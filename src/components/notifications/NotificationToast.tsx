import { useEffect } from 'react';
import { XMarkIcon, BellIcon, BanknotesIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { Notification } from '@/services/notificationService';
import clsx from 'clsx';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onClick?: () => void;
}

export const NotificationToast = ({ notification, onClose, onClick }: NotificationToastProps) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationStyle = (type: string, data: any) => {
    let icon = <BellIcon className="h-6 w-6" />
    let colorClass = "bg-blue-500/10 text-blue-500"
    let borderClass = "border-blue-500/30"
    let titleColor = "text-blue-400"
    let progressColor = "bg-blue-500"

    // Normalize type for comparison
    const normalizedType = type.toLowerCase();
    const dataType = data.type ? data.type.toLowerCase() : '';

    if (normalizedType.includes('sale') || dataType === 'sale_created') {
      icon = <BanknotesIcon className="h-6 w-6" />
      colorClass = "bg-emerald-500/10 text-emerald-500"
      borderClass = "border-emerald-500/30"
      titleColor = "text-white"
      progressColor = "bg-emerald-500"
    } else if (normalizedType.includes('stock') || dataType === 'stock_alert') {
      icon = <ExclamationTriangleIcon className="h-6 w-6" />
      colorClass = "bg-amber-500/10 text-amber-500"
      borderClass = "border-amber-500/30"
      titleColor = "text-amber-400"
      progressColor = "bg-amber-500"
    } else if (normalizedType.includes('error') || dataType === 'error') {
      icon = <ExclamationTriangleIcon className="h-6 w-6" />
      colorClass = "bg-red-500/10 text-red-500"
      borderClass = "border-red-500/30"
      titleColor = "text-red-400"
      progressColor = "bg-red-500"
    }

    return { icon, colorClass, borderClass, titleColor, progressColor }
  }

  const { icon, colorClass, borderClass, titleColor, progressColor } = getNotificationStyle(notification.type, notification.data);

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative bg-[#1E2230] rounded-xl shadow-2xl border p-4 w-96 cursor-pointer hover:shadow-3xl transition-all animate-slide-in-right overflow-hidden",
        borderClass
      )}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-10"
        aria-label="Cerrar notificación"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex gap-4 relative z-10">
        {/* Icon Container */}
        <div className={clsx("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", colorClass)}>
          {icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-4">
          <p className={clsx("text-sm font-bold mb-0.5", titleColor)}>
            {notification.data.title || 'Notificación'}
          </p>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            {notification.data.message}
          </p>
        </div>
      </div>

      {/* Progress Bar (Background overlay style) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
        <div className={clsx("h-full animate-progress", progressColor)}></div>
      </div>

      {/* Background Glow Effect */}
      <div className={clsx("absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[50px] opacity-10 pointer-events-none", progressColor)}></div>
    </div>
  );
};

// Container for multiple toasts
interface NotificationToastContainerProps {
  toasts: Array<{ id: string; notification: Notification }>;
  onRemove: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

export const NotificationToastContainer = ({
  toasts,
  onRemove,
  onNotificationClick,
}: NotificationToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <div key={toast.id} className="mb-3">
            <NotificationToast
              notification={toast.notification}
              onClose={() => onRemove(toast.id)}
              onClick={() => {
                onNotificationClick(toast.notification);
                onRemove(toast.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
