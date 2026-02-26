import { create } from 'zustand';
import type { Notification } from '@/services/notificationService';
import { notificationService } from '@/services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      // Fetch all notifications (history) instead of just unread
      const response = await notificationService.getAll();
      set({ notifications: response.data, loading: false });

      // Also update unread count
      const countResponse = await notificationService.getUnreadCount();
      set({ unreadCount: countResponse.count });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount();
      set({ unreadCount: response.count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();

    // Check if notification already exists
    const exists = notifications.some(n => n.id === notification.id);
    if (exists) return;

    // Add to the beginning of the list
    set({
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1,
    });

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.data.title, {
        body: notification.data.message,
        icon: '/logo.png',
        tag: notification.id,
      });
    }

    // Play sound (optional)
    playNotificationSound();
  },

  markAsRead: async (notificationId: string) => {
    const { notifications, unreadCount } = get();

    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      );

      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();

    try {
      await notificationService.markAllAsRead();

      // Update local state
      const updatedNotifications = notifications.map(n => ({
        ...n,
        read_at: new Date().toISOString(),
      }));

      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    const { notifications, unreadCount } = get();

    try {
      await notificationService.delete(notificationId);

      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;

      set({
        notifications: notifications.filter(n => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    // const audio = new Audio('/notification.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {
    //   // Silently fail if autoplay is blocked
    // });
    // console.log('🔔 Notification sound placeholder (add public/notification.mp3 to enable)');
  } catch (error) {
    // Silently fail
  }
}

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};
