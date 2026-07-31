import type { PlanSlug } from './plans';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired';

/**
 * A user's subscription record. This is the persistence-agnostic domain
 * model — how it's stored (Postgres table, Supabase row, etc.) is up to the
 * app wiring this module in.
 */
export interface Subscription {
  id: string;
  userId: string;
  planSlug: PlanSlug;
  status: SubscriptionStatus;
  /** ISO 8601 timestamp the current billing period started. */
  currentPeriodStart: string;
  /** ISO 8601 timestamp the current billing period ends. `null` for lifetime plans (e.g. Free). */
  currentPeriodEnd: string | null;
  /** If true, the subscription will not auto-renew and will drop to the Free plan at `currentPeriodEnd`. */
  cancelAtPeriodEnd: boolean;
  paystackCustomerCode?: string | null;
  paystackSubscriptionCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Minimal usage snapshot the feature gate needs in order to evaluate quota-based rules. */
export interface SubscriptionUsage {
  /** ISO timestamp (or Date) of the user's most recently scheduled status, if any. */
  lastScheduledStatusAt?: string | Date | null;
  /** Number of WhatsApp accounts currently connected. */
  connectedWhatsAppAccounts?: number;
}

/**
 * Creates a brand-new Free-plan subscription record for a newly registered user.
 * `id` is omitted since it's assigned by the persistence layer on insert.
 */
export function createFreeSubscription(userId: string, now: Date = new Date()): Omit<Subscription, 'id'> {
  const nowIso = now.toISOString();
  return {
    userId,
    planSlug: 'free',
    status: 'active',
    currentPeriodStart: nowIso,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
