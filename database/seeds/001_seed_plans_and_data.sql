-- Seed Subscription Plans
INSERT INTO subscription_plans (name, tier, monthly_price, max_accounts, monthly_posts_cap)
VALUES 
    ('Free Starter', 'STARTER', 0.00, 1, 4),
    ('Weekly Pro', 'PRO', 2000.00, 1, 9999),
    ('Monthly Business', 'AGENCY', 6000.00, 1, 99999)
ON CONFLICT (tier) DO UPDATE 
SET monthly_price = EXCLUDED.monthly_price,
    max_accounts = EXCLUDED.max_accounts,
    monthly_posts_cap = EXCLUDED.monthly_posts_cap;

-- Grant Super Admin privileges to abohrandy@gmail.com
INSERT INTO users (email, role)
VALUES ('abohrandy@gmail.com', 'ADMIN')
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN';
