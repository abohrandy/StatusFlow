import React, { useState, useEffect } from 'react';

export const DashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasSchedules, setHasSchedules] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-900/60 border border-zinc-800/60"></div>
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800/60"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">StatusFlow Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage and automate your scheduled WhatsApp Status broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
            <span>+</span> Schedule New Status
          </button>
          <button 
            onClick={() => setHasSchedules(!hasSchedules)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium border border-zinc-700 transition-all"
          >
            Toggle Empty State Demo
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Connected WhatsApp Session */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>WhatsApp Connection</span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">+234 812 345 6789</div>
          <div className="text-xs text-zinc-500">Session ID: sess_wa_8f92a1</div>
        </div>

        {/* 2. Scheduled Posts */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="text-xs text-zinc-400 font-medium">Upcoming Queue</div>
          <div className="text-3xl font-bold text-white tracking-tight">14</div>
          <div className="text-xs text-emerald-400 font-medium">3 statuses posting today</div>
        </div>

        {/* 3. Storage Usage */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>S3 Media Storage</span>
            <span>42% Used</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">2.1 GB <span className="text-xs font-normal text-zinc-500">/ 5.0 GB</span></div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[42%]"></div>
          </div>
        </div>

        {/* 4. Subscription Card */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>Subscription Plan</span>
            <span className="text-emerald-400 font-semibold">Pro Tier</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">$15.00 <span className="text-xs font-normal text-zinc-500">/ mo</span></div>
          <div className="text-xs text-zinc-400">Renews via Paystack on Aug 15</div>
        </div>
      </div>

      {/* Main Grid: Upcoming Schedules & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Schedules Section (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Upcoming Status Posts</h3>
            <span className="text-xs text-emerald-400 font-medium cursor-pointer hover:underline">View All Schedule</span>
          </div>

          {!hasSchedules ? (
            /* Empty State */
            <div className="py-12 text-center space-y-4 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto text-xl font-bold">
                📅
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white">No status posts scheduled</div>
                <div className="text-xs text-zinc-400">Schedule your first status update image, video, or text announcement.</div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium text-xs transition-all">
                Create Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { time: 'Today at 02:30 PM', type: 'IMAGE', caption: 'Flash Sale Alert! 30% Off Storewide Today Only 🔥', status: 'QUEUED' },
                { time: 'Today at 07:00 PM', type: 'VIDEO', caption: 'New Product Line Unboxing & Demonstration 🎥', status: 'SCHEDULED' },
                { time: 'Tomorrow at 09:00 AM', type: 'TEXT', caption: 'Good morning everyone! Stay tuned for updates.', status: 'SCHEDULED' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-xs">
                      {item.type}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white truncate max-w-sm">{item.caption}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{item.time}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed (1 Col) */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <h3 className="font-bold text-lg text-white">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { title: 'Status Broadcast Delivered', desc: 'Image status delivered to 142 contacts', time: '10 mins ago', icon: '✅' },
              { title: 'Session Re-authenticated', desc: 'WhatsApp web socket handshake completed', time: '1 hour ago', icon: '⚡' },
              { title: 'Payment Confirmed', desc: 'Paystack subscription charge $15.00', time: '2 days ago', icon: '💳' },
            ].map((act, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="text-base">{act.icon}</span>
                <div className="space-y-0.5">
                  <div className="font-medium text-white">{act.title}</div>
                  <div className="text-zinc-400">{act.desc}</div>
                  <div className="text-zinc-500 text-[10px]">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
