import { Pool } from 'pg';

// Own pool rather than importing apps/api's — apps/worker is a separately deployed
// process (see docker-compose.yml) and doesn't share a module graph with apps/api,
// matching the existing convention in billingSweep.ts / statusPostRepository.ts.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type RecurrenceType = 'INTERVAL' | 'WEEKDAYS';
export type SeriesStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface SeriesRow {
  id: string;
  user_id: string;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption: string | null;
  media_file_id: string | null;
  recurrence_type: RecurrenceType;
  interval_days: number | null;
  weekdays: number[] | null;
  start_at: string;
  end_at: string;
  last_materialized_at: string | null;
  status: SeriesStatus;
}

export async function getActiveSeries(): Promise<SeriesRow[]> {
  const result = await pool.query<SeriesRow>(`SELECT * FROM schedules WHERE status = 'ACTIVE'`);
  return result.rows;
}

export async function getLatestSessionId(userId: string): Promise<string | null> {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM whatsapp_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return result.rows[0]?.id ?? null;
}

/** Materializes one occurrence as an ordinary status_posts row — identical shape to what
 * POST /posts creates for a one-time post, just stamped with this series' series_id. */
export async function materializeOccurrence(series: SeriesRow, occurrenceAt: Date, sessionId: string | null): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO status_posts (user_id, session_id, media_file_id, media_type, caption, scheduled_at, status, series_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', $7)
     RETURNING id`,
    [series.user_id, sessionId, series.media_file_id, series.media_type, series.caption, occurrenceAt.toISOString(), series.id],
  );
  return result.rows[0].id;
}

export async function markSeriesMaterialized(seriesId: string, occurrenceAt: Date): Promise<void> {
  await pool.query(`UPDATE schedules SET last_materialized_at = $2 WHERE id = $1`, [seriesId, occurrenceAt.toISOString()]);
}

export async function markSeriesCompleted(seriesId: string): Promise<void> {
  await pool.query(`UPDATE schedules SET status = 'COMPLETED' WHERE id = $1 AND status = 'ACTIVE'`, [seriesId]);
}
