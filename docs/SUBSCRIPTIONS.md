# Subscription System

The subscription system lives in `packages/subscriptions` (`@statusflow/subscriptions`) as a
standalone, persistence-agnostic module. Any app in the monorepo (`api`, `worker`, `web`,
`mobile`) can import it to answer "what is this user allowed to do" without duplicating plan
logic. It has no UI and no database driver — it takes plan slugs and usage snapshots in,
and returns plain data (or throws a typed error) out.

## Design principle: config over conditionals

Every plan-specific rule — pricing, quotas, and feature availability — is declared once in
`packages/subscriptions/src/plans.ts`, in the `PLAN_DEFINITIONS` object. Nothing else in the
module (or in code that consumes it) should contain a hardcoded `if (planSlug === 'free')`
check. Instead:

- **Permission checks** (`permissions.ts`) read a plan's `limits`/`features` directly.
- **Feature gates** (`featureGate.ts`) read the same config, and compute upgrade suggestions
  by scanning `PLAN_DEFINITIONS` for the cheapest plan that would satisfy the request — they
  never name a specific plan slug in their logic.

### Adding a new plan

Add one entry to `PLAN_DEFINITIONS` in `plans.ts` with its `price`, `billingCycle`, `order`,
`limits`, and `features`. That's it — `PlanSlug` is `keyof typeof PLAN_DEFINITIONS`, so the
type system picks it up automatically, and every permission/feature-gate/billing helper
already iterates the config rather than switching on known slugs. Give the new plan an
`order` between two existing plans (or above the highest) to control where it slots into
upgrade suggestions.

## Plans

| Plan | Slug | Price | Billing cycle | WhatsApp accounts | Scheduling |
|---|---|---|---|---|---|
| Free | `free` | ₦0 | Lifetime | 1 | 1 status every 7 days |
| Weekly Pro | `weekly-pro` | ₦2,000 | Weekly | Unlimited | Unlimited, schedule months ahead |
| Monthly Business | `monthly-business` | ₦6,000 | Monthly | Unlimited | Unlimited, schedule months ahead |

### Feature matrix

| Feature | Free | Weekly Pro | Monthly Business |
|---|---|---|---|
| Text / image / video statuses | ✅ | ✅ | ✅ |
| Schedule months ahead | ❌ | ✅ | ✅ |
| Drafts | ❌ | ✅ | ✅ |
| Calendar view | ❌ | ✅ | ✅ |
| Posting history | ❌ | ✅ | ✅ |
| Priority queue | ❌ | ✅ | ✅ |
| Email support | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| Early feature access | ❌ | ❌ | ✅ |

## Module layout

```
packages/subscriptions/src/
  plans.ts        Central plan config (PLAN_DEFINITIONS), PlanSlug type, getPlan/listPlans
  types.ts        Subscription domain model, SubscriptionUsage, createFreeSubscription
  errors.ts       SubscriptionError + error codes + buildUpgradeSuggestion
  permissions.ts  Pure config lookups: hasFeature, canUseMediaType, account limits, etc.
  billing.ts      Pricing, billing cycle, renewal dates, upgrade/downgrade listings
  featureGate.ts  Usage-aware checks that return a FeatureGateResult or throw SubscriptionError
  index.ts        Public exports
```

### `plans.ts` — Plan constants

- `PLAN_DEFINITIONS` — the source of truth described above.
- `PlanSlug` — `'free' | 'weekly-pro' | 'monthly-business'`, derived from the config.
- `getPlan(slug)` / `listPlans()` — lookups, the latter sorted by `order`.

### `types.ts` — Subscription model

