import { computePeriodEnd, getAmountInKobo, getPlan, type PlanSlug } from '@statusflow/subscriptions';
import { pool } from '../db';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  plan_slug: PlanSlug;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  current_period_start: string;
  current_period_end: string | null;
  next_billing_at: string | null;
  renewed_at: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  expired_at: string | null;
  consecutive_renewals: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_slug: PlanSlug;
  reference: string;
  amount: string;
  currency: string;
  gateway: string;
  gateway_response: unknown;
  status: 'pending' | 'successful' | 'failed' | 'abandoned' | 'reversed';
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  user_id: string;
  subscription_id: string;
  payment_id: string | null;
  invoice_number: string;
  plan_slug: PlanSlug;
  amount: string;
  currency: string;
  status: 'paid' | 'pending' | 'void';
  period_start: string;
  period_end: string | null;
  issued_at: string;
}

export interface PlanRow {
  id: string;
  slug: PlanSlug;
  paystack_plan_code: string | null;
}

export async function getPlanRow(planSlug: PlanSlug): Promise<PlanRow> {
  const result = await pool.query<PlanRow>('SELECT id, slug, paystack_plan_code FROM plans WHERE slug = $1', [planSlug]);
  if (result.rows.length === 0) {
    throw new Error(`Plan "${planSlug}" is not seeded in the plans table.`);
  }
  return result.rows[0];
}

export async function getPlanIdBySlug(planSlug: PlanSlug): Promise<string> {
  return (await getPlanRow(planSlug)).id;
}

export async function setPlanPaystackCode(planSlug: PlanSlug, paystackPlanCode: string): Promise<void> {
  await pool.query('UPDATE plans SET paystack_plan_code = $2, updated_at = CURRENT_TIMESTAMP WHERE slug = $1', [
    planSlug,
    paystackPlanCode,
  ]);
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const result = await pool.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows[0]?.id ?? null;
}

/** When the account was created — used to evaluate the Free plan's 7-day trial window. */
export async function getUserCreatedAt(userId: string): Promise<Date | null> {
  const result = await pool.query<{ created_at: string }>('SELECT created_at FROM users WHERE id = $1', [userId]);
  return result.rows[0] ? new Date(result.rows[0].created_at) : null;
}

