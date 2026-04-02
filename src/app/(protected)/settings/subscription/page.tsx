'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useSubscriptionStore, type PlanFull } from '@/stores/subscriptionStore'
import { toast } from 'react-hot-toast'

type BillingPeriod = 'monthly' | 'semiannual' | 'yearly'

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: 'Mensual',
  semiannual: 'Semestral',
  yearly: 'Anual',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial:     { label: 'Prueba gratuita', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active:    { label: 'Activa', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  expired:   { label: 'Expirada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
}

export default function SubscriptionPage() {
  const router = useRouter()
  const {
    subscription,
    availablePlans,
    fetchSubscription,
    fetchPlans,
    subscribe,
    cancelSubscription,
    daysRemaining,
    isOnTrial,
    isExpired,
  } = useSubscriptionStore()

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[]>([])

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
    loadBillingHistory()
  }, [])

  const loadBillingHistory = async () => {
    try {
      const { default: api } = await import('@/lib/api')
      const { data } = await api.get('/subscriptions/invoices')
      setBillingHistory(data.data ?? [])
    } catch {}
  }

  const handleSubscribe = async (plan: PlanFull) => {
    setLoadingPlan(plan.id)
    try {
      await subscribe(plan.id, billingPeriod)
      toast.success(`¡Plan ${plan.name} activado!`)
      await fetchSubscription()
    } catch {
      toast.error('No se pudo procesar la suscripción.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelSubscription()
      setCancelConfirm(false)
      toast.success('Suscripción cancelada.')
    } catch {
      toast.error('No se pudo cancelar la suscripción.')
    }
  }

  const getPrice = (plan: PlanFull) => {
    switch (billingPeriod) {
      case 'semiannual': return plan.price_semiannual
      case 'yearly':     return plan.price_yearly
      default:           return plan.price_monthly
    }
  }

  const days = daysRemaining()
  const trial = isOnTrial()
  const expired = isExpired()
  const plan = subscription?.plan
  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null

  // Calcular progreso del período
  const totalDays = (subscription as any)?.total_days ?? 30
  const progressPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - days) / totalDays) * 100)) : 0

  const expiryDate = subscription?.status === 'trial'
    ? subscription.trial_ends_at
    : subscription?.ends_at

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suscripción</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tu plan y facturación</p>
      </div>

      {/* Suscripción actual */}
      {subscription && plan && (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan {plan.name}</h2>
                {statusInfo && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              {subscription.billing_period && (
                <p className="text-sm text-gray-500">Facturación {PERIOD_LABELS[subscription.billing_period as BillingPeriod]?.toLowerCase()}</p>
              )}
            </div>
            {!expired && (
              <div className="flex gap-2">
                {subscription.status !== 'cancelled' && (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancelar plan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Countdown visual */}
          {!expired && expiryDate && (
            <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {trial ? 'Prueba gratuita' : 'Período de facturación'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${days <= 3 ? 'text-amber-500' : days <= 7 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                    {days} {days === 1 ? 'día' : 'días'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Vence el {new Date(expiryDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    days <= 3 ? 'bg-amber-500' : days <= 7 ? 'bg-yellow-500' : 'bg-emerald-500'
                  } ${days <= 3 ? 'animate-pulse' : ''}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Inicio</span>
                <span>{progressPct}% consumido</span>
                <span>Vence</span>
              </div>
            </div>
          )}

          {/* Features del plan actual */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Usuarios', value: plan.max_users === null ? 'Ilimitados' : plan.max_users },
              { label: 'Productos', value: plan.max_products === null ? 'Ilimitados' : plan.max_products },
              { label: 'Facturas/mes', value: plan.max_invoices_monthly === null ? 'Ilimitadas' : plan.max_invoices_monthly },
              { label: 'Ventas/mes', value: plan.max_sales_monthly === null ? 'Ilimitadas' : plan.max_sales_monthly },
              { label: 'Clientes', value: plan.max_clients === null ? 'Ilimitados' : plan.max_clients },
              { label: 'Almacenes', value: plan.max_warehouses === null ? 'Ilimitados' : plan.max_warehouses },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparador de planes */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {expired ? 'Elige un plan' : 'Cambiar plan'}
            </h2>
            <p className="text-sm text-gray-500">Todos los planes incluyen soporte y actualizaciones</p>
          </div>

          {/* Billing period toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-[#161A22] rounded-xl p-1 gap-1">
            {(['monthly', 'semiannual', 'yearly'] as BillingPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === period
                    ? 'bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {PERIOD_LABELS[period]}
                {period !== 'monthly' && (
                  <span className="ml-1 text-xs text-emerald-600 font-semibold">
                    {period === 'semiannual' ? '-15%' : '-20%'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.filter(p => p.is_active).map((p) => {
            const price = getPrice(p)
            const isCurrentPlan = subscription?.plan_id === p.id && !expired
            const isRecommended = p.is_recommended || p.is_popular

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  isRecommended
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                    : isCurrentPlan
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {p.badge ?? 'Recomendado'}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Plan actual
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{p.description}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    S/ {Number(price).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">
                    /{billingPeriod === 'monthly' ? 'mes' : billingPeriod === 'semiannual' ? '6 meses' : 'año'}
                  </span>
                </div>

                <ul className="space-y-2 mb-6">
                  {(p.features ?? []).slice(0, 7).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(p)}
                  disabled={loadingPlan === p.id || isCurrentPlan}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                    isCurrentPlan
                      ? 'bg-gray-100 dark:bg-[#232834] text-gray-400 cursor-not-allowed'
                      : isRecommended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
                  }`}
                >
                  {loadingPlan === p.id
                    ? 'Procesando...'
                    : isCurrentPlan
                      ? 'Plan actual'
                      : 'Contratar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historial de pagos */}
      {billingHistory.length > 0 && (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
            <h2 className="font-bold text-gray-900 dark:text-white">Historial de suscripciones</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#232834]">
            {billingHistory.map((item: any) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.plan_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.starts_at} → {item.ends_at ?? item.trial_ends_at ?? '—'}
                    {item.billing_period && ` · ${PERIOD_LABELS[item.billing_period as BillingPeriod] ?? item.billing_period}`}
                  </p>
                </div>
                <div className="text-right">
                  {item.amount && (
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.currency} {Number(item.amount).toFixed(2)}
                    </p>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABELS[item.status]?.color ?? ''}`}>
                    {STATUS_LABELS[item.status]?.label ?? item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal confirmar cancelación */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <InformationCircleIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">¿Cancelar suscripción?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Seguirás teniendo acceso hasta que venza tu período actual. Después no podrás acceder al sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-[#232834] rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161A22]"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
