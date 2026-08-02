import { isFreeTrialExpired, listUpgradeOptions } from './billing';
import { buildUpgradeSuggestion, SubscriptionError, type SubscriptionErrorCode, type UpgradeSuggestion } from './errors';
import {
  canConnectAnotherWhatsAppAccount,
  canUseMediaType as isMediaTypeAllowed,
  getScheduledStatusIntervalDays,
  getWhatsAppAccountLimit,
  hasFeature,
  hasUnlimitedScheduling,
  type FeatureKey,
  type MediaType,
} from './permissions';
import { getPlan, type PlanDefinition, type PlanSlug } from './plans';
import type { SubscriptionUsage } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Result of a feature-gate check. Designed to be returned directly (or
 * mapped 1:1) as an API error body when `allowed` is false.
 */
export interface FeatureGateResult {
  allowed: boolean;
  code?: SubscriptionErrorCode;
  reason?: string;
  upgrade?: UpgradeSuggestion;
  /** ISO timestamp indicating when the caller may retry (interval-based quotas only). */
  retryAfter?: string;
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  scheduleMonthsAhead: 'Scheduling months ahead',
  drafts: 'Drafts',
  calendar: 'Calendar view',
  postingHistory: 'Posting history',
  priorityQueue: 'Priority queue',
  emailSupport: 'Email support',
  prioritySupport: 'Priority support',
  earlyFeatureAccess: 'Early feature access',
};

function allow(): FeatureGateResult {
  return { allowed: true };
}

/** Cheapest plan strictly above `planSlug` that satisfies `predicate`, if any. */
function findUpgradeFor(planSlug: PlanSlug, predicate: (plan: PlanDefinition) => boolean): PlanDefinition | undefined {
  return listUpgradeOptions(planSlug).find(predicate);
}

function describeInterval(days: number): string {
  if (days === 1) return 'day';
  if (days === 7) return 'week';
  if (days === 14) return 'two weeks';
  if (days === 30 || days === 31) return 'month';
  return `${days} days`;
}

/**
 * Checks whether a user on `planSlug` may schedule another status right now.
 * Free-tier (or any plan with an interval quota) is rejected until
 * `scheduledStatusIntervalDays` have elapsed since `usage.lastScheduledStatusAt`.
 */
export function canScheduleStatus(
  planSlug: PlanSlug,
  usage: SubscriptionUsage = {},
  now: Date = new Date(),
): FeatureGateResult {
  // The trial window is a harder stop than the interval quota below: once it's lapsed,
  // no further posts are allowed at all, not just "one every 7 days" going forward.
  if (planSlug === 'free' && usage.accountCreatedAt && isFreeTrialExpired(new Date(usage.accountCreatedAt), now)) {
    const upgradeTarget = findUpgradeFor(planSlug, () => true);
    return {
      allowed: false,
      code: 'TRIAL_EXPIRED',
      reason: 'Your 7-day free trial has ended.',
      upgrade: upgradeTarget
        ? buildUpgradeSuggestion(upgradeTarget.slug as PlanSlug, upgradeTarget.name, 'keep scheduling WhatsApp statuses')
        : undefined,
    };
  }

  const intervalDays = getScheduledStatusIntervalDays(planSlug);
  if (intervalDays === null) return allow();

  const last = usage.lastScheduledStatusAt ? new Date(usage.lastScheduledStatusAt) : null;
  if (!last) return allow();

  const nextAllowedAt = new Date(last.getTime() + intervalDays * MS_PER_DAY);
  if (now.getTime() < nextAllowedAt.getTime()) {
    const upgradeTarget = findUpgradeFor(planSlug, (plan) => hasUnlimitedScheduling(plan.slug as PlanSlug));
    // Lowercased so it reads naturally mid-sentence, e.g. "your free scheduled status".
    const planName = getPlan(planSlug).name.toLowerCase();
    return {
      allowed: false,
      code: 'SCHEDULE_QUOTA_EXCEEDED',
      reason: `You have already used your ${planName} scheduled status this ${describeInterval(intervalDays)}.`,
      upgrade: upgradeTarget
        ? buildUpgradeSuggestion(upgradeTarget.slug as PlanSlug, upgradeTarget.name, 'schedule unlimited statuses')
        : undefined,
      retryAfter: nextAllowedAt.toISOString(),
    };
  }

  return allow();
}

export function canConnectWhatsAppAccount(planSlug: PlanSlug, currentAccountCount: number): FeatureGateResult {
  if (canConnectAnotherWhatsAppAccount(planSlug, currentAccountCount)) return allow();

  const limit = getWhatsAppAccountLimit(planSlug);
  const upgradeTarget = findUpgradeFor(
    planSlug,
    (plan) => plan.limits.maxWhatsAppAccounts === null || plan.limits.maxWhatsAppAccounts > currentAccountCount,
  );

  return {
    allowed: false,
    code: 'WHATSAPP_ACCOUNT_LIMIT_REACHED',
    reason: `Your plan allows up to ${limit} connected WhatsApp account${limit === 1 ? '' : 's'}.`,
    upgrade: upgradeTarget
      ? buildUpgradeSuggestion(upgradeTarget.slug as PlanSlug, upgradeTarget.name, 'connect more WhatsApp accounts')
      : undefined,
  };
}

export function canPostMediaType(planSlug: PlanSlug, mediaType: MediaType): FeatureGateResult {
  if (isMediaTypeAllowed(planSlug, mediaType)) return allow();

  const upgradeTarget = findUpgradeFor(planSlug, (plan) => plan.features.mediaTypes[mediaType]);

  return {
    allowed: false,
    code: 'MEDIA_TYPE_NOT_ALLOWED',
    reason: `Your plan does not support ${mediaType} statuses.`,
    upgrade: upgradeTarget
      ? buildUpgradeSuggestion(upgradeTarget.slug as PlanSlug, upgradeTarget.name, `post ${mediaType} statuses`)
      : undefined,
  };
}

export function canUseFeature(planSlug: PlanSlug, feature: FeatureKey): FeatureGateResult {
  if (hasFeature(planSlug, feature)) return allow();

  const upgradeTarget = findUpgradeFor(planSlug, (plan) => plan.features[feature]);
  const label = FEATURE_LABELS[feature];

  return {
    allowed: false,
    code: 'FEATURE_NOT_AVAILABLE',
    reason: `${label} is not available on your plan.`,
    upgrade: upgradeTarget
      ? buildUpgradeSuggestion(upgradeTarget.slug as PlanSlug, upgradeTarget.name, `unlock ${label.toLowerCase()}`)
      : undefined,
  };
}

function assert(result: FeatureGateResult): void {
  if (result.allowed) return;
  throw new SubscriptionError(result.code as SubscriptionErrorCode, result.reason as string, {
    upgrade: result.upgrade,
    retryAfter: result.retryAfter,
  });
}

export function assertCanScheduleStatus(planSlug: PlanSlug, usage?: SubscriptionUsage, now?: Date): void {
  assert(canScheduleStatus(planSlug, usage, now));
}

export function assertCanConnectWhatsAppAccount(planSlug: PlanSlug, currentAccountCount: number): void {
  assert(canConnectWhatsAppAccount(planSlug, currentAccountCount));
}

export function assertCanUseMediaType(planSlug: PlanSlug, mediaType: MediaType): void {
  assert(canPostMediaType(planSlug, mediaType));
}

export function assertCanUseFeature(planSlug: PlanSlug, feature: FeatureKey): void {
  assert(canUseFeature(planSlug, feature));
}
