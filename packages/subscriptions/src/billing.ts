import { getPlan, listPlans, type BillingCycle, type PlanDefinition, type PlanSlug } from './plans';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
};

/** Formats a plan's price for display, e.g. "₦2,000" or "₦0". */
export function formatPrice(planSlug: PlanSlug): string {
  const plan = getPlan(planSlug);
  const symbol = CURRENCY_SYMBOLS[plan.currency] ?? '';
  return `${symbol}${plan.price.toLocaleString('en-NG')}`;
}

export function getBillingCycle(planSlug: PlanSlug): BillingCycle {
  return getPlan(planSlug).billingCycle;
}

export function isFreePlan(planSlug: PlanSlug): boolean {
  return getPlan(planSlug).price === 0;
}

export function isPaidPlan(planSlug: PlanSlug): boolean {
  return !isFreePlan(planSlug);
}

/** How long the Free plan's trial lasts, counted from account creation. */
export const FREE_TRIAL_DAYS = 7;

/** When a Free-plan trial ends, given when the account was created. */
export function freeTrialEndsAt(accountCreatedAt: Date): Date {
  const end = new Date(accountCreatedAt);
  end.setDate(end.getDate() + FREE_TRIAL_DAYS);
  return end;
}

/**
 * Whether a Free-plan account's trial has lapsed. Only meaningful for the Free plan —
 * paid plans are never subject to a trial window, so callers should only invoke this
 * after confirming `planSlug === 'free'`.
 */
export function isFreeTrialExpired(accountCreatedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= freeTrialEndsAt(accountCreatedAt).getTime();
}

/**
 * Amount in kobo (Paystack's smallest currency unit) for a plan's price.
 * Use this when building a Paystack charge/initialize payload.
 */
export function getAmountInKobo(planSlug: PlanSlug): number {
  return Math.round(getPlan(planSlug).price * 100);
}

/**
 * Computes when the current billing period ends, given a start date.
 * Returns `null` for plans with a `lifetime` billing cycle (e.g. Free).
 */
export function computePeriodEnd(planSlug: PlanSlug, periodStart: Date = new Date()): Date | null {
  const cycle = getBillingCycle(planSlug);
  const end = new Date(periodStart);

  switch (cycle) {
    case 'lifetime':
      return null;
    case 'weekly':
      end.setDate(end.getDate() + 7);
      return end;
    case 'monthly':
      end.setMonth(end.getMonth() + 1);
      return end;
  }
}

/** Plans strictly cheaper/more-restricted than the given plan, ordered ascending. */
export function listDowngradeOptions(planSlug: PlanSlug): PlanDefinition[] {
  const current = getPlan(planSlug);
  return listPlans().filter((plan) => plan.order < current.order);
}

/** Plans strictly more capable than the given plan, ordered ascending — i.e. valid upgrade targets. */
export function listUpgradeOptions(planSlug: PlanSlug): PlanDefinition[] {
  const current = getPlan(planSlug);
  return listPlans().filter((plan) => plan.order > current.order);
}

/** The cheapest plan that is strictly more capable than the given plan, if any. */
export function getNextUpgrade(planSlug: PlanSlug): PlanDefinition | undefined {
  return listUpgradeOptions(planSlug)[0];
}
