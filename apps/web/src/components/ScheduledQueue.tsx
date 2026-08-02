import React, { useState } from 'react';

export interface ScheduleItem {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  scheduledAt: string; // ISO string
  timezone: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  isValid: boolean;
}

const INITIAL_SCHEDULES: ScheduleItem[] = [
  { id: 'sch_1', caption: 'Flash Sale Alert! 30% Off Storewide Today Only 🔥', mediaType: 'IMAGE', scheduledAt: '2026-07-28T14:30', timezone: 'UTC', status: 'PENDING', isValid: true },
  { id: 'sch_2', caption: 'New Product Line Unboxing & Demonstration 🎥', mediaType: 'VIDEO', scheduledAt: '2026-07-28T19:00', timezone: 'Africa/Lagos', status: 'PENDING', isValid: true },
  { id: 'sch_3', caption: 'Good morning everyone! Stay tuned for updates.', mediaType: 'TEXT', scheduledAt: '2026-07-29T09:00', timezone: 'America/New_York', status: 'PENDING', isValid: true },
];

const TIMEZONES = ['UTC', 'Africa/Lagos', 'America/New_York', 'Europe/London', 'Asia/Dubai'];

export const ScheduledQueue: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedTimezone, setSelectedTimezone] = useState('Africa/Lagos');
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  const handleCancel = (id: string) => {
    setSchedules(prev => prev.map(item => item.id === id ? { ...item, status: 'CANCELLED' } : item));
  };

  const handleDuplicate = (item: ScheduleItem) => {
    const duplicated: ScheduleItem = {
      ...item,
      id: `sch_${Date.now()}`,
      caption: `${item.caption} (Copy)`,
      status: 'PENDING'
    };
    setSchedules(prev => [duplicated, ...prev]);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSchedules(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Scheduled Queue Engine</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage, edit, cancel, and synchronize scheduled status updates across timezones.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timezone Selector */}
          <select 
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
          >
            {TIMEZONES.map(tz => (
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
          
          <div className="space-y-3">
            {schedules.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {item.mediaType}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white truncate max-w-md">{item.caption}</div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                      <span>🕒 {new Date(item.scheduledAt).toLocaleString()} ({selectedTimezone})</span>
                      <span className="text-emerald-400">Valid</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${
                    item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {item.status}
                  </span>

                  {item.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDuplicate(item)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700"
                      >
                        Duplicate
                      </button>
                      <button 
                        onClick={() => handleCancel(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                {day === 28 && (
                  <>
                    <div className="hidden sm:block p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] truncate font-medium">
                      2 Scheduled Posts
                    </div>
                    <span className="sm:hidden self-end w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Edit Schedule Details</h3>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Caption</label>
              <textarea
                value={editingItem.caption}
                onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
                rows={3}
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={editingItem.scheduledAt}
                onChange={(e) => setEditingItem({ ...editingItem, scheduledAt: e.target.value })}
                className="w-full mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setEditingItem(null)} 
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
