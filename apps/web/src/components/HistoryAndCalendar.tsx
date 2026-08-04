import React, { useEffect, useState } from 'react';
import type { QueueLog, StatusPost } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';

type HistoryStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED';

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const HistoryAndCalendar: React.FC = () => {
  const [tab, setTab] = useState<'HISTORY' | 'CALENDAR'>('CALENDAR');
  const [calendarMode, setCalendarMode] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HistoryStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<StatusPost | null>(null);
  const [postLogs, setPostLogs] = useState<QueueLog[] | null>(null);
  const [postLogsLoading, setPostLogsLoading] = useState(false);
  const [history, setHistory] = useState<StatusPost[]>([]);
  const [scheduled, setScheduled] = useState<StatusPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([apiClient.listPostHistory(), apiClient.listScheduledPosts()]).then(([historyRes, scheduledRes]) => {
      setHistory(historyRes.status === 'fulfilled' ? historyRes.value.posts ?? [] : []);
      setScheduled(scheduledRes.status === 'fulfilled' ? scheduledRes.value.posts ?? [] : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedLog) {
      setPostLogs(null);
      return;
    }
    setPostLogsLoading(true);
    apiClient
      .getPostLogs(selectedLog.id)
      .then(({ logs }) => setPostLogs(logs))
      .catch(() => setPostLogs([]))
      .finally(() => setPostLogsLoading(false));
  }, [selectedLog]);

  const filteredHistory = history.filter(item => {
    const matchesFilter = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = (item.caption ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calendar views plot every post (past and upcoming) by its real scheduledAt date.
  const allPosts = [...history, ...scheduled];
  const today = new Date();
  const postsOnDay = (day: Date) => allPosts.filter((p) => isSameDay(new Date(p.scheduledAt), day));
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const todaysPosts = postsOnDay(today).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Posting History & Calendar</h2>
          <p className="text-sm text-zinc-400 mt-1">Review past status broadcasts, execution logs, and drag-and-drop calendar scheduling.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTab('CALENDAR')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'CALENDAR' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📅 Calendar View
            </button>
            <button
              onClick={() => setTab('HISTORY')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'HISTORY' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📜 Posting History
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab View */}
      {tab === 'CALENDAR' ? (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          {/* Calendar Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <span className="text-xs text-zinc-400 font-mono">(Africa/Lagos)</span>
            </div>

            {/* View Modes: Monthly, Weekly, Daily */}
            <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {(['MONTHLY', 'WEEKLY', 'DAILY'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setCalendarMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    calendarMode === mode ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Views */}
          {calendarMode === 'MONTHLY' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold text-zinc-400 pb-2 border-b border-zinc-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day}>
                    <span className="sm:hidden">{day[0]}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from(
                  { length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() },
                  (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1),
                ).map(day => {
                  const dayPosts = postsOnDay(day);
                  return (
                    <div
                      key={day.getDate()}
                      className={`h-12 sm:h-20 md:h-24 p-1 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between hover:border-emerald-500/50 transition-all cursor-pointer ${
                        isSameDay(day, today) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950/60 border-zinc-800'
                      }`}
                    >
                      <span className="text-[9px] sm:text-[11px] font-semibold text-zinc-400">{day.getDate()}</span>
                      {dayPosts.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 truncate">{dayPosts.length} post{dayPosts.length === 1 ? '' : 's'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calendarMode === 'WEEKLY' && (
            /* Each day column needs real width for its event cards, so below sm it scrolls
               horizontally (day-by-day, like a mobile calendar's week view) instead of
               squeezing all 7 columns down to unreadable widths. */
            <div className="flex sm:grid sm:grid-cols-7 gap-4 overflow-x-auto sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0">
              {weekDays.map((day, i) => {
                const dayPosts = postsOnDay(day);
                return (
                  <div key={i} className="min-w-[140px] sm:min-w-0 flex-1 sm:flex-none p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 min-h-[280px]">
                    <div className="text-xs font-bold text-white border-b border-zinc-800 pb-2">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
                    </div>
                    {dayPosts.length === 0 ? (
                      <div className="text-[11px] text-zinc-500">No posts</div>
                    ) : (
                      dayPosts.map((p) => (
                        <div key={p.id} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 truncate">
                          {new Date(p.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {p.caption || p.mediaType}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {calendarMode === 'DAILY' && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="text-sm font-bold text-white">Today · {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              {todaysPosts.length === 0 ? (
                <div className="text-xs text-zinc-500 py-4 text-center">No posts scheduled today.</div>
              ) : (
                <div className="space-y-2">
                  {todaysPosts.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 py-2 border-b border-zinc-800/60 text-xs">
                      <span className="w-16 font-mono text-zinc-400">{new Date(p.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      <div className="flex-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 truncate">{p.caption || `${p.mediaType} status`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* History & Detailed Logs Table */
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'COMPLETED', 'FAILED', 'CANCELLED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === status ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history log captions..."
              className="w-full sm:w-64 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* History Log List */}
          {loading ? (
            <div className="text-sm text-zinc-500 py-8 text-center">Loading history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-sm text-zinc-500 py-8 text-center">No posting history yet.</div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {item.mediaType}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white max-w-md truncate">{item.caption || '(no caption)'}</div>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                        <span>🕒 {new Date(item.scheduledAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                      item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => setSelectedLog(item)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700"
                    >
                      View Logs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Execution Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-zinc-400">Post ID: <span className="font-mono text-white">{selectedLog.id}</span></div>
              <div className="text-zinc-400">Scheduled: <span className="text-white">{new Date(selectedLog.scheduledAt).toLocaleString()}</span></div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed space-y-1.5 max-h-64 overflow-y-auto">
                {postLogsLoading ? (
                  <div className="text-zinc-500">Loading execution logs...</div>
                ) : !postLogs || postLogs.length === 0 ? (
                  <div className="text-zinc-500">No execution logs recorded for this post yet.</div>
                ) : (
                  postLogs.map((log) => (
                    <div key={log.id}>
                      <span className="text-zinc-500">[{new Date(log.createdAt).toLocaleTimeString()} · attempt {log.attemptNumber}]</span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
