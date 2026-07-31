# Referral Program

Users get a shareable referral code. Rewards are granted only after a referred user
completes a **real, webhook-verified** Paystack payment — never on signup alone.

| Referrals converted | Reward |
|---|---|
| 1 | One week of Weekly Pro |
| 3 | One month of Monthly Business |

## Architecture

- **Schema**: `database/migrations/003_referral_system.sql` — see
  [DATABASE.md](DATABASE.md#referral-schema-database-migrations003_referral_systemsql).
- **Backend**: `apps/api/src/repositories/referralRepository.ts` (data access) +
  `apps/api/src/services/referralService.ts` (reward evaluation/granting) +
  `apps/api/src/routes/referrals.ts` (API).
- **Frontend**: `apps/web/src/components/ReferralDashboard.tsx` (code, invites,
  conversions, reward progress, history) — reachable from the "Refer & Earn" sidebar tab.

## Flow

1. **Code generation** — `GET /api/v1/referrals/code` gets-or-creates an 8-character code
   (excludes ambiguous characters like `0`/`O`/`1`/`I`) for the caller.
2. **Sharing** — the dashboard builds a link of the form
   `{origin}/register?ref=CODE`.
3. **Signup attribution** — `Register.tsx` captures `?ref=` into `localStorage` at signup
   time (Supabase signup may require email confirmation before a session exists, so
   attribution can't happen synchronously). `AuthContext.tsx` attributes it — via
   `POST /api/v1/referrals/attribute` — the first time a session becomes available,
   whether that's immediately or after the user confirms their email.
4. **Conversion** — inside the Paystack webhook handler's `charge.success` case, once a
   payment is marked successful, `tryConvertReferral` marks the matching `referrals` row
   `converted` (only if it was still `signed_up` — idempotent against webhook redelivery).
5. **Reward evaluation** — after a conversion, `referralService` counts the referrer's
   total converted referrals and grants any newly-crossed tier.

## Abuse prevention

| Vector | Mitigation |
|---|---|
| Self-referral | `CHECK (referrer_user_id <> referred_user_id)` on `referrals` |
| Re-attributing an existing user to a new code | `referred_user_id` is `UNIQUE` — first attribution wins, later ones are a silent no-op |
| Reusing one payment to trigger multiple conversions | `converted_payment_id` is uniquely indexed |
| Re-crossing an already-rewarded tier | Unique index on `(referrer_user_id, reward_type)` |
| Two concurrent conversions racing to grant the same reward | `claimRewardSlot` inserts a `pending` reward row FIRST (an atomic claim via the unique index above); only the request that wins the insert applies the reward's side effect (extending/creating a subscription). The loser sees `null` back and does nothing — this was specifically verified in the production review, since applying the side effect before claiming would let both racers double-grant. |
| Rewarding a referral before real payment | Rewards are only ever evaluated from `tryConvertReferral`, itself only called from the webhook handler on a signature-verified `charge.success` |

## Applying a reward

`referralService.applyReward` reuses the same `activateOrRenewSubscription` function the
webhook handler uses: if the referrer is already on the reward's plan, it extends
`current_period_end`; otherwise it activates a fresh subscription for that plan. Reusing
the shared billing period math (`computePeriodEnd` from `@statusflow/subscriptions`) means
a freshly-granted reward's duration exactly matches the reward (7 days / 1 month) with no
separate date arithmetic to keep in sync.

## Admin visibility

The Admin Panel's **Referrals** tab (`GET /api/v1/admin/referral-rewards`) lists every
reward ever granted, across all users, and each subscription's admin detail view
additionally lists that specific user's referral rewards.
