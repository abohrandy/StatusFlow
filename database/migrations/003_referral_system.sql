-- StatusFlow Referral System Schema (Migration 003)
--
-- Referral rewards:
--   1 successful paid referral   -> 1 week of Weekly Pro
--   3 successful paid referrals  -> 1 month of Monthly Business
--
-- "Successful" means the referred user completed a Paystack payment that was confirmed
-- via a verified webhook (see docs/PAYSTACK.md) — never a client-side claim. See
-- apps/api/src/routes/referrals.ts and the referral conversion step inside the webhook
-- handler for how these tables are written.

CREATE TYPE referral_status AS ENUM ('invited', 'signed_up', 'converted', 'rewarded', 'expired');
CREATE TYPE referral_reward_status AS ENUM ('pending', 'granted', 'revoked');
CREATE TYPE referral_reward_type AS ENUM ('weekly_pro_week', 'monthly_business_month');

-- 1. Referral codes — one per user, generated on first request.
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Referrals — one row per referred signup.
-- Abuse prevention:
--   - `referred_user_id` is UNIQUE: a person can be credited to at most one referrer ever
--     (first attribution at signup wins; re-signing-up under another code does nothing).
--   - `chk_no_self_referral` blocks a user from referring themselves.
--   - Conversion is tied to `converted_payment_id`, which is itself unique below, so the
--     same payment can never trigger two conversions.
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    referred_email VARCHAR(255),
    referred_user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    status referral_status NOT NULL DEFAULT 'invited',
    converted_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_no_self_referral CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred_user ON referrals(referred_user_id);
CREATE UNIQUE INDEX idx_referrals_converted_payment ON referrals(converted_payment_id) WHERE converted_payment_id IS NOT NULL;

-- 3. Referral rewards — one row per reward tier granted to a referrer. Historical; if a
-- reward is later revoked (e.g. the triggering payment was refunded), the row's status
-- flips to 'revoked' rather than being deleted.
-- The unique index below ensures each referrer earns the 1-referral reward exactly once
-- and the 3-referral reward exactly once — additional referrals beyond 3 don't re-grant
-- either tier (further tiers can be added later as new `referral_reward_type` values).
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type referral_reward_type NOT NULL,
    referrals_required INT NOT NULL,
    status referral_reward_status NOT NULL DEFAULT 'pending',
    applied_to_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_user_id);
CREATE UNIQUE INDEX idx_one_reward_per_type_per_referrer ON referral_rewards(referrer_user_id, reward_type);
