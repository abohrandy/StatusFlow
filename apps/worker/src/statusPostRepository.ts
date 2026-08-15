import { Pool } from 'pg';

// Own pool rather than importing apps/api's — apps/worker is a separately deployed
// process (see docker-compose.yml) and doesn't share a module graph with apps/api,
// matching the existing convention in billingSweep.ts.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface WorkerStatusPost {
  id: string;
  user_id: string;
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption: string | null;
  media_url: string | null;
  session_id: string | null;
  whatsapp_status: string | null;
}

export async function getStatusPostForWorker(id: string): Promise<WorkerStatusPost | null> {
  const result = await pool.query<WorkerStatusPost>(
    `SELECT sp.id, sp.user_id, sp.media_type, sp.caption, sp.session_id, mf.file_url AS media_url, ws.status AS whatsapp_status
     FROM status_posts sp
     LEFT JOIN media_files mf ON mf.id = sp.media_file_id
     LEFT JOIN whatsapp_sessions ws ON ws.id = sp.session_id
     WHERE sp.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function markStatusPostProcessing(id: string): Promise<void> {
  await pool.query(`UPDATE status_posts SET status = 'PROCESSING' WHERE id = $1`, [id]);
}

export async function markStatusPostCompleted(id: string): Promise<void> {
  await pool.query(`UPDATE status_posts SET status = 'COMPLETED', error_message = NULL WHERE id = $1`, [id]);
  await pool.query(`INSERT INTO posting_history (post_id, status) VALUES ($1, 'COMPLETED')`, [id]);
}

export async function markStatusPostFailed(id: string, errorMessage: string): Promise<void> {
  await pool.query(`UPDATE status_posts SET status = 'FAILED', error_message = $2 WHERE id = $1`, [id, errorMessage]);
  await pool.query(`INSERT INTO posting_history (post_id, status, response_payload) VALUES ($1, 'FAILED', $2)`, [
    id,
    JSON.stringify({ error: errorMessage }),
  ]);
}

/** WhatsApp itself reported this session logged out (see WhatsAppConnection.isLoggedOut) —
 * the persisted creds are dead, so reflect that instead of leaving a stale CONNECTED row
 * that keeps sending posts through a socket WhatsApp will only reject again. */
export async function markSessionLoggedOut(sessionId: string): Promise<void> {
  await pool.query(`UPDATE whatsapp_sessions SET status = 'DISCONNECTED' WHERE id = $1`, [sessionId]);
}

export async function recordQueueLog(postId: string, attemptNumber: number, message: string): Promise<void> {
  await pool.query(`INSERT INTO queue_logs (post_id, attempt_number, log_message) VALUES ($1, $2, $3)`, [
    postId,
    attemptNumber,
    message,
  ]);
}
