import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime } from '../../lib/utils';

interface NotificationBellProps {
  theme?: 'light' | 'dark';
}

export default function NotificationBell({ theme = 'light' }: NotificationBellProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const buttonTheme =
    theme === 'dark'
      ? 'text-white/90 hover:text-white hover:bg-white/10'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-full focus:outline-none transition-colors ${buttonTheme}`}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
