import type { PlanSlug } from '@statusflow/subscriptions';
import { activateOrRenewSubscription, getActiveSubscription } from '../repositories/billingRepository';
import {
  attributeSignup,
  claimRewardSlot,
  countConvertedReferrals,
  finalizeReward,
  getOrCreateReferralCode,
  getReferralHistory,
  getRewardHistory,
  hasReward,
  markReferralConverted,
  recordInvite,
  type ReferralRewardRow,
} from '../repositories/referralRepository';
import { pool } from '../db';

const REWARD_TIERS: { rewardType: ReferralRewardRow['reward_type']; referralsRequired: number; planSlug: PlanSlug }[] = [
  { rewardType: 'weekly_pro_week', referralsRequired: 1, planSlug: 'weekly-pro' },
  { rewardType: 'monthly_business_month', referralsRequired: 3, planSlug: 'monthly-business' },
];

/**
 * Grants a referral reward by extending the referrer's current subscription (if they're
 * already on the reward's plan) or activating a fresh one (otherwise). Reusing
 * `activateOrRenewSubscription` for the "fresh" case means the granted period exactly
 * matches the reward duration (7 days for Weekly Pro, 1 month for Monthly Business) via
 * the shared `computePeriodEnd` billing math — no separate date arithmetic needed here.
 */
async function applyReward(referrerUserId: string, planSlug: PlanSlug, now: Date): Promise<string> {
  const existing = await getActiveSubscription(referrerUserId);

  if (existing && existing.plan_slug === planSlug && existing.current_period_end) {
    const extensionMs = planSlug === 'weekly-pro' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const newEnd = new Date(new Date(existing.current_period_end).getTime() + extensionMs);
    await pool.query(
      `UPDATE subscriptions SET current_period_end = $2, next_billing_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [existing.id, newEnd.toISOString()],
    );
    return existing.id;
  }

  const created = await activateOrRenewSubscription({ userId: referrerUserId, planSlug, now });
  return created.id;
}

/**
 * Checks whether `referrerUserId` has just crossed a reward threshold and, if so, claims
 * and applies it. Safe to call after every new conversion — `claimRewardSlot`'s unique
 * index means re-crossing an already-rewarded threshold (or a race between two
 * concurrent conversions) is a no-op.
 */
async function evaluateRewards(referrerUserId: string, now: Date): Promise<void> {
  const convertedCount = await countConvertedReferrals(referrerUserId);

  for (const tier of REWARD_TIERS) {
    if (convertedCount < tier.referralsRequired) continue;
    if (await hasReward(referrerUserId, tier.rewardType)) continue;

    const rewardId = await claimRewardSlot({
      referrerUserId,
      rewardType: tier.rewardType,
      referralsRequired: tier.referralsRequired,
    });
    if (!rewardId) continue; // lost the race to a concurrent request; already claimed

    const subscriptionId = await applyReward(referrerUserId, tier.planSlug, now);
    await finalizeReward(rewardId, subscriptionId);
  }
}

/**
 * Called from the Paystack webhook handler on a verified `charge.success` event only —
 * this is the sole entry point that can convert a referral or grant a reward, so rewards
 * are never issued off a client-side claim of payment.
 */
export async function tryConvertReferral(referredUserId: string, paymentId: string, now: Date = new Date()): Promise<void> {
  const referrerUserId = await markReferralConverted(referredUserId, paymentId);
  if (!referrerUserId) return; // this user wasn't referred, or was already converted
  await evaluateRewards(referrerUserId, now);
}

export async function getOrCreateCode(userId: string): Promise<string> {
  return getOrCreateReferralCode(userId);
}

export async function inviteByEmail(referrerUserId: string, email?: string): Promise<void> {
  const code = await getOrCreateReferralCode(referrerUserId);
  await recordInvite(referrerUserId, code, email ?? null);
}

export async function attributeReferralSignup(code: string, referredUserId: string): Promise<void> {
  await attributeSignup(code, referredUserId);
}

export async function getReferralDashboard(userId: string) {
  const [code, history, rewards] = await Promise.all([
    getOrCreateReferralCode(userId),
    getReferralHistory(userId),
    getRewardHistory(userId),
  ]);

  const invites = history.length;
  const conversions = history.filter((r) => r.status === 'converted' || r.status === 'rewarded').length;

  return { code, invites, conversions, rewards, history };
}
