'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { adminAlertsService, automatedAlertsService, type SystemAlert, type AutomatedAlertConfig } from '@/services/alertsService';

/* ── Tipos / constantes ──────────────────────────────────────────────────── */

const TYPES = [
  { value: 'sunat',      label: 'SUNAT',         color: 'bg-orange-500' },
  { value: 'payment',    label: 'Pago',           color: 'bg-red-500' },
  { value: 'suggestion', label: 'Sugerencia',     color: 'bg-blue-500' },
  { value: 'reminder',   label: 'Recordatorio',   color: 'bg-purple-500' },
  { value: 'warning',    label: 'Advertencia',    color: 'bg-yellow-500' },
  { value: 'info',       label: 'Información',    color: 'bg-emerald-500' },
];

const TARGET_TYPES = [
  { value: 'all',     label: 'Todos los usuarios' },
  { value: 'company', label: 'Empresa específica' },
  { value: 'user',    label: 'Usuario específico' },
];

const EMPTY_FORM: Partial<SystemAlert> = {
  title: '',
  body: '',
  type: 'info',
  target_type: 'all',
  target_id: '',
  scheduled_at: '',
  expires_at: '',
  is_active: true,
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const typeCfg = (type: string) => TYPES.find((t) => t.value === type) ?? TYPES[5];
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/* ── Modal ───────────────────────────────────────────────────────────────── */
interface ModalProps {
  alert: Partial<SystemAlert> | null;
  onClose: () => void;
  onSaved: () => void;
}

function AlertModal({ alert, onClose, onSaved }: ModalProps) {
  const isEdit = !!alert?.id;
  const [form, setForm] = useState<Partial<SystemAlert>>(alert ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof SystemAlert, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await adminAlertsService.update(alert!.id!, form);
        toast.success('Alerta actualizada');
      } else {
        await adminAlertsService.create(form);
        toast.success('Alerta creada');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar alerta' : 'Nueva alerta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Título</label>
            <input
              required maxLength={150}
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Recordatorio declaración SUNAT"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mensaje</label>
            <textarea
              required maxLength={500} rows={3}
              value={form.body ?? ''}
              onChange={(e) => set('body', e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Escribe el mensaje que verán los usuarios..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{(form.body ?? '').length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
              <select
                value={form.type ?? 'info'}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Destinatario</label>
              <select
                value={form.target_type ?? 'all'}
                onChange={(e) => set('target_type', e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {form.target_type !== 'all' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                {form.target_type === 'company' ? 'ID de empresa' : 'ID de usuario'}
              </label>
              <input
                value={form.target_id ?? ''}
                onChange={(e) => set('target_id', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="UUID..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Programar envío</label>
              <input
                type="datetime-local"
                value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''}
                onChange={(e) => set('scheduled_at', e.target.value || null)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Expira</label>
              <input
                type="datetime-local"
                value={form.expires_at ? form.expires_at.slice(0, 16) : ''}
                onChange={(e) => set('expires_at', e.target.value || null)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active" type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => set('is_active', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Activa</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Recordatorios automáticos ───────────────────────────────────────────── */
const AUTO_ICONS: Record<string, React.ReactNode> = {
  sunat_declaration: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-orange-500">
      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
    </svg>
  ),
  membership_expiry: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-purple-500">
      <path fillRule="evenodd" d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.479-.248A9.72 9.72 0 0 0 19.267 2.5Z" />
      <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
    </svg>
  ),
};

function AutomatedSection() {
  const [configs, setConfigs] = useState<AutomatedAlertConfig[]>([]);

  useEffect(() => {
    automatedAlertsService.list().then(setConfigs).catch(() => {});
  }, []);

  const handleToggle = async (cfg: AutomatedAlertConfig) => {
    try {
      const res = await automatedAlertsService.toggle(cfg.key);
      setConfigs((prev) => prev.map((c) => c.key === cfg.key ? { ...c, is_enabled: res.is_enabled } : c));
      toast.success(res.is_enabled ? 'Recordatorio activado' : 'Recordatorio desactivado');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  if (configs.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06l-1.591-1.59a.75.75 0 0 1 0-1.061Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.06-1.061l1.59-1.591a.75.75 0 0 1 1.061 0Zm-6.816 4.496a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.678ZM3 10.5a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10.5Zm14.25 0a.75.75 0 0 1 .75-.75H20.25a.75.75 0 0 1 0 1.5H18a.75.75 0 0 1-.75-.75Zm-8.962 3.712a.75.75 0 0 1 0 1.061l-1.591 1.591a.75.75 0 1 1-1.061-1.06l1.591-1.592a.75.75 0 0 1 1.061 0Z" clipRule="evenodd" />
        </svg>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recordatorios automáticos</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">— gestionados por el sistema, no editables</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {configs.map((cfg) => (
          <div key={cfg.key} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
            <div className="flex-shrink-0 mt-0.5">{AUTO_ICONS[cfg.key]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cfg.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{cfg.description}</p>
            </div>
            <button
              onClick={() => handleToggle(cfg)}
              className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                cfg.is_enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                cfg.is_enabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function AlertsManagementPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<SystemAlert> | null | false>(false);
  const [filter, setFilter] = useState<{ type?: string; target_type?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAlertsService.list({ page, ...filter });
      setAlerts(data.data);
      setTotal(data.total);
    } catch {
      toast.error('No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (alert: SystemAlert) => {
    try {
      await adminAlertsService.toggleStatus(alert.id);
      toast.success(alert.is_active ? 'Alerta desactivada' : 'Alerta activada');
      load();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleSendNow = async (alert: SystemAlert) => {
    try {
      await adminAlertsService.sendNow(alert.id);
      toast.success('Alerta enviada a todos los destinatarios');
      load();
    } catch {
      toast.error('Error al enviar');
    }
  };

  const handleDelete = async (alert: SystemAlert) => {
    if (!confirm(`¿Eliminar la alerta "${alert.title}"?`)) return;
    try {
      await adminAlertsService.destroy(alert.id);
      toast.success('Alerta eliminada');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Alertas & Recordatorios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} alerta{total !== 1 ? 's' : ''} programada{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal(EMPTY_FORM)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva alerta
        </button>
      </div>

      {/* Recordatorios automáticos */}
      <AutomatedSection />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter.type ?? ''}
          onChange={(e) => { setFilter((f) => ({ ...f, type: e.target.value || undefined })); setPage(1); }}
          className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          value={filter.target_type ?? ''}
          onChange={(e) => { setFilter((f) => ({ ...f, target_type: e.target.value || undefined })); setPage(1); }}
          className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="">Todos los destinos</option>
          {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No hay alertas. Crea la primera.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Título / Mensaje</th>
                <th className="px-5 py-3 text-left">Destino</th>
                <th className="px-5 py-3 text-left">Programada</th>
                <th className="px-5 py-3 text-left">Expira</th>
                <th className="px-5 py-3 text-left">Descartes</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {alerts.map((alert) => {
                const cfg = typeCfg(alert.type);
                return (
                  <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{alert.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{alert.body}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {TARGET_TYPES.find((t) => t.value === alert.target_type)?.label ?? alert.target_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{fmt(alert.scheduled_at)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{fmt(alert.expires_at)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                      {alert.dismissals_count ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(alert)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          alert.is_active ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          alert.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendNow(alert)}
                          title="Enviar ahora"
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setModal(alert)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(alert)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">Página {page}</span>
          <button disabled={alerts.length < 20} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal */}
      {modal !== false && (
        <AlertModal alert={modal} onClose={() => setModal(false)} onSaved={load} />
      )}
    </div>
  );
}
