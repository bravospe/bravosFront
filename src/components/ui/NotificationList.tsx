import React, { useEffect } from 'react'
import { BellIcon, CheckCircleIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function NotificationList({ onClose }: { onClose?: () => void }) {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotificationStore()

    const { user } = useAuthStore()

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await markAsRead(id)
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead()
        toast.success('Todas marcadas como leídas')
    }

    const getNotificationStyle = (type: string, data: any) => {
        let icon = <BellIcon className="h-5 w-5" />
        let colorClass = "bg-blue-500/10 text-blue-500"
        let titleColor = "text-blue-400"

        // Normalize type for comparison (backend sends 'App\Notifications\NewSaleNotification')
        const normalizedType = type.toLowerCase();
        const dataType = data.type ? data.type.toLowerCase() : '';

        if (normalizedType.includes('sale') || dataType === 'sale_created') {
            icon = <BanknotesIcon className="h-5 w-5" />
            colorClass = "bg-emerald-500/10 text-emerald-500"
            titleColor = "text-white" // Premium: White title for sales
        } else if (normalizedType.includes('stock') || dataType === 'stock_alert') {
            icon = <ExclamationTriangleIcon className="h-5 w-5" />
            colorClass = "bg-amber-500/10 text-amber-500"
            titleColor = "text-amber-400"
        } else if (normalizedType.includes('error') || dataType === 'error') {
            icon = <ExclamationTriangleIcon className="h-5 w-5" />
            colorClass = "bg-red-500/10 text-red-500"
            titleColor = "text-red-400"
        }

        return { icon, colorClass, titleColor }
    }

    if (loading && notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="text-sm font-medium">Cargando notificaciones...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[#161A22]">
            <div className="px-4 py-3 border-b border-[#232834] flex justify-between items-center bg-[#0D1117] sticky top-0 z-10">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                    Notificaciones
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/10">
                            {unreadCount}
                        </span>
                    )}
                </span>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors hover:bg-emerald-500/10 px-2 py-1 rounded-lg"
                    >
                        Marcar todo leído
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <div className="w-16 h-16 rounded-full bg-[#1E2230] flex items-center justify-center mb-4">
                            <BellIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No tienes notificaciones</p>
                        <p className="text-gray-600 text-sm mt-1">Te avisaremos cuando suceda algo importante.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#232834]">
                        {notifications.map((notification) => {
                            const { icon, colorClass, titleColor } = getNotificationStyle(notification.type, notification.data)
                            return (
                                <li
                                    key={notification.id}
                                    className={clsx(
                                        "p-4 hover:bg-[#1E2230] transition-all duration-200 relative group cursor-pointer",
                                        !notification.read_at ? "bg-[#1E2230]/40 border-l-2 border-emerald-500" : "border-l-2 border-transparent"
                                    )}
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                >
                                    <div className="flex gap-4">
                                        {/* Icon Container */}
                                        <div className={clsx("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", colorClass)}>
                                            {icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={clsx("text-sm font-bold pr-6", titleColor)}>
                                                    {notification.data.title || 'Sistema'}
                                                </p>
                                                <span className="text-[10px] bg-[#2A3040] text-gray-400 px-1.5 py-0.5 rounded border border-[#363B4D] whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                                {notification.data.message}
                                            </p>
                                        </div>

                                        {/* Actions (Hover) */}
                                        {!notification.read_at && (
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button
                                                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                                    title="Marcar como leída"
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id, e); }}
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
