import { pool } from '../db';
import { activateOrRenewSubscription } from './billingRepository';

export interface AdminSubscriptionRow {
  id: string;
  user_id: string;
  email: string;
  plan_slug: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  next_billing_at: string | null;
  cancel_at_period_end: boolean;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  consecutive_renewals: number;
  created_at: string;
}

/** Searches subscriptions by user email (case-insensitive substring match). Empty query returns the most recent subscriptions across all users. */
export async function searchSubscriptions(query: string, limit = 50): Promise<AdminSubscriptionRow[]> {
  const result = await pool.query<AdminSubscriptionRow>(
    `SELECT s.*, u.email
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE $1 = '' OR u.email ILIKE '%' || $1 || '%'
     ORDER BY s.created_at DESC
     LIMIT $2`,
    [query, limit],
  );
  return result.rows;
}

export async function listUsers(limit = 100) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.role, u.created_at,
            COALESCE(sub.plan_slug, 'free') AS plan,
            COALESCE(ws.sessions, 0)::int AS sessions,
            COALESCE(posts.post_count, 0)::int AS "postsCount",
            CASE WHEN u.role = 'ADMIN' THEN 'ADMIN' ELSE 'ACTIVE' END AS status
     FROM users u
     LEFT JOIN LATERAL (
       SELECT s.plan_slug
       FROM subscriptions s
       WHERE s.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT 1
     ) sub ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS sessions
       FROM whatsapp_sessions s
       WHERE s.user_id = u.id AND s.status = 'CONNECTED'
     ) ws ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS post_count
       FROM status_posts p
       WHERE p.user_id = u.id
     ) posts ON TRUE
     ORDER BY u.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function getSubscriptionDetail(subscriptionId: string) {
  const sub = await pool.query(
    `SELECT s.*, u.email FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
    [subscriptionId],
  );
  if (sub.rows.length === 0) return null;

  const userId = sub.rows[0].user_id;
  const [payments, invoices, rewards] = await Promise.all([
    pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC', [userId]),
    pool.query('SELECT * FROM referral_rewards WHERE referrer_user_id = $1 ORDER BY created_at DESC', [userId]),
  ]);

  return {
    subscription: sub.rows[0],
    payments: payments.rows,
    invoices: invoices.rows,
    referralRewards: rewards.rows,
  };
}

export async function extendSubscription(subscriptionId: string, days: number) {
  const result = await pool.query(
    `UPDATE subscriptions
     SET current_period_end = COALESCE(current_period_end, CURRENT_TIMESTAMP) + ($2 || ' days')::interval,
         next_billing_at = COALESCE(current_period_end, CURRENT_TIMESTAMP) + ($2 || ' days')::interval,
         status = 'active',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [subscriptionId, days],
  );
  return result.rows[0] ?? null;
}

export async function adminCancelSubscription(subscriptionId: string) {
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [subscriptionId],
  );
  return result.rows[0] ?? null;
}

export async function listPayments(limit = 100) {
  const result = await pool.query(
    `SELECT p.*, u.email FROM payments p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function listInvoices(limit = 100) {
  const result = await pool.query(
    `SELECT i.*, u.email FROM invoices i JOIN users u ON u.id = i.user_id ORDER BY i.issued_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function listWebhookLogs(limit = 100) {
  const result = await pool.query('SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT $1', [limit]);
  return result.rows;
}

export async function listReferralRewards(limit = 100) {
  const result = await pool.query(
    `SELECT r.*, u.email AS referrer_email
     FROM referral_rewards r
     JOIN users u ON u.id = r.referrer_user_id
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export interface AdminDashboardStats {
  activeSubscriptions: number;
  weeklyRevenueNaira: number;
  monthlyRevenueNaira: number;
  expiredSubscriptions: number;
  freeUsers: number;
  paidUsers: number;
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const [active, expired, paidUsers, totalUsers, weeklyRevenue, monthlyRevenue] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan_slug <> 'free'`),
    pool.query(`SELECT COUNT(*) FROM subscriptions WHERE status = 'expired'`),
    pool.query(
      `SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active' AND plan_slug <> 'free'`,
    ),
    pool.query(`SELECT COUNT(*) FROM users`),
    // Revenue from successful payments in the trailing 7 / 30 days, by the plan's own billing cadence.
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE status = 'successful' AND plan_slug = 'weekly-pro' AND paid_at > NOW() - INTERVAL '7 days'`,
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE status = 'successful' AND plan_slug = 'monthly-business' AND paid_at > NOW() - INTERVAL '30 days'`,
    ),
  ]);

  const paid = Number(paidUsers.rows[0].count);
  const total = Number(totalUsers.rows[0].count);

  return {
    activeSubscriptions: Number(active.rows[0].count),
    weeklyRevenueNaira: Number(weeklyRevenue.rows[0].total),
    monthlyRevenueNaira: Number(monthlyRevenue.rows[0].total),
    expiredSubscriptions: Number(expired.rows[0].count),
    freeUsers: Math.max(total - paid, 0),
    paidUsers: paid,
  };
}

export async function manuallyActivateSubscription(params: {
  userId: string;
  planSlug: 'free' | 'weekly-pro' | 'monthly-business';
}) {
  // Delegates to the same activation path Paystack webhooks use, so admin-granted
  // subscriptions behave identically (feature gates, consecutive_renewals, etc.) to a
  // real paid one — no separate "admin subscription" code path to keep in sync.
  return activateOrRenewSubscription({ userId: params.userId, planSlug: params.planSlug, now: new Date() });
}
