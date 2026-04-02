'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon, XMarkIcon, ArrowPathIcon, PencilIcon, TrashIcon,
  Squares2X2Icon, BoltIcon, ChatBubbleLeftIcon, ArrowsRightLeftIcon,
  CheckIcon, QueueListIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface Flow {
  id: string
  name: string
  trigger_type: string
  trigger_value: string
  priority: number
  is_active: boolean
  flow_data: FlowNode[]
}

interface FlowNode {
  id: string
  type: 'message' | 'options' | 'condition' | 'action'
  content?: string
  options?: { label: string; next?: string }[]
  condition?: string
  action?: string
}

const TRIGGER_TYPES: Record<string, string> = {
  keyword: 'Palabra clave',
  regex: 'Expresión regular',
  any: 'Cualquier mensaje',
  number: 'Número específico',
}

const NODE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  message: ChatBubbleLeftIcon,
  options: QueueListIcon,
  condition: ArrowsRightLeftIcon,
  action: BoltIcon,
}

const NODE_COLORS: Record<string, string> = {
  message: '#10B981',
  options: '#6366F1',
  condition: '#F59E0B',
  action: '#EC4899',
}

const EMPTY_FLOW: Partial<Flow> = {
  name: '', trigger_type: 'keyword', trigger_value: '', priority: 1,
  flow_data: [{ id: '1', type: 'message', content: 'Hola, ¿en qué te puedo ayudar?' }],
}

function Modal({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        {children}
      </div>
    </div>
  )
}

