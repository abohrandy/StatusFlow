# StatusFlow - Database Table Specs

| Table Name | Primary Key | Foreign Keys | Description |
|---|---|---|---|
| `users` | `id` | - | Authentication & core account details |
| `profiles` | `id` | `user_id` | User name, brand, timezone |
| `whatsapp_sessions` | `id` | `user_id` | Encrypted Baileys session states & status |
| `connected_accounts` | `id` | `user_id` | OAuth connection providers |
| `media_files` | `id` | `user_id` | S3 asset metadata |
| `status_posts` | `id` | `user_id`, `session_id`, `media_file_id`, `series_id` | Scheduled posts & statuses (one-time, or a materialized recurring occurrence) |
| `drafts` | `id` | `user_id` | Saved draft status posts |
| `schedules` | `id` | `user_id`, `media_file_id` | Recurring status post series (interval or specific-weekdays), each materialized into individual `status_posts` rows |
| `posting_history` | `id` | `post_id` | Delivery receipts and responses |
| `queue_logs` | `id` | `post_id` | BullMQ execution attempt logs |
| `notifications` | `id` | `user_id` | In-app user notifications |
| `subscription_plans` | `id` | - | Tiers & quota definitions |
| `user_subscriptions` | `id` | `user_id`, `plan_id` | Active Paystack subscriptions |
| `payments` | `id` | `user_id` | Paystack billing transactions |
| `settings` | `id` | `user_id` | User notification preferences |
| `audit_logs` | `id` | `user_id` | Security & activity logs |
