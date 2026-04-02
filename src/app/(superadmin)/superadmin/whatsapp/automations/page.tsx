'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon, BoltIcon, ArrowPathIcon, PencilIcon, TrashIcon,
  ListBulletIcon, PlayIcon, XMarkIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface Automation {
  id: string
  name: string
  trigger_event: string
  message_template: string
  recipient_type: string
  delay_minutes: number
  send_window_start: string
  send_window_end: string
  max_sends_per_day: number
  total_sent: number
  total_failed: number
  is_active: boolean
}

interface AutomationLog {
  id: string
  status: 'success' | 'failed'
  message: string
  created_at: string
}

const TRIGGER_LABELS: Record<string, string> = {
  // Trial
  'trial.day_1':    'Trial — Día 1',
  'trial.day_3':    'Trial — Día 3',
  'trial.day_5':    'Trial — Día 5',
  'trial.day_7':    'Trial — Día 7',
  'trial.expired':  'Trial — Expirado',
  // Límites
  'limit.invoices_80': 'Límite — 80% facturas',
  'limit.products_80': 'Límite — 80% productos',
  'limit.sales_80':    'Límite — 80% ventas',
  // Leads
  'lead.followup_24h': 'Lead — Seguimiento 24h',
  // Operaciones
  'low_stock.alert':             'Stock bajo',
  'invoice.client_notification': 'Factura aceptada',
  'sale.completed':              'Venta completada',
  // Resúmenes
  'summary.daily':   'Resumen diario',
  'summary.weekly':  'Resumen semanal',
  // Genéricos
  new_contact:  'Nuevo contacto',
  inactivity:   'Inactividad',
  birthday:     'Cumpleaños',
  manual:       'Manual',
  keyword:      'Palabra clave',
}

interface TabDef {
  id: string
  label: string
  emoji: string
  match: (trigger: string) => boolean
}

const TABS: TabDef[] = [
  { id: 'all',       label: 'Todas',           emoji: '⚡', match: () => true },
  { id: 'trial',     label: 'Trial',            emoji: '🧪', match: t => t.startsWith('trial.') },
  { id: 'limits',    label: 'Límites de Plan',  emoji: '📊', match: t => t.startsWith('limit.') },
  { id: 'leads',     label: 'Leads',            emoji: '🎯', match: t => t.startsWith('lead.') },
  { id: 'ops',       label: 'Operaciones',      emoji: '🏪', match: t => ['low_stock.alert','invoice.client_notification','sale.completed','invoice.created'].includes(t) },
  { id: 'summaries', label: 'Resúmenes',        emoji: '📅', match: t => t.startsWith('summary.') },
  { id: 'custom',    label: 'Personalizadas',   emoji: '⚙️', match: t => !['trial.','limit.','lead.','summary.'].some(p => t.startsWith(p)) && !['low_stock.alert','invoice.client_notification','sale.completed','invoice.created'].includes(t) },
]

