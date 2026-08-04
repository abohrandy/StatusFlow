import { NextFunction, Request, Response } from 'express';
import {
  assertCanCreateRecurringSeries,
  assertCanScheduleStatus,
  assertCanUseFeature,
  hasFeature,
  SubscriptionError,
  type FeatureKey,
  type PlanSlug,
} from '@statusflow/subscriptions';
import { getActiveSubscription, getUserCreatedAt } from '../repositories/billingRepository';
import { pool } from '../db';

/**
 * Premium-feature gate middleware. This file intentionally contains ZERO plan rules of
 * its own — every check here loads the user's current plan slug from the database and
 * then delegates the actual decision to @statusflow/subscriptions (the same helper the
 * web/mobile apps and the webhook handler all use). If a plan's limits ever change, this
 * file does not need to change.
 */

async function loadPlanSlug(userId: string): Promise<PlanSlug> {
  const sub = await getActiveSubscription(userId);
  return sub?.plan_slug ?? 'free';
}

function handleSubscriptionError(res: Response, err: unknown): void {
  if (err instanceof SubscriptionError) {
    res.status(403).json(err.toJSON());
    return;
  }
  console.error('[SubscriptionGate] Unexpected error:', err);
  res.status(500).json({ error: 'Failed to evaluate subscription permissions.' });
}

/**
 * Gates a route behind an on/off plan feature — e.g. drafts, scheduling months ahead.
 * Usage: `router.post('/drafts', requireAuth, requireFeature('drafts'), handler)`.
 */
export function requireFeature(feature: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planSlug = await loadPlanSlug(req.user!.id);
      assertCanUseFeature(planSlug, feature);
      next();
    } catch (err) {
      handleSubscriptionError(res, err);
    }
  };
}

/**
 * Gates "future scheduling" — i.e. scheduling further ahead than the very next slot.
 * Free plan cannot use this at all; unlimited-scheduling plans always pass.
 */
export const requireFutureScheduling = requireFeature('scheduleMonthsAhead');

/** Gates unlimited/repeat scheduling behind the Free plan's 7-day interval quota, using the user's real scheduling history from `status_posts`. */
export async function requireScheduleQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const planSlug = await loadPlanSlug(req.user!.id);
    const [result, accountCreatedAt] = await Promise.all([
      pool.query<{ last: string | null }>(
        `SELECT MAX(scheduled_at) AS last FROM status_posts WHERE user_id = $1 AND status NOT IN ('FAILED', 'CANCELLED')`,
        [req.user!.id],
      ),
      getUserCreatedAt(req.user!.id),
    ]);
    assertCanScheduleStatus(planSlug, { lastScheduledStatusAt: result.rows[0]?.last ?? null, accountCreatedAt });
    next();
  } catch (err) {
    handleSubscriptionError(res, err);
  }
}

/** Gates creating a recurring status post series behind a plan without the Free tier's interval quota. */
export async function requireRecurringSeriesAllowed(req: Request, res: Response, next: NextFunction) {
  try {
    const planSlug = await loadPlanSlug(req.user!.id);
    assertCanCreateRecurringSeries(planSlug);
    next();
  } catch (err) {
    handleSubscriptionError(res, err);
  }
}

/**
 * Not a blocking gate — priority queue is an ordering hint, not a permission. Attach the
 * returned value to a job's priority field when enqueuing (lower number = higher
 * priority in BullMQ's convention).
 */
export async function getQueuePriority(userId: string): Promise<number> {
  const planSlug = await loadPlanSlug(userId);
  return hasFeature(planSlug, 'priorityQueue') ? 1 : 10;
}
