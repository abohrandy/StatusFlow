-- Seed Subscription Plans
INSERT INTO subscription_plans (name, tier, monthly_price, max_accounts, monthly_posts_cap)
VALUES 
    ('Free Starter', 'STARTER', 0.00, 1, 30),
    ('Pro Marketer', 'PRO', 15.00, 3, 500),
    ('Agency Enterprise', 'AGENCY', 49.00, 10, 999999)
ON CONFLICT (tier) DO UPDATE 
SET monthly_price = EXCLUDED.monthly_price,
    max_accounts = EXCLUDED.max_accounts,
    monthly_posts_cap = EXCLUDED.monthly_posts_cap;
