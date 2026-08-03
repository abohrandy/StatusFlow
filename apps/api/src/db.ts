import { Pool } from 'pg';
import { describeError } from './utils/describeError';

/**
 * Shared Postgres connection pool for the billing subsystem. `DATABASE_URL` is required
 * for any billing route to function; see .env.example.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/** Keeps deployments that use an existing database volume in sync with the API schema. */
export async function ensureMediaStorageSchema(): Promise<void> {
  await pool.query('ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_path TEXT');
}

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle Postgres client:', describeError(err));
});
