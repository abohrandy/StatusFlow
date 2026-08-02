// Named (not wildcard) re-exports on purpose: tsc compiles `export * from './x'` under
// CommonJS to a dynamic __exportStar helper that copies properties at runtime, which
// Rollup/Vite's static CJS-interop analysis can't see through when bundling a consumer
// (apps/web) against this package's compiled dist/ output — named re-exports compile to
// statically-analyzable getters instead, so bundlers can resolve them at build time.
export {
  type Currency,
  type BillingCycle,
  type PlanLimits,
  type PlanFeatures,
  type PlanDefinition,
  PLAN_DEFINITIONS,
  type PlanSlug,
  DEFAULT_PLAN_SLUG,
  isPlanSlug,
  getPlan,
  listPlans,
} from './plans';

export {
  type SubscriptionStatus,
  type Subscription,
  type SubscriptionUsage,
  createFreeSubscription,
} from './types';

export {
  type SubscriptionErrorCode,
  type UpgradeSuggestion,
  type SubscriptionErrorOptions,
  SubscriptionError,
  buildUpgradeSuggestion,
} from './errors';

export {
  type MediaType,
  type FeatureKey,
  hasFeature,
  canUseMediaType,
  getWhatsAppAccountLimit,
  canConnectAnotherWhatsAppAccount,
  getScheduledStatusIntervalDays,
  hasUnlimitedScheduling,
} from './permissions';

export {
  formatPrice,
  getBillingCycle,
  isFreePlan,
  isPaidPlan,
  FREE_TRIAL_DAYS,
  freeTrialEndsAt,
  isFreeTrialExpired,
  getAmountInKobo,
  computePeriodEnd,
  listDowngradeOptions,
  listUpgradeOptions,
  getNextUpgrade,
} from './billing';

export {
  type FeatureGateResult,
  canScheduleStatus,
  canConnectWhatsAppAccount,
  canPostMediaType,
  canUseFeature,
  assertCanScheduleStatus,
  assertCanConnectWhatsAppAccount,
  assertCanUseMediaType,
  assertCanUseFeature,
} from './featureGate';
