import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// status_posts has no updated_at column, so scheduled_at is the only timestamp available to
// judge staleness by. A post can only reach PROCESSING once BullMQ fires its job at
// scheduled_at (see WorkerProcessor.ts), so time-since-scheduled_at is an accurate proxy for
// how long it's been stuck. The grace period covers the worker's own 20s connection timeout
// (WhatsAppConnection.waitUntilOpen) plus BullMQ retry backoff, without false-flagging a post
// that's still legitimately in flight.
const GRACE_PERIOD_MS = 15 * 60 * 1000;

/**
 * Fails status_posts left in PROCESSING long past their scheduled_at — orphaned when a worker
 * process is killed/redeployed mid-job or Redis drops the in-flight BullMQ job before it
 * reaches a terminal state. Without this, such posts stay PROCESSING forever, since nothing
 * else ever revisits them.
 */
export async function sweepStalledStatusPosts(): Promise<number> {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);
  const errorMessage = 'Worker did not report a result in time.';
  const result = await pool.query(
    `UPDATE status_posts
     SET status = 'FAILED', error_message = $2
     WHERE status = 'PROCESSING'
       AND scheduled_at < $1
     RETURNING id`,
    [cutoff.toISOString(), errorMessage],
  );

  for (const row of result.rows as { id: string }[]) {
    await pool.query(`INSERT INTO posting_history (post_id, status, response_payload) VALUES ($1, 'FAILED', $2)`, [
      row.id,
      JSON.stringify({ error: errorMessage }),
    ]);
  }

  if (result.rowCount) {
    console.log(`[Worker] Post sweep: failed ${result.rowCount} stalled status post(s) stuck in PROCESSING.`);
  }
  return result.rowCount ?? 0;
}
