import { Router, raw } from 'express';
import type { PlanSlug } from '@statusflow/subscriptions';
import { verifyWebhookSignature } from '../services/paystack';
import { tryConvertReferral } from '../services/referralService';
import { asyncHandler } from '../utils/asyncHandler';
import {
  activateOrRenewSubscription,
  attachPaystackSubscriptionCode,
  getActiveSubscription,
  getPaymentByReference,
  getSubscriptionByPaystackCode,
  getUserIdByEmail,
  logWebhookEvent,
  markPaymentStatus,
  markSubscriptionCancelledNow,
  markSubscriptionExpired,
  markSubscriptionPastDue,
  recordFailedRenewalPayment,
  recordInvoice,
} from '../repositories/billingRepository';

export const webhooksRouter = Router();

/**
 * `charge.success` fires for both the first payment on a plan and every recurring
 * renewal Paystack processes automatically. Either way this is the ONLY place a
 * subscription is activated or renewed — see docs/PAYSTACK.md.
 */
async function handleChargeSuccess(data: any): Promise<void> {
  const reference = data.reference;
  const payment = await getPaymentByReference(reference);
  if (!payment) {
    // Paystack generates its own reference for auto-charged renewals — we only create a
    // `payments` row up front for the initial, user-initiated checkout. Match this
    // renewal to a user via the customer email Paystack always includes instead.
    const email = data.customer?.email;
    const userId = email ? await getUserIdByEmail(email) : null;
    const sub = userId ? await getActiveSubscription(userId) : null;
    if (!sub) {
      throw new Error(`charge.success for unknown reference "${reference}" and no matching active subscription for customer.`);
    }

    const renewed = await activateOrRenewSubscription({ userId: sub.user_id, planSlug: sub.plan_slug, now: new Date() });
    await recordInvoice({
      userId: sub.user_id,
      subscriptionId: renewed.id,
      paymentId: null,
      planSlug: sub.plan_slug,
      periodStart: new Date(renewed.current_period_start),
      periodEnd: renewed.current_period_end ? new Date(renewed.current_period_end) : null,
    });
    return;
  }

  if (payment.status === 'successful') return; // idempotent: Paystack may redeliver

  const planSlug = payment.plan_slug as PlanSlug;
  const now = new Date();

  const subscription = await activateOrRenewSubscription({
    userId: payment.user_id,
    planSlug,
    paystackCustomerCode: data.customer?.customer_code ?? null,
    now,
  });

  await markPaymentStatus({
    reference,
    status: 'successful',
    gatewayResponse: data,
    paidAt: now,
    subscriptionId: subscription.id,
  });

  await recordInvoice({
    userId: payment.user_id,
    subscriptionId: subscription.id,
    paymentId: payment.id,
    planSlug,
    periodStart: new Date(subscription.current_period_start),
    periodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
  });

  await tryConvertReferral(payment.user_id, payment.id, now);
}

/** Attaches the Paystack-issued subscription code/email token to our subscription row so we can later cancel it via the API. */
async function handleSubscriptionCreate(data: any): Promise<void> {
  const email = data.customer?.email;
  const subscriptionCode = data.subscription_code;
  const emailToken = data.email_token;
  if (!email || !subscriptionCode || !emailToken) return;

  const userId = await getUserIdByEmail(email);
  if (!userId) return;

  const sub = await getActiveSubscription(userId);
  if (!sub) return;

  await attachPaystackSubscriptionCode(sub.id, {
    customerCode: data.customer?.customer_code ?? null,
    subscriptionCode,
    emailToken,
  });
}

/**
 * Paystack fires this both when we called `disableSubscription` ourselves (cancellation)
 * and when it gives up on retrying a failed renewal (expiration). We distinguish using
 * whether `cancel_at_period_end` was already set by our own `/billing/cancel` route.
 */
async function handleSubscriptionDisable(data: any): Promise<void> {
  const code = data.subscription_code;
  if (!code) return;

  const sub = await getSubscriptionByPaystackCode(code);
  if (!sub || sub.status === 'cancelled' || sub.status === 'expired') return;

  if (sub.cancel_at_period_end) {
    await markSubscriptionCancelledNow(sub.id);
  } else {
    await markSubscriptionExpired(sub.id);
  }
}

/** A recurring renewal charge failed. Paystack will retry automatically; we just reflect the past-due state and log the failed attempt. */
async function handleInvoicePaymentFailed(data: any): Promise<void> {
  const code = data.subscription?.subscription_code ?? data.subscription_code;
  if (!code) return;

  const sub = await getSubscriptionByPaystackCode(code);
  if (!sub) return;

  await markSubscriptionPastDue(sub.id);
  await recordFailedRenewalPayment({
    userId: sub.user_id,
    subscriptionId: sub.id,
    planSlug: sub.plan_slug,
    reference: data.reference ?? `failed_${code}_${Date.now()}`,
    gatewayResponse: data,
  });
}

async function handlePaystackEvent(event: any): Promise<void> {
  if (!event?.event) return;

  switch (event.event) {
    case 'charge.success':
      return handleChargeSuccess(event.data);
    case 'subscription.create':
      return handleSubscriptionCreate(event.data);
    case 'subscription.disable':
      return handleSubscriptionDisable(event.data);
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data);
    default:
      return; // logged in webhook_logs regardless; no handler needed for other events
  }
}

/**
 * Paystack webhook endpoint. Mounted with `express.raw` (see index.ts) so the exact
 * bytes Paystack sent are available for HMAC signature verification — a parsed-then-
 * re-serialized JSON body would not reliably reproduce the same signature.
 *
 * Every delivery is logged to `webhook_logs`, valid signature or not, before any
 * business logic runs. This is the audit trail proving subscription activation only
 * ever happens here, never from a client-side call.
 */
webhooksRouter.post(
  '/paystack',
  raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = req.body as Buffer;
    const isValid = verifyWebhookSignature(rawBody, signature);

    let event: any = null;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      // leave event null; still logged below
    }

    // A logging failure (transient DB hiccup) must never crash the process or block us
    // from responding to Paystack — log best-effort and fall through either way.
    async function safeLog(params: Parameters<typeof logWebhookEvent>[0]) {
      try {
        await logWebhookEvent(params);
      } catch (err: any) {
        console.error('[Webhook] Failed to write webhook_logs entry:', err.message);
      }
    }

    if (!isValid) {
      await safeLog({
        eventType: event?.event ?? null,
        reference: event?.data?.reference ?? null,
        payload: event ?? {},
        signatureValid: false,
        processed: false,
        processingError: 'Invalid Paystack signature',
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let processingError: string | null = null;
    try {
      await handlePaystackEvent(event);
    } catch (err: any) {
      processingError = err.message;
      console.error('[Webhook] Processing error:', err.message);
    }

    await safeLog({
      eventType: event?.event ?? null,
      reference: event?.data?.reference ?? null,
      payload: event ?? {},
      signatureValid: true,
      processed: !processingError,
      processingError,
    });

    // Always 200 once the signature is valid, so Paystack doesn't endlessly retry a
    // permanently-failing event; failures are captured in webhook_logs for follow-up.
    res.sendStatus(200);
  }),
);
