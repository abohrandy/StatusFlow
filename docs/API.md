# StatusFlow - REST & WebSocket API Specification

## Authentication

Every endpoint below except `GET /api/v1/health` and `POST /api/v1/webhooks/paystack`
requires `Authorization: Bearer <supabase-access-token>`. The token is validated against
Supabase Auth (`apps/api/src/middleware/auth.ts`), which also lazily provisions the
matching row in the app's own `users` table on first use — see
[DATABASE.md](DATABASE.md#users).

Admin endpoints (`/api/v1/admin/*`) additionally require `users.role = 'ADMIN'`.

## Billing Endpoints (`/api/v1/billing`)

| Method & Path | Description |
|---|---|
| `POST /billing/initialize` | Body `{ planSlug }` (`weekly-pro` \| `monthly-business`). Creates a pending `payments` row and a Paystack transaction, returns `{ authorizationUrl, reference }` to redirect the user to. |
| `GET /billing/verify?reference=` | Server-to-server check against Paystack's verify endpoint, for UX feedback only. **Never activates a subscription** — see [PAYSTACK.md](PAYSTACK.md). |
| `GET /billing/subscription` | Current plan, subscription status/dates, and computed `smartPrompts` (see [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md#smart-upgrade-prompts)). |
| `POST /billing/cancel` | Cancels the caller's active paid subscription (`cancel_at_period_end = true`); calls Paystack to disable the underlying recurring subscription first. |
| `GET /billing/payments` | Caller's payment history (all statuses). |
| `GET /billing/invoices` | Caller's invoices. |
| `GET /billing/subscriptions/history` | Caller's full subscription history (all past + current rows). |
| `POST /billing/schedule-check` | Runs the Free plan's 7-day scheduling quota check via `@statusflow/subscriptions#assertCanScheduleStatus`, using the caller's real `status_posts` history. Returns `{allowed:true}` or a 403 with a `SubscriptionError` body (see [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md#meaningful-api-errors)). |

## Paystack Webhook (`/api/v1/webhooks`)

| Method & Path | Description |
|---|---|
| `POST /webhooks/paystack` | Signature-verified Paystack event ingestion. Mounted before `express.json()` so the raw request body is available for HMAC verification. See [PAYSTACK.md](PAYSTACK.md) for the full event-handling contract. |

## Referral Endpoints (`/api/v1/referrals`)

| Method & Path | Description |
|---|---|
| `GET /referrals/code` | Returns (creating if needed) the caller's referral code. |
| `POST /referrals/invite` | Body `{ email? }`. Records an invite under the caller's code. |
| `POST /referrals/attribute` | Body `{ code }`. Attributes the caller (a brand-new signup) to the referrer owning `code`. Called once, right after registration — see [REFERRALS.md](REFERRALS.md). |
| `GET /referrals/dashboard` | `{ code, invites, conversions, rewards, history }` for the caller. |

## Notification Endpoints (`/api/v1/notifications`)

| Method & Path | Description |
|---|---|
| `GET /notifications` | Caller's notifications, newest first. Currently populated only by the billing smart-prompt logic (see [SUBSCRIPTIONS.md](SUBSCRIPTIONS.md#smart-upgrade-prompts)). |
| `POST /notifications/:id/read` | Marks one notification read. |
| `POST /notifications/read-all` | Marks all of the caller's notifications read. |

## Admin Endpoints (`/api/v1/admin`)

Requires `role = 'ADMIN'`.

| Method & Path | Description |
|---|---|
| `GET /admin/dashboard` | Aggregate billing stats: active subscriptions, weekly/monthly revenue, expired subscriptions, free vs. paid user counts. |
| `GET /admin/subscriptions?search=` | Subscriptions joined with user email; empty search returns the most recent. |
| `GET /admin/subscriptions/:id` | Subscription detail + that user's payments, invoices, and referral rewards. |
| `POST /admin/subscriptions/:id/cancel` | Immediately cancels a subscription. |
| `POST /admin/subscriptions/:id/extend` | Body `{ days }`. Extends `current_period_end` / `next_billing_at`. |
| `POST /admin/subscriptions/activate` | Body `{ email, planSlug }`. Manually grants a plan, reusing the same activation path Paystack webhooks use. |
| `GET /admin/payments` | All payments across all users. |
| `GET /admin/invoices` | All invoices across all users. |
| `GET /admin/webhook-logs` | Every inbound Paystack webhook delivery, valid signature or not. |
| `GET /admin/referral-rewards` | Every referral reward granted, across all users. |

## User Settings Endpoints
- `GET /api/v1/users/profile` - Retrieve user profile
