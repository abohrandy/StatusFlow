-- Seed Subscription Plans
-- Mirrors PLAN_DEFINITIONS in packages/subscriptions/src/plans.ts. If you change pricing
-- or ordering there, update this seed (and re-run it) to match.
--
-- paystack_plan_code is set here (rather than left for ensurePaystackPlan to create lazily
-- — see apps/api/src/services/billingService.ts) because these Plans already exist live on
-- Paystack; leaving this NULL would make the first live checkout create duplicate plans.
INSERT INTO plans (slug, name, price, currency, billing_cycle, sort_order, paystack_plan_code)
VALUES
    ('free', 'Free', 0.00, 'NGN', 'lifetime', 0, NULL),
    ('weekly-pro', 'Weekly Pro', 2000.00, 'NGN', 'weekly', 10, 'PLN_dwntmk7o0ogwhml'),
    ('monthly-business', 'Monthly Business', 6000.00, 'NGN', 'monthly', 20, 'PLN_xs5tn28x1wgfg6v')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    billing_cycle = EXCLUDED.billing_cycle,
    sort_order = EXCLUDED.sort_order,
    paystack_plan_code = COALESCE(plans.paystack_plan_code, EXCLUDED.paystack_plan_code),
    updated_at = CURRENT_TIMESTAMP;

-- Grant Super Admin privileges to abohrandy@gmail.com
INSERT INTO users (email, role)
VALUES ('abohrandy@gmail.com', 'ADMIN')
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN';
