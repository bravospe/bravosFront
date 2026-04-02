'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useSubscriptionStore, type PlanFull } from '@/stores/subscriptionStore'
import { toast } from 'react-hot-toast'

type BillingPeriod = 'monthly' | 'semiannual' | 'yearly'

export default function PlanPaywall() {
  const {
    subscription, availablePlans, plansLoading,
    fetchPlans, fetchSubscription, subscribe, isExpired, initialized,
  } = useSubscriptionStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Esperar a que se inicialice la suscripción
  if (!initialized) return null
  if (!isExpired()) return null

  // Mostrar spinner mientras carga los planes
  if (plansLoading && availablePlans.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-white text-sm">Cargando planes...</p>
        </div>
      </div>
    )
  }

  const getPrice = (plan: PlanFull) => {
    switch (billingPeriod) {
      case 'semiannual': return plan.price_semiannual
      case 'yearly':     return plan.price_yearly
      default:           return plan.price_monthly
    }
  }

  const getSavings = (plan: PlanFull) => {
    switch (billingPeriod) {
      case 'semiannual': return plan.semiannual_savings_percentage > 0 ? `Ahorra ${plan.semiannual_savings_percentage}%` : null
      case 'yearly':     return plan.yearly_savings_percentage > 0 ? `Ahorra ${plan.yearly_savings_percentage}%` : null
      default:           return null
    }
  }

  const handleSubscribe = async (plan: PlanFull) => {
    setLoading(plan.id)
    try {
      await subscribe(plan.id, billingPeriod)
      toast.success(`¡Plan ${plan.name} activado!`)
    } catch {
      toast.error('No se pudo procesar la suscripción. Contacta a soporte.')
    } finally {
      setLoading(null)
    }
  }

  const isTrialExpired = subscription?.status === 'expired' && !subscription.last_payment_at

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center border-b border-gray-100 dark:border-[#232834]">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isTrialExpired ? 'Tu período de prueba ha terminado' : 'Tu suscripción ha vencido'}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {isTrialExpired
              ? 'Espero que hayas disfrutado los 15 días gratis. Elige un plan para seguir usando Bravos.'
              : 'Renueva tu plan para seguir gestionando tu negocio sin interrupciones.'}
          </p>
        </div>

        {/* Billing period toggle */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="inline-flex items-center bg-gray-100 dark:bg-[#161A22] rounded-xl p-1 gap-1">
            {(['monthly', 'semiannual', 'yearly'] as BillingPeriod[]).map((period) => {
              const labels: Record<BillingPeriod, string> = {
                monthly: 'Mensual',
                semiannual: 'Semestral',
                yearly: 'Anual',
              }
              return (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingPeriod === period
                      ? 'bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {labels[period]}
                  {period !== 'monthly' && (
                    <span className="ml-1 text-xs text-emerald-600 font-semibold">
                      {period === 'semiannual' ? '-15%' : '-20%'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Plans grid */}
        <div className="px-8 pb-8 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.filter(p => p.is_active).map((plan) => {
            const price = getPrice(plan)
            const savings = getSavings(plan)
            const isRecommended = plan.is_recommended || plan.is_popular
            const isCurrentPlan = subscription?.plan_id === plan.id

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  isRecommended
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge ?? 'Recomendado'}
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4 line-clamp-2">{plan.description}</p>

                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    S/ {Number(price).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    /{billingPeriod === 'monthly' ? 'mes' : billingPeriod === 'semiannual' ? '6 meses' : 'año'}
                  </span>
                </div>
                {savings && (
                  <div className="text-xs text-emerald-600 font-semibold mb-4">{savings}</div>
                )}

                <ul className="space-y-2 mb-6 mt-4">
                  {(plan.features ?? []).slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                    isRecommended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
                  }`}
                >
                  {loading === plan.id
                    ? 'Procesando...'
                    : isCurrentPlan
                      ? 'Plan actual'
                      : 'Contratar ahora'}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          ¿Necesitas ayuda? Escríbenos a <span className="text-emerald-600">soporte@bravos.pe</span>
        </p>
      </div>
    </div>
  )
}
