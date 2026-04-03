import { useState, type ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { cn, formatRelativeTime } from '../../lib/utils';
import { useLanguageStore } from '../../store/languageStore';

interface NotificationBellProps {
  theme?: 'light' | 'dark';
  children?: ReactNode;
  containerClassName?: string;
  triggerClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
}

export default function NotificationBell({
  theme = 'light',
  children,
  containerClassName,
  triggerClassName,
  iconClassName,
  badgeClassName,
  panelClassName,
  ariaLabel = 'Notifications',
}: NotificationBellProps) {
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const buttonTheme =
    theme === 'dark'
      ? 'text-white/90 hover:text-white hover:bg-white/10'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <div className={cn('relative', containerClassName)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-full focus:outline-none transition-colors',
          children ? '' : 'p-2',
          buttonTheme,
          triggerClassName
        )}
        aria-label={ariaLabel === 'Notifications' ? tx('Varsler', 'Notifications') : ariaLabel}
      >
        {children || <Bell className={cn('h-6 w-6', iconClassName)} />}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute top-0 right-0 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold leading-none text-white translate-x-1/2 -translate-y-1/2',
              badgeClassName
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute right-0 z-20 mt-2 w-80 rounded-lg border bg-white shadow-xl',
              panelClassName
            )}
          >
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold text-gray-900">{tx('Varsler', 'Notifications')}</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                  {tx('Marker alle som lest', 'Mark all read')}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  {tx('Ingen varsler', 'No notifications')}
                </p>
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
