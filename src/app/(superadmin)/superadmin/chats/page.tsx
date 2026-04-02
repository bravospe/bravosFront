'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MagnifyingGlassIcon, PaperAirplaneIcon, SparklesIcon,
  UserCircleIcon, PlusIcon, XMarkIcon, ArrowPathIcon, PhoneIcon,
  UserPlusIcon, ArrowTopRightOnSquareIcon, StarIcon,
  BuildingOfficeIcon, IdentificationIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
import { format, isToday, isYesterday } from 'date-fns'
import Link from 'next/link'
import api from '@/lib/api'

interface Label { id: string; name: string; color: string }
interface Agent { id: string; name: string; email: string }
interface Message { id: string; body: string; from_me: boolean; type: string; created_at: string }
interface Conversation {
  id: string; jid: string; name: string; ai_enabled: boolean
  status: string; last_message?: string; last_message_at?: string
  assigned_agent_id?: string; agent?: Agent; labels: Label[]
  bravos_profile?: 'subscriber' | 'client' | 'lead' | 'unknown'
  bravos_company_id?: string
}
interface CrmStatus {
  in_crm: boolean
  contact: { id: number; name: string; lead_score: number; stage: { id: number; name: string; color: string } | null } | null
}
interface Stage { id: number; name: string; color: string }
interface BravosProfile {
  profile: 'subscriber' | 'client' | 'lead' | 'unknown'
  company: { id: string; name: string; ruc: string; email: string; is_active: boolean; plan: string; plan_status: string; trial_ends_at: string | null; ends_at: string | null } | null
  owner: { id: string; name: string; email: string } | null
  client: { id: string; name: string; email: string; phone: string } | null
}

