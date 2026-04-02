'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  EnvelopeIcon, PlusIcon, TrashIcon, KeyIcon,
  ArrowPathIcon, XMarkIcon, ServerIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InboxIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface MailAccount {
  email: string
  has_hash: boolean
  mailbox_size_mb: number
  mailbox_exists: boolean
}

interface MailStats {
  accounts_count: number
  total_mail_mb: number
  disk_total_gb: number
  disk_free_gb: number
  domain: string
  server: string
}

const QUOTA_WARN_MB = 500

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

function SizeBar({ sizeMb }: { sizeMb: number }) {
  const pct = Math.min((sizeMb / QUOTA_WARN_MB) * 100, 100)
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#232834] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 shrink-0 w-16 text-right">
        {sizeMb < 1 ? `${(sizeMb * 1024).toFixed(0)} KB` : `${sizeMb.toFixed(1)} MB`}
      </span>
    </div>
  )
}

export default function MailAccountsPage() {
  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [stats, setStats]       = useState<MailStats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [changePwFor, setChangePwFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [accRes, statRes] = await Promise.all([
        api.get('/admin/mail/accounts'),
        api.get('/admin/mail/stats'),
      ])
      setAccounts(Array.isArray(accRes.data) ? accRes.data : [])
      setStats(statRes.data)
    } catch { toast.error('Error al cargar cuentas') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (email: string) => {
    if (!confirm(`¿Eliminar la cuenta ${email}? Se perderán todos los correos.`)) return
    try {
      await api.delete(`/admin/mail/accounts/${encodeURIComponent(email)}`)
      toast.success(`Cuenta ${email} eliminada`)
      setAccounts(p => p.filter(a => a.email !== email))
    } catch (e: any) { toast.error(e.response?.data?.error || 'Error al eliminar') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas de Correo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestión de buzones @bravos.pe</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-gray-100 dark:bg-[#1A1F2E] text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva cuenta
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Cuentas',         value: stats.accounts_count,                icon: EnvelopeIcon,  color: '#10B981' },
            { label: 'Almacenamiento',  value: `${stats.total_mail_mb.toFixed(1)} MB`, icon: InboxIcon,  color: '#6366F1' },
            { label: 'Disco total',     value: `${stats.disk_total_gb} GB`,          icon: ServerIcon,   color: '#F59E0B' },
            { label: 'Disco libre',     value: `${stats.disk_free_gb} GB`,           icon: CheckCircleIcon, color: '#EC4899' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Server info */}
      {stats && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Servidor: {stats.server}</span>
          <span className="text-blue-600 dark:text-blue-300">IMAP: <code>993 (SSL)</code></span>
          <span className="text-blue-600 dark:text-blue-300">SMTP: <code>587 (TLS)</code> / <code>465 (SSL)</code></span>
          <span className="text-blue-600 dark:text-blue-300">Webmail: <a href="https://mail.bravos.pe" target="_blank" className="underline">mail.bravos.pe</a></span>
        </div>
      )}

      {/* Accounts table */}
      <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-16 text-center">
            <EnvelopeIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay cuentas configuradas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#232834]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-52">Uso / Cuota</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.email} className="border-b border-gray-50 dark:border-[#1A1F2E] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1A1F2E] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <EnvelopeIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{acc.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {acc.mailbox_exists ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircleIcon className="w-3.5 h-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Sin buzón
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 w-52">
                    <SizeBar sizeMb={acc.mailbox_size_mb} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setChangePwFor(acc.email)}
                        title="Cambiar contraseña"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.email)}
                        title="Eliminar cuenta"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834] text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <CreateAccountForm
            onClose={() => setShowCreate(false)}
            onCreated={acc => { setAccounts(p => [...p, acc]); setShowCreate(false) }}
          />
        </Modal>
      )}

      {/* Change Password Modal */}
      {changePwFor && (
        <Modal onClose={() => setChangePwFor(null)}>
          <ChangePasswordForm
            email={changePwFor}
            onClose={() => setChangePwFor(null)}
          />
        </Modal>
      )}
    </div>
  )
}

// ─── Create Account Form ──────────────────────────────────────────────────────
function CreateAccountForm({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (acc: MailAccount) => void
}) {
  const [form, setForm] = useState({ user: '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }
    setSaving(true)
    try {
      const email = `${form.user.toLowerCase()}@bravos.pe`
      await api.post('/admin/mail/accounts', { email, password: form.password })
      toast.success(`Cuenta ${email} creada`)
      onCreated({ email, has_hash: true, mailbox_size_mb: 0, mailbox_exists: true })
    } catch (e: any) {
      const errors = e.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(', ') : (e.response?.data?.error || 'Error al crear')
      toast.error(msg)
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
        <h3 className="font-bold text-gray-900 dark:text-white">Nueva cuenta de correo</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handle} className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Usuario</label>
          <div className="flex items-center bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl overflow-hidden">
            <input
              type="text"
              placeholder="nombre"
              value={form.user}
              onChange={e => setForm(f => ({ ...f, user: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
              required
              className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none text-gray-900 dark:text-white"
            />
            <span className="px-3 py-2.5 bg-gray-100 dark:bg-[#232834] text-sm text-gray-500 border-l border-gray-200 dark:border-[#232834] shrink-0">
              @bravos.pe
            </span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required minLength={8}
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirmar contraseña</label>
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            required
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Crear cuenta
          </button>
        </div>
      </form>
    </>
  )
}

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm({ email, onClose }: { email: string; onClose: () => void }) {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }
    setSaving(true)
    try {
      await api.put(`/admin/mail/accounts/${encodeURIComponent(email)}`, { password: form.password })
      toast.success(`Contraseña de ${email} actualizada`)
      onClose()
    } catch (e: any) { toast.error(e.response?.data?.error || 'Error al cambiar contraseña') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#232834]">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Cambiar contraseña</h3>
          <p className="text-xs text-gray-500 mt-0.5">{email}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232834]">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handle} className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nueva contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required minLength={8} autoFocus
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirmar contraseña</label>
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            required
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-[#232834] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#232834] text-gray-700 dark:text-gray-300 rounded-xl font-semibold">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Cambiar contraseña
          </button>
        </div>
      </form>
    </>
  )
}
