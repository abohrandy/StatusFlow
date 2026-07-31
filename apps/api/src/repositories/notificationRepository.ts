import { pool } from '../db';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

/** Creates a notification once per (user, dedupeKey) — safe to call on every page load; re-firing the same condition is a no-op. */
export async function upsertDedupedNotification(params: {
  userId: string;
  type: string;
  dedupeKey: string;
  title: string;
  message: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, dedupe_key)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
    [params.userId, params.title, params.message, params.type, params.dedupeKey],
  );
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const result = await pool.query<NotificationRow>(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit],
  );
  return result.rows;
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [userId]);
}
