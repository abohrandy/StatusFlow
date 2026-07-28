import React, { useState } from 'react';

export const DashboardOverview: React.FC = () => {
  const [schedules] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">StatusFlow Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your single connected WhatsApp account and scheduled status broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
            <span>+</span> Schedule New Status
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Connected WhatsApp Session */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>WhatsApp Connection</span>
            <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
              Not Connected
            </span>
          </div>
          <div className="text-sm font-semibold text-zinc-300">Single Device Session</div>
          <div className="text-xs text-zinc-500">Connect in WhatsApp Pairing</div>
        </div>

        {/* 2. Scheduled Posts */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="text-xs text-zinc-400 font-medium">Upcoming Queue</div>
          <div className="text-3xl font-bold text-white tracking-tight">0</div>
          <div className="text-xs text-zinc-500 font-medium">No posts scheduled</div>
        </div>

        {/* 3. Storage Usage */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>Media Storage</span>
            <span>0% Used</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">0.0 MB <span className="text-xs font-normal text-zinc-500">/ 5.0 GB</span></div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[0%]"></div>
          </div>
        </div>

        {/* 4. Subscription Card */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>Subscription Plan</span>
            <span className="text-emerald-400 font-semibold">Free Tier</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">₦0.00 <span className="text-xs font-normal text-zinc-500">/ wk</span></div>
          <div className="text-xs text-zinc-400">1 status schedule every 7 days</div>
        </div>
      </div>

      {/* Main Grid: Upcoming Schedules & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Schedules Section (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Upcoming Status Posts</h3>
          </div>

          {schedules.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center space-y-4 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto text-xl font-bold">
                📅
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white">No status posts scheduled</div>
                <div className="text-xs text-zinc-400">Schedule your first status update image, video, or text announcement.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3"></div>
          )}
        </div>

        {/* Recent Activity Feed (1 Col) */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <h3 className="font-bold text-lg text-white">Recent Activity</h3>
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No recent activity recorded yet.
          </div>
        </div>
      </div>
    </div>
  );
};
