import { Router } from 'express';
import { assertCanScheduleStatus, getAmountInKobo, getPlan, isPaidPlan, isPlanSlug, SubscriptionError, type PlanSlug } from '@statusflow/subscriptions';
import { requireAuth } from '../middleware/auth';
import { ensurePaystackPlan, generatePaymentReference } from '../services/billingService';
import { disableSubscription, initializeTransaction, verifyTransaction } from '../services/paystack';
import { pool } from '../db';
import {
  createPendingPayment,
  getActiveSubscription,
  getInvoices,
  getPaymentByReference,
  getPaymentHistory,
  getSubscriptionHistory,
  getUserCreatedAt,
  markPaymentStatus,
  requestCancellation,
} from '../repositories/billingRepository';
import { upsertDedupedNotification } from '../repositories/notificationRepository';
import { asyncHandler } from '../utils/asyncHandler';

export const billingRouter = Router();
billingRouter.use(requireAuth);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

billingRouter.post('/initialize', asyncHandler(async (req, res) => {
  const planSlug = req.body?.planSlug;
  if (!isPlanSlug(planSlug) || !isPaidPlan(planSlug)) {
    return res.status(400).json({ error: 'planSlug must be a paid plan ("weekly-pro" or "monthly-business").' });
  }

  try {
    const planCode = await ensurePaystackPlan(planSlug);
    const reference = generatePaymentReference(req.user!.id);
    await createPendingPayment({ userId: req.user!.id, planSlug, reference });

    const init = await initializeTransaction({
      email: req.user!.email,
      amountKobo: getAmountInKobo(planSlug),
      reference,
      planCode,
      callbackUrl: `${FRONTEND_URL}/billing/callback`,
      metadata: { userId: req.user!.id, planSlug },
    });

    res.status(201).json({ authorizationUrl: init.authorizationUrl, reference: init.reference });
  } catch (err: any) {
    console.error('[Billing] initialize failed:', err.message);
    res.status(502).json({ error: 'Could not start the Paystack checkout. Please try again.' });
  }
}));

/**
 * Reports payment status back to the client for UX purposes only (e.g. "we're
 * confirming your payment"). This NEVER activates or renews a subscription — that only
 * ever happens inside the webhook handler once Paystack's signature is verified. Calling
 * Paystack's verify endpoint here is a trusted server-to-server check, not a client
 * claim, but it is deliberately not wired to activation to avoid two independent code
 * paths that could activate a subscription.
 */
billingRouter.get('/verify', asyncHandler(async (req, res) => {
  const reference = typeof req.query.reference === 'string' ? req.query.reference : '';
  if (!reference) {
    return res.status(400).json({ error: 'A reference query parameter is required.' });
  }

  const payment = await getPaymentByReference(reference);
  if (!payment || payment.user_id !== req.user!.id) {
    return res.status(404).json({ error: 'Payment reference not found.' });
  }

  try {
    const verification = await verifyTransaction(reference);
    // Only ever downgrade a still-pending row here; a `successful` row means the webhook
    // already processed it (subscription activation included) — never overwrite that.
    let currentStatus = payment.status;
    if (payment.status === 'pending' && verification.status !== 'success') {
      const updated = await markPaymentStatus({
        reference,
        status: verification.status === 'abandoned' ? 'abandoned' : 'failed',
        gatewayResponse: verification.raw,
      });
      currentStatus = updated.status;
    }

    res.json({
      reference,
      paystackStatus: verification.status,
      paymentStatus: currentStatus,
      message:
        verification.status === 'success'
          ? 'Payment received. Your subscription activates automatically once Paystack confirms it via webhook — usually within a few seconds.'
          : 'Payment was not completed.',
    });
  } catch (err: any) {
    console.error('[Billing] verify failed:', err.message);
    res.status(502).json({ error: 'Could not verify payment with Paystack right now.' });
  }
}));

function buildSmartPrompts(sub: Awaited<ReturnType<typeof getActiveSubscription>>) {
  if (!sub) return { renewalSavings: false, expiryWarning: false };

  // Scenario 1: exactly on the 4th consecutive renewal of Weekly Pro (fires once, not
  // on every subsequent renewal).
  const renewalSavings = sub.plan_slug === 'weekly-pro' && sub.consecutive_renewals === 4;

  // Scenario 2: Weekly Pro, heading toward expiration (cancelled or payment past due),
  // within 3 days of period end.
  let expiryWarning = false;
  if (sub.plan_slug === 'weekly-pro' && sub.current_period_end && (sub.cancel_at_period_end || sub.status === 'past_due')) {
    const msRemaining = new Date(sub.current_period_end).getTime() - Date.now();
    expiryWarning = msRemaining > 0 && msRemaining <= THREE_DAYS_MS;
  }

  return { renewalSavings, expiryWarning };
}

