# StatusFlow - Supabase & Infrastructure Setup Guide

Connect your live Supabase project and supporting infrastructure to StatusFlow.

---

## Step 1: Create a Supabase Project & Get API Keys

1. Go to [https://supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project** and name it `StatusFlow`.
3. Set your Database Password and select your region (e.g. Frankfurt or London).
4. Once created, go to **Project Settings** ➔ **API**:
   - Copy **Project URL** (e.g. `https://xyzcompany.supabase.co`).
   - Copy **anon public API Key** (e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`).
   - Copy **service_role API Key** — used server-side only by the media upload endpoint (`apps/api/src/storage.ts`). Never expose this to the web or mobile client.

---

## Step 2: Run Database Migrations in Supabase SQL Editor

Run every file in `database/migrations/` **in order** — each one is additive on top of the last, so skipping ahead will fail on missing tables/types:

1. In your Supabase Dashboard, click **SQL Editor** ➔ **New Query**.
2. Copy and paste each of the following, in order, clicking **RUN** after each:
   - [`001_initial_schema.sql`](../database/migrations/001_initial_schema.sql) — all core tables, foreign keys, indexes, and ENUM types.
   - [`002_billing_system.sql`](../database/migrations/002_billing_system.sql) — subscriptions, payments, invoices.
   - [`003_referral_system.sql`](../database/migrations/003_referral_system.sql) — referral codes and rewards.
   - [`004_notification_metadata.sql`](../database/migrations/004_notification_metadata.sql) — smart-prompt notification metadata.
   - [`005_trial_abuse_prevention.sql`](../database/migrations/005_trial_abuse_prevention.sql) — one-trial-per-phone-number tracking.
   - [`006_status_post_cancellation.sql`](../database/migrations/006_status_post_cancellation.sql) — adds the `CANCELLED` post status.
   - [`007_media_storage_path.sql`](../database/migrations/007_media_storage_path.sql) — tracks each media file's Storage object path.
3. Open a new query, copy and paste the seed data file:
   👉 [`database/seeds/001_seed_plans_and_data.sql`](../database/seeds/001_seed_plans_and_data.sql)
4. Click **RUN**. (This populates subscription plans: Free, Weekly ₦2,000, Monthly ₦6,000).

---

## Step 3: Create the Media Storage Bucket

Status images/videos (uploaded from the Media Library or Composer) are stored in Supabase Storage, not the database.

1. In your Supabase Dashboard, click **Storage** ➔ **New Bucket**.
2. Name it exactly `status-media`.
3. Set it to **Public** (read access) — uploaded files need a stable public URL the worker can later publish. Writes still go through your own API (using the service_role key), not directly from the client, so this doesn't expose upload access.
4. Click **Create bucket**. No RLS policy setup is needed — the service_role key bypasses RLS by design.

---

## Step 4: Provision Redis

The scheduling queue (`apps/api` enqueues, `apps/worker` consumes — see `docs/SCHEDULER.md`) runs on BullMQ over Redis. On Railway, add a **Redis** plugin/service to your project; it will expose a `REDIS_URL` you can wire into both the API and Worker services in Step 5.

---

## Step 5: Add Environment Variables in Railway.app

1. Open your **StatusFlow Project** on [Railway.app](https://railway.app).
2. For **each** of the API and Worker services, go to the **Variables** tab and add:

| Variable Name | Value | Used by |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` | API, Worker |
| `REDIS_URL` | From your Railway Redis plugin | API, Worker |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | API |
| `SUPABASE_ANON_KEY` | Your anon public key | API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key (Step 1) | API |
| `PAYSTACK_SECRET_KEY` | From your Paystack dashboard | API |

3. For the **Web** service (or your static host), set:

| Variable Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Same as above |
| `VITE_SUPABASE_ANON_KEY` | Same as above |
| `VITE_API_BASE_URL` | Your deployed API's `/api/v1` URL |

4. Click **Save and Deploy** on each service.

Railway will automatically re-deploy. Once all three services (API, Worker, Web) are up with the same `DATABASE_URL`/`REDIS_URL`, scheduled status posts flow end-to-end: composer → `status_posts` row → BullMQ job → worker pickup → publish attempt.
