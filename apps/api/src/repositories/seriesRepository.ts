import { pool } from '../db';
import { createMediaFile, type MediaType } from './statusPostRepository';

export type RecurrenceType = 'INTERVAL' | 'WEEKDAYS';
export type SeriesStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface SeriesRow {
  id: string;
  user_id: string;
  media_type: MediaType;
  caption: string | null;
  media_file_id: string | null;
  media_url: string | null;
  recurrence_type: RecurrenceType;
  interval_days: number | null;
  weekdays: number[] | null;
  start_at: string;
  end_at: string;
  last_materialized_at: string | null;
  status: SeriesStatus;
  created_at: string;
}

const SELECT_WITH_MEDIA = `
  SELECT s.*, mf.file_url AS media_url
  FROM schedules s
  LEFT JOIN media_files mf ON mf.id = s.media_file_id
`;

export interface CreateSeriesInput {
  userId: string;
  mediaType: MediaType;
  caption: string | null;
  mediaUrl: string | null;
  recurrenceType: RecurrenceType;
  intervalDays: number | null;
  weekdays: number[] | null;
  startAt: string;
  endAt: string;
}

export async function createSeries(input: CreateSeriesInput): Promise<SeriesRow> {
  const mediaFileId = input.mediaUrl ? await createMediaFile(input.userId, input.mediaType, input.mediaUrl) : null;
  const result = await pool.query<SeriesRow>(
    `INSERT INTO schedules (
       user_id, media_type, caption, media_file_id,
       recurrence_type, interval_days, weekdays, start_at, end_at, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
     RETURNING *`,
    [
      input.userId,
      input.mediaType,
      input.caption,
      mediaFileId,
      input.recurrenceType,
      input.intervalDays,
      input.weekdays,
      input.startAt,
      input.endAt,
    ],
  );
  return { ...result.rows[0], media_url: input.mediaUrl };
}

export async function getSeriesForUser(userId: string): Promise<SeriesRow[]> {
  const result = await pool.query<SeriesRow>(
    `${SELECT_WITH_MEDIA} WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export interface CancelSeriesResult {
  series: SeriesRow;
  /** IDs of already-materialized occurrences that got cancelled too, so the caller can
   * also pull their BullMQ jobs — see routes/posts.ts. */
  cancelledPostIds: string[];
}

/** Only cancellable while still active — a completed or already-cancelled series can't be re-cancelled.
 * Cancelling still-pending materialized occurrences too matches the principle of least
 * surprise: "cancel this series" should mean "stop everything from it that hasn't sent
 * yet", not just "stop creating new ones". */
export async function cancelSeries(id: string, userId: string): Promise<CancelSeriesResult | null> {
  const result = await pool.query<SeriesRow>(
    `UPDATE schedules SET status = 'CANCELLED'
     WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
     RETURNING *`,
    [id, userId],
  );
  if (!result.rows[0]) return null;

  const cancelledPosts = await pool.query<{ id: string }>(
    `UPDATE status_posts SET status = 'CANCELLED'
     WHERE series_id = $1 AND status IN ('DRAFT', 'SCHEDULED', 'QUEUED')
     RETURNING id`,
    [id],
  );

  return { series: { ...result.rows[0], media_url: null }, cancelledPostIds: cancelledPosts.rows.map((r) => r.id) };
}