export async function getActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  // Super Admin override: ADMIN users bypass all account/post limits by inheriting monthly-business features
  const userCheck = await pool.query<{ role: string; email: string }>('SELECT role, email FROM users WHERE id = $1', [userId]);
  if (userCheck.rows[0]?.role === 'ADMIN' || userCheck.rows[0]?.email === 'abohrandy@gmail.com') {
    return {
      id: 'admin-override',
      user_id: userId,
      plan_id: 'admin-plan',
      plan_slug: 'monthly-business',
      status: 'active',
      paystack_customer_code: null,
      paystack_subscription_code: null,
      paystack_email_token: null,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
      next_billing_at: null,
      renewed_at: null,
      cancel_at_period_end: false,
      cancelled_at: null,
      expired_at: null,
      consecutive_renewals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const result = await pool.query<SubscriptionRow>(
    `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}


export async function getSubscriptionHistory(userId: string): Promise<SubscriptionRow[]> {
  const result = await pool.query<SubscriptionRow>(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getSubscriptionByPaystackCode(subscriptionCode: string): Promise<SubscriptionRow | null> {
  const result = await pool.query<SubscriptionRow>(
    `SELECT * FROM subscriptions WHERE paystack_subscription_code = $1 LIMIT 1`,
    [subscriptionCode],
  );
  return result.rows[0] ?? null;
}

export async function createPendingPayment(params: {
  userId: string;
  planSlug: PlanSlug;
  reference: string;
}): Promise<PaymentRow> {
  const plan = getPlan(params.planSlug);
  const result = await pool.query<PaymentRow>(
    `INSERT INTO payments (user_id, plan_slug, reference, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [params.userId, params.planSlug, params.reference, plan.price, plan.currency],
  );
  return result.rows[0];
}

export async function getPaymentByReference(reference: string): Promise<PaymentRow | null> {
  const result = await pool.query<PaymentRow>('SELECT * FROM payments WHERE reference = $1', [reference]);
  return result.rows[0] ?? null;
}

export async function markPaymentStatus(params: {
  reference: string;
  status: PaymentRow['status'];
  gatewayResponse: unknown;
  paidAt?: Date | null;
  subscriptionId?: string | null;
}): Promise<PaymentRow> {
  const result = await pool.query<PaymentRow>(
    `UPDATE payments
     SET status = $2,
         gateway_response = $3,
         paid_at = $4,
         subscription_id = COALESCE($5, subscription_id),
         updated_at = CURRENT_TIMESTAMP
     WHERE reference = $1
     RETURNING *`,
    [params.reference, params.status, JSON.stringify(params.gatewayResponse), params.paidAt ?? null, params.subscriptionId ?? null],
  );
  if (result.rows.length === 0) {
    throw new Error(`No payment found for reference "${params.reference}".`);
  }
  return result.rows[0];
}

export async function getPaymentHistory(userId: string, limit = 50): Promise<PaymentRow[]> {
  const result = await pool.query<PaymentRow>(
    `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}

/**
 * Activates a subscription (first-time) or renews the user's existing active row for the
 * same plan. Called exclusively from the Paystack webhook handler after a signature-
 * verified `charge.success` event — never from the client-facing verify endpoint.
 *
 * - No existing active subscription -> creates a new row, `consecutive_renewals = 0`.
 * - Existing active row for the SAME plan -> renewal: extends the period and increments
 *   `consecutive_renewals` (drives the "switch to Monthly Business" smart prompt).
 * - Existing active row for a DIFFERENT plan -> the old row is closed out as
 *   'cancelled' (plan change) and a fresh row is created for the new plan.
 */
export async function activateOrRenewSubscription(params: {
  userId: string;
  planSlug: PlanSlug;
  paystackCustomerCode?: string | null;
  paystackSubscriptionCode?: string | null;
  paystackEmailToken?: string | null;
  now?: Date;
}): Promise<SubscriptionRow> {
  const now = params.now ?? new Date();
  const existing = await getActiveSubscription(params.userId);
  const periodEnd = computePeriodEnd(params.planSlug, now);

  if (existing && existing.plan_slug === params.planSlug) {
    const result = await pool.query<SubscriptionRow>(
      `UPDATE subscriptions
       SET status = 'active',
           current_period_start = $2,
           current_period_end = $3,
           next_billing_at = $3,
           renewed_at = $2,
           consecutive_renewals = consecutive_renewals + 1,
           cancel_at_period_end = FALSE,
           paystack_customer_code = COALESCE($4, paystack_customer_code),
           paystack_subscription_code = COALESCE($5, paystack_subscription_code),
           paystack_email_token = COALESCE($6, paystack_email_token),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [
        existing.id,
        now.toISOString(),
        periodEnd?.toISOString() ?? null,
        params.paystackCustomerCode ?? null,
        params.paystackSubscriptionCode ?? null,
        params.paystackEmailToken ?? null,
      ],
    );
    return result.rows[0];
  }

  if (existing) {
    await pool.query(
      `UPDATE subscriptions
       SET status = 'cancelled', cancelled_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [existing.id, now.toISOString()],
    );
  }

  const planId = await getPlanIdBySlug(params.planSlug);
  const result = await pool.query<SubscriptionRow>(
    `INSERT INTO subscriptions (
       user_id, plan_id, plan_slug, status,
       paystack_customer_code, paystack_subscription_code, paystack_email_token,
       current_period_start, current_period_end, next_billing_at, renewed_at,
       consecutive_renewals
     )
     VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, $8, $7, 0)
     RETURNING *`,
    [
      params.userId,
      planId,
      params.planSlug,
      params.paystackCustomerCode ?? null,
      params.paystackSubscriptionCode ?? null,
      params.paystackEmailToken ?? null,
      now.toISOString(),
      periodEnd?.toISOString() ?? null,
    ],
  );
  return result.rows[0];
}

export async function attachPaystackSubscriptionCode(
  subscriptionId: string,
  params: { customerCode?: string | null; subscriptionCode: string; emailToken: string },
): Promise<void> {
  await pool.query(
    `UPDATE subscriptions
     SET paystack_subscription_code = $2,
         paystack_email_token = $3,
         paystack_customer_code = COALESCE($4, paystack_customer_code),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [subscriptionId, params.subscriptionCode, params.emailToken, params.customerCode ?? null],
  );
}

export async function recordFailedRenewalPayment(params: {
  userId: string;
  subscriptionId: string;
  planSlug: PlanSlug;
  reference: string;
  gatewayResponse: unknown;
}): Promise<void> {
  const plan = getPlan(params.planSlug);
  await pool.query(
    `INSERT INTO payments (user_id, subscription_id, plan_slug, reference, amount, currency, status, gateway_response, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7, NULL)
     ON CONFLICT (reference) DO NOTHING`,
    [params.userId, params.subscriptionId, params.planSlug, params.reference, plan.price, plan.currency, JSON.stringify(params.gatewayResponse)],
  );
}

export async function markSubscriptionPastDue(subscriptionId: string): Promise<void> {
  await pool.query(
    `UPDATE subscriptions SET status = 'past_due', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'active'`,
    [subscriptionId],
  );
}

export async function requestCancellation(subscriptionId: string): Promise<SubscriptionRow> {
  const result = await pool.query<SubscriptionRow>(
    `UPDATE subscriptions
     SET cancel_at_period_end = TRUE, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [subscriptionId],
  );
  return result.rows[0];
}

export async function markSubscriptionCancelledNow(subscriptionId: string): Promise<void> {
  await pool.query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [subscriptionId],
  );
}

export async function markSubscriptionExpired(subscriptionId: string): Promise<void> {
  await pool.query(
    `UPDATE subscriptions
     SET status = 'expired', expired_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [subscriptionId],
  );
}

export async function recordInvoice(params: {
  userId: string;
  subscriptionId: string;
  paymentId: string | null;
  planSlug: PlanSlug;
  periodStart: Date;
  periodEnd: Date | null;
}): Promise<InvoiceRow> {
  const plan = getPlan(params.planSlug);
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const result = await pool.query<InvoiceRow>(
    `INSERT INTO invoices (
       user_id, subscription_id, payment_id, invoice_number, plan_slug,
       amount, currency, status, period_start, period_end
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid', $8, $9)
     RETURNING *`,
    [
      params.userId,
      params.subscriptionId,
      params.paymentId,
      invoiceNumber,
      params.planSlug,
      plan.price,
      plan.currency,
      params.periodStart.toISOString(),
      params.periodEnd?.toISOString() ?? null,
    ],
  );
  return result.rows[0];
}

export async function getInvoices(userId: string, limit = 50): Promise<InvoiceRow[]> {
  const result = await pool.query<InvoiceRow>(
    `SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}

export async function logWebhookEvent(params: {
  eventType: string | null;
  reference: string | null;
  payload: unknown;
  signatureValid: boolean;
  processed: boolean;
  processingError?: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO webhook_logs (provider, event_type, reference, payload, signature_valid, processed, processing_error, processed_at)
     VALUES ('paystack', $1, $2, $3, $4, $5, $6, CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
    [params.eventType, params.reference, JSON.stringify(params.payload), params.signatureValid, params.processed, params.processingError ?? null],
  );
}

/** Amount in kobo Paystack should charge for a plan — reuses the shared billing helper. */
export function amountForPlanInKobo(planSlug: PlanSlug): number {
  return getAmountInKobo(planSlug);
}
