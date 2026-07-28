import React, { useState } from 'react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'workers' | 'payments' | 'audit'>('metrics');

  const [usersList, setUsersList] = useState([
    { id: 'usr_1', email: 'marketer@agency.com', plan: 'MONTHLY', sessions: 1, postsCount: 142, status: 'ACTIVE' },
    { id: 'usr_2', email: 'john@smallbiz.com', plan: 'WEEKLY', sessions: 1, postsCount: 28, status: 'ACTIVE' },
    { id: 'usr_3', email: 'freeuser@gmail.com', plan: 'FREE', sessions: 1, postsCount: 4, status: 'ACTIVE' },
  ]);

  const handlePlanChange = (userId: string, newPlan: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / System Health */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">StatusFlow Super Admin Intelligence Panel</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              abohrandy@gmail.com (Super Admin)
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Real-time platform metrics, WhatsApp socket health, queue throughput, storage usage, and weekly retention.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          {(['metrics', 'users', 'workers', 'payments', 'audit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeTab === t ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards Answers Key Business Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Active Users */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>How Many Active Users?</span>
            <span className="text-emerald-400 font-bold">+12% this wk</span>
          </div>
          <div className="text-2xl font-bold text-white">1,248</div>
          <div className="text-[11px] text-zinc-500">1,180 Active MAUs</div>
        </div>

        {/* 2. Connected WhatsApp Sessions */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>WhatsApp Sessions</span>
            <span className="text-emerald-400 font-bold">1 per User</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">892 Connected</div>
          <div className="text-[11px] text-zinc-500">Single device sessions active</div>
        </div>

        {/* 3. Scheduled Posts Today */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Scheduled Today</span>
            <span className="text-emerald-400 font-bold">Today</span>
          </div>
          <div className="text-2xl font-bold text-white">342 Posts</div>
          <div className="text-[11px] text-zinc-500">184 delivered, 158 pending</div>
        </div>

        {/* 4. Failed Jobs & Queue Health */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Failed Jobs / DLQ</span>
            <span className="text-emerald-400 font-bold">Queue Healthy</span>
          </div>
          <div className="text-2xl font-bold text-white">0 Failures</div>
          <div className="text-[11px] text-emerald-400">99.98% delivery success rate</div>
        </div>

        {/* 5. Storage Usage */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Storage Usage</span>
            <span className="text-zinc-400">S3 / R2 Bucket</span>
          </div>
          <div className="text-2xl font-bold text-white">42.8 GB</div>
          <div className="text-[11px] text-zinc-500">Media images & videos</div>
        </div>

        {/* 6. Subscription Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Subscription Revenue</span>
            <span className="text-emerald-400 font-bold">Paystack MRR</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">₦4.28M / mo</div>
          <div className="text-[11px] text-zinc-500">Weekly ₦2k & Monthly ₦6k</div>
        </div>

        {/* 7. Queue Health (BullMQ) */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Queue Latency (Redis)</span>
            <span className="text-emerald-400 font-bold">1.2ms</span>
          </div>
          <div className="text-2xl font-bold text-white">14 Pending</div>
          <div className="text-[11px] text-zinc-500">10 Worker cluster nodes active</div>
        </div>

        {/* 8. Weekly Retention */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>Weekly Retention</span>
            <span className="text-emerald-400 font-bold">W4 Cohort</span>
          </div>
          <div className="text-2xl font-bold text-white">78.4%</div>
          <div className="text-[11px] text-zinc-500">Active repeat schedulers</div>
        </div>
      </div>

      {/* Tab 1: Detailed System Metrics Dashboard */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage & Queue Detailed Box */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="font-semibold text-base text-white">S3 Storage Allocation & Bandwidth</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Total Media Storage Capacity (500 GB)</span>
                <span className="text-emerald-400 font-bold">8.5% Used</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-emerald-500 w-[8.5%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                  <div className="text-zinc-500">Image Assets</div>
                  <div className="text-white font-bold text-sm mt-0.5">28.4 GB</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                  <div className="text-zinc-500">Video Assets</div>
                  <div className="text-white font-bold text-sm mt-0.5">14.4 GB</div>
                </div>
              </div>
            </div>
          </div>

          {/* Retention & Cohorts Detailed Box */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="font-semibold text-base text-white">Weekly User Retention Cohorts</h3>
            <div className="space-y-2 text-xs">
              {[
                { cohort: 'Week 1 (Current)', users: 240, retention: '100%' },
                { cohort: 'Week 2', users: 218, retention: '90.8%' },
                { cohort: 'Week 3', users: 195, retention: '81.2%' },
                { cohort: 'Week 4', users: 188, retention: '78.4%' },
              ].map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-300 font-medium">{c.cohort}</span>
                  <span className="text-zinc-400">{c.users} users</span>
                  <span className="text-emerald-400 font-bold">{c.retention}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white mb-2">User Accounts & Subscription Overrides</h3>
          <div className="space-y-3">
            {usersList.map(u => (
              <div key={u.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-white">{u.email}</div>
                  <div className="text-xs text-zinc-400 mt-1">ID: {u.id} • Active Sockets: {u.sessions} (Strict 1-Account) • Posts Delivered: {u.postsCount}</div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={u.plan}
                    onChange={(e) => handlePlanChange(u.id, e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-emerald-400 font-semibold focus:outline-none"
                  >
                    <option value="FREE">Free Tier</option>
                    <option value="WEEKLY">Weekly Pro (₦2,000)</option>
                    <option value="MONTHLY">Monthly Business (₦6,000)</option>
                  </select>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Queue & Worker Telemetry */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="font-semibold text-base text-white">Worker Process Daemon Nodes</h3>
            <div className="space-y-3">
              {[
                { name: 'worker-node-railway-prod-1', status: 'ONLINE', uptime: '99.98%', jobsProcessed: 14209 },
                { name: 'worker-node-railway-prod-2', status: 'ONLINE', uptime: '99.95%', jobsProcessed: 11840 }
              ].map((w, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-white">{w.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Uptime: {w.uptime} • Processed: {w.jobsProcessed} jobs</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="font-semibold text-base text-white">Dead-Letter Queue (DLQ) Monitoring</h3>
            <div className="py-8 text-center border-2 border-dashed border-zinc-800 rounded-xl space-y-2">
              <div className="text-emerald-400 text-lg font-bold">0 Dead-Letter Jobs</div>
              <div className="text-xs text-zinc-400">All delayed worker jobs are executing cleanly with zero unrecoverable errors.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Paystack Payments Ledger */}
      {activeTab === 'payments' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white">Paystack System Payment Transactions</h3>
          <div className="space-y-3">
            {[
              { ref: 'pstk_ref_9821a', email: 'marketer@agency.com', amount: '₦6,000', plan: 'Monthly Business', date: '2026-07-28' },
              { ref: 'pstk_ref_4102b', email: 'john@smallbiz.com', amount: '₦2,000', plan: 'Weekly Pro', date: '2026-07-27' },
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{p.email}</div>
                  <div className="text-zinc-400 mt-0.5">Ref: <span className="font-mono">{p.ref}</span> • {p.plan}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">{p.amount}</div>
                  <div className="text-zinc-500">{p.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white">Platform System Audit Logs</h3>
          <div className="space-y-2 font-mono text-[11px] text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div>[2026-07-28 10:14:02] ADMIN: Super Admin abohrandy@gmail.com viewed platform intelligence panel.</div>
            <div>[2026-07-28 09:58:12] WORKER: Worker node worker-node-railway-prod-1 started Redis listener.</div>
            <div>[2026-07-28 08:30:00] PAYSTACK: Webhook event charge.success processed for ref pstk_ref_9821a.</div>
          </div>
        </div>
      )}
    </div>
  );
};
