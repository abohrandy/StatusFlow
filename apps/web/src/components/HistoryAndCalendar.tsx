import React, { useState } from 'react';

export interface HistoryItem {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  deliveredAt: string;
  status: 'DELIVERED' | 'FAILED' | 'SCHEDULED';
  viewsCount: number;
  logDetails: string;
}

const INITIAL_HISTORY: HistoryItem[] = [
  { id: 'hist_1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only 🔥', mediaType: 'IMAGE', deliveredAt: '2026-07-28 09:30 AM', status: 'DELIVERED', viewsCount: 142, logDetails: 'Socket publish ack received. Message ID: 3EB0F89A. Broadcast target: status@broadcast.' },
  { id: 'hist_2', caption: 'Product Launch Teaser Video 🎥', mediaType: 'VIDEO', deliveredAt: '2026-07-27 06:15 PM', status: 'DELIVERED', viewsCount: 289, logDetails: 'Socket publish ack received. Message ID: 3EB0F91B. Media size: 8.5MB.' },
  { id: 'hist_3', caption: 'System Maintenance Notice 🛠️', mediaType: 'TEXT', deliveredAt: '2026-07-26 10:00 AM', status: 'FAILED', viewsCount: 0, logDetails: 'ERR: Socket connection lost during publish. DisconnectReason: 401 Unauthorized.' }
];

export const HistoryAndCalendar: React.FC = () => {
  const [tab, setTab] = useState<'HISTORY' | 'CALENDAR'>('CALENDAR');
  const [calendarMode, setCalendarMode] = useState<'MONTHLY' | 'WEEKLY' | 'DAILY'>('MONTHLY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'FAILED' | 'SCHEDULED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<HistoryItem | null>(null);

  const filteredHistory = INITIAL_HISTORY.filter(item => {
    const matchesFilter = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = item.caption.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
              <span className="text-lg font-bold text-white">July 2026</span>
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
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div
                    key={day}
                    className="h-12 sm:h-20 md:h-24 p-1 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] sm:text-[11px] font-semibold text-zinc-400">{day}</span>
                    {day === 28 && (
                      <>
                        {/* Full detail on larger screens; a plain dot on phones where there's no room */}
                        <div className="hidden sm:block p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] space-y-0.5">
                          <div className="font-bold truncate">09:30 AM - Image</div>
                          <div className="text-[9px] text-zinc-400">Drag to Reschedule</div>
                        </div>
                        <span className="sm:hidden self-end w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {calendarMode === 'WEEKLY' && (
            /* Each day column needs real width for its event cards, so below sm it scrolls
               horizontally (day-by-day, like a mobile calendar's week view) instead of
               squeezing all 7 columns down to unreadable widths. */
            <div className="flex sm:grid sm:grid-cols-7 gap-4 overflow-x-auto sm:overflow-visible -mx-1 px-1 sm:mx-0 sm:px-0">
              {['Sun 26', 'Mon 27', 'Tue 28', 'Wed 29', 'Thu 30', 'Fri 31', 'Sat 01'].map((dayStr, i) => (
                <div key={i} className="min-w-[140px] sm:min-w-0 flex-1 sm:flex-none p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 min-h-[280px]">
                  <div className="text-xs font-bold text-white border-b border-zinc-800 pb-2">{dayStr}</div>
                  {i === 2 && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                      <div className="font-bold">02:30 PM</div>
                      <div className="text-[11px] text-zinc-300">Flash Sale Alert</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {calendarMode === 'DAILY' && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="text-sm font-bold text-white">Daily Schedule Overview (July 28, 2026)</div>
              <div className="space-y-2">
                {[9, 12, 14, 18, 21].map(hour => (
                  <div key={hour} className="flex items-center gap-4 py-2 border-b border-zinc-800/60 text-xs">
                    <span className="w-16 font-mono text-zinc-400">{hour}:00</span>
                    <div className="flex-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {hour === 14 ? 'Flash Sale Alert! 30% Off Storewide Today Only 🔥' : 'No posts scheduled'}
                    </div>
                  </div>
                ))}
              </div>
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
              {(['ALL', 'DELIVERED', 'FAILED', 'SCHEDULED'] as const).map(status => (
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
          <div className="space-y-3">
            {filteredHistory.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {item.mediaType}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white max-w-md truncate">{item.caption}</div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                      <span>🕒 {item.deliveredAt}</span>
                      <span>👁️ {item.viewsCount} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                    item.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
              <div className="text-zinc-400">Delivered: <span className="text-white">{selectedLog.deliveredAt}</span></div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed">
                {selectedLog.logDetails}
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
