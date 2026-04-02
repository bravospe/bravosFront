'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  UserCircleIcon,
  PhoneIcon,
  StarIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
}

interface Contact {
  id: number;
  jid: string;
  name: string;
  email: string | null;
  phone_formatted: string;
  lead_score: number;
  source: string | null;
  last_contacted_at: string | null;
  stage: { id: number; name: string; color: string } | null;
  notes?: Note[];
  tasks?: Task[];
}

interface Note {
  id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: { name: string };
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (score >= 40) return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';
  return 'text-gray-500 bg-gray-100 dark:bg-gray-700/30 dark:text-gray-400';
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '107, 114, 128';
}

// ─── Contact Detail Modal ─────────────────────────────────────────────────────

function ContactModal({
  contact,
  stages,
  onClose,
  onSaved,
}: {
  contact: Contact;
  stages: Stage[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<Contact | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [form, setForm] = useState({
    name: contact.name,
    email: contact.email || '',
    lead_stage_id: contact.stage?.id?.toString() || '',
    lead_score: contact.lead_score?.toString() || '0',
    notes: '',
  });

  useEffect(() => {
    fetchDetail();
  }, [contact.id]);

  const fetchDetail = async () => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/whatsapp/crm/contacts/${contact.id}`);
      setDetail(res.data);
      setForm({
        name: res.data.name,
        email: res.data.email || '',
        lead_stage_id: res.data.stage?.id?.toString() || '',
        lead_score: res.data.lead_score?.toString() || '0',
        notes: '',
      });
    } catch {
      toast.error('Error al cargar contacto');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/whatsapp/crm/contacts/${contact.id}`, {
        name: form.name,
        email: form.email || null,
        lead_stage_id: form.lead_stage_id ? Number(form.lead_stage_id) : null,
        lead_score: Number(form.lead_score),
        notes: form.notes || undefined,
      });
      toast.success('Contacto actualizado');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/admin/whatsapp/crm/contacts/${contact.id}/notes`, {
        content: noteContent.trim(),
        is_internal: true,
      });
      toast.success('Nota agregada');
      setNoteContent('');
      fetchDetail();
    } catch {
      toast.error('Error al agregar nota');
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Contacto: ${contact.name}`} size="xl">
      {loadingDetail ? (
        <div className="py-12 flex justify-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Edit form */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
              <PencilSquareIcon className="w-4 h-4 text-emerald-500" />
              Editar contacto
            </h4>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Etapa</label>
                <select
                  value={form.lead_stage_id}
                  onChange={(e) => setForm({ ...form, lead_stage_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sin etapa</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Lead Score ({form.lead_score})
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.lead_score}
                  onChange={(e) => setForm({ ...form, lead_score: e.target.value })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                  Guardar cambios
                </button>
              </div>
            </form>

            {/* Tasks */}
            {detail?.tasks && detail.tasks.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                  Tareas ({detail.tasks.length})
                </h4>
                <div className="space-y-2">
                  {detail.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834]"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {format(new Date(task.due_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Notes */}
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
              <PlusIcon className="w-4 h-4 text-purple-500" />
              Notas ({detail?.notes?.length ?? 0})
            </h4>

            <div className="flex-1 space-y-2 max-h-64 overflow-y-auto pr-1 mb-3">
              {detail?.notes && detail.notes.length > 0 ? (
                detail.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-[#0D1117] border border-gray-100 dark:border-[#232834]"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {note.author?.name && `${note.author.name} · `}
                      {formatDistanceToNow(new Date(note.created_at), { locale: es, addSuffix: true })}
                      {note.is_internal && (
                        <span className="ml-2 text-xs text-amber-500">Interna</span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Sin notas aún</p>
              )}
            </div>

            <div className="border border-gray-200 dark:border-[#232834] rounded-lg overflow-hidden">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escribir nota interna..."
                className="w-full px-3 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-[#0D1117] resize-none focus:outline-none"
              />
              <div className="flex justify-end px-3 py-2 bg-gray-50 dark:bg-[#111318] border-t border-gray-100 dark:border-[#232834]">
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !noteContent.trim()}
                  className="text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addingNote ? (
                    <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  ) : (
                    <PlusIcon className="w-3 h-3" />
                  )}
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-white dark:bg-[#111318] rounded-xl border border-gray-100 dark:border-[#232834] hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials(contact.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {contact.name}
            </p>
            {contact.phone_formatted && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <PhoneIcon className="w-3 h-3" />
                {contact.phone_formatted}
              </p>
            )}
          </div>
        </div>
        <span className={clsx('flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5', scoreColor(contact.lead_score))}>
          <StarIcon className="w-3 h-3" />
          {contact.lead_score}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        {contact.last_contacted_at ? (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {formatDistanceToNow(new Date(contact.last_contacted_at), { locale: es, addSuffix: true })}
          </p>
        ) : <span />}
        {contact.source === 'chat' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            <ChatBubbleLeftRightIcon className="w-3 h-3" />
            Chat IA
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppCrmPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchStages = useCallback(async () => {
    try {
      const res = await api.get('/admin/whatsapp/crm/stages');
      setStages(res.data);
    } catch {
      toast.error('Error al cargar etapas');
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (stageFilter) params.stage_id = stageFilter;
      const res = await api.get('/admin/whatsapp/crm/contacts', { params });
      const data = res.data?.data ?? res.data;
      setContacts(Array.isArray(data) ? data : []);
      setTotal(res.data?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  useEffect(() => {
    const timer = setTimeout(() => fetchContacts(), 350);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const groupedByStage = useCallback(() => {
    const map: Record<string, Contact[]> = { '__none__': [] };
    stages.forEach((s) => (map[s.id] = []));
    contacts.forEach((c) => {
      if (c.stage?.id && map[c.stage.id] !== undefined) {
        map[c.stage.id].push(c);
      } else {
        map['__none__'].push(c);
      }
    });
    return map;
  }, [contacts, stages]);

  const grouped = groupedByStage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM WhatsApp</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tus contactos y pipeline de ventas</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="">Todas las etapas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1E2230] rounded-xl p-1">
          <button
            onClick={() => setView('kanban')}
            className={clsx('p-1.5 rounded-lg transition-colors', view === 'kanban' ? 'bg-white dark:bg-[#111318] shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
            title="Vista Kanban"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-white dark:bg-[#111318] shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
            title="Vista Lista"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={fetchContacts}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all disabled:opacity-50"
          title="Actualizar"
        >
          <ArrowPathIcon className={clsx('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#232834]">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-5 h-5 text-emerald-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Total contactos:</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{total}</span>
        </div>
        {stages.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.name}:</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {grouped[s.id]?.length ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 flex justify-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Kanban View */}
      {!loading && view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const rgb = hexToRgb(stage.color);
            const cols = grouped[stage.id] ?? [];
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-72"
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b-2"
                  style={{
                    backgroundColor: `rgba(${rgb}, 0.08)`,
                    borderColor: stage.color,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{stage.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#111318] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#232834]">
                    {cols.length}
                  </span>
                </div>
                <div
                  className="min-h-32 p-2 rounded-b-xl space-y-2"
                  style={{ backgroundColor: `rgba(${rgb}, 0.04)` }}
                >
                  {cols.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Sin contactos</p>
                  ) : (
                    cols.map((c) => (
                      <KanbanCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Sin etapa column */}
          <div className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1d26]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sin etapa</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#111318] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#232834]">
                {grouped['__none__']?.length ?? 0}
              </span>
            </div>
            <div className="min-h-32 p-2 rounded-b-xl bg-gray-50/50 dark:bg-[#111318]/40 space-y-2">
              {(grouped['__none__'] ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Sin contactos</p>
              ) : (
                (grouped['__none__'] ?? []).map((c) => (
                  <KanbanCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && view === 'list' && (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] overflow-hidden">
          {contacts.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <UserCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No se encontraron contactos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#232834] bg-gray-50 dark:bg-[#111318]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Último contacto
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#1a1d26]">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#111318] transition-colors cursor-pointer"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {initials(contact.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                            {contact.email && (
                              <p className="text-xs text-gray-400">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {contact.phone_formatted || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {contact.stage ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: `rgba(${hexToRgb(contact.stage.color)}, 0.12)`,
                              color: contact.stage.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: contact.stage.color }}
                            />
                            {contact.stage.name}
                          </span>
                        ) : (
                          <Badge variant="secondary" size="sm">Sin etapa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md', scoreColor(contact.lead_score))}>
                          <StarIcon className="w-3 h-3" />
                          {contact.lead_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {contact.last_contacted_at
                          ? formatDistanceToNow(new Date(contact.last_contacted_at), { locale: es, addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {contact.source === 'chat' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                            <ChatBubbleLeftRightIcon className="w-3 h-3" />
                            Chat IA
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactModal
          contact={selectedContact}
          stages={stages}
          onClose={() => setSelectedContact(null)}
          onSaved={() => {
            setSelectedContact(null);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
