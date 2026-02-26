import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { initializeEcho, disconnectEcho, getEcho } from '@/lib/echo';
import type { Notification } from '@/services/notificationService';
import { useRouter } from 'next/navigation';

interface Toast {
  id: string;
  notification: Notification;
}

// Global Set to track processed IDs across all hook instances
const processedIdsGlobal = new Set<string>();

export const useNotifications = () => {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { addNotification, markAsRead } = useNotificationStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!user || !token) {
      disconnectEcho();
      return;
    }

    // Initialize Echo
    const echo = initializeEcho(token);

    // Listen to user's private channel (Standard Laravel Notification Channel)
    const channelName = `App.Models.User.${user.id}`;
    const channel = echo.private(channelName);

    console.log(`🔌 Subscribing to channel: ${channelName}`);

    // Listen for standard Laravel Notification event
    // Using full class name allows for more precise targeting than the helper
    // Use a ref to track processed IDs to avoid duplicates in strict mode

    // Listen for standard Laravel Notification event
    const eventName = '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated';

    // Subscribe
    channel.listen(eventName, (event: any) => {
      console.log('📬 Real-time notification received:', event);

      // Prevent duplicates using Global Set
      if (processedIdsGlobal.has(event.id)) {
        console.log('Skipping duplicate notification (Global check):', event.id);
        return;
      }
      processedIdsGlobal.add(event.id);

      // Cleanup processed ID after 2 seconds
      setTimeout(() => processedIdsGlobal.delete(event.id), 2000);

      const newNotification: Notification = {
        id: event.id,
        type: event.type,
        data: event.data || event,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to store immediately
      addNotification(newNotification);

      // Show toast
      const toastId = `toast-${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id: toastId, notification: newNotification }]);
    });

    // Log subscription errors (e.g. 403 Auth failure)
    channel.error((error: any) => {
      console.error('❌ Echo Subscription Error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (channel) {
        channel.stopListening(eventName);
      }
    };
  }, [user, token, addNotification]);

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const handleToastClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL
    if (notification.data.action_url) {
      router.push(notification.data.action_url);
    }
  };

  return {
    toasts,
    removeToast,
    handleToastClick,
  };
};
