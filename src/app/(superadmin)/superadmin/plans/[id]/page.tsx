'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface PlanFull {
  id?: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_semiannual: number
  price_yearly: number
  currency: string
  trial_days: number
  max_users: number | null
  max_products: number | null
  max_invoices_monthly: number | null
  max_sales_monthly: number | null
  max_clients: number | null
  max_suppliers: number | null
  max_warehouses: number | null
  max_branches: number | null
  max_pos_sessions: number | null
  max_cash_registers: number | null
  storage_limit_mb: number | null
  has_pos: boolean
  has_invoicing: boolean
  has_inventory: boolean
  has_clients: boolean
  has_suppliers: boolean
  has_quotes: boolean
  has_credit_notes: boolean
  has_dispatch_guides: boolean
  has_product_variants: boolean
  has_multi_warehouse: boolean
  has_multi_branch: boolean
  has_reports_advanced: boolean
  has_api_access: boolean
  has_barcode_scanner: boolean
  has_email_support: boolean
  has_priority_support: boolean
  has_whatsapp_integration: boolean
  has_custom_branding: boolean
  is_active: boolean
  is_popular: boolean
  is_recommended: boolean
  badge: string
  badge_color: string
  sort_order: number
}

const DEFAULT: PlanFull = {
  name: '', slug: '', description: '',
  price_monthly: 0, price_semiannual: 0, price_yearly: 0,
  currency: 'PEN', trial_days: 15,
  max_users: 1, max_products: 100, max_invoices_monthly: 50,
  max_sales_monthly: 100, max_clients: 50, max_suppliers: null,
  max_warehouses: 1, max_branches: 1, max_pos_sessions: 1, max_cash_registers: 1, storage_limit_mb: 100,
  has_pos: false, has_invoicing: false, has_inventory: false, has_clients: true,
  has_suppliers: false, has_quotes: false, has_credit_notes: false,
  has_dispatch_guides: false, has_product_variants: false, has_multi_warehouse: false,
  has_multi_branch: false, has_reports_advanced: false, has_api_access: false,
  has_barcode_scanner: false, has_email_support: true, has_priority_support: false,
  has_whatsapp_integration: false, has_custom_branding: false,
  is_active: true, is_popular: false, is_recommended: false,
  badge: '', badge_color: '#10b981', sort_order: 99,
}

// ── Componentes de campo ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 mt-0">{children}</h2>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, min, step, mono }: {
  value: string | number; onChange: (v: any) => void
  type?: string; placeholder?: string; min?: number; step?: string; mono?: boolean
}) {
  return (
    <input
      type={type}
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#232834] rounded-xl',
        'bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500',
        mono && 'font-mono'
      )}
    />
  )
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#232834] rounded-xl bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
    />
  )
}

function Toggle({ label, description, value, onChange, linked }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void; linked?: string
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={clsx(
        'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
        value
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/15'
          : 'border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] hover:border-gray-300 dark:hover:border-[#2e3545]'
      )}
    >
      <div>
        <p className={clsx('text-sm font-medium', value ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300')}>
          {label}
        </p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        {linked && <p className={clsx('text-[10px] mt-0.5 font-medium', value ? 'text-emerald-500' : 'text-gray-400')}>→ {linked}</p>}
      </div>
      <div className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        value ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
      )}>
        <span className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-6' : 'translate-x-1'
        )} />
      </div>
    </div>
  )
}