function NodeCard({ node, index, onChange, onDelete }: {
  node: FlowNode; index: number
  onChange: (n: FlowNode) => void
  onDelete: () => void
}) {
  const Icon = NODE_ICONS[node.type] ?? ChatBubbleLeftIcon
  const color = NODE_COLORS[node.type] ?? '#10B981'

  return (
    <div className="relative flex gap-3">
      {/* Connector line */}
      {index > 0 && <div className="absolute -top-4 left-5 w-px h-4 bg-gray-200 dark:bg-[#232834]" />}

      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-[#232834] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <select
            value={node.type}
            onChange={e => onChange({ ...node, type: e.target.value as FlowNode['type'] })}
            className="text-xs font-semibold bg-transparent text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="message">💬 Mensaje</option>
            <option value="options">📋 Opciones</option>
            <option value="condition">↔️ Condición</option>
            <option value="action">⚡ Acción</option>
          </select>
          <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {(node.type === 'message') && (
          <textarea
            rows={2}
            value={node.content ?? ''}
            onChange={e => onChange({ ...node, content: e.target.value })}
            placeholder="Texto del mensaje..."
            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-1 focus:ring-emerald-500"
          />
        )}
        {node.type === 'options' && (
          <div className="space-y-1.5">
            {(node.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">{oi + 1}</span>
                <input
                  value={opt.label}
                  onChange={e => {
                    const opts = [...(node.options ?? [])]
                    opts[oi] = { ...opts[oi], label: e.target.value }
                    onChange({ ...node, options: opts })
                  }}
                  placeholder={`Opción ${oi + 1}`}
                  className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-lg px-2.5 py-1 text-sm outline-none"
                />
                <button onClick={() => {
                  const opts = (node.options ?? []).filter((_, i) => i !== oi)
                  onChange({ ...node, options: opts })
                }} className="text-gray-400 hover:text-red-500"><XMarkIcon className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button
              onClick={() => onChange({ ...node, options: [...(node.options ?? []), { label: '' }] })}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
            >+ Agregar opción</button>
          </div>
        )}
        {(node.type === 'condition' || node.type === 'action') && (
          <input
            value={node.type === 'condition' ? node.condition ?? '' : node.action ?? ''}
            onChange={e => onChange({ ...node, [node.type === 'condition' ? 'condition' : 'action']: e.target.value })}
            placeholder={node.type === 'condition' ? 'ej: respuesta == "1"' : 'ej: asignar_agente'}
            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
          />
        )}
      </div>
    </div>
  )
}

function FlowForm({ initial, onSave, onClose }: {
  initial?: Partial<Flow>
  onSave: (data: Partial<Flow>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Flow>>({ ...EMPTY_FLOW, ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const addNode = () => {
    const nodes = [...(form.flow_data ?? [])]
    nodes.push({ id: String(Date.now()), type: 'message', content: '' })
    set('flow_data', nodes)
  }

  const updateNode = (i: number, n: FlowNode) => {
    const nodes = [...(form.flow_data ?? [])]
    nodes[i] = n
    set('flow_data', nodes)
  }

  const deleteNode = (i: number) => {
    const nodes = (form.flow_data ?? []).filter((_, idx) => idx !== i)
    set('flow_data', nodes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
        <h3 className="font-bold text-gray-900 dark:text-white">{initial?.name ? 'Editar flujo' : 'Nuevo flujo'}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre del flujo</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} required
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Trigger</label>
            <select value={form.trigger_type ?? 'keyword'} onChange={e => set('trigger_type', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none">
              {Object.entries(TRIGGER_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Valor del trigger</label>
            <input value={form.trigger_value ?? ''} onChange={e => set('trigger_value', e.target.value)}
              placeholder='ej: "hola", "ayuda"'
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Prioridad</label>
            <input type="number" min={1} max={100} value={form.priority ?? 1} onChange={e => set('priority', +e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
          </div>
        </div>

        {/* Flow nodes */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-3 block">Nodos del flujo</label>
          <div className="space-y-4">
            {(form.flow_data ?? []).map((node, i) => (
              <NodeCard key={node.id} node={node} index={i}
                onChange={n => updateNode(i, n)}
                onDelete={() => deleteNode(i)}
              />
            ))}
          </div>
          <button type="button" onClick={addNode}
            className="mt-3 flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
            <PlusIcon className="w-4 h-4" /> Agregar nodo
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
            Guardar flujo
          </button>
        </div>
      </form>
    </>
  )
}

export default function WhatsAppBotBuilderPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Flow | null>(null)

  const fetchFlows = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/whatsapp/flows')
      setFlows(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch { toast.error('Error al cargar flujos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchFlows() }, [fetchFlows])

  const handleSave = async (form: Partial<Flow>) => {
    try {
      if (editing) {
        await api.put(`/admin/whatsapp/flows/${editing.id}`, form)
        toast.success('Flujo actualizado')
      } else {
        await api.post('/admin/whatsapp/flows', form)
        toast.success('Flujo creado')
      }
      setShowForm(false); setEditing(null); fetchFlows()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al guardar') }
  }

  const handleToggle = async (flow: Flow) => {
    try {
      await api.post(`/admin/whatsapp/flows/${flow.id}/toggle`)
      setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, is_active: !f.is_active } : f))
    } catch { toast.error('Error al cambiar estado') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este flujo?')) return
    try {
      await api.delete(`/admin/whatsapp/flows/${id}`)
      toast.success('Flujo eliminado')
      setFlows(prev => prev.filter(f => f.id !== id))
    } catch { toast.error('Error al eliminar') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bot Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Flujos de respuesta automática por trigger</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo flujo
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-[#1A1F2E] rounded-2xl" />)}
        </div>
      ) : flows.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-16 text-center">
          <Squares2X2Icon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay flujos configurados</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
            Crear primer flujo
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(flow => {
            const nodeCount = Array.isArray(flow.flow_data) ? flow.flow_data.length : 0
            return (
              <div key={flow.id} className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{flow.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                        {TRIGGER_TYPES[flow.trigger_type] ?? flow.trigger_type}
                      </span>
                      {flow.trigger_value && (
                        <span className="text-xs text-gray-400 font-mono truncate">"{flow.trigger_value}"</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(flow)}
                    className={`relative w-10 h-5 rounded-full shrink-0 transition-colors duration-200 ${flow.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${flow.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Node preview */}
                <div className="space-y-1.5">
                  {(Array.isArray(flow.flow_data) ? flow.flow_data : []).slice(0, 3).map((node, i) => {
                    const Icon = NODE_ICONS[node.type] ?? ChatBubbleLeftIcon
                    const col = NODE_COLORS[node.type] ?? '#10B981'
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: col }} />
                        <span className="truncate">{node.content ?? node.condition ?? node.action ?? `${node.options?.length ?? 0} opciones`}</span>
                      </div>
                    )
                  })}
                  {nodeCount > 3 && <p className="text-xs text-gray-400">+{nodeCount - 3} nodos más</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#1A1F2E]">
                  <span className="text-xs text-gray-400">Prioridad: {flow.priority}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(flow); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-emerald-500 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(flow.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-red-500 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditing(null) }} wide>
          <FlowForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null) }}
          />
        </Modal>
      )}
    </div>
  )
}
