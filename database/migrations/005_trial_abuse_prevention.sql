-- Free-trial abuse prevention: once a phone number has been used to connect WhatsApp on a
-- Free-plan account, it can never activate another Free trial — even from a different
-- email/account. This is a standalone ledger, not derived from whatsapp_sessions, because
-- whatsapp_sessions rows (and even whole user accounts) can be deleted/disconnected, but
-- this block must survive that. Never deleted, same as payments/invoices/webhook_logs.
CREATE TABLE trial_phone_numbers (
    phone_number VARCHAR(50) PRIMARY KEY,
    -- The account that first used this number. Kept for audit purposes; set to NULL (not
    -- cascade-deleted) if that account is later removed, so the phone number stays blocked.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trial_phone_numbers_user_id ON trial_phone_numbers(user_id);
