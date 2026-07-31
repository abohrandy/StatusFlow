import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

interface ReferralDashboardData {
  code: string;
  invites: number;
  conversions: number;
  rewards: Array<{ id: string; reward_type: string; status: string; granted_at: string | null }>;
  history: Array<{
    id: string;
    referred_email: string | null;
    referred_user_id: string | null;
    status: string;
    converted_at: string | null;
    created_at: string;
  }>;
}

const REWARD_LABELS: Record<string, string> = {
  weekly_pro_week: 'One week of Weekly Pro',
  monthly_business_month: 'One month of Monthly Business',
};

const STATUS_STYLES: Record<string, string> = {
  invited: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  signed_up: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rewarded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const ReferralDashboard: React.FC = () => {
  const [data, setData] = useState<ReferralDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await apiClient.getReferralDashboard();
      setData(result as ReferralDashboardData);
    } catch (err: any) {
      setMessage(err.message || 'Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const shareLink = data ? `${window.location.origin}/register?ref=${data.code}` : '';

  async function handleCopy() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await apiClient.inviteReferral(email || undefined);
      setMessage(email ? `Invite recorded for ${email}.` : 'Invite recorded.');
      setEmail('');
      load();
    } catch (err: any) {
      setMessage(err.message || 'Could not record invite.');
    } finally {
      setInviting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-xl font-bold text-white tracking-tight">Refer & Earn</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Invite friends to StatusFlow. Reward is granted after their first paid subscription is confirmed.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center">
          {message}
        </div>
      )}

      {/* Referral code + share link */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white">Your Referral Code</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-emerald-400 text-sm truncate">
            {loading ? 'Loading...' : shareLink}
          </div>
          <button
            onClick={handleCopy}
            disabled={!data}
            className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com (optional)"
            className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all disabled:opacity-60"
          >
            {inviting ? 'Recording...' : 'Track Invite'}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Invites</div>
          <div className="text-2xl font-bold text-white">{data?.invites ?? 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Paid Conversions</div>
          <div className="text-2xl font-bold text-emerald-400">{data?.conversions ?? 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Rewards Earned</div>
          <div className="text-2xl font-bold text-white">{data?.rewards.length ?? 0}</div>
        </div>
      </div>

      {/* Reward progress */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white">Reward Tiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="font-semibold text-white">1 paid referral</div>
            <div className="text-zinc-400 mt-1">Reward: One week of Weekly Pro</div>
            <div className="mt-2">
              {(data?.conversions ?? 0) >= 1 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Unlocked</span>
              ) : (
                <span className="text-zinc-500">{data?.conversions ?? 0}/1 referrals</span>
              )}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="font-semibold text-white">3 paid referrals</div>
            <div className="text-zinc-400 mt-1">Reward: One month of Monthly Business</div>
            <div className="mt-2">
              {(data?.conversions ?? 0) >= 3 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Unlocked</span>
              ) : (
                <span className="text-zinc-500">{data?.conversions ?? 0}/3 referrals</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral history */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white">Referral History</h3>
        {!data || data.history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No referrals tracked yet.
          </div>
        ) : (
          <div className="space-y-3">
            {data.history.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-white">{r.referred_email || 'Signed up via link'}</div>
                  <div className="text-zinc-400 mt-0.5">Invited {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-mono border ${STATUS_STYLES[r.status] || STATUS_STYLES.invited}`}>
                  {r.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
