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
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { useSubscriptionStore, type PlanFull } from '@/stores/subscriptionStore'
import { toast } from 'react-hot-toast'
import { Tabs, Tab } from '@/components/ui/Tabs'
import { ManualPaymentForm } from '@/components/subscription/ManualPaymentForm'
import { Modal } from '@/components/ui/Modal'

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
  pending:   { label: 'Pago en revisión', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export default function SubscriptionPage() {
  const router = useRouter()
  const {
    subscription,
    availablePlans,
    fetchSubscription,
    fetchPlans,
    daysRemaining,
    isOnTrial,
    isExpired,
    cancelSubscription,
  } = useSubscriptionStore()

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [selectedPlanToPay, setSelectedPlanToPay] = useState<PlanFull | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
    loadBillingHistory()
  }, [])

  const loadBillingHistory = async () => {
    setLoadingHistory(true)
    try {
      const { default: api } = await import('@/lib/api')
      const { data } = await api.get('/membership/payments/history')
      setBillingHistory(data.data ?? [])
    } catch {
      // toast.error('Error al cargar el historial')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelSubscription()
      setCancelConfirm(false)
      toast.success('Suscripción cancelada.')
      fetchSubscription()
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

  const activeMembershipContent = (
    <div className="space-y-6">
      {subscription && plan ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6 shadow-sm">
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
                <p className="text-sm text-gray-500 font-medium">Facturación {PERIOD_LABELS[subscription.billing_period as BillingPeriod]?.toLowerCase()}</p>
              )}
            </div>
            {!expired && subscription.status !== 'cancelled' && (
              <button
                onClick={() => setCancelConfirm(true)}
                className="text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-900/30 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors font-semibold"
              >
                Cancelar plan
              </button>
            )}
          </div>

          {/* Countdown visual */}
          {!expired && expiryDate && (
            <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl p-4 mb-6 border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {trial ? 'Período de prueba' : 'Vencimiento de plan'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${days <= 3 ? 'text-amber-500' : days <= 7 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                    {days} {days === 1 ? 'día' : 'días'}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Hasta el {new Date(expiryDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${
                    days <= 3 ? 'bg-amber-500' : days <= 7 ? 'bg-yellow-500' : 'bg-emerald-500'
                  } ${days <= 3 ? 'animate-pulse' : ''}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                <span>Inicio</span>
                <span>{progressPct}% transcurrido</span>
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
              <div key={item.label} className="bg-white dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834] rounded-xl p-4 text-center shadow-sm">
                <div className="text-xl font-black text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
             <SparklesIcon className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes una membresía activa</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Selecciona un plan en la pestaña "Aumentar Plan" para comenzar a utilizar todas las funciones.</p>
        </div>
      )}
    </div>
  )

  const upgradePlanContent = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Planes Disponibles</h2>
          <p className="text-sm text-gray-500">Mejora tu plan para obtener más beneficios y límites ampliados.</p>
        </div>

        {/* Billing period toggle */}
        <div className="inline-flex items-center bg-gray-100 dark:bg-[#161A22] rounded-xl p-1 gap-1 border border-gray-200 dark:border-white/5">
          {(['monthly', 'semiannual', 'yearly'] as BillingPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setBillingPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                billingPeriod === period
                  ? 'bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {PERIOD_LABELS[period]}
              {period !== 'monthly' && (
                <span className="ml-1 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  {period === 'semiannual' ? '-15%' : '-20%'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.filter(p => p.is_active).map((p) => {
          const price = getPrice(p)
          const isCurrentPlan = subscription?.plan_id === p.id && !expired
          const isRecommended = p.is_recommended || p.is_popular

          return (
            <div
              key={p.id}
              className={`relative rounded-3xl border-2 p-8 transition-all duration-300 hover:shadow-xl ${
                isRecommended
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-emerald-500/5 scale-[1.02] z-10'
                  : 'border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {p.badge ?? 'Recomendado'}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{p.name}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{p.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  S/ {Number(price).toFixed(0)}
                </span>
                <span className="text-sm font-bold text-gray-500">
                  /{billingPeriod === 'monthly' ? 'mes' : billingPeriod === 'semiannual' ? '6 meses' : 'año'}
                </span>
              </div>

              <div className="space-y-4 mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incluye:</p>
                <ul className="space-y-3">
                  {(p.features ?? []).slice(0, 8).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckIcon className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanToPay(p)}
                disabled={isCurrentPlan}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                  isCurrentPlan
                    ? 'bg-gray-100 dark:bg-[#232834] text-gray-400 cursor-not-allowed'
                    : isRecommended
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-lg'
                }`}
              >
                {isCurrentPlan ? 'Plan actual' : 'Contratar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  const historyContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Historial de Pagos</h2>
          <p className="text-sm text-gray-500">Consulta tus pagos anteriores y su estado.</p>
        </div>
        <button 
          onClick={loadBillingHistory}
          disabled={loadingHistory}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-emerald-500 transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loadingHistory ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] overflow-hidden shadow-sm">
        {loadingHistory && billingHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Cargando historial...</div>
        ) : billingHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCardIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No hay registros de facturación aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <th className="px-6 py-4">Concepto / Plan</th>
                  <th className="px-6 py-4">Periodo</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {billingHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.plan?.name || item.plan_name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">REF: {item.transaction_reference || 'S/N'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {item.billing_period ? PERIOD_LABELS[item.billing_period as BillingPeriod] : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900 dark:text-white">
                        {item.currency} {Number(item.amount).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_LABELS[item.status]?.color ?? ''}`}>
                        {STATUS_LABELS[item.status]?.label ?? item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {new Date(item.created_at || item.starts_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const tabs: Tab[] = [
    {
      id: 'active',
      label: 'Membresía Activa',
      icon: <SparklesIcon className="w-5 h-5" />,
      content: activeMembershipContent,
    },
    {
      id: 'upgrade',
      label: 'Aumentar Plan',
      icon: <ArrowPathIcon className="w-5 h-5" />,
      content: upgradePlanContent,
    },
    {
      id: 'history',
      label: 'Historial',
      icon: <ClockIcon className="w-5 h-5" />,
      content: historyContent,
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Suscripción</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestiona tu plan empresarial y facturación</p>
        </div>
      </div>

      <Tabs 
        tabs={tabs} 
        variant="pills" 
        className="mt-6"
        defaultTab="active"
      />

      {/* Modal confirmar cancelación */}
      {cancelConfirm && (
        <Modal
          isOpen={cancelConfirm}
          onClose={() => setCancelConfirm(false)}
          title="¿Cancelar suscripción?"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seguirás teniendo acceso hasta que venza tu período actual. Después de eso, tu cuenta se desactivará y no podrás acceder a tus datos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-600/20"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Pago Manual */}
      {selectedPlanToPay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <ManualPaymentForm 
              plan={selectedPlanToPay}
              amount={getPrice(selectedPlanToPay)}
              billingPeriod={billingPeriod}
              onCancel={() => setSelectedPlanToPay(null)}
              onSuccess={() => {
                setSelectedPlanToPay(null)
                loadBillingHistory()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
