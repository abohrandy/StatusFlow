import { Pool } from 'pg';

/**
 * Shared Postgres connection pool for the billing subsystem. `DATABASE_URL` is required
 * for any billing route to function; see .env.example.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle Postgres client:', err.message);
});