function LimitField({ label, description, value, onChange, linked }: {
  label: string; description?: string; value: number | null; onChange: (v: number | null) => void; linked?: string
}) {
  const unlimited = value === null
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          {linked && <p className="text-[10px] text-blue-400 mt-0.5 font-medium">→ {linked}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(unlimited ? 1 : null)}
          className={clsx(
            'shrink-0 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ml-3',
            unlimited
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-[#232834] text-gray-500 hover:bg-gray-200'
          )}
        >
          {unlimited ? '∞ Ilimitado' : 'Con límite'}
        </button>
      </div>
      {!unlimited && (
        <input
          type="number"
          min={0}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#232834] rounded-lg bg-gray-50 dark:bg-[#161A22] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Ej: 100"
        />
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function PlanEditorPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === 'new'

  const [plan, setPlan] = useState<PlanFull>(DEFAULT)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/plans/${params.id}`)
        .then(({ data }) => { setPlan(data.data); setLoading(false) })
        .catch(() => { toast.error('No se pudo cargar el plan'); router.push('/superadmin/plans') })
    }
  }, [params.id])

  const set = (key: keyof PlanFull, value: any) =>
    setPlan((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    if (!plan.name) return toast.error('El nombre es obligatorio')
    setSaving(true)
    try {
      if (isNew) {
        await api.post('/admin/plans', plan)
        toast.success('Plan creado exitosamente')
      } else {
        await api.put(`/admin/plans/${plan.id}`, plan)
        toast.success('Plan guardado exitosamente')
      }
      router.push('/superadmin/plans')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Calcular ahorros en tiempo real
  const semiPct = plan.price_monthly > 0 && plan.price_semiannual > 0
    ? Math.round(((plan.price_monthly * 6 - plan.price_semiannual) / (plan.price_monthly * 6)) * 100)
    : 0
  const yearPct = plan.price_monthly > 0 && plan.price_yearly > 0
    ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  )

  return (
    <div className="max-w-6xl">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-[#F1F3F6] dark:bg-[#080B12] pb-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/superadmin/plans')}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-[#161A22] transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isNew ? 'Crear nuevo plan' : `Editando: ${plan.name}`}
              </h1>
              {plan.slug && <p className="text-xs text-gray-400 font-mono">/plans/{plan.slug}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/superadmin/plans')}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#232834] rounded-xl hover:bg-white dark:hover:bg-[#161A22] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {saving ? 'Guardando...' : isNew ? 'Crear plan' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid de 3 columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Columna 1: Información + Precios ── */}
        <div className="space-y-6">

          {/* Información general */}
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6 space-y-4">
            <SectionTitle>Información general</SectionTitle>
            <Field label="Nombre del plan *">
              <Input value={plan.name} onChange={(v) => set('name', v)} placeholder="Ej: Básico" />
            </Field>
            <Field label="Slug (URL)" hint="Se genera automáticamente si lo dejas vacío">
              <Input value={plan.slug} onChange={(v) => set('slug', v)} placeholder="basico" mono />
            </Field>
            <Field label="Descripción">
              <Textarea value={plan.description} onChange={(v) => set('description', v)} placeholder="¿Qué incluye este plan?" rows={3} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Badge (etiqueta)">
                <Input value={plan.badge} onChange={(v) => set('badge', v)} placeholder="Más popular" />
              </Field>
              <Field label="Días de prueba gratis">
                <Input type="number" value={plan.trial_days} onChange={(v) => set('trial_days', v)} min={0} />
              </Field>
            </div>
            <Field label="Orden de visualización" hint="Menor número = aparece primero">
              <Input type="number" value={plan.sort_order} onChange={(v) => set('sort_order', v)} min={0} />
            </Field>
            <div className="flex gap-6 pt-1">
              {([
                { key: 'is_active', label: 'Activo' },
                { key: 'is_popular', label: 'Popular' },
                { key: 'is_recommended', label: 'Recomendado' },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={(plan as any)[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6 space-y-4">
            <SectionTitle>Precios</SectionTitle>

            <Field label="Precio Mensual">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 w-7">S/</span>
                <Input type="number" value={plan.price_monthly} onChange={(v) => set('price_monthly', v)} min={0} step="0.01" placeholder="0.00" />
                <span className="text-xs text-gray-400 whitespace-nowrap">/mes</span>
              </div>
            </Field>

            <Field label="Precio Semestral">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 w-7">S/</span>
                <Input type="number" value={plan.price_semiannual} onChange={(v) => set('price_semiannual', v)} min={0} step="0.01" placeholder="0.00" />
                <span className="text-xs text-gray-400 whitespace-nowrap">/6 meses</span>
              </div>
              {semiPct > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mt-1.5 ml-9">Ahorro del {semiPct}% vs mensual</p>
              )}
            </Field>

            <Field label="Precio Anual">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 w-7">S/</span>
                <Input type="number" value={plan.price_yearly} onChange={(v) => set('price_yearly', v)} min={0} step="0.01" placeholder="0.00" />
                <span className="text-xs text-gray-400 whitespace-nowrap">/año</span>
              </div>
              {yearPct > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mt-1.5 ml-9">Ahorro del {yearPct}% vs mensual</p>
              )}
            </Field>
          </div>
        </div>

        {/* ── Columna 2: Límites de recursos ── */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6">
            <SectionTitle>Límites de recursos</SectionTitle>
            <p className="text-xs text-gray-400 mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              Cada límite está vinculado a su contraparte en el dashboard. Al llegar al límite, el botón correspondiente se bloquea.
            </p>
            <div className="space-y-3">
              <LimitField
                label="Usuarios"
                description="Acceso a la empresa"
                value={plan.max_users}
                onChange={(v) => set('max_users', v)}
                linked="Usuarios → botón invitar"
              />
              <LimitField
                label="Productos"
                description="Total en catálogo"
                value={plan.max_products}
                onChange={(v) => set('max_products', v)}
                linked="Productos → botón nuevo"
              />
              <LimitField
                label="Facturas por mes"
                description="Documentos electrónicos SUNAT"
                value={plan.max_invoices_monthly}
                onChange={(v) => set('max_invoices_monthly', v)}
                linked="Facturación → bloqueo al límite"
              />
              <LimitField
                label="Ventas por mes"
                description="Transacciones POS y ventas"
                value={plan.max_sales_monthly}
                onChange={(v) => set('max_sales_monthly', v)}
                linked="POS / Ventas → bloqueo al límite"
              />
              <LimitField
                label="Clientes"
                description="Clientes registrados"
                value={plan.max_clients}
                onChange={(v) => set('max_clients', v)}
                linked="Clientes → botón nuevo"
              />
              <LimitField
                label="Proveedores"
                description="Proveedores registrados"
                value={plan.max_suppliers}
                onChange={(v) => set('max_suppliers', v)}
                linked="Proveedores → botón nuevo"
              />
              <LimitField
                label="Almacenes"
                description="Almacenes activos"
                value={plan.max_warehouses}
                onChange={(v) => set('max_warehouses', v)}
                linked="Inventario → almacenes"
              />
              <LimitField
                label="Sucursales"
                description="Sucursales de la empresa"
                value={plan.max_branches}
                onChange={(v) => set('max_branches', v)}
                linked="Config → sucursales"
              />
              <LimitField
                label="Sesiones POS"
                description="Cajas abiertas simultáneas"
                value={plan.max_pos_sessions}
                onChange={(v) => set('max_pos_sessions', v)}
                linked="POS → apertura de caja"
              />
              <LimitField
                label="Cajas Registradoras"
                description="Dispositivos de caja permitidos"
                value={plan.max_cash_registers}
                onChange={(v) => set('max_cash_registers', v)}
                linked="Settings → Cajas"
              />
              <LimitField
                label="Almacenamiento (MB)"
                description="Archivos y documentos"
                value={plan.storage_limit_mb}
                onChange={(v) => set('storage_limit_mb', v)}
                linked="Upload de archivos"
              />
            </div>
          </div>
        </div>

        {/* ── Columna 3: Módulos y Features ── */}
        <div className="space-y-6">

          {/* Módulos principales */}
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6">
            <SectionTitle>Módulos principales</SectionTitle>
            <p className="text-xs text-gray-400 mb-4">Controlan qué secciones del dashboard son visibles.</p>
            <div className="space-y-2">
              <Toggle label="Punto de Venta (POS)" description="Sistema de caja y ventas rápidas" value={plan.has_pos} onChange={(v) => set('has_pos', v)} linked="Menú POS" />
              <Toggle label="Facturación Electrónica" description="Emisión de facturas SUNAT" value={plan.has_invoicing} onChange={(v) => set('has_invoicing', v)} linked="Menú Facturación" />
              <Toggle label="Control de Inventario" description="Stock, kardex, almacenes" value={plan.has_inventory} onChange={(v) => set('has_inventory', v)} linked="Menú Inventario" />
              <Toggle label="Gestión de Clientes" value={plan.has_clients} onChange={(v) => set('has_clients', v)} linked="Menú Clientes" />
              <Toggle label="Gestión de Proveedores" value={plan.has_suppliers} onChange={(v) => set('has_suppliers', v)} linked="Menú Proveedores" />
              <Toggle label="Cotizaciones" value={plan.has_quotes} onChange={(v) => set('has_quotes', v)} linked="Menú Cotizaciones" />
              <Toggle label="Reportes Avanzados" description="Análisis y exportaciones" value={plan.has_reports_advanced} onChange={(v) => set('has_reports_advanced', v)} linked="Reportes → sección avanzada" />
              <Toggle label="Acceso API" description="Token REST para integraciones" value={plan.has_api_access} onChange={(v) => set('has_api_access', v)} linked="Config → API" />
            </div>
          </div>

          {/* Features adicionales */}
          <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-[#232834] p-6">
            <SectionTitle>Features adicionales</SectionTitle>
            <div className="space-y-2">
              <Toggle label="Notas de Crédito y Débito" value={plan.has_credit_notes} onChange={(v) => set('has_credit_notes', v)} linked="Facturación → notas" />
              <Toggle label="Guías de Remisión" value={plan.has_dispatch_guides} onChange={(v) => set('has_dispatch_guides', v)} linked="Facturación → guías" />
              <Toggle label="Variantes de Productos" description="Tallas, colores, etc." value={plan.has_product_variants} onChange={(v) => set('has_product_variants', v)} linked="Productos → variantes" />
              <Toggle label="Multi-almacén" description="Más de 1 almacén activo" value={plan.has_multi_warehouse} onChange={(v) => set('has_multi_warehouse', v)} linked="Inventario → almacenes" />
              <Toggle label="Multi-sucursal" description="Más de 1 sucursal activa" value={plan.has_multi_branch} onChange={(v) => set('has_multi_branch', v)} linked="Config → sucursales" />
              <Toggle label="Escáner de código de barras" value={plan.has_barcode_scanner} onChange={(v) => set('has_barcode_scanner', v)} linked="POS → escáner" />
              <Toggle label="Integración WhatsApp" description="Notificaciones y alertas" value={plan.has_whatsapp_integration} onChange={(v) => set('has_whatsapp_integration', v)} linked="WhatsApp" />
<Toggle label="Marca Personalizada" description="Logo en documentos emitidos" value={plan.has_custom_branding} onChange={(v) => set('has_custom_branding', v)} linked="Config → apariencia" />
              <Toggle label="Soporte por Email" value={plan.has_email_support} onChange={(v) => set('has_email_support', v)} />
              <Toggle label="Soporte Prioritario" description="Atención preferencial y por WA" value={plan.has_priority_support} onChange={(v) => set('has_priority_support', v)} />
            </div>
          </div>
        </div>

      </div>

      {/* Botón guardar al final en móvil */}
      <div className="mt-6 flex justify-end gap-3 xl:hidden">
        <button
          onClick={() => router.push('/superadmin/plans')}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 dark:border-[#232834] rounded-xl hover:bg-white dark:hover:bg-[#161A22]"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
        >
          <CheckCircleIcon className="w-4 h-4" />
          {saving ? 'Guardando...' : isNew ? 'Crear plan' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
