import React, { useEffect, useState } from 'react';
import type { StatusPost } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMediaAge(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const STORAGE_LIMIT_MB = 5 * 1024; // 5 GB, matches the plan copy this card has always shown.

interface DashboardOverviewProps {
  onNavigateToComposer?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateToComposer }) => {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<StatusPost[]>([]);
  const [history, setHistory] = useState<StatusPost[]>([]);
  const [mediaUsageMb, setMediaUsageMb] = useState(0);
  const [planName, setPlanName] = useState('Free Tier');
  const [planPrice, setPlanPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState('week');

  useEffect(() => {
    Promise.allSettled([
      apiClient.whatsappStatus(),
      apiClient.listScheduledPosts(),
      apiClient.listPostHistory(),
      apiClient.listMedia(),
      apiClient.getSubscription(),
    ]).then(([statusRes, scheduledRes, historyRes, mediaRes, subRes]) => {
      if (statusRes.status === 'fulfilled') {
        setConnected(statusRes.value.connected);
        setPhoneNumber(statusRes.value.phoneNumber);
      }
      if (scheduledRes.status === 'fulfilled') setSchedules(scheduledRes.value.posts ?? []);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.posts ?? []);
      if (mediaRes.status === 'fulfilled') {
        const totalBytes = (mediaRes.value.media ?? []).reduce((sum, m) => sum + m.fileSize, 0);
        setMediaUsageMb(totalBytes / (1024 * 1024));
      }
      if (subRes.status === 'fulfilled' && subRes.value.plan) {
        setPlanName(subRes.value.plan.name);
        setPlanPrice(subRes.value.plan.price);
        setBillingCycle(subRes.value.plan.billingCycle === 'weekly' ? 'wk' : 'mo');
      }
      setLoading(false);
    });
  }, []);

  const storagePercent = Math.min(100, Math.round((mediaUsageMb / STORAGE_LIMIT_MB) * 100));
  const recentActivity = [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">StatusFlow Dashboard</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your single connected WhatsApp account and scheduled status broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToComposer}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
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
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${connected ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
              {loading ? '...' : connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <div className="text-sm font-semibold text-zinc-300">{connected && phoneNumber ? phoneNumber : 'Single Device Session'}</div>
          <div className="text-xs text-zinc-500">{connected ? 'Active multi-device session' : 'Connect in WhatsApp Pairing'}</div>
        </div>

        {/* 2. Scheduled Posts */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="text-xs text-zinc-400 font-medium">Upcoming Queue</div>
          <div className="text-3xl font-bold text-white tracking-tight">{loading ? '...' : schedules.length}</div>
          <div className="text-xs text-zinc-500 font-medium">{schedules.length === 0 ? 'No posts scheduled' : `${schedules.length} post${schedules.length === 1 ? '' : 's'} pending`}</div>
        </div>

        {/* 3. Storage Usage */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>Media Storage</span>
            <span>{storagePercent}% Used</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{formatBytes(mediaUsageMb * 1024 * 1024)} <span className="text-xs font-normal text-zinc-500">/ 5.0 GB</span></div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${storagePercent}%` }}></div>
          </div>
        </div>

        {/* 4. Subscription Card */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 font-medium">
            <span>Subscription Plan</span>
            <span className="text-emerald-400 font-semibold">{planName}</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">₦{planPrice.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ {billingCycle}</span></div>
        </div>
      </div>

      {/* Main Grid: Upcoming Schedules & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Schedules Section (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Upcoming Status Posts</h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Loading...</div>
          ) : schedules.length === 0 ? (
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
            <div className="space-y-3">
              {schedules.slice(0, 5).map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {item.mediaType}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white truncate max-w-md">{item.caption || '(no caption)'}</div>
                      <div className="text-xs text-zinc-400 mt-1">🕒 {new Date(item.scheduledAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No recent activity recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{item.caption || `${item.mediaType} status`}</div>
                    <div className="text-zinc-500">{formatMediaAge(item.createdAt)}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-mono shrink-0 ${item.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
