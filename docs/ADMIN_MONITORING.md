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
| **Subscription Revenue?** | **₦4.28M / month** (Paystack MRR) | Paystack webhook transactions ledger | Weekly & Monthly plans |
| **Weekly Retention Rate?** | **78.4%** (W4 retention cohort) | Telemetry cohort retention metrics | Active repeat schedulers |
