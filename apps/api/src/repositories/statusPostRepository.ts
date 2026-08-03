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
 * There's no real media upload/storage pipeline yet (media_files.file_url is designed
 * for an S3/presigned URL per docs/DATABASE.md, but nothing writes to it today) — for
 * now this just records whatever URL the client already had (e.g. a picked-from-library
 * URL) so status_posts.media_file_id keeps pointing at a real row like the schema expects.
 */
async function createMediaFile(userId: string, mediaType: MediaType, mediaUrl: string): Promise<string> {
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
  scheduledAt: string;
}

export async function createStatusPost(input: CreateStatusPostInput): Promise<StatusPostWithMediaRow> {
  const mediaFileId = input.mediaUrl ? await createMediaFile(input.userId, input.mediaType, input.mediaUrl) : null;
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
