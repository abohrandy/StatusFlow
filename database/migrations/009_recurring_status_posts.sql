-- The `schedules` table has existed since 001_initial_schema.sql but was never wired up to
-- anything (see docs/database/TABLES.md's "Recurring schedule configurations" description) —
-- no repository or route anywhere ever read or wrote to it, and its cron_expression/is_active
-- columns were never implemented. This finally puts it to use as what a recurring status
-- post series actually needs: a *factory* that apps/worker's recurringSeriesSweep.ts
-- periodically materializes into ordinary status_posts rows (see status_posts.series_id
-- below), which then go through the exact same publish pipeline (WorkerProcessor.ts) a
-- one-time post already does. Nothing about how a status actually gets sent changes.
--
-- Recurrence math (see apps/worker/src/recurrence.ts) works entirely in the UTC instants
-- stored here — start_at's own UTC hour/minute doubles as the time-of-day for every future
-- occurrence, so no separate timezone-aware "time of day" column is needed.
--
-- Every statement below is idempotent (IF NOT EXISTS / duplicate_object-tolerant DO blocks)
-- on purpose — this migration got applied manually in pieces across several attempts (no
-- migration runner exists in this repo), so it needs to be safe to paste again in full
-- regardless of which parts already landed.
BEGIN;

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM ('INTERVAL', 'WEEKDAYS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE series_status AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE schedules
    ALTER COLUMN name DROP NOT NULL,
    DROP COLUMN IF EXISTS cron_expression,
    DROP COLUMN IF EXISTS is_active,
    ADD COLUMN IF NOT EXISTS media_type media_type,
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS media_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS recurrence_type recurrence_type,
    -- Required (and only meaningful) when recurrence_type = 'INTERVAL': fire every N days.
    ADD COLUMN IF NOT EXISTS interval_days INT,
    -- Required (and only meaningful) when recurrence_type = 'WEEKDAYS': 0=Sunday .. 6=Saturday.
    ADD COLUMN IF NOT EXISTS weekdays SMALLINT[],
    ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITH TIME ZONE,
    -- The timestamp of the most recent occurrence already turned into a status_posts row —
    -- NULL means nothing has been materialized yet (the series was just created).
    ADD COLUMN IF NOT EXISTS last_materialized_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status series_status NOT NULL DEFAULT 'ACTIVE';

DO $$ BEGIN
  ALTER TABLE schedules ADD CONSTRAINT schedules_recurrence_fields CHECK (
      recurrence_type IS NULL OR
      (recurrence_type = 'INTERVAL' AND interval_days IS NOT NULL AND interval_days > 0 AND weekdays IS NULL) OR
      (recurrence_type = 'WEEKDAYS' AND weekdays IS NOT NULL AND array_length(weekdays, 1) > 0 AND interval_days IS NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE schedules ADD CONSTRAINT schedules_end_after_start CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(status) WHERE status = 'ACTIVE';

ALTER TABLE status_posts ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES schedules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_status_posts_series ON status_posts(series_id) WHERE series_id IS NOT NULL;

COMMIT;
