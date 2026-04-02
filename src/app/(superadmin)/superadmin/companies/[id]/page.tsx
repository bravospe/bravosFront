'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArchiveBoxIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyUser {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  joined_at: string
}

interface SubscriptionRecord {
  id: string
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  billing_period?: string
  starts_at?: string
  ends_at?: string
  trial_ends_at?: string
  last_payment_at?: string
  days_remaining: number
  plan?: { id: string; name: string; slug: string }
}

interface CompanyDetail {
  id: string
  name: string
  trade_name?: string
  ruc: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  department?: string
  province?: string
  district?: string
  is_active: boolean
  created_at: string
  owner: { id: string; name: string; email: string }
  subscription?: SubscriptionRecord
  subscription_history: SubscriptionRecord[]
  users: CompanyUser[]
  virtual_store?: { id: string; slug: string; name: string; is_active: boolean }
  stats: {
    invoices_total: number
    invoices_this_month: number
    sales_total: number
    sales_this_month: number
    sales_revenue: number
    sales_revenue_month: number
    products_count: number
    clients_count: number
    suppliers_count: number
    warehouses_count: number
  }
}

interface Plan {
  id: string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabel: Record<string, string> = {
  trial: 'Prueba',
  active: 'Activo',
  expired: 'Vencido',
  cancelled: 'Cancelado',
}

const periodLabel: Record<string, string> = {
  monthly: 'Mensual',
  semiannual: 'Semestral',
  yearly: 'Anual',
}

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
  }
  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ company }: { company: CompanyDetail }) {
  const s = company.stats
  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Estadísticas de uso</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={DocumentTextIcon} label="Facturas totales" value={s.invoices_total} sub={`${s.invoices_this_month} este mes`} color="blue" />
          <StatCard icon={CurrencyDollarIcon} label="Ventas totales" value={s.sales_total} sub={`${s.sales_this_month} este mes`} color="emerald" />
          <StatCard icon={ChartBarIcon} label="Ingresos (mes)" value={`S/ ${s.sales_revenue_month.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`} sub={`S/ ${s.sales_revenue.toLocaleString('es-PE', { minimumFractionDigits: 0 })} total`} color="purple" />
          <StatCard icon={ArchiveBoxIcon} label="Productos" value={s.products_count} color="amber" />
          <StatCard icon={UsersIcon} label="Clientes" value={s.clients_count} color="rose" />
        </div>
      </div>

      {/* Company Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Información de la empresa</h3>
        <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] divide-y divide-gray-100 dark:divide-[#232834]">
          {[
            { label: 'RUC', value: company.ruc },
            { label: 'Nombre comercial', value: company.trade_name || '—' },
            { label: 'Dirección', value: company.address || '—' },
            { label: 'Teléfono', value: company.phone || '—' },
            { label: 'Email', value: company.email || '—' },
            { label: 'Departamento', value: [company.department, company.province, company.district].filter(Boolean).join(', ') || '—' },
            { label: 'Creada el', value: format(new Date(company.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center px-5 py-3">
              <span className="w-40 text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Store */}
      {company.virtual_store && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tienda virtual</h3>
          <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">{company.virtual_store.name}</p>
              <p className="text-sm text-gray-500">{company.virtual_store.slug}.bravos.pe</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${company.virtual_store.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {company.virtual_store.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab({ company, onRemoveUser }: { company: CompanyDetail; onRemoveUser: (userId: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{company.users.length} usuarios en esta empresa</p>
      </div>

      <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#232834] bg-gray-50/50 dark:bg-[#161A22]/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingresó</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#1A1F2E]">
            {company.users.map((user) => {
              const isOwner = user.id === company.owner.id
              return (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-[#161A22]/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium capitalize">
                      {isOwner ? 'Dueño' : (user.role || 'Usuario')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircleIcon className="w-4 h-4" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <XCircleIcon className="w-4 h-4" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {user.joined_at ? format(new Date(user.joined_at), 'dd/MM/yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!isOwner && (
                      <button
                        onClick={() => onRemoveUser(user.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar de la empresa"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Subscription ────────────────────────────────────────────────────────

function SubscriptionTab({ company, onReload }: { company: CompanyDetail; onReload: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [saving, setSaving] = useState(false)
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const [form, setForm] = useState({
    plan_id: company.subscription?.plan?.id || '',
    status: 'active',
    billing_period: 'monthly',
    starts_at: format(today, 'yyyy-MM-dd'),
    ends_at: format(nextMonth, 'yyyy-MM-dd'),
    notes: '',
  })

  useEffect(() => {
    api.get('/admin/plans').then(r => setPlans(r.data.data ?? r.data ?? [])).catch(() => {})
  }, [])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/admin/companies/${company.id}/subscription/assign`, form)
      toast.success('Membresía asignada correctamente')
      onReload()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al asignar membresía')
    } finally {
      setSaving(false)
    }
  }

  const sub = company.subscription

  return (
    <div className="space-y-6">
      {/* Current subscription */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Suscripción actual</h3>
        {sub ? (
          <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{sub.plan?.name ?? 'Sin plan'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColors[sub.status]}`}>
                    {statusLabel[sub.status]}
                  </span>
                  {sub.billing_period && (
                    <span className="text-xs text-gray-500">{periodLabel[sub.billing_period] ?? sub.billing_period}</span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                {sub.days_remaining > 0 ? (
                  <p className="text-2xl font-black text-emerald-600">{sub.days_remaining} <span className="text-sm font-normal text-gray-500">días</span></p>
                ) : (
                  <p className="text-sm text-red-500 font-semibold">Vencida</p>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Inicio', value: sub.starts_at ? format(new Date(sub.starts_at), 'dd/MM/yyyy') : (sub.trial_ends_at ? 'Trial' : '—') },
                { label: 'Vence', value: (sub.ends_at || sub.trial_ends_at) ? format(new Date(sub.ends_at || sub.trial_ends_at!), 'dd/MM/yyyy') : '—' },
                { label: 'Último pago', value: sub.last_payment_at ? format(new Date(sub.last_payment_at), 'dd/MM/yyyy') : '—' },
                { label: 'Estado', value: statusLabel[sub.status] },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-[#161A22] rounded-lg p-3">
                  <p className="text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-[#161A22] rounded-xl border border-dashed border-gray-200 dark:border-[#232834] p-8 text-center">
            <CreditCardIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Sin suscripción activa</p>
          </div>
        )}
      </div>

      {/* Assign subscription form */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Asignación manual</h3>
        <form onSubmit={handleAssign} className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Plan</label>
              <select
                value={form.plan_id}
                onChange={e => setForm({ ...form, plan_id: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Seleccionar plan...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="active">Activo (pagado)</option>
                <option value="trial">Trial (prueba)</option>
                <option value="expired">Vencido</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Período de facturación</label>
              <select
                value={form.billing_period}
                onChange={e => setForm({ ...form, billing_period: e.target.value })}
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="monthly">Mensual</option>
                <option value="semiannual">Semestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Fecha de inicio</label>
              <input
                type="date"
                value={form.starts_at}
                onChange={e => setForm({ ...form, starts_at: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500">Fecha de vencimiento</label>
              <input
                type="date"
                value={form.ends_at}
                onChange={e => setForm({ ...form, ends_at: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Asignar suscripción'}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Historial</h3>
        <div className="space-y-2">
          {company.subscription_history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin historial de suscripciones</p>
          ) : (
            company.subscription_history.map(h => (
              <div key={h.id} className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{h.plan?.name ?? 'Plan desconocido'}</p>
                    <p className="text-xs text-gray-500">
                      {h.starts_at ? format(new Date(h.starts_at), 'dd/MM/yy') : '?'} → {(h.ends_at || h.trial_ends_at) ? format(new Date(h.ends_at || h.trial_ends_at!), 'dd/MM/yy') : '?'}
                      {h.billing_period && ` · ${periodLabel[h.billing_period] ?? h.billing_period}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusColors[h.status]}`}>
                  {statusLabel[h.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'subscription'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', trade_name: '', ruc: '', address: '', phone: '', email: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const fetchCompany = async () => {
    try {
      const { data } = await api.get(`/admin/companies/${id}`)
      setCompany(data)
      setEditForm({
        name: data.name,
        trade_name: data.trade_name || '',
        ruc: data.ruc,
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        is_active: data.is_active,
      })
    } catch {
      toast.error('No se pudo cargar la empresa')
      router.push('/superadmin/companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompany() }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/admin/companies/${id}`, editForm)
      toast.success('Empresa actualizada')
      setEditing(false)
      fetchCompany()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      await api.post(`/admin/companies/${id}/toggle-status`)
      toast.success('Estado actualizado')
      fetchCompany()
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario de la empresa?')) return
    try {
      await api.delete(`/admin/companies/${id}/users/${userId}`)
      toast.success('Usuario eliminado de la empresa')
      fetchCompany()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!company) return null

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Resumen', icon: ChartBarIcon },
    { key: 'users', label: `Usuarios (${company.users.length})`, icon: UsersIcon },
    { key: 'subscription', label: 'Suscripción', icon: CreditCardIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/superadmin/companies')}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
              <BuildingOfficeIcon className="w-6 h-6" />
            </div>
            {editing ? (
              <form onSubmit={handleSave} className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-xl font-bold bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button type="submit" disabled={saving} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg font-semibold disabled:opacity-60">
                  {saving ? '...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-semibold">
                  Cancelar
                </button>
              </form>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                <p className="text-sm text-gray-500">RUC {company.ruc} · Dueño: {company.owner.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${company.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {company.is_active ? 'Activa' : 'Suspendida'}
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Editar empresa"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleToggleStatus}
            className={`p-2 rounded-lg transition-colors ${company.is_active ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
            title={company.is_active ? 'Suspender empresa' : 'Activar empresa'}
          >
            {company.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Edit form (expanded) */}
      {editing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834] p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Editar información</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Razón Social', type: 'text' },
              { key: 'trade_name', label: 'Nombre Comercial', type: 'text' },
              { key: 'ruc', label: 'RUC', type: 'text' },
              { key: 'phone', label: 'Teléfono', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'address', label: 'Dirección', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">{label}</label>
                <input
                  type={type}
                  value={(editForm as any)[key]}
                  onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={editForm.is_active}
              onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="edit_is_active" className="text-sm text-gray-700 dark:text-gray-300">Empresa activa</label>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Subscription quick-status bar */}
      {company.subscription && (
        <div className={`rounded-xl border px-5 py-3 flex items-center justify-between gap-4 ${
          company.subscription.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' :
          company.subscription.status === 'trial' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30' :
          'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
        }`}>
          <div className="flex items-center gap-3">
            <ClockIcon className={`w-5 h-5 shrink-0 ${company.subscription.status === 'active' ? 'text-emerald-600' : company.subscription.status === 'trial' ? 'text-blue-600' : 'text-red-500'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {company.subscription.plan?.name} · {statusLabel[company.subscription.status]}
              </p>
              <p className="text-xs text-gray-500">
                {company.subscription.days_remaining > 0 ? `${company.subscription.days_remaining} días restantes` : 'Vencida'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('subscription')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-[#232834] text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            Gestionar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab company={company} />}
        {activeTab === 'users' && <UsersTab company={company} onRemoveUser={handleRemoveUser} />}
        {activeTab === 'subscription' && <SubscriptionTab company={company} onReload={fetchCompany} />}
      </div>
    </div>
  )
}
