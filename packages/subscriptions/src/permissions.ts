import { getPlan, type PlanFeatures, type PlanSlug } from './plans';

export type MediaType = 'text' | 'image' | 'video';

/** Feature flags that are simple on/off switches (excludes the nested `mediaTypes` map). */
export type FeatureKey = Exclude<keyof PlanFeatures, 'mediaTypes'>;

/**
 * Pure permission checks — "is this plan allowed to do X", answered entirely
 * from `PLAN_DEFINITIONS`. These never look at usage/quota state; for
 * quota-aware checks (e.g. "has this user already scheduled a status this
 * week") see `featureGate.ts`.
 */

export function hasFeature(planSlug: PlanSlug, feature: FeatureKey): boolean {
  return getPlan(planSlug).features[feature];
}

export function canUseMediaType(planSlug: PlanSlug, mediaType: MediaType): boolean {
  return getPlan(planSlug).features.mediaTypes[mediaType];
}

export function getWhatsAppAccountLimit(planSlug: PlanSlug): number | null {
  return getPlan(planSlug).limits.maxWhatsAppAccounts;
}

export function canConnectAnotherWhatsAppAccount(planSlug: PlanSlug, currentAccountCount: number): boolean {
  const limit = getWhatsAppAccountLimit(planSlug);
  return limit === null || currentAccountCount < limit;
}

export function getScheduledStatusIntervalDays(planSlug: PlanSlug): number | null {
  return getPlan(planSlug).limits.scheduledStatusIntervalDays;
}

/** True when the plan has no interval restriction between scheduled statuses. */
export function hasUnlimitedScheduling(planSlug: PlanSlug): boolean {
  return getScheduledStatusIntervalDays(planSlug) === null;
}
