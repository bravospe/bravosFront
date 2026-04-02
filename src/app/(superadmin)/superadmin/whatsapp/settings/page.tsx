'use client'

import { useState, useEffect } from 'react'
import {
  Cog6ToothIcon, ChatBubbleBottomCenterTextIcon, NoSymbolIcon,
  BookOpenIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon,
  ArrowPathIcon, CheckIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

type Tab = 'general' | 'quick_replies' | 'blocked' | 'knowledge'

interface QuickReply { id: string; title: string; body: string }
interface BlockedNumber { id: string; phone_number: string; reason: string }
interface KBArticle { id: string; title: string; content: string; is_active: boolean }

const TABS: { key: Tab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'general', label: 'General', icon: Cog6ToothIcon },
  { key: 'quick_replies', label: 'Respuestas rápidas', icon: ChatBubbleBottomCenterTextIcon },
  { key: 'blocked', label: 'Números bloqueados', icon: NoSymbolIcon },
  { key: 'knowledge', label: 'Base de conocimiento', icon: BookOpenIcon },
]

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

/* ─── Model Test Panel ───────────────────────────────── */
interface ModelTestResult {
  id: string; label: string; tier: 'paid' | 'free'
  status: 'idle' | 'testing' | 'ok' | 'error'
  ms?: number; response?: string; error?: string
}

