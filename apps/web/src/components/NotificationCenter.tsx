import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function getIcon(type: string): string {
  switch (type) {
    case 'RENEWAL_SAVINGS':
      return '💰';
    case 'EXPIRY_WARNING':
      return '⏳';
    case 'DISCONNECT':
      return '⚠️';
    case 'SUCCESS':
      return '✅';
    case 'FAILURE':
      return '❌';
    default:
      return '🔔';
  }
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { notifications: rows } = await apiClient.getNotifications();
      setNotifications(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          type: r.type,
          isRead: r.is_read,
          createdAt: r.created_at,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await apiClient.markAllNotificationsRead();
  };

  const handleToggleRead = async (id: string, isRead: boolean) => {
    if (isRead) return; // no "mark unread" endpoint — read state only moves forward
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await apiClient.markNotificationRead(id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">Billing and subscription alerts land here.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-all"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications History List */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-semibold text-base text-white mb-2">Notification History</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                  !item.isRead ? 'bg-zinc-950/80 border-emerald-500/30' : 'bg-zinc-950/40 border-zinc-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-xl p-2 rounded-xl bg-zinc-900 border border-zinc-800">{getIcon(item.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{item.title}</span>
                      {!item.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-zinc-500 mt-2 block">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                {!item.isRead && (
                  <button onClick={() => handleToggleRead(item.id, item.isRead)} className="text-xs text-zinc-400 hover:text-white font-medium">
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
