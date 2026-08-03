import { pool } from '../db';

export interface MediaFileRow {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  storage_path: string | null;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface CreateMediaFileInput {
  userId: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
}

export async function createMediaFile(input: CreateMediaFileInput): Promise<MediaFileRow> {
  const result = await pool.query<MediaFileRow>(
    `INSERT INTO media_files (user_id, file_name, file_url, storage_path, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.userId, input.fileName, input.fileUrl, input.storagePath, input.fileSize, input.mimeType],
  );
  return result.rows[0];
}

export async function listMediaFilesForUser(userId: string): Promise<MediaFileRow[]> {
  const result = await pool.query<MediaFileRow>(`SELECT * FROM media_files WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return result.rows;
}

/** `status_posts.media_file_id` is `ON DELETE SET NULL`, so deleting media a post already references just detaches it. */
export async function deleteMediaFile(id: string, userId: string): Promise<MediaFileRow | null> {
  const result = await pool.query<MediaFileRow>(`DELETE FROM media_files WHERE id = $1 AND user_id = $2 RETURNING *`, [id, userId]);
  return result.rows[0] ?? null;
}