```ts
interface Subscription {
  id: string;
  userId: string;
  planSlug: PlanSlug;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: string;      // ISO timestamp
  currentPeriodEnd: string | null; // null for lifetime plans (Free)
  cancelAtPeriodEnd: boolean;
  paystackCustomerCode?: string | null;
  paystackSubscriptionCode?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

`createFreeSubscription(userId)` builds the default record a new signup should get.

`SubscriptionUsage` is the small usage snapshot the feature gate needs — currently
`lastScheduledStatusAt` and `connectedWhatsAppAccounts`. Callers assemble this from whatever
their persistence layer is (Postgres query, cache, etc.); the module itself never queries a
database.

### `permissions.ts` — Permission helper

Stateless config lookups — no quota/usage awareness:

- `hasFeature(planSlug, feature)`
- `canUseMediaType(planSlug, mediaType)`
- `getWhatsAppAccountLimit(planSlug)` / `canConnectAnotherWhatsAppAccount(planSlug, count)`
- `getScheduledStatusIntervalDays(planSlug)` / `hasUnlimitedScheduling(planSlug)`

### `billing.ts` — Billing helper

- `formatPrice(planSlug)` → `"₦2,000"`
- `getAmountInKobo(planSlug)` — for building Paystack charge/initialize payloads
- `getBillingCycle(planSlug)`, `isFreePlan(planSlug)`, `isPaidPlan(planSlug)`
- `computePeriodEnd(planSlug, periodStart)` — `null` for lifetime plans, else +7 days / +1 month
- `listUpgradeOptions(planSlug)` / `listDowngradeOptions(planSlug)` / `getNextUpgrade(planSlug)`

### `featureGate.ts` — Feature gate helper

Usage-aware checks. Each returns a `FeatureGateResult`:

```ts
interface FeatureGateResult {
  allowed: boolean;
  code?: SubscriptionErrorCode;
  reason?: string;
  upgrade?: { planSlug: PlanSlug; planName: string; message: string };
  retryAfter?: string; // ISO timestamp, interval-based quotas only
}
```

- `canScheduleStatus(planSlug, usage, now?)` — enforces `scheduledStatusIntervalDays`.
- `canConnectWhatsAppAccount(planSlug, currentAccountCount)`
- `canPostMediaType(planSlug, mediaType)`
- `canUseFeature(planSlug, feature)`

Each has an `assertCan*` twin (`assertCanScheduleStatus`, `assertCanConnectWhatsAppAccount`,
`assertCanUseMediaType`, `assertCanUseFeature`) that throws a `SubscriptionError` instead of
returning a result — convenient in an Express route handler:

```ts
import { assertCanScheduleStatus, SubscriptionError } from '@statusflow/subscriptions';

