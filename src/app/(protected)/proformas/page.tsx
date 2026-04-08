'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowRightCircleIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { Button, Input, Badge, Modal } from '@/components/ui';
import CreateQuotationModal from '@/components/invoices/CreateQuotationModal';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface QuotationItem {
  id: string;
  product_id: string;
  description: string;
  code?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

interface Quotation {
  id: string;
  number: string;
  issue_date: string;
  validity_date: string;
  currency: string;
  subtotal: number;
  tax_igv: number;
  total: number;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  client?: {
    id: string;
    name?: string;
    business_name?: string;
    document_type: string;
    document_number: string;
    email?: string;
    phone?: string;
  };
  seller?: { id: string; name: string };
  items?: QuotationItem[];
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Config ───────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',      icon: DocumentTextIcon },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',       icon: ArrowPathIcon },
  accepted:  { label: 'Aceptada',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircleIcon },
  rejected:  { label: 'Rechazada',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',           icon: XCircleIcon },
  converted: { label: 'Convertida', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',   icon: DocumentCheckIcon },
};

const TABS = [
  { id: 'all',       label: 'Todas'      },
  { id: 'draft',     label: 'Borradores' },
  { id: 'sent',      label: 'Enviadas'   },
  { id: 'accepted',  label: 'Aceptadas'  },
  { id: 'converted', label: 'Convertidas'},
];

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};

const fmtMoney = (v: number | undefined, cur = 'PEN') => {
  const sym = cur === 'USD' ? 'US$' : 'S/';
  return `${sym} ${Number(v || 0).toFixed(2)}`;
};

// ─── Component ────────────────────────────────────────────

export default function ProformasPage() {
  const { currentCompany } = useAuthStore();
  const [quotations, setQuotations]       = useState<Quotation[]>([]);
  const [meta, setMeta]                   = useState<Meta | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('all');
  const [currentPage, setCurrentPage]     = useState(1);
  const [showFilters, setShowFilters]     = useState(false);
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout>>();

  // Modals
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionQuotation,  setActionQuotation]  = useState<Quotation | null>(null);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDocType,   setConvertDocType]   = useState<'01' | '03'>('01');

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress,   setEmailAddress]   = useState('');
  const [emailTarget,    setEmailTarget]    = useState<Quotation | null>(null);

  // WhatsApp
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone,     setWhatsappPhone]     = useState('');
  const [whatsappTarget,    setWhatsappTarget]    = useState<Quotation | null>(null);
  const [waUsage,           setWaUsage]           = useState<{ used: number; limit: number; remaining: number; plan_name: string } | null>(null);

  // ─── Fetch ──────────────────────────────────────────────

  const fetchQuotations = useCallback(async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 15 };
      if (activeTab !== 'all') params['filter[status]'] = activeTab;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      if (search)   params.search    = search;

      const res = await api.get(`/companies/${currentCompany.id}/quotations`, { params });
      setQuotations(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      toast.error('Error al cargar proformas');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentPage, activeTab, dateFrom, dateTo, search]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); }, 400);
  };

  // ─── Actions ────────────────────────────────────────────

  const handleViewDetail = async (q: Quotation) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/quotations/${q.id}`);
      setSelectedQuotation(res.data.data || q);
    } catch {
      setSelectedQuotation(q);
    }
    setShowDetailModal(true);
  };

  const handleConvert = async () => {
    if (!selectedQuotation || !currentCompany) return;
    setActionLoading('convert');
    try {
      await api.post(`/companies/${currentCompany.id}/quotations/${selectedQuotation.id}/convert`, {
        document_type: convertDocType,
      });
      toast.success('Proforma convertida a comprobante exitosamente');
      setShowConvertModal(false);
      setShowDetailModal(false);
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al convertir');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (q: Quotation) => {
    if (!confirm(`¿Eliminar proforma ${q.number}?`)) return;
    if (!currentCompany) return;
    setActionLoading('delete');
    try {
      await api.delete(`/companies/${currentCompany.id}/quotations/${q.id}`);
      toast.success('Proforma eliminada');
      setShowActionsModal(false);
      setActionQuotation(null);
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally { setActionLoading(null); }
  };

  const handleDownloadPdf = async (q: Quotation) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/quotations/${q.id}/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `Cotizacion-${q.number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error('Error al descargar PDF'); }
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailAddress || !currentCompany) return;
    setActionLoading('email');
    try {
      await api.post(`/companies/${currentCompany.id}/quotations/${emailTarget.id}/send-email`, { email: emailAddress });
      toast.success('Cotización enviada por correo');
      setShowEmailModal(false);
      setEmailAddress('');
      setEmailTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar email');
    } finally { setActionLoading(null); }
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappTarget || !whatsappPhone || !currentCompany) return;
    setActionLoading('whatsapp');
    try {
      await api.post(`/companies/${currentCompany.id}/quotations/${whatsappTarget.id}/send-whatsapp`, { phone: whatsappPhone });
      toast.success('Cotización enviada por WhatsApp');
      setShowWhatsappModal(false);
      setWhatsappPhone('');
      setWhatsappTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar por WhatsApp');
    } finally { setActionLoading(null); }
  };

  const openActionsModal = (q: Quotation) => {
    setActionQuotation(q);
    setShowActionsModal(true);
  };

  const isExpired = (q: Quotation) =>
    q.status === 'sent' && new Date(q.validity_date) < new Date();

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proformas / Cotizaciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona cotizaciones y conviértelas a comprobantes electrónicos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-lg shadow-amber-500/25"
          >
            <PlusIcon className="w-4 h-4" /> Nueva Cotización
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={clsx(
                'py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
              {tab.id === 'all' && meta?.total !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400">
                  {meta.total}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por cliente o número..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition',
            showFilters
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#232834] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161A22]'
          )}
        >
          <FunnelIcon className="w-4 h-4" /> Filtros
        </button>
        <button
          onClick={() => fetchQuotations()}
          className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#232834] transition"
          title="Actualizar"
        >
          <ArrowPathIcon className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setActiveTab('all'); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-600/30 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161A22]">
                {['Número', 'Cliente', 'Fecha', 'Vence', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className={clsx(
                    'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    ['Total'].includes(h) ? 'text-right' : ['Estado', 'Acciones'].includes(h) ? 'text-center' : 'text-left'
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron proformas</p>
                    <p className="text-xs text-gray-400 mt-1">Crea tu primera cotización con el botón de arriba</p>
                  </td>
                </tr>
              ) : quotations.map(q => {
                const sc = statusConfig[q.status] || statusConfig.draft;
                const SIcon = sc.icon;
                return (
                  <tr key={q.id} className="hover:bg-gray-50/50 dark:hover:bg-[#161A22]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                        COT
                      </span>
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{q.number}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[180px]">
                        {q.client?.name || q.client?.business_name || 'Sin cliente'}
                      </p>
                      {q.client?.document_number && (
                        <p className="text-xs text-gray-400">{q.client.document_type}: {q.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 dark:text-white">{fmtDate(q.issue_date)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <span className={clsx(isExpired(q) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400')}>
                        {fmtDate(q.validity_date)}
                        {isExpired(q) && <span className="ml-1 text-xs">(Vencida)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right font-bold text-gray-900 dark:text-white">
                      {fmtMoney(q.total, q.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold', sc.color)}>
                        <SIcon className="w-3 h-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => openActionsModal(q)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg text-gray-500 hover:text-emerald-600 transition"
                        title="Acciones"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-[#232834] flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {((currentPage - 1) * meta.per_page) + 1} – {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total} proformas
            </p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                let page: number;
                if (meta.last_page <= 7) { page = i + 1; }
                else if (currentPage <= 4) { page = i + 1; }
                else if (currentPage >= meta.last_page - 3) { page = meta.last_page - 6 + i; }
                else { page = currentPage - 3 + i; }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      'w-8 h-8 rounded-lg text-xs font-medium transition',
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#161A22]'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Create Modal ────────────────────────────────── */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { fetchQuotations(); setShowCreateModal(false); }}
      />

      {/* ── Actions Modal ───────────────────────────────── */}
      <Modal
        isOpen={showActionsModal}
        onClose={() => { setShowActionsModal(false); setActionQuotation(null); }}
        title={actionQuotation ? `Proforma ${actionQuotation.number}` : 'Acciones'}
        size="sm"
      >
        {actionQuotation && (
          <div className="space-y-1 py-1">
            {/* Ver detalle */}
            <button
              onClick={() => { setShowActionsModal(false); handleViewDetail(actionQuotation); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl transition"
            >
              <EyeIcon className="w-5 h-5 text-emerald-500" />
              <div className="text-left">
                <p className="font-medium">Ver detalle</p>
                <p className="text-xs text-gray-400">Información completa de la proforma</p>
              </div>
            </button>

            {/* Convertir */}
            {!['converted', 'rejected'].includes(actionQuotation.status) && (
              <button
                onClick={() => { setShowActionsModal(false); setSelectedQuotation(actionQuotation); setShowConvertModal(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition"
              >
                <ArrowRightCircleIcon className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">Convertir a comprobante</p>
                  <p className="text-xs text-gray-400">Generar factura o boleta electrónica</p>
                </div>
              </button>
            )}

            {/* Descargar PDF */}
            <button
              onClick={() => { setShowActionsModal(false); handleDownloadPdf(actionQuotation); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition"
            >
              <DocumentArrowDownIcon className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">Descargar PDF</p>
                <p className="text-xs text-gray-400">Cotización en formato PDF</p>
              </div>
            </button>

            {/* Enviar por email */}
            <button
              onClick={() => {
                setShowActionsModal(false);
                setEmailTarget(actionQuotation);
                setEmailAddress(actionQuotation.client?.email || '');
                setShowEmailModal(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition"
            >
              <EnvelopeIcon className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <p className="font-medium">Enviar por email</p>
                <p className="text-xs text-gray-400">Enviar PDF al correo del cliente</p>
              </div>
            </button>

            {/* Enviar por WhatsApp */}
            <button
              onClick={() => {
                setShowActionsModal(false);
                setWhatsappTarget(actionQuotation);
                setWhatsappPhone(actionQuotation.client?.phone || '');
                setWaUsage(null);
                setShowWhatsappModal(true);
                if (currentCompany?.id) {
                  api.get(`/companies/${currentCompany.id}/whatsapp-usage`).then(r => setWaUsage(r.data)).catch(() => {});
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition"
            >
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-emerald-500" />
              <div className="text-left">
                <p className="font-medium">Enviar por WhatsApp</p>
                <p className="text-xs text-gray-400">Enviar PDF al número del cliente</p>
              </div>
            </button>

            {/* Eliminar */}
            {actionQuotation.status !== 'converted' && (
              <button
                onClick={() => handleDelete(actionQuotation)}
                disabled={actionLoading === 'delete'}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition"
              >
                <TrashIcon className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium">Eliminar proforma</p>
                  <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
                </div>
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Detail Modal ────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedQuotation(null); }}
        title={selectedQuotation ? `Proforma ${selectedQuotation.number}` : 'Detalle'}
        size="lg"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-[#161A22] rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedQuotation.client?.name || selectedQuotation.client?.business_name || 'Sin cliente'}
                </p>
                {selectedQuotation.client?.document_number && (
                  <p className="text-sm text-gray-500">{selectedQuotation.client.document_type}: {selectedQuotation.client.document_number}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase mb-1">Estado</p>
                {(() => {
                  const sc = statusConfig[selectedQuotation.status] || statusConfig.draft;
                  const SIcon = sc.icon;
                  return (
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold', sc.color)}>
                      <SIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-2">
                  Válida hasta: <span className="font-medium">{fmtDate(selectedQuotation.validity_date)}</span>
                </p>
              </div>
            </div>

            {selectedQuotation.items && selectedQuotation.items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Productos</h4>
                <div className="border border-gray-200 dark:border-[#232834] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-[#161A22]">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-gray-500">P. Unit.</th>
                        <th className="px-3 py-2 text-right text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                      {selectedQuotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">{item.description}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{fmtMoney(item.unit_price, selectedQuotation.currency)}</td>
                          <td className="px-3 py-2 text-right font-medium">{fmtMoney(item.total, selectedQuotation.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <div className="w-56 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{fmtMoney(selectedQuotation.subtotal, selectedQuotation.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>IGV (18%)</span>
                  <span>{fmtMoney(selectedQuotation.tax_igv, selectedQuotation.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#232834]">
                  <span>Total</span>
                  <span>{fmtMoney(selectedQuotation.total, selectedQuotation.currency)}</span>
                </div>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Notas</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedQuotation.notes}</p>
              </div>
            )}

            {!['converted', 'rejected'].includes(selectedQuotation.status) && (
              <div className="pt-4 border-t border-gray-200 dark:border-[#232834] flex gap-3">
                <Button variant="secondary" onClick={() => { handleDownloadPdf(selectedQuotation); }}>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button
                  onClick={() => {
                    setEmailTarget(selectedQuotation);
                    setEmailAddress(selectedQuotation.client?.email || '');
                    setShowDetailModal(false);
                    setShowEmailModal(true);
                  }}
                  variant="secondary"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" /> Email
                </Button>
                <Button className="flex-1" onClick={() => setShowConvertModal(true)}>
                  <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
                  Convertir a Comprobante
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Convert Modal ───────────────────────────────── */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convertir a Comprobante"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecciona el tipo de comprobante electrónico a generar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['01', '03'] as const).map(type => (
              <button
                key={type}
                onClick={() => setConvertDocType(type)}
                className={clsx(
                  'p-4 rounded-lg border-2 text-center transition-colors',
                  convertDocType === type
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-[#232834] hover:border-gray-300'
                )}
              >
                {type === '01'
                  ? <DocumentCheckIcon className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  : <DocumentTextIcon  className="w-8 h-8 mx-auto mb-2 text-blue-500" />}
                <p className="font-medium text-gray-900 dark:text-white">{type === '01' ? 'Factura' : 'Boleta'}</p>
                <p className="text-xs text-gray-500">Tipo {type}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowConvertModal(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleConvert} loading={actionLoading === 'convert'}>
              <ArrowRightCircleIcon className="w-5 h-5 mr-2" /> Convertir
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Email Modal ─────────────────────────────────── */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => { setShowEmailModal(false); setEmailAddress(''); setEmailTarget(null); }}
        title="Enviar por Email"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="cliente@ejemplo.com"
            value={emailAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailAddress(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowEmailModal(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSendEmail} loading={actionLoading === 'email'} disabled={!emailAddress}>
              <EnvelopeIcon className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── WhatsApp Modal ──────────────────────────────── */}
      <Modal
        isOpen={showWhatsappModal}
        onClose={() => { setShowWhatsappModal(false); setWhatsappPhone(''); setWhatsappTarget(null); }}
        title="Enviar por WhatsApp"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Se enviará el PDF de la proforma al número indicado a través del bot de Bravos.
            </p>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
            <span className="text-gray-500 dark:text-gray-400">Envíos WhatsApp este mes</span>
            {waUsage === null ? (
              <span className="text-gray-400 text-xs">cargando...</span>
            ) : (
              <span className={`font-semibold ${waUsage.remaining === 0 ? 'text-red-500' : waUsage.remaining <= 5 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}>
                {waUsage.used} / {waUsage.limit}
                <span className="ml-1 font-normal text-gray-400 text-xs">({waUsage.remaining} restantes)</span>
              </span>
            )}
          </div>

          <Input
            label="Número de WhatsApp"
            type="tel"
            placeholder="Ej: 987654321"
            value={whatsappPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWhatsappPhone(e.target.value)}
          />
          <p className="text-xs text-gray-400">Incluir código de país si es necesario (Perú: 51xxxxxxxxx)</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowWhatsappModal(false)}>Cancelar</Button>
            <Button
              fullWidth
              onClick={handleSendWhatsapp}
              loading={actionLoading === 'whatsapp'}
              disabled={!whatsappPhone || waUsage?.remaining === 0}
            >
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
