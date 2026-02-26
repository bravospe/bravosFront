'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationService, Notification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'unread' | 'read';

const NotificationsPage = () => {
  const router = useRouter();
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch notifications
  const fetchNotifications = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await notificationService.getAll(page);
      setNotifications(response.data);
      
      if (response.meta) {
        setCurrentPage(response.meta.current_page);
        setTotalPages(response.meta.last_page);
        setTotal(response.meta.total);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read_at;
    if (filter === 'read') return notification.read_at;
    return true;
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    }

    if (notification.data.action_url) {
      router.push(notification.data.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta notificación?')) {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotal(prev => prev - 1);
    }
  };

  const handleClearRead = async () => {
    if (confirm('¿Estás seguro de eliminar todas las notificaciones leídas?')) {
      await notificationService.clearRead();
      setNotifications(prev => prev.filter(n => !n.read_at));
      fetchNotifications(1);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-blue-900/20 rounded-lg">
              <Bell className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notificaciones
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {total} notificaciones en total • {unreadCount} sin leer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-black rounded-lg shadow border border-gray-200 dark:border-[#232834] mb-4">
        <div className="p-4 border-b border-gray-200 dark:border-[#232834]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-500 text-black font-semibold'
                    : 'bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todas ({total})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-emerald-500 text-black font-semibold'
                    : 'bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                No leídas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-emerald-500 text-black font-semibold'
                    : 'bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Leídas ({total - unreadCount})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-emerald-500 dark:text-emerald-400 hover:bg-blue-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check size={16} />
                  Marcar todas como leídas
                </button>
              )}
              
              {notifications.some(n => n.read_at) && (
                <button
                  onClick={handleClearRead}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Limpiar leídas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200 dark:divide-[#1E2230]">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
              <Bell size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">No hay notificaciones</p>
              <p className="text-sm">
                {filter === 'unread' && 'No tienes notificaciones sin leer'}
                {filter === 'read' && 'No tienes notificaciones leídas'}
                {filter === 'all' && 'No tienes ninguna notificación'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  group relative p-5 cursor-pointer transition-colors
                  ${!notification.read_at 
                    ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/10' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#1E2230]/50'
                  }
                `}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-3xl">
                    {notification.data.icon || '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {notification.data.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {notification.data.message}
                    </p>

                    {/* Additional data */}
                    {Object.keys(notification.data).length > 3 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(notification.data)
                          .filter(([key]) => !['title', 'message', 'icon', 'action_url'].includes(key))
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#1E2230] text-gray-800 dark:text-gray-200"
                            >
                              {typeof value === 'number' ? `S/ ${value.toFixed(2)}` : String(value)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Eliminar notificación"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Unread Indicator */}
                {!notification.read_at && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-blue-600 rounded-r"></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-[#232834]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis between non-consecutive pages
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`
                              px-3 py-1 rounded-lg text-sm font-medium transition-colors
                              ${page === currentPage
                                ? 'bg-emerald-500 text-black font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1E2230]'
                              }
                            `}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