const EMPTY_FORM = {
  name: '', trigger_event: 'new_contact', message_template: '',
  recipient_type: 'company_owner', delay_minutes: 0,
  send_window_start: '08:00', send_window_end: '20:00', max_sends_per_day: 10,
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function AutomationForm({ initial, onSave, onClose }: {
  initial?: Partial<typeof EMPTY_FORM>
  onSave: (data: typeof EMPTY_FORM) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
        <h3 className="font-bold text-gray-900 dark:text-white">{initial?.name ? 'Editar automatización' : 'Nueva automatización'}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Trigger</label>
            <select value={form.trigger_event} onChange={e => set('trigger_event', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none">
              <optgroup label="Trial">
                {['trial.day_1','trial.day_3','trial.day_5','trial.day_7','trial.expired'].map(v => (
                  <option key={v} value={v}>{TRIGGER_LABELS[v]}</option>
                ))}
              </optgroup>
              <optgroup label="Límites">
                {['limit.invoices_80','limit.products_80','limit.sales_80'].map(v => (
                  <option key={v} value={v}>{TRIGGER_LABELS[v]}</option>
                ))}
              </optgroup>
              <optgroup label="Leads">
                <option value="lead.followup_24h">{TRIGGER_LABELS['lead.followup_24h']}</option>
              </optgroup>
              <optgroup label="Operaciones">
                {['low_stock.alert','invoice.client_notification','sale.completed'].map(v => (
                  <option key={v} value={v}>{TRIGGER_LABELS[v]}</option>
                ))}
              </optgroup>
              <optgroup label="Resúmenes">
                {['summary.daily','summary.weekly'].map(v => (
                  <option key={v} value={v}>{TRIGGER_LABELS[v]}</option>
                ))}
              </optgroup>
              <optgroup label="Personalizados">
                {['new_contact','inactivity','birthday','manual','keyword'].map(v => (
                  <option key={v} value={v}>{TRIGGER_LABELS[v]}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Destinatario</label>
            <select value={form.recipient_type} onChange={e => set('recipient_type', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none">
              <option value="company_owner">Dueño empresa</option>
              <option value="client">Cliente</option>
              <option value="custom_jid">JID personalizado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Plantilla de mensaje</label>
          <textarea rows={4} value={form.message_template} onChange={e => set('message_template', e.target.value)} required
            placeholder="Hola {{nombre}}, gracias por contactarnos..."
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          <p className="text-[10px] text-gray-400 mt-1">Variables: {'{{nombre}}'}, {'{{empresa}}'}, {'{{fecha}}'}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Delay (min)</label>
            <input type="number" min={0} value={form.delay_minutes} onChange={e => set('delay_minutes', +e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Desde</label>
            <input type="time" value={form.send_window_start} onChange={e => set('send_window_start', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Hasta</label>
            <input type="time" value={form.send_window_end} onChange={e => set('send_window_end', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Máx. envíos por día</label>
          <input type="number" min={1} max={1000} value={form.max_sends_per_day} onChange={e => set('max_sends_per_day', +e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </>
  )
}

function LogsModal({ automation, onClose }: { automation: Automation; onClose: () => void }) {
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/admin/whatsapp/automations/${automation.id}/logs`)
      .then(r => setLogs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [automation.id])

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
        <h3 className="font-bold text-gray-900 dark:text-white">Logs — {automation.name}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-[#232834] rounded-xl" />)}</div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin ejecuciones registradas aún</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/30">
                {log.status === 'success'
                  ? <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  : <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{log.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString('es-PE')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function AutomationCard({
  auto,
  onToggle,
  onTest,
  onLogs,
  onEdit,
  onDelete,
}: {
  auto: Automation
  onToggle: () => void
  onTest: () => void
  onLogs: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className={`w-2 h-2 rounded-full shrink-0 self-start mt-1.5 sm:self-auto sm:mt-0 ${auto.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 dark:text-white">{auto.name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
            {TRIGGER_LABELS[auto.trigger_event] ?? auto.trigger_event}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            Delay: {auto.delay_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
            {auto.total_sent} enviados
          </span>
          {auto.total_failed > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              {auto.total_failed} fallidos
            </span>
          )}
          <span>{auto.send_window_start} – {auto.send_window_end}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggle}
          title={auto.is_active ? 'Desactivar' : 'Activar'}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${auto.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${auto.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>

        <button onClick={onTest} title="Probar" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-500 hover:text-indigo-600 transition-colors">
          <PlayIcon className="w-4 h-4" />
        </button>
        <button onClick={onLogs} title="Ver logs" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-500 hover:text-blue-600 transition-colors">
          <ListBulletIcon className="w-4 h-4" />
        </button>
        <button onClick={onEdit} title="Editar" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-500 hover:text-emerald-600 transition-colors">
          <PencilIcon className="w-4 h-4" />
        </button>
        <button onClick={onDelete} title="Eliminar" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-500 hover:text-red-600 transition-colors">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function WhatsAppAutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Automation | null>(null)
  const [logsFor, setLogsFor] = useState<Automation | null>(null)

  const fetchAutomations = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/whatsapp/automations')
      setAutomations(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch { toast.error('Error al cargar automatizaciones') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAutomations() }, [fetchAutomations])

  const handleSave = async (form: any) => {
    try {
      if (editing) {
        await api.put(`/admin/whatsapp/automations/${editing.id}`, form)
        toast.success('Automatización actualizada')
      } else {
        await api.post('/admin/whatsapp/automations', form)
        toast.success('Automatización creada')
      }
      setShowForm(false); setEditing(null); fetchAutomations()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al guardar') }
  }

  const handleToggle = async (a: Automation) => {
    try {
      await api.post(`/admin/whatsapp/automations/${a.id}/toggle`)
      setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta automatización?')) return
    try {
      await api.delete(`/admin/whatsapp/automations/${id}`)
      toast.success('Eliminada')
      setAutomations(prev => prev.filter(a => a.id !== id))
    } catch { toast.error('Error al eliminar') }
  }

  const handleTest = async (id: string) => {
    const jid = window.prompt('Ingresa el número de WhatsApp para la prueba (ej: 51987654321):');
    if (!jid) return;

    // Asegurar formato JID
    const formattedJid = jid.includes('@') ? jid : `${jid.replace('+', '')}@s.whatsapp.net`;

    try {
      await api.post(`/admin/whatsapp/automations/${id}/test`, { test_jid: formattedJid });
      toast.success('Prueba enviada a ' + jid);
    } catch { 
      toast.error('Error al probar automatización');
    }
  }

  const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0]
  const filtered = automations.filter(a => currentTab.match(a.trigger_event))

  // Badge counts per tab
  const tabCounts = Object.fromEntries(
    TABS.map(t => [t.id, t.id === 'all' ? automations.length : automations.filter(a => t.match(a.trigger_event)).length])
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automatizaciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Mensajes automáticos por trigger de eventos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva automatización
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-[#232834] pb-0">
        {TABS.map(tab => {
          const count = tabCounts[tab.id] ?? 0
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-[#232834] text-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-[#1A1F2E] rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-16 text-center">
          <BoltIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'all' ? 'No hay automatizaciones configuradas' : `No hay automatizaciones en "${currentTab.label}"`}
          </p>
          {activeTab === 'all' && (
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
              Crear primera automatización
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(auto => (
            <AutomationCard
              key={auto.id}
              auto={auto}
              onToggle={() => handleToggle(auto)}
              onTest={() => handleTest(auto.id)}
              onLogs={() => setLogsFor(auto)}
              onEdit={() => { setEditing(auto); setShowForm(true) }}
              onDelete={() => handleDelete(auto.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditing(null) }}>
          <AutomationForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null) }}
          />
        </Modal>
      )}

      {logsFor && (
        <Modal onClose={() => setLogsFor(null)}>
          <LogsModal automation={logsFor} onClose={() => setLogsFor(null)} />
        </Modal>
      )}
    </div>
  )
}
