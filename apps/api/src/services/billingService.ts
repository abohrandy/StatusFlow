import { getBillingCycle, getPlan, type PlanSlug } from '@statusflow/subscriptions';
import { amountForPlanInKobo, getPlanRow, setPlanPaystackCode } from '../repositories/billingRepository';
import { createPlan } from './paystack';

/**
 * Returns the Paystack plan code for `planSlug`, creating it on Paystack (once, ever)
 * if this is the first time anyone has checked out on this plan.
 */
export async function ensurePaystackPlan(planSlug: PlanSlug): Promise<string> {
  const row = await getPlanRow(planSlug);
  if (row.paystack_plan_code) return row.paystack_plan_code;

  const cycle = getBillingCycle(planSlug);
  if (cycle !== 'weekly' && cycle !== 'monthly') {
    throw new Error(`Plan "${planSlug}" has no recurring billing cycle and cannot be sold via Paystack subscriptions.`);
  }

  const plan = getPlan(planSlug);
  const code = await createPlan({
    name: `StatusFlow - ${plan.name}`,
    amountKobo: amountForPlanInKobo(planSlug),
    interval: cycle,
  });

  await setPlanPaystackCode(planSlug, code);
  return code;
}

export function generatePaymentReference(userId: string): string {
  return `sf_${userId.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