try {
  assertCanScheduleStatus(user.planSlug, { lastScheduledStatusAt: user.lastScheduledStatusAt });
  // proceed to create the scheduled status
} catch (err) {
  if (err instanceof SubscriptionError) {
    return res.status(403).json(err.toJSON());
  }
  throw err;
}
```

## Meaningful API errors

`SubscriptionError` carries a machine-readable `code`, a human-readable `message` (reason +
upgrade suggestion combined), and `toJSON()` for returning directly as an API error body.

| Code | Example message |
|---|---|
| `SCHEDULE_QUOTA_EXCEEDED` | "You have already used your free scheduled status this week. Upgrade to Weekly Pro to schedule unlimited statuses." |
| `WHATSAPP_ACCOUNT_LIMIT_REACHED` | "Your plan allows up to 1 connected WhatsApp account. Upgrade to Weekly Pro to connect more WhatsApp accounts." |
| `MEDIA_TYPE_NOT_ALLOWED` | "Your plan does not support video statuses. Upgrade to &lt;plan&gt; to post video statuses." |
| `FEATURE_NOT_AVAILABLE` | "Drafts is not available on your plan. Upgrade to Weekly Pro to unlock drafts." |

The upgrade suggestion is never hardcoded to a specific plan name — it's computed by scanning
`listUpgradeOptions(planSlug)` (plans with a higher `order`) for the cheapest one that would
satisfy the request. Today that resolves to "Weekly Pro" for a Free user, but adding a plan
between Free and Weekly Pro later would redirect the suggestion automatically.

## Free plan quota rule

`canScheduleStatus` compares `now` against `usage.lastScheduledStatusAt + scheduledStatusIntervalDays`.
For Free (`scheduledStatusIntervalDays: 7`), a second scheduled status is rejected until 7 days
have elapsed since the last one; `retryAfter` on the result tells the caller exactly when the
quota resets. Weekly Pro and Monthly Business have `scheduledStatusIntervalDays: null`, so the
check is a no-op for them — this is what "keep permissions driven from configuration rather
than hardcoded checks" means in practice: the paid tiers were never special-cased, they simply
have no interval to violate.

## Database, Paystack, and UI wiring

The sections above describe the persistence-agnostic `@statusflow/subscriptions` package
itself. It is now fully wired into a real backend and UI:

- **Database**: `apps/api` persists `Subscription`/`Payment`/`Invoice`/webhook records to
  Postgres — see [DATABASE.md](DATABASE.md#billing-schema-database-migrations002_billing_systemsql).
- **Paystack**: initialize/verify/webhook/cancel are fully implemented — see
  [PAYSTACK.md](PAYSTACK.md). Activation only ever happens inside the signature-verified
  webhook handler.
- **Middleware**: `apps/api/src/middleware/subscriptionGate.ts` protects premium features
  (unlimited scheduling, drafts, priority queue, future scheduling) by loading the
  caller's real subscription and delegating the decision entirely to this package's
  `assertCanUseFeature`/`assertCanScheduleStatus` — it contains no plan rules of its own.
- **UI**: `apps/web/src/components/SubscriptionBilling.tsx` (pricing cards + payment
  history + invoices), `apps/web/src/components/modals/FreeQuotaModal.tsx` and
  `SmartUpgradePrompts.tsx` (in-app modals, never browser `alert()`s), and the Admin
  Panel's Subscription Management tab (`apps/web/src/components/AdminPanel.tsx`).

## Smart upgrade prompts

Computed server-side in `GET /api/v1/billing/subscription` (`buildSmartPrompts` in
`apps/api/src/routes/billing.ts`), surfaced client-side as modals and, once triggered, also
persisted as deduped notifications (see [DATABASE.md](DATABASE.md#notification-metadata-database-migrations004_notification_metadatasql)):

| Scenario | Condition | Message |
|---|---|---|
| Renewal savings | Weekly Pro, `consecutive_renewals === 4` exactly (fires once, not every subsequent renewal) | "You're spending ₦8,000 every four weeks. Switch to Monthly Business and save ₦2,000 every month." |
| Expiry warning | Weekly Pro, cancelled or past-due, `current_period_end` within 3 days | "Your Weekly Pro subscription expires in 3 days. Renew now or switch to Monthly Business to save money." |

Both boundary conditions (fires at exactly 4, not 3 or 5; fires within the 3-day window,
not before or after; never fires for a normally auto-renewing subscription) were verified
directly during the production review.

## Production review notes

A full review of this system (Free-plan enforcement, webhook-only activation, renewal/
cancellation/expiration, referral rewards, admin data accuracy) was performed by compiling
the actual repository/service code and running it against a real Postgres engine and real
HTTP requests with genuine and forged Paystack signatures — not just reading the code. One
real bug was found and fixed: Express 4 does not automatically catch promise rejections
inside `async` route handlers, so a transient failure (e.g. a dropped DB connection) inside
any billing/referral/admin/notifications/webhook route — or inside the `requireAuth`
middleware itself — could have crashed the entire API process instead of failing just that
one request. Fixed with a shared `asyncHandler` wrapper (`apps/api/src/utils/asyncHandler.ts`)
applied to every route, a global Express error-handling middleware in `index.ts`, and
try/catch hardening around `requireAuth` and the webhook logger. Re-tested afterward: the
server now survives the same failure scenario and returns a proper error response instead
of dying.

One limitation of the review environment worth disclosing: the sandbox has no Docker/local
Postgres, so verification used an embedded WASM Postgres (`@electric-sql/pglite`) exposed
over a real Postgres-wire-protocol socket, which does not reliably support multiple
simultaneous client connections. This surfaced as connection resets specifically when a
second concurrent process queried the same instance the live API server was using — a
limitation of that lightweight test harness, not of the reviewed code (a single-process,
sequential exercise of the exact same compiled repository functions against the same
engine passed all assertions, including the full activate → renew ×4 → cancel → expire →
plan-switch lifecycle and the complete referral attribution → conversion → reward flow).
Real production Postgres does not have this limitation.
