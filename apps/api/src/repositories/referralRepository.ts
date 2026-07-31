import { randomBytes } from 'crypto';
import { pool } from '../db';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid ambiguity

function randomCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export interface ReferralRow {
  id: string;
  referrer_user_id: string;
  code: string;
  referred_email: string | null;
  referred_user_id: string | null;
  status: 'invited' | 'signed_up' | 'converted' | 'rewarded' | 'expired';
  converted_payment_id: string | null;
  converted_at: string | null;
  created_at: string;
}

export interface ReferralRewardRow {
  id: string;
  referrer_user_id: string;
  reward_type: 'weekly_pro_week' | 'monthly_business_month';
  referrals_required: number;
  status: 'pending' | 'granted' | 'revoked';
  applied_to_subscription_id: string | null;
  granted_at: string | null;
  created_at: string;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await pool.query<{ code: string }>('SELECT code FROM referral_codes WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) return existing.rows[0].code;

  // Retry on the rare chance of a code collision (unique constraint on `code`).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = randomCode();
      const result = await pool.query<{ code: string }>(
        'INSERT INTO referral_codes (user_id, code) VALUES ($1, $2) RETURNING code',
        [userId, code],
      );
      return result.rows[0].code;
    } catch (err: any) {
      if (err.code === '23505' && attempt < 4) continue; // unique_violation, retry with a new code
      throw err;
    }
  }
  throw new Error('Failed to generate a unique referral code after 5 attempts.');
}

export async function getReferrerIdByCode(code: string): Promise<string | null> {
  const result = await pool.query<{ user_id: string }>('SELECT user_id FROM referral_codes WHERE code = $1', [code]);
  return result.rows[0]?.user_id ?? null;
}

export async function recordInvite(referrerUserId: string, code: string, referredEmail?: string | null): Promise<ReferralRow> {
  const result = await pool.query<ReferralRow>(
    `INSERT INTO referrals (referrer_user_id, code, referred_email, status)
     VALUES ($1, $2, $3, 'invited')
     RETURNING *`,
    [referrerUserId, code, referredEmail ?? null],
  );
  return result.rows[0];
}

/**
 * Attributes a brand-new signup to the referrer who owns `code`. First attribution wins:
 * if this user is already linked to a referral (via the unique `referred_user_id` index),
 * this is a silent no-op — a signup can never be re-attributed to a different referrer.
 */
export async function attributeSignup(code: string, referredUserId: string): Promise<void> {
  const referrerUserId = await getReferrerIdByCode(code);
  if (!referrerUserId || referrerUserId === referredUserId) return;

  await pool.query(
    `INSERT INTO referrals (referrer_user_id, code, referred_user_id, status)
     VALUES ($1, $2, $3, 'signed_up')
     ON CONFLICT (referred_user_id) DO NOTHING`,
    [referrerUserId, code, referredUserId],
  );
}

/**
 * Marks the referral for `referredUserId` as converted, if one exists and hasn't already
 * converted. Returns the referrer's user id when a conversion actually happened (so the
 * caller can evaluate reward tiers), or `null` if there was nothing to convert.
 */
export async function markReferralConverted(referredUserId: string, paymentId: string): Promise<string | null> {
  const result = await pool.query<{ referrer_user_id: string }>(
    `UPDATE referrals
     SET status = 'converted', converted_payment_id = $2, converted_at = CURRENT_TIMESTAMP
     WHERE referred_user_id = $1 AND status = 'signed_up'
     RETURNING referrer_user_id`,
    [referredUserId, paymentId],
  );
  return result.rows[0]?.referrer_user_id ?? null;
}

export async function countConvertedReferrals(referrerUserId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM referrals WHERE referrer_user_id = $1 AND status IN ('converted', 'rewarded')`,
    [referrerUserId],
  );
  return Number(result.rows[0].count);
}

export async function hasReward(
  referrerUserId: string,
  rewardType: ReferralRewardRow['reward_type'],
): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM referral_rewards WHERE referrer_user_id = $1 AND reward_type = $2', [
    referrerUserId,
    rewardType,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Atomically claims a reward slot for (referrer, rewardType) via the unique index on
 * those two columns, BEFORE the caller does anything else (like extending a
 * subscription). This ordering matters: if two concurrent webhook deliveries both cross
 * the same reward threshold at once, only one of them wins this insert — the loser gets
 * `null` back and must not apply the reward's side effect. Without claiming first, both
 * could apply the subscription extension and only discover the duplicate afterward.
 */
export async function claimRewardSlot(params: {
  referrerUserId: string;
  rewardType: ReferralRewardRow['reward_type'];
  referralsRequired: number;
}): Promise<string | null> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO referral_rewards (referrer_user_id, reward_type, referrals_required, status)
     VALUES ($1, $2, $3, 'pending')
     ON CONFLICT (referrer_user_id, reward_type) DO NOTHING
     RETURNING id`,
    [params.referrerUserId, params.rewardType, params.referralsRequired],
  );
  return result.rows[0]?.id ?? null;
}

export async function finalizeReward(rewardId: string, appliedToSubscriptionId: string): Promise<void> {
  await pool.query(
    `UPDATE referral_rewards SET status = 'granted', applied_to_subscription_id = $2, granted_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [rewardId, appliedToSubscriptionId],
  );
}

export async function getReferralHistory(referrerUserId: string): Promise<ReferralRow[]> {
  const result = await pool.query<ReferralRow>(
    'SELECT * FROM referrals WHERE referrer_user_id = $1 ORDER BY created_at DESC',
    [referrerUserId],
  );
  return result.rows;
}

export async function getRewardHistory(referrerUserId: string): Promise<ReferralRewardRow[]> {
  const result = await pool.query<ReferralRewardRow>(
    'SELECT * FROM referral_rewards WHERE referrer_user_id = $1 ORDER BY created_at DESC',
    [referrerUserId],
  );
  return result.rows;
}
