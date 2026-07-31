/**
 * Central plan configuration.
 *
 * This is the single source of truth for pricing, billing cycle, quotas, and
 * feature availability for every subscription plan in StatusFlow. Every other
 * module in this package (permissions, billing, feature gates) reads from
 * `PLAN_DEFINITIONS` instead of hardcoding plan-specific checks.
 *
 * To add a new plan: add an entry here. No other file needs to change —
 * permission checks, feature gates, and upgrade suggestions are all derived
 * from this config at runtime.
 */

export type Currency = 'NGN';

export type BillingCycle = 'lifetime' | 'weekly' | 'monthly';

/** Usage caps for a plan. `null` means "no limit". */
export interface PlanLimits {
  /** Max number of WhatsApp accounts that can be connected at once. `null` = unlimited. */
  maxWhatsAppAccounts: number | null;
  /**
   * Minimum number of days that must pass between two scheduled statuses.
   * `null` means there is no interval restriction (unlimited scheduling).
   */
  scheduledStatusIntervalDays: number | null;
}

/** On/off capabilities for a plan. */
export interface PlanFeatures {
  mediaTypes: {
    text: boolean;
    image: boolean;
    video: boolean;
  };
  /** Allows scheduling statuses months in advance rather than one at a time. */
  scheduleMonthsAhead: boolean;
  drafts: boolean;
  calendar: boolean;
  postingHistory: boolean;
  priorityQueue: boolean;
  emailSupport: boolean;
  prioritySupport: boolean;
  earlyFeatureAccess: boolean;
}

export interface PlanDefinition {
  slug: string;
  name: string;
  /** Price in the plan's major currency unit (e.g. naira, not kobo). */
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  /**
   * Relative ordering used to rank plans from cheapest/most-restricted to
   * most expensive/least-restricted. Used to compute upgrade suggestions.
   * Must be unique and ascending; gaps are fine (e.g. 0, 10, 20) if you want
   * room to insert plans later without renumbering everything.
   */
  order: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

export const PLAN_DEFINITIONS = {
  free: {
    slug: 'free',
    name: 'Free',
    price: 0,
    currency: 'NGN',
    billingCycle: 'lifetime',
    order: 0,
    limits: {
      maxWhatsAppAccounts: 1,
      scheduledStatusIntervalDays: 7,
    },
    features: {
      mediaTypes: { text: true, image: true, video: true },
      scheduleMonthsAhead: false,
      drafts: false,
      calendar: false,
      postingHistory: false,
      priorityQueue: false,
      emailSupport: false,
      prioritySupport: false,
      earlyFeatureAccess: false,
    },
  },
  'weekly-pro': {
    slug: 'weekly-pro',
    name: 'Weekly Pro',
    price: 2000,
    currency: 'NGN',
    billingCycle: 'weekly',
    order: 10,
    limits: {
      maxWhatsAppAccounts: null,
      scheduledStatusIntervalDays: null,
    },
    features: {
      mediaTypes: { text: true, image: true, video: true },
      scheduleMonthsAhead: true,
      drafts: true,
      calendar: true,
      postingHistory: true,
      priorityQueue: true,
      emailSupport: true,
      prioritySupport: false,
      earlyFeatureAccess: false,
    },
  },
  'monthly-business': {
    slug: 'monthly-business',
    name: 'Monthly Business',
    price: 6000,
    currency: 'NGN',
    billingCycle: 'monthly',
    order: 20,
    limits: {
      maxWhatsAppAccounts: null,
      scheduledStatusIntervalDays: null,
    },
    features: {
      mediaTypes: { text: true, image: true, video: true },
      scheduleMonthsAhead: true,
      drafts: true,
      calendar: true,
      postingHistory: true,
      priorityQueue: true,
      emailSupport: true,
      prioritySupport: true,
      earlyFeatureAccess: true,
    },
  },
} as const satisfies Record<string, PlanDefinition>;

/** Union of every valid plan slug. Derived from `PLAN_DEFINITIONS` — adding a plan above extends this automatically. */
export type PlanSlug = keyof typeof PLAN_DEFINITIONS;

export const DEFAULT_PLAN_SLUG: PlanSlug = 'free';

export function isPlanSlug(value: string): value is PlanSlug {
  return value in PLAN_DEFINITIONS;
}

export function getPlan(slug: PlanSlug): PlanDefinition {
  return PLAN_DEFINITIONS[slug];
}

/** All plans, ordered from most-restricted (e.g. Free) to least-restricted. */
export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS).sort((a, b) => a.order - b.order);
}
