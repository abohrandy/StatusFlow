# StatusFlow - Supabase Integration & Connection Guide

Connect your live Supabase project to StatusFlow in 3 easy steps.

---

## Step 1: Create a Supabase Project & Get API Keys

1. Go to [https://supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project** and name it `StatusFlow`.
3. Set your Database Password and select your region (e.g. Frankfurt or London).
4. Once created, go to **Project Settings** ➔ **API**:
   - Copy **Project URL** (e.g. `https://xyzcompany.supabase.co`).
   - Copy **anon public API Key** (e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`).

---

## Step 2: Run Database Migrations in Supabase SQL Editor

1. In your Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Copy and paste the full contents of our initial database migration file:
   👉 [`database/migrations/001_initial_schema.sql`](file:///c:/Work/Reelas/Status%20Flow/database/migrations/001_initial_schema.sql)
4. Click **RUN**. (This creates all 16 tables, foreign keys, indexes, and ENUM types).
5. Open a second **New Query**, copy and paste our seed data file:
   👉 [`database/seeds/001_seed_plans_and_data.sql`](file:///c:/Work/Reelas/Status%20Flow/database/seeds/001_seed_plans_and_data.sql)
6. Click **RUN**. (This populates subscription plans: Free, Weekly ₦2,000, Monthly ₦6,000).

---

## Step 3: Add Variables in Railway.app

1. Open your **StatusFlow Project** on [Railway.app](https://railway.app).
2. Click on your **Web/API Service** ➔ Go to **Variables** tab.
3. Add the following environment variables:

| Variable Name | Value from Supabase |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-public-key` |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` |

4. Click **Save and Deploy**.

Railway will automatically re-deploy, and your remote app will now be connected to your live Supabase database!
