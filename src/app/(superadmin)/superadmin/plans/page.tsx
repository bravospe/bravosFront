'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BanknotesIcon,
  PlusIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface PlanFull {
  id: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_semiannual: number
  price_yearly: number
  max_users: number | null
  max_products: number | null
  max_invoices_monthly: number | null
  has_pos: boolean
  has_invoicing: boolean
  has_inventory: boolean
  has_reports_advanced: boolean
  has_api_access: boolean
  has_multi_warehouse: boolean
  is_active: boolean
  is_recommended: boolean
  badge: string
  active_subscriptions_count?: number
}

export default function PlansManagementPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanFull[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/admin/plans')
      setPlans(data.data || [])
    } catch {
      toast.error('No se pudieron cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const duplicatePlan = async (plan: PlanFull) => {
    try {
      await api.post(`/admin/plans/${plan.id}/duplicate`)
      toast.success('Plan duplicado')
      fetchPlans()
    } catch {
      toast.error('Error al duplicar')
    }
  }

  const toggleStatus = async (plan: PlanFull) => {
    try {
      await api.post(`/admin/plans/${plan.id}/toggle-status`)
      toast.success(`Plan ${plan.is_active ? 'desactivado' : 'activado'}`)
      fetchPlans()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const totalActive = plans.filter(p => p.is_active).length
  const totalSubs = plans.reduce((a, p) => a + (p.active_subscriptions_count ?? 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planes y Membresías</h1>
          <p className="text-gray-500 dark:text-gray-400">Configura los paquetes de suscripción de Bravos.pe</p>
        </div>
        <button
          onClick={() => router.push('/superadmin/plans/new')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Crear Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total planes', value: plans.length, icon: BanknotesIcon, color: 'text-emerald-500' },
          { label: 'Planes activos', value: totalActive, icon: CheckCircleIcon, color: 'text-blue-500' },
          { label: 'Suscriptores activos', value: totalSubs, icon: UsersIcon, color: 'text-purple-500' },
          { label: 'Días de prueba gratis', value: '15', icon: ChartBarIcon, color: 'text-amber-500' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={clsx('p-6 relative overflow-visible transition-all', !plan.is_active && 'opacity-60')}
          >
            {plan.is_recommended && (
              <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                {plan.badge || 'Recomendado'}
              </div>
            )}
            {!plan.is_active && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Inactivo
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-[11px] text-gray-400 font-mono">{plan.slug}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 h-9 line-clamp-2 mb-4">{plan.description}</p>

            {/* Precios */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {[
                { label: 'Mensual', value: plan.price_monthly },
                { label: 'Semestral', value: plan.price_semiannual },
                { label: 'Anual', value: plan.price_yearly },
              ].map((p) => (
                <div key={p.label} className="bg-gray-50 dark:bg-[#161A22] rounded-lg p-2">
                  <p className="text-xs text-gray-400">{p.label}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">S/ {Number(p.value).toFixed(0)}</p>
                </div>
              ))}
            </div>

            {/* Límites chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { label: plan.max_users === null ? '∞ usuarios' : `${plan.max_users} usuarios`, icon: UsersIcon },
                { label: plan.max_products === null ? '∞ productos' : `${plan.max_products} productos`, icon: CubeIcon },
                { label: plan.max_invoices_monthly === null ? '∞ facturas' : `${plan.max_invoices_monthly}/mes`, icon: DocumentTextIcon },
              ].map((chip) => (
                <span key={chip.label} className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-[#232834] text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                  <chip.icon className="w-3 h-3" />
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-1 mb-5">
              {[
                { flag: plan.has_pos, label: 'POS' },
                { flag: plan.has_invoicing, label: 'Facturación' },
                { flag: plan.has_inventory, label: 'Inventario' },
                { flag: plan.has_reports_advanced, label: 'Reportes Adv.' },
                { flag: plan.has_api_access, label: 'API' },
                { flag: plan.has_multi_warehouse, label: 'Multi-almacén' },
              ].map(({ flag, label }) => (
                <span key={label} className={clsx(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  flag
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 line-through'
                )}>
                  {label}
                </span>
              ))}
            </div>

            {plan.active_subscriptions_count !== undefined && (
              <p className="text-xs text-gray-400 mb-3">{plan.active_subscriptions_count} suscriptores activos</p>
            )}

            <div className="flex gap-2 border-t border-gray-100 dark:border-[#232834] pt-4">
              <button
                onClick={() => router.push(`/superadmin/plans/${plan.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-2 rounded-xl transition-colors"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => duplicatePlan(plan)}
                className="px-3 text-xs font-medium text-gray-500 border border-gray-200 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#232834] py-2 rounded-xl transition-colors"
                title="Duplicar plan"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleStatus(plan)}
                className={clsx(
                  'flex-1 text-xs font-medium py-2 rounded-xl transition-colors border',
                  plan.is_active
                    ? 'text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                )}
              >
                {plan.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full p-16 text-center text-gray-400">
            No hay planes configurados.{' '}
            <button onClick={() => router.push('/superadmin/plans/new')} className="text-emerald-600 hover:underline font-medium">
              Crea el primer plan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
