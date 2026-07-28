import React, { useState } from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'FAILURE' | 'DISCONNECT' | 'SUBSCRIPTION';
  isRead: boolean;
  createdAt: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif_1', title: 'WhatsApp Socket Disconnected', message: 'Session +2348123456789 lost connection. Auto-reconnecting...', type: 'DISCONNECT', isRead: false, createdAt: '10 mins ago' },
  { id: 'notif_2', title: 'Status Broadcast Published', message: 'Flash Sale Alert! status delivered to 142 contacts.', type: 'SUCCESS', isRead: false, createdAt: '1 hour ago' },
  { id: 'notif_3', title: 'Subscription Auto-Renewing', message: 'Your Pro Plan subscription ($15.00) renews on Aug 15 via Paystack.', type: 'SUBSCRIPTION', isRead: true, createdAt: '1 day ago' },
  { id: 'notif_4', title: 'Status Publish Failed', message: 'Product Video Status failed due to temporary network error. Retrying...', type: 'FAILURE', isRead: true, createdAt: '2 days ago' }
];

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DISCONNECT': return '⚠️';
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'SUBSCRIPTION': return '💳';
    }
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
          <p className="text-sm text-zinc-400 mt-1">Real-time alerts for socket status, status broadcasts, and Paystack subscriptions.</p>
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
        <h3 className="font-semibold text-base text-white mb-2">Notification History Logs</h3>

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
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-zinc-500 mt-2 block">{item.createdAt}</span>
                </div>
              </div>

              <button
                onClick={() => handleToggleRead(item.id)}
                className="text-xs text-zinc-400 hover:text-white font-medium"
              >
                {item.isRead ? 'Mark Unread' : 'Mark Read'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
