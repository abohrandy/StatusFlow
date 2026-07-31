# Paystack Integration Architecture

StatusFlow sells two recurring plans through Paystack's Plans & Subscriptions API:
Weekly Pro (₦2,000/week) and Monthly Business (₦6,000/month). All Paystack-facing code
lives in `apps/api/src/services/paystack.ts` (the raw REST client) and
`apps/api/src/services/billingService.ts` (plan-code management).

## Golden rule: never trust client-side payment status

**Subscription activation happens in exactly one place: the signature-verified webhook
handler (`apps/api/src/routes/webhooks.ts`).** No other code path — not `/billing/verify`,
not `/billing/initialize`, not any client callback — is allowed to call
`activateOrRenewSubscription`. This was verified end-to-end during the production review:
a real HTTP request to `/api/v1/webhooks/paystack` with a forged or missing
`x-paystack-signature` is rejected with 401 and never touches the `subscriptions` table;
only a request whose signature matches an HMAC-SHA512 of the exact raw request body
(using `PAYSTACK_SECRET_KEY`) is processed.

## Checkout flow

1. **Initialize** — `POST /api/v1/billing/initialize` `{ planSlug }`:
   - Looks up (or creates, once ever) a Paystack recurring "Plan" for that slug via
     `ensurePaystackPlan`, persisting the resulting `paystack_plan_code` on the `plans` row.
   - Creates a `payments` row (`status = 'pending'`) with a generated `reference`.
   - Calls Paystack's `/transaction/initialize` with that reference and the plan code,
     returns `{ authorizationUrl }` for the client to redirect to.
2. **User pays** on Paystack's hosted checkout page, then is redirected back to
   `{FRONTEND_URL}/billing/callback?reference=...`.
3. **Verify (informational only)** — the web app calls `GET /api/v1/billing/verify` on
   that callback page to show "payment received, activating..." feedback. This calls
   Paystack's server-to-server verify endpoint and may downgrade a still-`pending` payment
   row to `failed`/`abandoned`, but it **never marks a payment `successful` and never
   touches `subscriptions`** — that's reserved for the webhook.
4. **Webhook activates** — Paystack's `charge.success` webhook (see below) arrives
   independently (usually within seconds) and is what actually activates the subscription.

## Webhook Handler (`POST /api/v1/webhooks/paystack`)

Mounted **before** `express.json()` in `apps/api/src/index.ts` so the raw request body is
available for signature verification — parsing it to JSON first and re-serializing would
not reliably reproduce Paystack's HMAC.

```typescript
// apps/api/src/services/paystack.ts
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const hash = createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  return hash === signature;
}
```

Every delivery — valid signature or not — is written to `webhook_logs` before or
immediately after processing (see [DATABASE.md](DATABASE.md#webhook_logs)), and that write
is itself wrapped so a transient logging failure can never crash the process or block the
response to Paystack.

### Supported events

| Event | Handling |
|---|---|
| `charge.success` | Matches the payment by `reference` (falling back to matching by customer email for Paystack-initiated renewal charges, which use their own reference). Calls `activateOrRenewSubscription` — first-time activation or renewal of the existing row, extending `current_period_end` and incrementing `consecutive_renewals`. Marks the payment `successful`, records an invoice, and triggers referral conversion (see [REFERRALS.md](REFERRALS.md)). |
| `subscription.create` | Attaches the Paystack-issued `subscription_code`/`email_token` to the user's active subscription row, so `/billing/cancel` can later call Paystack's disable-subscription API. |
| `subscription.disable` | Fired either because we called disable ourselves (cancellation) or Paystack gave up retrying a failed renewal (expiration). Distinguished by whether `cancel_at_period_end` was already set: if so → `cancelled`, otherwise → `expired`. |
| `invoice.payment_failed` | A recurring renewal charge failed. Marks the subscription `past_due` and records the failed attempt in `payments` (Paystack will retry automatically; `subscription.disable` follows if retries are exhausted). |

### Renewal, cancellation, and expiration in practice

- **Renewal** = another `charge.success` for an existing active subscription →
  `activateOrRenewSubscription` extends the period and increments `consecutive_renewals`.
- **Cancellation** = `POST /api/v1/billing/cancel` calls Paystack's disable-subscription API,
  then sets `cancel_at_period_end = true` (the subscription stays usable until the period
  ends — standard SaaS grace period).
- **Expiration** has two mechanisms, deliberately redundant:
  1. Reactive: the `subscription.disable` webhook, once Paystack actually stops billing.
  2. Proactive safety net: `apps/worker/src/billingSweep.ts` runs hourly and expires any
     cancelled-or-past-due subscription whose `current_period_end` is more than 24 hours in
     the past — in case a webhook is delayed or never arrives.

## Manual/admin and referral-reward activation

Two other, unrelated code paths also call `activateOrRenewSubscription` — this is
intentional, not a bypass of the "webhook-only" rule (which specifically concerns *Paystack
payments*):
- **Admin manual activation** (`POST /api/v1/admin/subscriptions/activate`) — an explicit,
  authenticated admin action for comping an account, not a payment claim.
- **Referral rewards** (`apps/api/src/services/referralService.ts`) — granting a free week
  of Weekly Pro or month of Monthly Business, itself gated on a *different* verified
  Paystack payment (the referred user's), per [REFERRALS.md](REFERRALS.md).
