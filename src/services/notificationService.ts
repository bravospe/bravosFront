import api from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    icon?: string;
    action_url?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const notificationService = {
  /**
   * Get all notifications (paginated)
   */
  async getAll(page: number = 1): Promise<NotificationResponse> {
    const { data } = await api.get<NotificationResponse>(`/notifications?page=${page}`);
    return data;
  },

  /**
   * Get unread notifications
   */
  async getUnread(): Promise<{ data: Notification[] }> {
    const { data } = await api.get<{ data: Notification[] }>('/notifications/unread');
    return data;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/mark-read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const { data } = await api.post<{ count: number }>('/notifications/mark-all-read');
    return data;
  },

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  /**
   * Clear all read notifications
   */
  async clearRead(): Promise<{ count: number }> {
    const { data } = await api.delete<{ count: number }>('/notifications/clear-read');
    return data;
  },
};