billingRouter.get('/subscription', asyncHandler(async (req, res) => {
  const sub = await getActiveSubscription(req.user!.id);
  const planSlug: PlanSlug = sub?.plan_slug ?? 'free';
  const plan = getPlan(planSlug);
  const smartPrompts = buildSmartPrompts(sub);

  if (sub && smartPrompts.renewalSavings) {
    await upsertDedupedNotification({
      userId: req.user!.id,
      type: 'RENEWAL_SAVINGS',
      dedupeKey: `renewal-savings:${sub.id}:${sub.consecutive_renewals}`,
      title: "You're spending ₦8,000 every four weeks.",
      message: 'Switch to Monthly Business and save ₦2,000 every month.',
    });
  }
  if (sub && smartPrompts.expiryWarning) {
    await upsertDedupedNotification({
      userId: req.user!.id,
      type: 'EXPIRY_WARNING',
      dedupeKey: `expiry-warning:${sub.id}`,
      title: 'Your Weekly Pro subscription expires in 3 days.',
      message: 'Renew now or switch to Monthly Business to save money.',
    });
  }

  res.json({
    plan,
    subscription: sub && {
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      nextBillingAt: sub.next_billing_at,
      renewedAt: sub.renewed_at,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      consecutiveRenewals: sub.consecutive_renewals,
    },
    smartPrompts,
  });
}));

billingRouter.post('/cancel', asyncHandler(async (req, res) => {
  const sub = await getActiveSubscription(req.user!.id);
  if (!sub || sub.plan_slug === 'free') {
    return res.status(400).json({ error: 'You do not have an active paid subscription to cancel.' });
  }

  if (sub.paystack_subscription_code && sub.paystack_email_token) {
    try {
      await disableSubscription(sub.paystack_subscription_code, sub.paystack_email_token);
    } catch (err: any) {
      console.error('[Billing] Paystack disableSubscription failed:', err.message);
      return res.status(502).json({ error: 'Could not reach Paystack to cancel your subscription. Please try again.' });
    }
  }

  const updated = await requestCancellation(sub.id);
  res.json({
    ok: true,
    message: `Your ${getPlan(sub.plan_slug).name} subscription will remain active until ${updated.current_period_end}, then move to the Free plan.`,
  });
}));

billingRouter.get('/payments', asyncHandler(async (req, res) => {
  res.json({ payments: await getPaymentHistory(req.user!.id) });
}));

billingRouter.get('/invoices', asyncHandler(async (req, res) => {
  res.json({ invoices: await getInvoices(req.user!.id) });
}));

billingRouter.get('/subscriptions/history', asyncHandler(async (req, res) => {
  res.json({ subscriptions: await getSubscriptionHistory(req.user!.id) });
}));

/**
 * Lets the composer check the Free plan's 7-day scheduling quota BEFORE attempting to
 * schedule a status, so the UI can show the upgrade modal instead of a raw error. Reuses
 * `assertCanScheduleStatus` from @statusflow/subscriptions — the exact same check the
 * (future) posting endpoint and the `requireScheduleQuota` middleware use — so this can
 * never drift out of sync with the real enforcement.
 */
billingRouter.post('/schedule-check', asyncHandler(async (req, res) => {
  const sub = await getActiveSubscription(req.user!.id);
  const planSlug: PlanSlug = sub?.plan_slug ?? 'free';

  const [result, accountCreatedAt] = await Promise.all([
    pool.query<{ last: string | null }>(
      `SELECT MAX(scheduled_at) AS last FROM status_posts WHERE user_id = $1 AND status <> 'FAILED'`,
      [req.user!.id],
    ),
    getUserCreatedAt(req.user!.id),
  ]);

  try {
    assertCanScheduleStatus(planSlug, { lastScheduledStatusAt: result.rows[0]?.last ?? null, accountCreatedAt });
    res.json({ allowed: true });
  } catch (err) {
    if (err instanceof SubscriptionError) {
      return res.status(403).json(err.toJSON());
    }
    throw err;
  }
}));
