import { pool } from '../db';

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO';

export interface StatusPostRow {
  id: string;
  user_id: string;
  session_id: string | null;
  media_file_id: string | null;
  media_type: MediaType;
  caption: string | null;
  scheduled_at: string;
  status: PostStatus;
  error_message: string | null;
  created_at: string;
}

export interface StatusPostWithMediaRow extends StatusPostRow {
  media_url: string | null;
}

const SELECT_WITH_MEDIA = `
  SELECT sp.*, mf.file_url AS media_url
  FROM status_posts sp
  LEFT JOIN media_files mf ON mf.id = sp.media_file_id
`;

/**
 * The real media upload pipeline lives in routes/media.ts + storage.ts (Supabase Storage) —
 * this is a separate, narrower path: it just records a URL the client already obtained
 * (normally from that real upload) against status_posts.media_file_id, so the schema's
 * foreign key keeps pointing at a real media_files row.
 */
export async function createMediaFile(userId: string, mediaType: MediaType, mediaUrl: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO media_files (user_id, file_name, file_url, file_size, mime_type)
     VALUES ($1, $2, $3, 0, $4)
     RETURNING id`,
    [userId, `status-${Date.now()}`, mediaUrl, mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'],
  );
  return result.rows[0].id;
}

export interface CreateStatusPostInput {
  userId: string;
  sessionId: string | null;
  mediaType: MediaType;
  caption: string | null;
  mediaUrl: string | null;
  /** The real media_files row for this asset (from POST /media or a prior upload), if the
   * caller has it — reusing it avoids createMediaFile() below fabricating a second,
   * duplicate-looking row (file_name "status-<timestamp>", file_size 0) that shows up
   * alongside the real one in the Media Library for the exact same underlying file. */
  mediaFileId?: string | null;
  scheduledAt: string;
}

export async function createStatusPost(input: CreateStatusPostInput): Promise<StatusPostWithMediaRow> {
  const mediaFileId = input.mediaFileId
    ? input.mediaFileId
    : input.mediaUrl
    ? await createMediaFile(input.userId, input.mediaType, input.mediaUrl)
    : null;
  const result = await pool.query<StatusPostRow>(
    `INSERT INTO status_posts (user_id, session_id, media_file_id, media_type, caption, scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
     RETURNING *`,
    [input.userId, input.sessionId, mediaFileId, input.mediaType, input.caption, input.scheduledAt],
  );
  return { ...result.rows[0], media_url: input.mediaUrl };
}

export async function getStatusPostsForUser(userId: string, statuses: PostStatus[]): Promise<StatusPostWithMediaRow[]> {
  const result = await pool.query<StatusPostWithMediaRow>(
    `${SELECT_WITH_MEDIA} WHERE sp.user_id = $1 AND sp.status = ANY($2::post_status[]) ORDER BY sp.scheduled_at ASC`,
    [userId, statuses],
  );
  return result.rows;
}

export async function getStatusPostByIdForUser(id: string, userId: string): Promise<StatusPostWithMediaRow | null> {
  const result = await pool.query<StatusPostWithMediaRow>(`${SELECT_WITH_MEDIA} WHERE sp.id = $1 AND sp.user_id = $2`, [id, userId]);
  return result.rows[0] ?? null;
}

export interface QueueLogRow {
  id: string;
  attempt_number: number;
  log_message: string;
  created_at: string;
}

/** Real per-attempt worker logs for a post (see apps/worker's recordQueueLog) — scoped through
 * status_posts so a user can't read another user's post's logs by guessing a post id. */
export async function getQueueLogsForUserPost(postId: string, userId: string): Promise<QueueLogRow[] | null> {
  const owns = await pool.query('SELECT 1 FROM status_posts WHERE id = $1 AND user_id = $2', [postId, userId]);
  if (owns.rows.length === 0) return null;
  const result = await pool.query<QueueLogRow>(
    `SELECT id, attempt_number, log_message, created_at FROM queue_logs WHERE post_id = $1 ORDER BY created_at ASC`,
    [postId],
  );
  return result.rows;
}

/** Only cancellable while still pending — a post already being processed or resolved can't be pulled back. */
export async function cancelStatusPost(id: string, userId: string): Promise<StatusPostRow | null> {
  const result = await pool.query<StatusPostRow>(
    `UPDATE status_posts SET status = 'CANCELLED'
     WHERE id = $1 AND user_id = $2 AND status IN ('DRAFT', 'SCHEDULED', 'QUEUED')
     RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}
