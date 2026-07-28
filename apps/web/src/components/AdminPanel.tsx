import React, { useState } from 'react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'workers' | 'payments' | 'audit'>('users');

  const [usersList, setUsersList] = useState([
    { id: 'usr_1', email: 'marketer@agency.com', plan: 'MONTHLY', sessions: 3, postsCount: 142, status: 'ACTIVE' },
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
            <h2 className="text-xl font-bold text-white tracking-tight">StatusFlow System Admin Panel</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              Admin Role
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Platform monitoring, user account overrides, BullMQ worker nodes, and payment ledgers.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          {(['users', 'workers', 'payments', 'audit'] as const).map((t) => (
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Total Platform Users</div>
          <div className="text-2xl font-bold text-white">1,248</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Active WhatsApp Sockets</div>
          <div className="text-2xl font-bold text-emerald-400">892 Connected</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">BullMQ Queue Depth</div>
          <div className="text-2xl font-bold text-white">14 Jobs Pending</div>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-xs text-zinc-400">Monthly Revenue (Paystack)</div>
          <div className="text-2xl font-bold text-emerald-400">₦4.28M</div>
        </div>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white mb-2">User Accounts & Subscription Overrides</h3>
          <div className="space-y-3">
            {usersList.map(u => (
              <div key={u.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-white">{u.email}</div>
                  <div className="text-xs text-zinc-400 mt-1">ID: {u.id} • Active Sockets: {u.sessions} • Posts Delivered: {u.postsCount}</div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={u.plan}
                    onChange={(e) => handlePlanChange(u.id, e.target.value)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-emerald-400 font-semibold focus:outline-none"
                  >
                    <option value="FREE">Free Tier</option>
                    <option value="WEEKLY">Weekly Pro</option>
                    <option value="MONTHLY">Monthly Business</option>
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

      {/* Tab 2: Queue & Worker Telemetry */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="font-semibold text-base text-white">Worker Process Daemon Nodes</h3>
            <div className="space-y-3">
              {[
                { name: 'worker-node-aws-east-1', status: 'ONLINE', uptime: '99.98%', jobsProcessed: 14209 },
                { name: 'worker-node-aws-east-2', status: 'ONLINE', uptime: '99.95%', jobsProcessed: 11840 }
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

      {/* Tab 3: Paystack Payments Ledger */}
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

      {/* Tab 4: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white">Platform System Audit Logs</h3>
          <div className="space-y-2 font-mono text-[11px] text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div>[2026-07-28 10:14:02] ADMIN: System user mark@agency.com upgraded to Monthly Business tier.</div>
            <div>[2026-07-28 09:58:12] WORKER: Worker node worker-node-aws-east-1 started Redis listener.</div>
            <div>[2026-07-28 08:30:00] PAYSTACK: Webhook event charge.success processed for ref pstk_ref_9821a.</div>
          </div>
        </div>
      )}
    </div>
  );
};
