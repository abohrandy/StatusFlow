import React, { useEffect, useState } from 'react';
import type { StatusPost } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';

const TIMEZONES = ['UTC', 'Africa/Lagos', 'America/New_York', 'Europe/London', 'Asia/Dubai'];

const STATUS_BADGE: Record<StatusPost['status'], string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  SCHEDULED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  QUEUED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const CANCELLABLE_STATUSES: StatusPost['status'][] = ['DRAFT', 'SCHEDULED', 'QUEUED'];

export const ScheduledQueue: React.FC = () => {
  const [schedules, setSchedules] = useState<StatusPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedTimezone, setSelectedTimezone] = useState('Africa/Lagos');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .listScheduledPosts()
      .then(({ posts }) => setSchedules(posts ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await apiClient.cancelStatusPost(id);
      setSchedules((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Leave the item in place on failure so the user can see it and retry.
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Scheduled Queue Engine</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage and cancel scheduled status updates across timezones.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timezone Selector */}
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'LIST' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'CALENDAR' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Calendar Sync
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'LIST' ? (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-base text-white mb-2">Pending & Active Status Schedules</h3>

          {loading ? (
            <div className="text-sm text-zinc-500 py-8 text-center">Loading your scheduled posts...</div>
          ) : schedules.length === 0 ? (
            <div className="text-sm text-zinc-500 py-8 text-center">
              Nothing scheduled yet — head to the Composer to create your first status post.
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {item.mediaType}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white truncate max-w-md">{item.caption || '(no caption)'}</div>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                        <span>🕒 {new Date(item.scheduledAt).toLocaleString()} ({selectedTimezone})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${STATUS_BADGE[item.status]}`}>
                      {item.status}
                    </span>

                    {CANCELLABLE_STATUSES.includes(item.status) && (
                      <button
                        onClick={() => handleCancel(item.id)}
                        disabled={cancellingId === item.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium disabled:opacity-50"
                      >
                        {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View Synchronization */
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base text-white">Calendar Schedule View ({selectedTimezone})</h3>
            <span className="text-xs text-zinc-400">July 2026</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold text-zinc-400 pb-2 border-b border-zinc-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day}>
                <span className="sm:hidden">{day[0]}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <div key={day} className="h-12 sm:h-16 md:h-20 p-1 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between text-left">
                <span className="text-[9px] sm:text-[11px] font-semibold text-zinc-400">{day}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
