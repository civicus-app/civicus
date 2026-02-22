import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification } from '../types/policy.types';

export const useNotifications = (userId?: string) => {
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        addNotification(payload.new as Notification);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    markAsRead(id);
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    markAllAsRead();
  };

  return { notifications, unreadCount, markRead, markAllRead };
};
