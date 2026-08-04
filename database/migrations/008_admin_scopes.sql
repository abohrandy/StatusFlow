-- Splits the previously-flat ADMIN role into a real hierarchy:
--   USER         - no admin access at all.
--   ADMIN        - delegated access to specific admin departments, granted per-user
--                  via admin_scopes below. An ADMIN with no rows in admin_scopes has
--                  the Admin Panel but sees none of its tabs until scoped.
--   SUPER_ADMIN  - sees and can do everything, including granting/revoking ADMIN
--                  access and scopes for other users. Not scoped by admin_scopes.
--
-- ALTER TYPE ... ADD VALUE cannot run inside the same transaction as a statement that
-- uses the new value, but running as its own statement (outside an explicit BEGIN/COMMIT
-- block wrapping the rest of this file) is safe on Postgres 12+.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

CREATE TYPE admin_scope AS ENUM ('BILLING', 'USERS', 'OPS');

-- BILLING: subscriptions, payments, invoices, referral rewards.
-- USERS:   the user list / account management.
-- OPS:     webhook delivery logs, and worker/queue/audit tooling as it's built.
CREATE TABLE admin_scopes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope admin_scope NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, scope)
);

-- abohrandy@gmail.com was the app's sole hardcoded "super admin" override (removed from
-- application code — see billingRepository.getActiveSubscription) — promote it to the
-- real SUPER_ADMIN role so it keeps full access through the legitimate, revocable path.
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'abohrandy@gmail.com';
