'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, ExclamationTriangleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useQuery } from '@tanstack/react-query'
import { subscriptionService } from '@/services/subscriptionService'

export default function SubscriptionBanner() {
  const router = useRouter()
  const { subscription, fetchSubscription, isOnTrial, isExpiringSoon, daysRemaining, isExpired, initialized } = useSubscriptionStore()

  const { data: latestPayment, isLoading: isLoadingPayment } = useQuery({
    queryKey: ['latest-payment'],
    queryFn: () => subscriptionService.getLatestManualPayment(),
  });

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  if (!initialized || !subscription) return null

  // Si hay un pago pendiente, mostrar banner de "En revisión"
  if (latestPayment?.data?.status === 'pending') {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ArrowPathIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Tu pago de membresía está siendo verificado
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 mt-0.5">
                Referencia: {latestPayment.data.transaction_reference} • Esto puede tardar hasta 24 horas.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/settings/subscription')}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            Ver detalle
          </button>
        </div>
      </div>
    );
  }

  const days = daysRemaining()
  const trial = isOnTrial()
  const expiringSoon = isExpiringSoon()
  const expired = isExpired()

  // No mostrar banner si está activo con más de 7 días
  if (!trial && !expiringSoon && !expired) return null

  // Calcular barra de progreso
  const totalDays = trial
    ? (subscription.trial_ends_at ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date(subscription.starts_at ?? '').getTime()) / 86400000) : 15)
    : ((subscription as any).total_days ?? 30)
  const usedDays = totalDays - days
  const progressPct = Math.min(100, Math.round((usedDays / totalDays) * 100))

  if (expired) {
    return null // El paywall se ocupa de esto
  }

  const isCritical = days <= 3
  const bgColor = isCritical
    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40'
    : trial
      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40'
      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40'

  const textColor = isCritical
    ? 'text-amber-800 dark:text-amber-300'
    : trial
      ? 'text-blue-800 dark:text-blue-300'
      : 'text-yellow-800 dark:text-yellow-300'

  const barColor = isCritical
    ? 'bg-amber-500'
    : trial
      ? 'bg-blue-500'
      : 'bg-yellow-500'

  const barBg = isCritical
    ? 'bg-amber-200 dark:bg-amber-800/40'
    : trial
      ? 'bg-blue-200 dark:bg-blue-800/40'
      : 'bg-yellow-200 dark:bg-yellow-800/40'

  return (
    <div className={`mx-4 mt-3 rounded-xl border px-4 py-3 ${bgColor}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isCritical ? (
            <ExclamationTriangleIcon className={`w-5 h-5 shrink-0 ${textColor}`} />
          ) : (
            <ClockIcon className={`w-5 h-5 shrink-0 ${textColor}`} />
          )}
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${textColor}`}>
              {trial
                ? isCritical
                  ? `¡Solo ${days} ${days === 1 ? 'día' : 'días'} de prueba restantes!`
                  : `Período de prueba: ${days} días restantes`
                : isCritical
                  ? `¡Tu plan vence en ${days} ${days === 1 ? 'día' : 'días'}!`
                  : `Tu plan vence en ${days} días`}
            </p>
            <div className={`mt-1.5 h-1.5 w-full rounded-full ${barBg} hidden sm:block`}>
              <div
                className={`h-1.5 rounded-full transition-all ${barColor} ${isCritical ? 'animate-pulse' : ''}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/settings/subscription')}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            isCritical
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : trial
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {trial ? 'Contratar plan' : 'Renovar ahora'}
        </button>
      </div>
    </div>
  )
}