const MODELS_LIST: Omit<ModelTestResult, 'status'>[] = [
  { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash',       tier: 'paid' },
  { id: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro',         tier: 'paid' },
  { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash Lite',  tier: 'paid' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite Latest', tier: 'free' },
  { id: 'gemini-flash-latest',    label: 'Gemini Flash Latest',     tier: 'free' },
]

function ModelTestPanel() {
  const [models, setModels] = useState<ModelTestResult[]>(
    MODELS_LIST.map(m => ({ ...m, status: 'idle' }))
  )
  const [running, setRunning] = useState(false)

  const runTest = async () => {
    setRunning(true)
    setModels(MODELS_LIST.map(m => ({ ...m, status: 'testing' })))
    try {
      const { data } = await api.get('/admin/whatsapp/settings/test-models')
      setModels(data.map((r: ModelTestResult) => ({ ...r, status: r.status })))
    } catch {
      setModels(MODELS_LIST.map(m => ({ ...m, status: 'error', error: 'Error de conexión' })))
    } finally {
      setRunning(false)
    }
  }

  const statusIcon = (s: ModelTestResult['status']) => {
    if (s === 'idle')    return <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
    if (s === 'testing') return <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse" />
    if (s === 'ok')      return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
    return                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
  }

  return (
    <div className="border border-gray-100 dark:border-[#232834] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Estado de modelos disponibles</p>
          <p className="text-xs text-gray-500">Prueba en vivo con la API key configurada</p>
        </div>
        <button type="button" onClick={runTest} disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
          <ArrowPathIcon className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Probando…' : 'Probar todos'}
        </button>
      </div>

      <div className="space-y-1.5">
        {models.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-black/30 rounded-lg">
            {statusIcon(m.status)}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{m.label}</span>
              {m.status === 'ok' && (
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ {m.ms}ms — &quot;{m.response}&quot;
                </span>
              )}
              {m.status === 'error' && (
                <span className="ml-2 text-xs text-red-500 truncate">{m.error}</span>
              )}
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
              m.tier === 'paid'
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              {m.tier === 'paid' ? 'pago' : 'gratis'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── General Settings ──────────────────────────────── */
function GeneralSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    api.get('/admin/whatsapp/settings')
      .then(r => setSettings(r.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/admin/whatsapp/settings', { settings })
      toast.success('Configuración guardada')
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }))

  if (loading) return <div className="h-64 animate-pulse bg-gray-100 dark:bg-[#1A1F2E] rounded-2xl" />

  return (
    <form onSubmit={handleSave} className="space-y-5 bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-6">
      <h2 className="font-bold text-gray-900 dark:text-white">Conexión Meta / WhatsApp Business</h2>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number ID</label>
        <input
          value={settings.phone_number_id ?? ''}
          onChange={e => set('phone_number_id', e.target.value)}
          placeholder="992287483972175"
          className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Access Token de Meta</label>
        <div className="flex gap-2">
          <input
            type={showToken ? 'text' : 'password'}
            value={settings.access_token ?? ''}
            onChange={e => set('access_token', e.target.value)}
            placeholder="EAA..."
            className="flex-1 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
          <button type="button" onClick={() => setShowToken(s => !s)}
            className="p-2.5 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            {showToken ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-[#232834] pt-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Configuración de IA</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Modelo de IA</label>
            <select value={settings.ai_model ?? 'gemini-2.5-flash'} onChange={e => set('ai_model', e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none">
              <optgroup label="⚡ Gemini 2.5 — Recomendados">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash — Rápido y potente ✅</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro — Máxima inteligencia</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite — Económico</option>
              </optgroup>
              <optgroup label="🆓 Free Tier">
                <option value="gemini-flash-lite-latest">Gemini Flash Lite Latest — Gratis</option>
                <option value="gemini-flash-latest">Gemini Flash Latest — Gratis</option>
              </optgroup>
            </select>
          </div>

          <ModelTestPanel />

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Instrucción del sistema (prompt)</label>
            <textarea
              rows={5}
              value={settings.system_prompt ?? ''}
              onChange={e => set('system_prompt', e.target.value)}
              placeholder="Eres un asistente de atención al cliente de la empresa..."
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/30 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">IA activa por defecto</p>
              <p className="text-xs text-gray-500">Las nuevas conversaciones tendrán IA habilitada</p>
            </div>
            <button
              type="button"
              onClick={() => set('ai_default_enabled', settings.ai_default_enabled === '1' ? '0' : '1')}
              className={`relative w-10 h-5 rounded-full transition-colors ${settings.ai_default_enabled === '1' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.ai_default_enabled === '1' ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
          {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
          Guardar configuración
        </button>
      </div>
    </form>
  )
}

/* ─── Quick Replies ──────────────────────────────────── */
function QuickRepliesTab() {
  const [items, setItems] = useState<QuickReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<QuickReply | null>(null)
  const [form, setForm] = useState({ title: '', body: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/whatsapp/quick-replies')
      setItems(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openEdit = (item: QuickReply) => { setEditing(item); setForm({ title: item.title, body: item.body }); setShowForm(true) }
  const openNew = () => { setEditing(null); setForm({ title: '', body: '' }); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await api.put(`/admin/whatsapp/quick-replies/${editing.id}`, form); toast.success('Actualizada') }
      else { await api.post('/admin/whatsapp/quick-replies', form); toast.success('Creada') }
      setShowForm(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar?')) return
    try { await api.delete(`/admin/whatsapp/quick-replies/${id}`); toast.success('Eliminada'); load() }
    catch { toast.error('Error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
          <PlusIcon className="w-4 h-4" /> Agregar
        </button>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-12 text-center">
          <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Sin respuestas rápidas</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] overflow-hidden">
          {items.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-gray-50 dark:border-[#1A1F2E]' : ''} hover:bg-gray-50 dark:hover:bg-[#1A1F2E] transition-colors`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.body}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-emerald-500 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
            <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Editar' : 'Nueva'} respuesta rápida</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Título (atajo)</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mensaje</label>
              <textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

/* ─── Blocked Numbers ──────────────────────────────── */
function BlockedNumbersTab() {
  const [items, setItems] = useState<BlockedNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phone_number: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/whatsapp/blocked-numbers')
      setItems(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/admin/whatsapp/blocked-numbers', form)
      toast.success('Número bloqueado'); setShowForm(false); setForm({ phone_number: '', reason: '' }); load()
    } catch { toast.error('Error al bloquear') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desbloquear este número?')) return
    try { await api.delete(`/admin/whatsapp/blocked-numbers/${id}`); toast.success('Desbloqueado'); load() }
    catch { toast.error('Error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold">
          <NoSymbolIcon className="w-4 h-4" /> Bloquear número
        </button>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-12 text-center">
          <NoSymbolIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Sin números bloqueados</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] overflow-hidden">
          {items.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-gray-50 dark:border-[#1A1F2E]' : ''}`}>
              <NoSymbolIcon className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">{item.phone_number}</p>
                {item.reason && <p className="text-xs text-gray-500">{item.reason}</p>}
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
            <h3 className="font-bold text-gray-900 dark:text-white">Bloquear número</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Número (con código de país)</label>
              <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} required placeholder="51999888777"
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Motivo (opcional)</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Spam, acoso, etc."
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-60">
                {saving ? 'Bloqueando...' : 'Bloquear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

/* ─── Knowledge Base ─────────────────────────────────── */
function KnowledgeBaseTab() {
  const [items, setItems] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KBArticle | null>(null)
  const [form, setForm] = useState({ title: '', content: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/whatsapp/knowledge-base')
      setItems(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openEdit = (item: KBArticle) => { setEditing(item); setForm({ title: item.title, content: item.content, is_active: item.is_active }); setShowForm(true) }
  const openNew = () => { setEditing(null); setForm({ title: '', content: '', is_active: true }); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await api.put(`/admin/whatsapp/knowledge-base/${editing.id}`, form); toast.success('Artículo actualizado') }
      else { await api.post('/admin/whatsapp/knowledge-base', form); toast.success('Artículo creado') }
      setShowForm(false); load()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return
    try { await api.delete(`/admin/whatsapp/knowledge-base/${id}`); toast.success('Eliminado'); load() }
    catch { toast.error('Error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
          <PlusIcon className="w-4 h-4" /> Agregar artículo
        </button>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-12 text-center">
          <BookOpenIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Base de conocimiento vacía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-4 flex items-start gap-4">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.content}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-emerald-500 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
            <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Editar' : 'Nuevo'} artículo</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Contenido</label>
              <textarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required
                placeholder="Información que el bot usará para responder preguntas..."
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Artículo activo</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────── */
export default function WhatsAppSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración WhatsApp</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">API, IA, respuestas rápidas y base de conocimiento</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === key
                ? 'bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'quick_replies' && <QuickRepliesTab />}
      {activeTab === 'blocked' && <BlockedNumbersTab />}
      {activeTab === 'knowledge' && <KnowledgeBaseTab />}
    </div>
  )
}