function formatTime(d?: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (isToday(dt)) return format(dt, 'HH:mm')
  if (isYesterday(dt)) return 'Ayer'
  return format(dt, 'dd/MM/yy')
}
function phoneFromJid(jid: string) { return jid.replace('@s.whatsapp.net', '').replace('@g.us', '') }
function initials(n: string) { return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500']
function ac(n: string) { let x = 0; for (const c of n) x += c.charCodeAt(0); return COLORS[x % COLORS.length] }

// Bravos profile badge config
const PROFILE_CONFIG = {
  subscriber: { label: 'Suscriptor Bravos', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500', icon: ShieldCheckIcon },
  client:     { label: 'Cliente Bravos',     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    dot: 'bg-blue-500',    icon: IdentificationIcon },
  lead:       { label: 'Lead',               color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  dot: 'bg-amber-400',   icon: null },
  unknown:    { label: '',                   color: '',                                      bg: '',                                  dot: 'bg-gray-400',    icon: null },
} as const

// ─── New Conversation Modal ───────────────────────────────────────────────────
function NewConvModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Conversation) => void }) {
  const [form, setForm] = useState({ phone: '', name: '', message: '' })
  const [loading, setLoading] = useState(false)
  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post('/admin/whatsapp/conversations/start', form)
      toast.success('Conversación iniciada'); onCreated(data.conversation); onClose()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al iniciar') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
          <h3 className="font-bold text-gray-900 dark:text-white">Nueva conversación</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Teléfono (con código de país)</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2">
              <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="51999888777" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Nombre</label>
            <input type="text" placeholder="Nombre del contacto" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Mensaje inicial</label>
            <textarea rows={3} placeholder="Hola, ¿en qué puedo ayudarte?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
              {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PaperAirplaneIcon className="w-4 h-4" />} Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Promote to CRM Modal ─────────────────────────────────────────────────────
function PromoteToCrmModal({ conversation, onClose, onPromoted }: {
  conversation: Conversation; onClose: () => void; onPromoted: (status: CrmStatus) => void
}) {
  const [stages, setStages] = useState<Stage[]>([])
  const [stageId, setStageId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/whatsapp/crm/stages').then(r => setStages(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post(`/admin/whatsapp/conversations/${conversation.id}/promote-to-crm`, {
        lead_stage_id: stageId || null,
      })
      toast.success(data.already_existed ? 'Contacto ya estaba en CRM, datos actualizados' : '¡Contacto agregado al CRM!')
      onPromoted({ in_crm: true, contact: data.contact })
      onClose()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error al agregar al CRM') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#232834]">
          <div className="flex items-center gap-2">
            <UserPlusIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Agregar al CRM</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]"><XMarkIcon className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${ac(conversation.name)}`}>
              {initials(conversation.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{conversation.name}</p>
              <p className="text-xs text-gray-500">{phoneFromJid(conversation.jid)}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Etapa inicial en el pipeline</label>
            <select value={stageId} onChange={e => setStageId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Sin etapa</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400">Se creará una nota automática indicando el origen del contacto.</p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Bravos Profile Panel ─────────────────────────────────────────────────────
function BravosProfilePanel({ conversation, bravosProfile, onRefresh, refreshing }: {
  conversation: Conversation
  bravosProfile: BravosProfile | null
  onRefresh: () => void
  refreshing: boolean
}) {
  const profile = bravosProfile?.profile ?? conversation.bravos_profile ?? 'unknown'
  if (profile === 'unknown' || profile === 'lead') return null

  const cfg = PROFILE_CONFIG[profile]
  const Icon = cfg.icon

  return (
    <div className={`px-5 py-2.5 border-b border-gray-100 dark:border-[#232834] ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon && <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
              {bravosProfile?.company && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                    {bravosProfile.company.name}
                  </span>
                </>
              )}
            </div>

            {/* Subscriber details */}
            {profile === 'subscriber' && bravosProfile?.company && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {bravosProfile.company.plan && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {bravosProfile.company.plan}
                  </span>
                )}
                {bravosProfile.company.plan_status === 'trial' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Trial
                    {bravosProfile.company.trial_ends_at ? ` · vence ${bravosProfile.company.trial_ends_at}` : ''}
                  </span>
                )}
                {bravosProfile.company.ruc && (
                  <span className="text-[10px] text-gray-400">RUC {bravosProfile.company.ruc}</span>
                )}
              </div>
            )}

            {/* Client details */}
            {profile === 'client' && bravosProfile?.company && (
              <div className="mt-1">
                <span className="text-[10px] text-gray-400">
                  Cliente en <span className="text-gray-600 dark:text-gray-300 font-medium">{bravosProfile.company.name}</span>
                  {bravosProfile.company.ruc ? ` · RUC ${bravosProfile.company.ruc}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Actualizar perfil"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {profile === 'subscriber' && bravosProfile?.company && (
            <Link
              href={`/superadmin/companies/${bravosProfile.company.id}`}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${cfg.color} border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40`}
            >
              <BuildingOfficeIcon className="w-3.5 h-3.5" />
              Ver empresa
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Link>
          )}
          {profile === 'client' && bravosProfile?.company && (
            <Link
              href={`/superadmin/companies/${bravosProfile.company.id}`}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${cfg.color} border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40`}
            >
              <BuildingOfficeIcon className="w-3.5 h-3.5" />
              Ver empresa
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CRM Status Panel ─────────────────────────────────────────────────────────
function CrmStatusPanel({ conversation, status, onPromoteClick }: {
  conversation: Conversation; status: CrmStatus | null; onPromoteClick: () => void
}) {
  if (!status) return null

  if (status.in_crm && status.contact) {
    const c = status.contact
    return (
      <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 dark:border-[#232834] bg-emerald-50/50 dark:bg-emerald-900/10">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          En CRM
        </div>
        {c.stage && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${c.stage.color}20`, color: c.stage.color }}>
            {c.stage.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
          <StarIcon className="w-3 h-3" />
          {c.lead_score}
        </span>
        <Link href="/superadmin/whatsapp/crm" className="ml-auto flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
          Ver en CRM
          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 dark:border-[#232834] bg-gray-50 dark:bg-[#0A0E17]">
      <span className="text-xs text-gray-400">Contacto no está en el CRM</span>
      <button
        onClick={onPromoteClick}
        className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
      >
        <UserPlusIcon className="w-3.5 h-3.5" />
        Agregar al CRM
      </button>
    </div>
  )
}

// ─── Profile badge for sidebar ────────────────────────────────────────────────
function ProfileBadge({ profile }: { profile?: string }) {
  if (!profile || profile === 'unknown') return null
  if (profile === 'subscriber') return (
    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Suscriptor</span>
  )
  if (profile === 'client') return (
    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">Cliente</span>
  )
  if (profile === 'lead') return (
    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">Lead</span>
  )
  return null
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [showNew, setShowNew] = useState(false)
  const [showPromote, setShowPromote] = useState(false)
  const [crmStatus, setCrmStatus] = useState<CrmStatus | null>(null)
  const [bravosProfile, setBravosProfile] = useState<BravosProfile | null>(null)
  const [refreshingProfile, setRefreshingProfile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchConvs = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/whatsapp/conversations')
      setConversations(Array.isArray(data) ? data : [])
    } catch {} finally { setLoadingList(false) }
  }, [])

  useEffect(() => {
    fetchConvs()
    api.get('/admin/whatsapp/agents').then(r => setAgents(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [fetchConvs])

  useEffect(() => { const id = setInterval(fetchConvs, 5000); return () => clearInterval(id) }, [fetchConvs])

  const fetchMsgs = useCallback(async (conv: Conversation) => {
    setLoadingMsgs(true); setCrmStatus(null); setBravosProfile(null)
    try {
      const [msgRes, crmRes, bravosRes] = await Promise.all([
        api.get(`/admin/whatsapp/conversations/${conv.id}`),
        api.get(`/admin/whatsapp/conversations/${conv.id}/crm-status`),
        api.get(`/admin/whatsapp/conversations/${conv.id}/bravos-profile`),
      ])
      setMessages(Array.isArray(msgRes.data.messages) ? msgRes.data.messages : [])
      setSelected(msgRes.data.conversation ?? conv)
      setCrmStatus(crmRes.data)
      setBravosProfile(bravosRes.data)
    } catch { toast.error('Error al cargar mensajes') } finally { setLoadingMsgs(false) }
  }, [])

  const handleRefreshProfile = async () => {
    if (!selected) return
    setRefreshingProfile(true)
    try {
      const { data } = await api.post(`/admin/whatsapp/conversations/${selected.id}/refresh-bravos-profile`)
      setBravosProfile(data)
      // update badge in sidebar
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, bravos_profile: data.profile } : c))
      toast.success('Perfil actualizado')
    } catch { toast.error('Error al actualizar perfil') }
    finally { setRefreshingProfile(false) }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!selected) return
    const id = setInterval(async () => {
      try {
        const { data } = await api.get(`/admin/whatsapp/conversations/${selected.id}`)
        setMessages(Array.isArray(data.messages) ? data.messages : [])
      } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [selected])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); if (!input.trim() || !selected) return
    setSending(true); const body = input.trim(); setInput('')
    try {
      const { data } = await api.post(`/admin/whatsapp/conversations/${selected.id}/send`, { body })
      setMessages(prev => [...prev, data])
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: body, last_message_at: new Date().toISOString() } : c))
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error al enviar'); setInput(body) }
    finally { setSending(false) }
  }

  const handleToggleAI = async () => {
    if (!selected) return
    try {
      const { data } = await api.post(`/admin/whatsapp/conversations/${selected.id}/toggle-ai`)
      setSelected(p => p ? { ...p, ai_enabled: data.ai_enabled } : p)
      setConversations(p => p.map(c => c.id === selected.id ? { ...c, ai_enabled: data.ai_enabled } : c))
      toast.success(data.ai_enabled ? 'IA activada' : 'IA desactivada')
    } catch { toast.error('Error') }
  }

  const handleAssign = async (agentId: string) => {
    if (!selected) return
    try {
      await api.post(`/admin/whatsapp/conversations/${selected.id}/assign`, { agent_id: agentId || null })
      const agent = agents.find(a => a.id === agentId)
      setSelected(p => p ? { ...p, agent, assigned_agent_id: agentId } : p)
      toast.success('Agente asignado')
    } catch { toast.error('Error al asignar') }
  }

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || phoneFromJid(c.jid).includes(search)
  )

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#232834] bg-white dark:bg-[#0D1117]">
      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r border-gray-100 dark:border-[#232834]">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#232834]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Conversaciones</h2>
            <button onClick={() => setShowNew(true)} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors">
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-black/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10"><ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <UserCircleIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin conversaciones</p>
            </div>
          ) : filtered.map(conv => (
            <button key={conv.id} onClick={() => { setMessages([]); fetchMsgs(conv) }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#161A22] border-b border-gray-50 dark:border-[#1A1F2E] ${selected?.id === conv.id ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-l-emerald-500' : ''}`}>
              {/* Avatar with profile dot */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${ac(conv.name)}`}>
                  {initials(conv.name)}
                </div>
                {(conv.bravos_profile === 'subscriber' || conv.bravos_profile === 'client') && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D1117] ${PROFILE_CONFIG[conv.bravos_profile].dot}`} title={PROFILE_CONFIG[conv.bravos_profile].label} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{conv.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTime(conv.last_message_at)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || '...'}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <ProfileBadge profile={conv.bravos_profile} />
                  {conv.ai_enabled && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">IA</span>}
                  {conv.labels?.slice(0, 2).map(l => (
                    <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: l.color + '22', color: l.color }}>{l.name}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0A0E17]">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-gray-400 text-sm">Selecciona una conversación</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#232834] bg-white dark:bg-[#0D1117]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${ac(selected.name)}`}>
                  {initials(selected.name)}
                </div>
                {(selected.bravos_profile === 'subscriber' || selected.bravos_profile === 'client') && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0D1117] ${PROFILE_CONFIG[selected.bravos_profile].dot}`} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{selected.name}</p>
                  <ProfileBadge profile={selected.bravos_profile} />
                </div>
                <p className="text-xs text-gray-500">{phoneFromJid(selected.jid)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={selected.assigned_agent_id || ''} onChange={e => handleAssign(e.target.value)}
                className="text-xs bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-gray-300">
                <option value="">Sin agente</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={handleToggleAI}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${selected.ai_enabled ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 dark:bg-[#232834] text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
                {selected.ai_enabled ? <><SparklesSolid className="w-3.5 h-3.5" /> IA activa</> : <><SparklesIcon className="w-3.5 h-3.5" /> IA inactiva</>}
              </button>
            </div>
          </div>

          {/* Bravos Profile Panel */}
          <BravosProfilePanel
            conversation={selected}
            bravosProfile={bravosProfile}
            onRefresh={handleRefreshProfile}
            refreshing={refreshingProfile}
          />

          {/* CRM Status Panel */}
          <CrmStatusPanel
            conversation={selected}
            status={crmStatus}
            onPromoteClick={() => setShowPromote(true)}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-gray-50 dark:bg-[#0A0E17]">
            {loadingMsgs ? (
              <div className="flex justify-center py-10"><ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-500" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">Sin mensajes aún</div>
            ) : messages.map((msg, i) => (
              <div key={msg.id ?? i} className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.from_me ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-[#232834]'}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.from_me ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-end gap-3 px-4 py-3 border-t border-gray-100 dark:border-[#232834] bg-white dark:bg-[#0D1117]">
            <textarea rows={1} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              className="flex-1 resize-none bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-400 max-h-32" />
            <button type="submit" disabled={sending || !input.trim()} className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 shrink-0">
              {sending ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}

      {showNew && <NewConvModal onClose={() => setShowNew(false)} onCreated={c => { setConversations(p => [c, ...p]); fetchMsgs(c) }} />}
      {showPromote && selected && (
        <PromoteToCrmModal
          conversation={selected}
          onClose={() => setShowPromote(false)}
          onPromoted={status => setCrmStatus(status)}
        />
      )}
    </div>
  )
}
