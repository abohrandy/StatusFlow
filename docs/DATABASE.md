# StatusFlow - Database Schema & Design

## Media Files Table Specs (`media_files`)
- `id`: UUID Primary Key
- `user_id`: UUID Foreign Key -> `users.id`
- `file_name`: String
- `file_url`: S3 Public / Presigned URL
- `file_size`: Integer (bytes)
- `mime_type`: String (`image/jpeg`, `video/mp4`)
- `created_at`: Timestamp

## Users

`users` (from `database/migrations/001_initial_schema.sql`) is populated two ways:
1. The seed script grants `role = 'ADMIN'` to the super-admin email.
2. Every other row is created **lazily** the first time a Supabase-authenticated request
   hits the API (`apps/api/src/middleware/auth.ts`) — Supabase's own signup flow only
   creates a row in its internal `auth.users` schema, not this app's `public.users` table,
   so the API upserts a matching row (same `id`, taken from the Supabase JWT) on first use.

## Billing Schema (`database/migrations/002_billing_system.sql`)

Introduced to replace the placeholder `subscription_plans` / `user_subscriptions` /
`payments` tables from migration 001, which were never written to by any real code path.
See the migration file's header comment for why this is a schema *replacement*, not a
data deletion. Migration 001 itself is left untouched, per standard migration hygiene —
schema changes are always additive follow-up migrations, never edits to an already-applied
file.

### `plans`
Mirrors `PLAN_DEFINITIONS` in `packages/subscriptions/src/plans.ts` — kept in the database
for foreign-key integrity, admin visibility, and to store each plan's Paystack recurring
`paystack_plan_code` once it's been created. The application's actual permission/feature
logic still reads `@statusflow/subscriptions`, never this table.

| Column | Notes |
|---|---|
| `slug` | `free` \| `weekly-pro` \| `monthly-business` |
| `price`, `currency`, `billing_cycle` | Must match `packages/subscriptions/src/plans.ts` |
| `sort_order` | Ranks plans cheapest → most capable; drives upgrade suggestions |
| `paystack_plan_code` | Set lazily on first checkout for that plan (see `billingService.ensurePaystackPlan`) |

### `subscriptions`
One row per subscription lifecycle attempt — **never deleted**, only transitioned between
statuses, so a user's full plan history is always reconstructable.

| Column | Notes |
|---|---|
| `status` | `active` \| `past_due` \| `cancelled` \| `expired` |
| `current_period_start` / `current_period_end` | The paid period this row covers |
| `next_billing_at` | When Paystack is expected to auto-charge next |
| `renewed_at` | Timestamp of the most recent successful renewal |
| `cancel_at_period_end` | Set by `/billing/cancel`; subscription stays `active` until the period ends, then a webhook or the worker's sweep expires it |
| `consecutive_renewals` | Drives the "switch to Monthly Business" smart prompt at exactly 4 |
| `paystack_subscription_code` / `paystack_email_token` | Needed to call Paystack's disable-subscription API |

A partial unique index enforces **one active subscription per user**
(`idx_one_active_subscription_per_user ... WHERE status = 'active'`) while leaving
historical (cancelled/expired) rows for the same user unrestricted.

### `payments`
Every payment attempt — successful, failed, or abandoned — **never deleted**. `reference`
is the Paystack transaction reference and is globally unique.

### `invoices`
One row per successfully billed period, linked to both the `subscriptions` row it belongs
to and the `payments` row that paid for it.

### `webhook_logs`
Every inbound Paystack webhook delivery, valid signature or not, **never deleted**. This is
the audit trail proving subscription activation only ever happens as a result of a
signature-verified webhook — see [PAYSTACK.md](PAYSTACK.md).

## Referral Schema (`database/migrations/003_referral_system.sql`)

See [REFERRALS.md](REFERRALS.md) for the full reward mechanics. Tables:

- **`referral_codes`** — one per user.
- **`referrals`** — one per referred signup. `referred_user_id` is unique (a person can be
  attributed to at most one referrer, ever) and a `CHECK` constraint blocks self-referral.
- **`referral_rewards`** — one per reward tier granted to a referrer. A unique index on
  `(referrer_user_id, reward_type)` ensures each tier is granted at most once per referrer.

## Notification Metadata (`database/migrations/004_notification_metadata.sql`)

Additive `type` and `dedupe_key` columns on the existing `notifications` table (from
migration 001), plus a partial unique index on `(user_id, dedupe_key)`. Used by the billing
smart-prompt logic to avoid inserting the same "you're spending ₦8,000 every four weeks"
or "expires in 3 days" notification more than once per milestone. Pre-existing notification
rows and behavior are unaffected — the columns are nullable/defaulted.
