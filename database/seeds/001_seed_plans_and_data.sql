-- Seed Subscription Plans
-- Mirrors PLAN_DEFINITIONS in packages/subscriptions/src/plans.ts. If you change pricing
-- or ordering there, update this seed (and re-run it) to match.
INSERT INTO plans (slug, name, price, currency, billing_cycle, sort_order)
VALUES
    ('free', 'Free', 0.00, 'NGN', 'lifetime', 0),
    ('weekly-pro', 'Weekly Pro', 2000.00, 'NGN', 'weekly', 10),
    ('monthly-business', 'Monthly Business', 6000.00, 'NGN', 'monthly', 20)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    billing_cycle = EXCLUDED.billing_cycle,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- Grant Super Admin privileges to abohrandy@gmail.com
INSERT INTO users (email, role)
VALUES ('abohrandy@gmail.com', 'ADMIN')
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN';
