# StatusFlow - Phase 7: Super Admin Monitoring & Intelligence Dashboard Guide

This document specifies the metrics, queries, and monitoring architecture available exclusively to **Super Admin (`abohrandy@gmail.com`)** via `AdminPanel.tsx`.

---

## 1. Key Business & Infrastructure Metrics Summary

| Business Question | Monitored Metric | Data Source | SLA / Status |
|---|---|---|---|
| **How many active users?** | **1,248 Users** (1,180 MAUs) | PostgreSQL `users` table count | Healthy |
| **Connected WhatsApp sessions?** | **892 Sessions** (Strictly 1 per user) | PostgreSQL `whatsapp_sessions` table | Active sockets |
| **Scheduled posts today?** | **342 Posts** (184 published, 158 pending) | PostgreSQL `status_posts` table | Daily throughput |
| **How many failed jobs?** | **0 Failed Jobs** (DLQ Depth: 0) | BullMQ Dead-Letter Queue | 99.98% delivery rate |
| **Queue Health?** | **1.2 ms Redis Latency** (14 Pending jobs) | Redis 7 cluster connection | 10 Worker nodes |
| **Storage Usage?** | **42.8 GB** (28.4GB Images, 14.4GB Videos) | AWS S3 / Cloudflare R2 bucket stats | 8.5% capacity |
| **Weekly Retention Rate?** | **78.4%** (W4 retention cohort) | Telemetry cohort retention metrics | Active repeat schedulers |

## 1a. Billing Overview (real data)

Unlike the illustrative metrics above, the "Billing Overview" cards at the top of
`AdminPanel.tsx` are backed by a real query (`GET /api/v1/admin/dashboard`, implemented in
`apps/api/src/repositories/adminBillingRepository.ts#getDashboardStats`):

| Card | Source |
|---|---|
| Active Subscriptions | `COUNT(*)` from `subscriptions` where `status='active'` and not on the free plan |
| Weekly Revenue (7d) | `SUM(amount)` from successful Weekly Pro payments in the trailing 7 days |
| Monthly Revenue (30d) | `SUM(amount)` from successful Monthly Business payments in the trailing 30 days |
| Expired Subscriptions | `COUNT(*)` where `status='expired'` |
| Free Users | Total users minus paid users |
| Paid Users | Distinct users with an active paid subscription |

## 2. Subscription Management Tab

Full CRUD/read surface over billing, all backed by real endpoints (see
[API.md](API.md#admin-endpoints-apiv1admin)):

- **Search subscriptions** by user email, with an expandable detail view showing that
  user's payments, invoices, and referral rewards inline.
- **Cancel** a subscription immediately (distinct from the user-facing `/billing/cancel`,
  which respects the billing-period grace window).
- **Extend** a subscription by N days.
- **Manually activate** a plan for any user by email — reuses the same activation function
  Paystack webhooks use, so a comped account behaves identically to a paid one.
- **View Paystack references** — each subscription row shows its
  `paystack_subscription_code` inline.

## 3. Payments / Invoices / Referrals / Webhooks Tabs

Four more tabs, each a thin read view over one table: `payments`, `invoices`,
`referral_rewards` (joined to the referrer's email), and `webhook_logs` (showing event
type, reference, signature validity, and processing outcome — the same audit trail
[PAYSTACK.md](PAYSTACK.md) describes).
