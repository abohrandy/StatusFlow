import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// How long past `current_period_end` we wait before proactively expiring a subscription
// ourselves. This is a safety net, not the primary mechanism: expiration normally happens
// reactively when Paystack's `subscription.disable` webhook arrives (see
// apps/api/src/routes/webhooks.ts). The grace period exists so this sweep doesn't race
// ahead of a webhook that's simply running a little late.
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * Expires subscriptions whose period has lapsed without a webhook-driven transition —
 * either a cancelled subscription (`cancel_at_period_end`) past its period end, or a
 * `past_due` subscription Paystack never followed up on with a `subscription.disable`
 * event. Never touches subscriptions still auto-renewing normally.
 */
export async function sweepExpiredSubscriptions(): Promise<number> {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'expired', expired_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('active', 'past_due')
       AND current_period_end IS NOT NULL
       AND current_period_end < $1
       AND (cancel_at_period_end = TRUE OR status = 'past_due')
     RETURNING id, user_id`,
    [cutoff.toISOString()],
  );

  if (result.rowCount) {
    console.log(`[Worker] Billing sweep: expired ${result.rowCount} subscription(s) past their grace period.`);
  }
  return result.rowCount ?? 0;
}
