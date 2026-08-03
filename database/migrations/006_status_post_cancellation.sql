-- Adds a CANCELLED terminal state to post_status, distinct from FAILED, so a user who
-- cancels a still-pending post (see apps/api/src/routes/posts.ts POST /posts/:id/cancel)
-- doesn't show up in delivery-failure reporting or get treated as a failed delivery
-- attempt by the Free plan's scheduling-quota check (apps/api/src/middleware/subscriptionGate.ts).
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'CANCELLED';
