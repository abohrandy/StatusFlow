-- Notification metadata for smart billing prompts (Migration 004)
--
-- Additive columns only — existing rows and existing NotificationCenter behavior are
-- unaffected. `dedupe_key` lets the billing system avoid re-inserting the same "renew
-- and save" or "expires in 3 days" notification on every request; it's only set by the
-- new smart-prompt logic, so pre-existing notification types are untouched.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_dedupe
    ON notifications(user_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;
