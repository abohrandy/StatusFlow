-- StatusFlow Billing System Schema (Migration 002)
--
-- Replaces the placeholder `subscription_plans` / `user_subscriptions` / `payments`
-- tables introduced in migration 001 with the production billing schema described in
-- docs/SUBSCRIPTIONS.md and docs/PAYSTACK.md. Those placeholder tables were never
-- written to by any application code (no real payment flow existed yet), so dropping
-- them here is a schema replacement, not a deletion of production data. From this
-- migration forward, billing rows are additive only — see the "never deleted" notes
-- on each table below.
--
-- Migration files are never edited after being applied; 001_initial_schema.sql is left
-- untouched and this migration transforms its billing tables forward instead.

DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscription_plans;
DROP TYPE IF EXISTS plan_tier;
DROP TYPE IF EXISTS payment_status;

-- Enums
CREATE TYPE billing_cycle AS ENUM ('lifetime', 'weekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'successful', 'failed', 'abandoned', 'reversed');
CREATE TYPE invoice_status AS ENUM ('paid', 'pending', 'void');

-- 1. Plans
-- Mirrors PLAN_DEFINITIONS in packages/subscriptions/src/plans.ts. This table exists for
-- foreign-key integrity, admin visibility, and historical price snapshots — the
-- application's runtime permission/feature-gate logic still reads
-- @statusflow/subscriptions directly, never this table, so pricing/feature rules stay
-- centralized in one place.
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    billing_cycle billing_cycle NOT NULL,
    sort_order INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Paystack's recurring-billing "Plan" code, created lazily on first checkout
    -- (see apps/api/src/services/paystack.ts#ensurePaystackPlan) so renewals are handled
    -- by Paystack itself rather than us re-initializing a transaction every cycle.
    paystack_plan_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subscriptions
-- One row per subscription lifecycle attempt. A user accumulates many rows over time
-- (e.g. free -> weekly-pro -> cancelled -> monthly-business); rows are never deleted,
-- only transitioned between statuses, so subscription history is fully auditable.
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    plan_slug VARCHAR(50) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    paystack_customer_code VARCHAR(255),
    paystack_subscription_code VARCHAR(255),
    paystack_email_token VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Expiration date: when the current paid period lapses if not renewed.
    current_period_end TIMESTAMP WITH TIME ZONE,
    -- Next billing: when Paystack is expected to attempt the next auto-renewal charge.
    next_billing_at TIMESTAMP WITH TIME ZONE,
    -- Renewal date: timestamp of the most recent successful renewal charge.
    renewed_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    -- Count of consecutive on-time renewals for this subscription row, used to power the
    -- "you've renewed 4 weeks in a row, switch to Monthly Business" upgrade prompt.
    -- Reset to 0 whenever the row is newly activated (not renewed).
    consecutive_renewals INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enforce "one active subscription per user" while still allowing unlimited historical
-- (cancelled/expired) rows for the same user.
CREATE UNIQUE INDEX idx_one_active_subscription_per_user ON subscriptions(user_id) WHERE status = 'active';
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_paystack_subscription_code ON subscriptions(paystack_subscription_code);

-- 3. Payments
-- Every payment attempt — successful, failed, or abandoned. Many payments per user.
-- Never deleted, including failed/abandoned rows, so the payment history and admin
-- payment ledger are always complete.
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan_slug VARCHAR(50) NOT NULL,
    -- The Paystack transaction reference we generated at initialize time.
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    gateway VARCHAR(50) NOT NULL DEFAULT 'paystack',
    -- Full raw gateway response payload (Paystack verify/webhook data) for audit purposes.
    gateway_response JSONB,
    status payment_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 4. Invoices
-- One invoice per successfully billed period. Never deleted.
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    plan_slug VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status invoice_status NOT NULL DEFAULT 'pending',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);

-- 5. Webhook logs
-- Every inbound Paystack webhook delivery, valid signature or not. Never deleted — this
-- table is the audit trail proving that subscription activation only ever happened as a
-- result of a signature-verified webhook event, never a client-side claim.
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'paystack',
    event_type VARCHAR(100),
    reference VARCHAR(255),
    payload JSONB NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processing_error TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_logs_reference ON webhook_logs(reference);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
