import { pool } from '../db';

export type WhatsAppSessionStatus = 'UNINITIALIZED' | 'PAIRING' | 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED';

export interface WhatsAppSessionRow {
  id: string;
  user_id: string;
  phone_number: string | null;
  status: WhatsAppSessionStatus;
  last_active: string | null;
  created_at: string;
}

/** Active (pairing or connected) WhatsApp sessions for a user — used to enforce the plan's account limit. */
export async function getActiveSessionCount(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM whatsapp_sessions WHERE user_id = $1 AND status IN ('PAIRING', 'CONNECTED')`,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getLatestSession(userId: string): Promise<WhatsAppSessionRow | null> {
  const result = await pool.query<WhatsAppSessionRow>(
    `SELECT * FROM whatsapp_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

/**
 * Whether `phoneNumber` has already been used to activate a Free trial by a DIFFERENT
 * account. Returns false if it's never been used, or if it was this same user (that's
 * their own trial continuing, not a new one).
 */
export async function isPhoneNumberBlockedForTrial(phoneNumber: string, userId: string): Promise<boolean> {
  const result = await pool.query<{ user_id: string | null }>(
    'SELECT user_id FROM trial_phone_numbers WHERE phone_number = $1',
    [phoneNumber],
  );
  const row = result.rows[0];
  return !!row && row.user_id !== userId;
}

/** Records the first time a phone number is used for a Free trial. No-op if already recorded. */
export async function recordTrialPhoneNumber(phoneNumber: string, userId: string): Promise<void> {
  await pool.query(
    'INSERT INTO trial_phone_numbers (phone_number, user_id) VALUES ($1, $2) ON CONFLICT (phone_number) DO NOTHING',
    [phoneNumber, userId],
  );
}

export async function createPairingSession(userId: string, phoneNumber: string): Promise<WhatsAppSessionRow> {
  const result = await pool.query<WhatsAppSessionRow>(
    `INSERT INTO whatsapp_sessions (user_id, phone_number, status)
     VALUES ($1, $2, 'PAIRING')
     RETURNING *`,
    [userId, phoneNumber],
  );
  return result.rows[0];
}

export async function markSessionConnected(sessionId: string, userId: string): Promise<WhatsAppSessionRow | null> {
  const result = await pool.query<WhatsAppSessionRow>(
    `UPDATE whatsapp_sessions
     SET status = 'CONNECTED', last_active = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [sessionId, userId],
  );
  return result.rows[0] ?? null;
}

export async function markSessionDisconnected(userId: string): Promise<void> {
  await pool.query(
    `UPDATE whatsapp_sessions SET status = 'DISCONNECTED' WHERE user_id = $1 AND status IN ('PAIRING', 'CONNECTED')`,
    [userId],
  );
}
