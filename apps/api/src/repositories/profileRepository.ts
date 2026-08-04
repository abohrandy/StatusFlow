import { pool } from '../db';

export interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const result = await pool.query<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] ?? null;
}

export async function upsertProfile(params: {
  userId: string;
  fullName: string;
  companyName: string;
  timezone?: string;
}): Promise<ProfileRow> {
  const result = await pool.query<ProfileRow>(
    `INSERT INTO profiles (user_id, full_name, company_name, timezone)
     VALUES ($1, $2, $3, COALESCE($4, 'UTC'))
     ON CONFLICT (user_id) DO UPDATE
     SET full_name = EXCLUDED.full_name, company_name = EXCLUDED.company_name,
         timezone = COALESCE($4, profiles.timezone)
     RETURNING *`,
    [params.userId, params.fullName, params.companyName, params.timezone ?? null],
  );
  return result.rows[0];
}
