import { createHmac } from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  return key;
}

async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = await res.json();
  if (!res.ok || body.status === false) {
    throw new Error(body.message || `Paystack request to ${path} failed with status ${res.status}`);
  }
  return body.data as T;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Initializes a Paystack transaction for a one-off or first-time subscription charge.
 * Returns a hosted checkout URL — the caller redirects the user there. This never marks
 * anything as paid; Paystack only tells us the *attempt* was created.
 */
export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeTransactionResult> {
  const data = await paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    },
  );

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export interface VerifyTransactionResult {
  reference: string;
  status: 'success' | 'failed' | 'abandoned' | string;
  amountKobo: number;
  currency: string;
  paidAt: string | null;
  customerCode: string | null;
  authorizationCode: string | null;
  raw: unknown;
}

/**
 * Calls Paystack's server-to-server verify endpoint. This is the ONLY payment-status
 * source this module trusts — the client never gets to assert "I paid". Note: verifying
 * here is informational only. Per StatusFlow's policy, subscription activation happens
 * exclusively inside the webhook handler (see routes/webhooks.ts), not here — a verify
 * call and the webhook delivery are independent confirmations of the same event, and we
 * require the webhook specifically so activation isn't gated on the user's browser
 * successfully calling us back.
 */
export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const data = await paystackRequest<any>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });

  return {
    reference: data.reference,
    status: data.status,
    amountKobo: data.amount,
    currency: data.currency,
    paidAt: data.paid_at ?? null,
    customerCode: data.customer?.customer_code ?? null,
    authorizationCode: data.authorization?.authorization_code ?? null,
    raw: data,
  };
}

/**
 * Creates a Paystack recurring billing "Plan" (used so Paystack itself handles
 * recurring charges/retries for a subscription, rather than us re-initializing a
 * transaction every billing cycle). Idempotent from the caller's side — see
 * `ensurePaystackPlan` in services/billingService.ts, which only calls this once per
 * plan slug and persists the resulting code.
 */
export async function createPlan(params: {
  name: string;
  amountKobo: number;
  interval: 'weekly' | 'monthly';
}): Promise<string> {
  const data = await paystackRequest<{ plan_code: string }>('/plan', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      amount: params.amountKobo,
      interval: params.interval,
    }),
  });
  return data.plan_code;
}

/**
 * Disables (cancels) a Paystack recurring subscription. Requires the subscription code
 * and email token Paystack returned when the subscription was created.
 */
export async function disableSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
  await paystackRequest('/subscription/disable', {
    method: 'POST',
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });
}

/**
 * Verifies the `x-paystack-signature` header against the raw request body using HMAC
 * SHA-512, per Paystack's webhook documentation. `rawBody` MUST be the exact bytes
 * Paystack sent (see the raw-body middleware wired in routes/webhooks.ts) — re-serializing
 * a parsed JSON body will not reliably reproduce the same signature.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const hash = createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  return hash === signature;
}
