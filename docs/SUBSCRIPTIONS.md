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

## What this module intentionally does not do (yet)

- **No database wiring.** `apps/api` and `apps/worker` in this repo are currently thin
  scaffolds with no ORM/query layer at all (see `apps/api/src/index.ts`). Wiring
  `Subscription` records to actual Postgres/Supabase storage, and calling the feature gate
  from real API routes, is follow-up work once those layers exist.
- **No Paystack HTTP calls.** `getAmountInKobo` and the pricing helpers give you what you need
  to build a Paystack initialize/charge payload, but the actual webhook handling described in
  `docs/PAYSTACK.md` (`charge.success`, `subscription.disable`, etc.) is a separate integration
  layer that should call into this module's helpers, not duplicate its plan logic.
- **No UI.** Per the current scope, the web dashboard's `SubscriptionBilling.tsx` and the
  mobile app's `billing.tsx` are unchanged.
