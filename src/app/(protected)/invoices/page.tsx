'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PrinterIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  CodeBracketIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { Button, Input, Badge, Card, Modal } from '@/components/ui';
import { useInvoiceStore, Invoice } from '@/stores/invoiceStore';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import CreateInvoiceModal from '@/components/invoices/CreateInvoiceModal';
import InvoiceDetailDrawer from '@/components/invoices/InvoiceDetailDrawer';
import SunatQueueModal from '@/components/invoices/SunatQueueModal';
import { printSaleReceipt } from '@/lib/printReceiptFromSale';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

// ─── Helpers ──────────────────────────────────────────────

const docTypeLabels: Record<string, { short: string; color: string }> = {
  '01': { short: 'Factura',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  '03': { short: 'Boleta',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
  '07': { short: 'N. Crédito', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  '08': { short: 'N. Débito',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  '00': { short: 'N. Venta',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
};

const sunatStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', icon: ClockIcon },
  sent:     { label: 'Enviado',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: ArrowPathIcon },
  accepted: { label: 'Aceptado',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircleIcon },
  rejected: { label: 'Rechazado',  color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: ExclamationCircleIcon },
  annulled: { label: 'Anulado',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400', icon: XCircleIcon },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' },
  partial: { label: 'Parcial',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  paid:    { label: 'Pagado',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};

const fmtMoney = (v: number | string | undefined, cur = 'PEN') => {
  const n = Number(v || 0);
  const sym = cur === 'USD' ? 'US$' : 'S/';
  return `${sym} ${n.toFixed(2)}`;
};

// ─── Component ────────────────────────────────────────────

export default function InvoicesPage() {
  const {
    invoices, isLoading, meta, filters, currentInvoice,
    fetchInvoices, getInvoice, setFilters, setCurrentInvoice,
    sendToSunat, downloadPdf, downloadXml, downloadCdr, sendEmail, deleteInvoice,
  } = useInvoiceStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDocType, setCreateDocType] = useState<'01' | '03'>('01');
  const [showDetail, setShowDetail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionInvoice, setActionInvoice] = useState<Invoice | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappInvoice, setWhatsappInvoice] = useState<Invoice | null>(null);
  const [waUsage, setWaUsage] = useState<{ used: number; limit: number; remaining: number; plan_name: string } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const [filterOptions, setFilterOptions] = useState({ users: [] as any[], cashRegisters: [] as any[] });
  const [showSunatModal, setShowSunatModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const currentCompany = useAuthStore(s => s.currentCompany);
  const searchParams = useSearchParams();

  useEffect(() => {
    const cid = currentCompany?.id;
    if (!cid) return;
    const loadFilters = async () => {
      try {
        const [resU, resC] = await Promise.all([
          api.get(`/companies/${cid}/users`),
          api.get(`/companies/${cid}/cash-registers`)
        ]);
        setFilterOptions({
          users: resU.data?.data || resU.data || [],
          cashRegisters: resC.data?.data || resC.data || []
        });
      } catch (e) { }
    };
    loadFilters();
  }, [currentCompany?.id]);

  useEffect(() => {
    if (!currentCompany?.id) return;
    const fetchCount = async () => {
      try {
        const res = await api.get(`/companies/${currentCompany.id}/invoices`, {
          params: { sunat_status: 'pending', per_page: 1 }
        });
        setPendingCount(res.data?.meta?.total || 0);
      } catch (e) { }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [currentCompany?.id]);

  // Load invoices
  useEffect(() => {
    fetchInvoices({ page: currentPage });
  }, [fetchInvoices, currentPage, filters]);

  // Auto-open detail if ?open=uuid is in URL (from dashboard click)
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    getInvoice(openId)
      .then(() => setShowDetail(true))
      .catch(() => {});
  }, [searchParams]);

  // Tab → filter
  useEffect(() => {
    setFilters({ ...filters, sunat_status: selectedTab === 'all' ? undefined : selectedTab });
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters({ ...filters, search: val || undefined });
      setCurrentPage(1);
    }, 400);
  };

  // Actions
  const handleViewDetail = async (inv: Invoice) => {
    try {
      await getInvoice(inv.id);
      setShowDetail(true);
    } catch { toast.error('Error al cargar detalle'); }
  };

  const handleSendToSunat = async (id: string) => {
    setActionLoading('sunat');
    try {
      await sendToSunat(id);
      toast.success('Comprobante enviado a SUNAT');
      await getInvoice(id);
      fetchInvoices({ page: currentPage });
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar a SUNAT');
    } finally { setActionLoading(null); }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const inv = invoices.find(i => i.id === id) || actionInvoice || currentInvoice;
      if (inv?.document_model === 'sale') {
         const cid = useAuthStore.getState().currentCompany?.id;
         const res = await api.get(`/companies/${cid}/sales/${inv.id}/pdf`, { responseType: 'blob' });
         const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
         const link = document.createElement('a');
         link.href = url;
         link.setAttribute('download', `NV-${inv.series}-${inv.number}.pdf`);
         document.body.appendChild(link);
         link.click();
         link.remove();
         return;
      }
      await downloadPdf(id);
    } catch { toast.error('Error al descargar PDF'); }
  };
  const handleDownloadXml = async (id: string) => {
    try { await downloadXml(id); } catch { toast.error('Error al descargar XML'); }
  };
  const handleDownloadCdr = async (id: string) => {
    try { await downloadCdr(id); } catch { toast.error('Error al descargar CDR'); }
  };

  const handleSendEmail = async () => {
    if (!currentInvoice || !emailAddress) return;
    setActionLoading('email');
    try {
      await sendEmail(currentInvoice.id, emailAddress);
      toast.success('Email enviado');
      setShowEmailModal(false);
      setEmailAddress('');
    } catch { toast.error('Error al enviar email'); }
    finally { setActionLoading(null); }
  };

  const [isExporting, setIsExporting] = useState(false);

  // Export Excel — fetches ALL records matching current filters
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const cid = useAuthStore.getState().currentCompany?.id;
      if (!cid) { toast.error('No hay empresa seleccionada'); return; }
      const res = await api.get(`/companies/${cid}/invoices`, {
        params: { ...filters, per_page: 9999, page: 1 },
      });
      const all: Invoice[] = res.data?.data || [];
      if (!all.length) { toast.error('No hay datos para exportar'); return; }

      const docTypeLabel: Record<string, string> = {
        '01': 'Factura', '03': 'Boleta', '07': 'N. Crédito', '08': 'N. Débito', '00': 'Nota de Venta',
      };
      const paymentLabel: Record<string, string> = {
        cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
        yape: 'Yape / Plin', plin: 'Yape / Plin', yape_plin: 'Yape / Plin', credit: 'Crédito', mixed: 'Mixto',
      };

      const rows = all.map(inv => ({
        'Tipo': docTypeLabel[inv.document_type] || inv.document_type,
        'Serie': inv.series || '',
        'Número': String(inv.number || inv.correlative || '').padStart(8, '0'),
        'Fecha Emisión': inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('es-PE') : '',
        'Cliente': inv.client?.name || inv.client?.business_name || 'Cliente varios',
        'RUC/DNI': inv.client?.document_number || '',
        'Moneda': inv.currency || 'PEN',
        'Subtotal': Number(inv.subtotal || 0),
        'IGV': Number(inv.tax_amount || inv.tax_igv || 0),
        'Total': Number(inv.total || 0),
        'Estado SUNAT': inv.document_model === 'sale' ? 'Local' : (sunatStatusConfig[inv.sunat_status]?.label || inv.sunat_status),
        'Forma de Pago': paymentLabel[inv.payment_method || ''] || inv.payment_method || '',
        'Vendedor': inv.seller?.name || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Column widths
      ws['!cols'] = [14, 8, 12, 14, 30, 14, 8, 12, 12, 12, 14, 16, 20].map(w => ({ wch: w }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Comprobantes');
      XLSX.writeFile(wb, `comprobantes_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${all.length} registros exportados a Excel`);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'all',      label: 'Todos',       count: meta?.total },
    { id: 'pending',  label: 'Pendientes'  },
    { id: 'accepted', label: 'Aceptados'   },
    { id: 'rejected', label: 'Rechazados'  },
    { id: 'annulled', label: 'Anulados'    },
  ];

  const openActionsModal = (inv: Invoice) => {
    setActionInvoice(inv);
    setShowActionsModal(true);
  };

  const handleAnular = async (id: string) => {
    if (!confirm('¿Estás seguro de anular este comprobante?')) return;
    setActionLoading('anular');
    try {
      const inv = invoices.find(i => i.id === id) || actionInvoice || currentInvoice;
      if (inv?.document_model === 'sale') {
        const cid = useAuthStore.getState().currentCompany?.id;
        await api.delete(`/companies/${cid}/sales/${id}`);
      } else {
        await deleteInvoice(id);
      }
      toast.success('Comprobante anulado');
      setShowActionsModal(false);
      setActionInvoice(null);
      fetchInvoices({ page: currentPage });
    } catch (err: any) {
      toast.error(err.message || 'Error al anular');
    } finally { setActionLoading(null); }
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappInvoice || !whatsappPhone) return;
    setActionLoading('whatsapp');
    try {
      const cid = useAuthStore.getState().currentCompany?.id;
      if (whatsappInvoice.document_model === 'sale') {
        await api.post(`/companies/${cid}/sales/${whatsappInvoice.id}/send-whatsapp`, { phone: whatsappPhone });
      } else {
        await api.post(`/companies/${cid}/invoices/${whatsappInvoice.id}/send-whatsapp`, { phone: whatsappPhone });
      }
      toast.success('Comprobante enviado por WhatsApp');
      setShowWhatsappModal(false);
      setWhatsappInvoice(null);
      setWhatsappPhone('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar por WhatsApp');
    } finally { setActionLoading(null); }
  };

  const openCreate = (type: '01' | '03') => {
    setCreateDocType(type);
    setShowCreateModal(true);
  };

  // File indicators
  const FileIndicator = ({ has, label }: { has: boolean; label: string }) => (
    <span className={clsx(
      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
      has ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700/30 dark:text-gray-500'
    )}>
      {has ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
      {label}
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comprobantes Electrónicos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Facturas, boletas y notas de crédito/débito</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportExcel} disabled={isExporting} className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-gray-100 dark:bg-[#161A22] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1E2230] rounded-xl transition border border-gray-200 dark:border-[#232834] disabled:opacity-60">
            <ArrowDownTrayIcon className={clsx('w-4 h-4', isExporting && 'animate-bounce')} /> {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
          <button onClick={() => openCreate('03')} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-sm">
            <PlusIcon className="w-4 h-4" /> Nueva Boleta
          </button>
          <button onClick={() => openCreate('01')} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-lg shadow-emerald-500/25">
            <PlusIcon className="w-4 h-4" /> Nueva Factura
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={clsx(
                'py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                selectedTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400">
                  {tab.count}
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
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por cliente, serie, número o RUC..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={clsx(
          'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition',
          showFilters
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#232834] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161A22]'
        )}>
          <FunnelIcon className="w-4 h-4" /> Filtros
        </button>
        <button onClick={() => fetchInvoices({ page: currentPage })} className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl border border-gray-200 dark:border-[#232834] transition" title="Actualizar">
          <ArrowPathIcon className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#232834]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select value={filters.document_type || ''} onChange={e => { setFilters({ ...filters, document_type: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Todos</option>
              <option value="01">Factura</option>
              <option value="00">Nota de Venta</option>
              <option value="03">Boleta</option>
              <option value="07">N. Crédito</option>
              <option value="08">N. Débito</option>
            </select>
          </div>
                    <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendedor</label>
            <select value={filters.seller_id || ''} onChange={e => { setFilters({ ...filters, seller_id: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Todos</option>
              {filterOptions.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Caja</label>
            <select value={filters.cash_register_id || ''} onChange={e => { setFilters({ ...filters, cash_register_id: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Todas</option>
              {filterOptions.cashRegisters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Método de Pago</label>
            <select value={(filters as any).payment_method || ''} onChange={e => { setFilters({ ...filters, payment_method: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="yape_plin">Yape / Plin</option>
              <option value="credit">Crédito</option>
              <option value="mixed">Mixto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={filters.date_from || ''} onChange={e => { setFilters({ ...filters, date_from: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={filters.date_to || ''} onChange={e => { setFilters({ ...filters, date_to: e.target.value || undefined }); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2A3244] bg-white dark:bg-[#161A22] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilters({}); setSearchInput(''); setSelectedTab('all'); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-600/30 transition">
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
                {['Documento', 'Cliente', 'Fecha', 'Subtotal', 'IGV', 'Total', 'SUNAT', 'Vendedor', 'Acciones'].map(h => (
                  <th key={h} className={clsx(
                    'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    ['Subtotal', 'IGV', 'Total'].includes(h) ? 'text-right' : ['SUNAT', 'Vendedor', 'Acciones'].includes(h) ? 'text-center' : 'text-left'
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
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron comprobantes</p>
                    <p className="text-xs text-gray-400 mt-1">Crea tu primer comprobante con los botones de arriba</p>
                  </td>
                </tr>
              ) : invoices.map(inv => {
                const dt = docTypeLabels[inv.document_type] || { short: inv.document_type, color: 'bg-gray-100 text-gray-600' };
                const ss = sunatStatusConfig[inv.sunat_status] || sunatStatusConfig.pending;
                const ps = paymentStatusConfig[inv.payment_status] || paymentStatusConfig.pending;
                const SIcon = ss.icon;
                const docNum = String(inv.number || inv.correlative || '').padStart(8, '0');
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#161A22]/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className={clsx('inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase', dt.color)}>{dt.short}</span>
                      <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{inv.series}-{docNum}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[180px]">{inv.client?.name || inv.client?.business_name || 'Cliente varios'}</p>
                      <p className="text-xs text-gray-400">{inv.client?.document_type}: {inv.client?.document_number || '-'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-900 dark:text-white">{fmtDate(inv.issue_date)}</p>
                      {inv.document_type !== '00' && inv.document_model !== 'sale' && (
                        (inv as any).accepted_at ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3 flex-shrink-0" />
                            {new Date((inv as any).accepted_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        ) : (inv.sunat_status === 'pending' || !inv.sunat_status) ? (
                          <p className="text-[11px] text-yellow-500 dark:text-yellow-400 mt-0.5 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 flex-shrink-0" />
                            Pendiente SUNAT
                          </p>
                        ) : null
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right text-gray-600 dark:text-gray-400">{fmtMoney(inv.subtotal, inv.currency)}</td>
                    <td className="px-4 py-3.5 text-sm text-right text-gray-500">
                      {inv.document_type === '00' ? <span className="text-gray-400">—</span> : fmtMoney(inv.tax_amount || inv.tax_igv, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right font-bold text-gray-900 dark:text-white">{fmtMoney(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3.5 text-center">
                      {inv.document_type === '00' || inv.document_model === 'sale' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold', ss.color)}>
                          <SIcon className="w-3 h-3" /> {ss.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[120px] inline-block">{inv.seller?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => openActionsModal(inv)}
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
              {((currentPage - 1) * meta.per_page) + 1} - {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total} comprobantes
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

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchInvoices({ page: 1 })}
        defaultDocumentType={createDocType}
      />

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        invoice={currentInvoice}
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setCurrentInvoice(null); }}
        onSendSunat={handleSendToSunat}
        onDownloadPdf={handleDownloadPdf}
        onDownloadXml={handleDownloadXml}
        onDownloadCdr={handleDownloadCdr}
        actionLoading={actionLoading}
      />

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => { setShowEmailModal(false); setEmailAddress(''); }}
        title="Enviar por Email"
        size="sm"
      >
        <div className="space-y-4">
          <Input label="Correo electrónico" type="email" placeholder="cliente@ejemplo.com" value={emailAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailAddress(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowEmailModal(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSendEmail} loading={actionLoading === 'email'} disabled={!emailAddress}>
              <EnvelopeIcon className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Modal */}
      <Modal
        isOpen={showWhatsappModal}
        onClose={() => { setShowWhatsappModal(false); setWhatsappInvoice(null); setWhatsappPhone(''); }}
        title="Enviar por WhatsApp"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Se enviará el PDF del comprobante al número indicado a través del bot de Bravos.
            </p>
          </div>

          {/* Usage counter */}
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
            <Button fullWidth onClick={handleSendWhatsapp} loading={actionLoading === 'whatsapp'} disabled={!whatsappPhone || waUsage?.remaining === 0}>
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" /> Enviar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Actions Modal */}
      <Modal
        isOpen={showActionsModal}
        onClose={() => { setShowActionsModal(false); setActionInvoice(null); }}
        title={actionInvoice ? `${(docTypeLabels[actionInvoice.document_type]?.short || 'Documento')} ${actionInvoice.series}-${String(actionInvoice.number || actionInvoice.correlative || '').padStart(8, '0')}` : 'Acciones'}
        size="sm"
      >
        {actionInvoice && (() => {
          const inv = actionInvoice;
          const hasXml = !!inv.xml_path;
          const hasCdr = !!inv.cdr_path;
          const hasPdf = !!(inv.pdf_path || (inv.sunat_response as any)?.payload?.pdf);
          const canSend = inv.sunat_status === 'pending' || inv.sunat_status === 'rejected';
          const canAnular = inv.sunat_status !== 'accepted' && inv.sunat_status !== 'annulled';

          return (
            <div className="space-y-1 py-1">
              {/* Ver detalle */}
              <button
                onClick={() => { setShowActionsModal(false); handleViewDetail(inv); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl transition"
              >
                <EyeIcon className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium">Ver detalle</p>
                  <p className="text-xs text-gray-400">Informacion completa del comprobante</p>
                </div>
              </button>

              {/* Enviar a SUNAT */}
              {canSend && (
                <button
                  onClick={async () => { setShowActionsModal(false); await handleSendToSunat(inv.id); }}
                  disabled={actionLoading === 'sunat'}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-purple-500" />
                  <div className="text-left">
                    <p className="font-medium">Enviar a SUNAT</p>
                    <p className="text-xs text-gray-400">Firmar y enviar el comprobante electronico</p>
                  </div>
                </button>
              )}

              {/* Descargar PDF */}
              {hasPdf && (
                <button
                  onClick={() => { handleDownloadPdf(inv.id); setShowActionsModal(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Descargar PDF</p>
                    <p className="text-xs text-gray-400">Representacion impresa del comprobante</p>
                  </div>
                </button>
              )}

              {/* Descargar XML */}
              {hasXml && (
                <button
                  onClick={() => { handleDownloadXml(inv.id); setShowActionsModal(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition"
                >
                  <CodeBracketIcon className="w-5 h-5 text-indigo-500" />
                  <div className="text-left">
                    <p className="font-medium">Descargar XML</p>
                    <p className="text-xs text-gray-400">Documento XML firmado digitalmente</p>
                  </div>
                </button>
              )}

              {/* Descargar CDR */}
              {hasCdr && (
                <button
                  onClick={() => { handleDownloadCdr(inv.id); setShowActionsModal(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-xl transition"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-teal-500" />
                  <div className="text-left">
                    <p className="font-medium">Descargar CDR</p>
                    <p className="text-xs text-gray-400">Constancia de recepcion SUNAT</p>
                  </div>
                </button>
              )}

              {/* Enviar por email */}
              {inv.document_model !== 'sale' && (
              <button
                onClick={() => {
                  setShowActionsModal(false);
                  setCurrentInvoice(inv as any);
                  setEmailAddress(inv.client?.email || '');
                  setShowEmailModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition"
              >
                <EnvelopeIcon className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium">Enviar por email</p>
                  <p className="text-xs text-gray-400">Enviar comprobante al cliente</p>
                </div>
              </button>
              )}

                            {/* Imprimir */}
              <button
                onClick={async () => {
                  setShowActionsModal(false);
                  if (inv.document_model === 'sale') {
                    // NV → POS overlay
                    const { currentCompany } = useAuthStore.getState();
                    const logoUrl = currentCompany?.logo
                      ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/storage/${currentCompany.logo}`
                      : undefined;
                    try {
                      await printSaleReceipt(inv.id, currentCompany!.id, currentCompany, logoUrl);
                    } catch { toast.error('Error al imprimir'); }
                  } else {
                    window.print();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#161A22] rounded-xl transition"
              >
                <PrinterIcon className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <p className="font-medium">Imprimir</p>
                  <p className="text-xs text-gray-400">{inv.document_model === 'sale' ? 'Ticket en formato ticketera' : 'Imprimir comprobante en A4'}</p>
                </div>
              </button>

              {/* Enviar por WhatsApp */}
              <button
                onClick={() => {
                  setShowActionsModal(false);
                  setWhatsappInvoice(inv);
                  setWhatsappPhone(inv.client?.phone || '');
                  setWaUsage(null);
                  setShowWhatsappModal(true);
                  const cid = useAuthStore.getState().currentCompany?.id;
                  if (cid) api.get(`/companies/${cid}/whatsapp-usage`).then(r => setWaUsage(r.data)).catch(() => {});
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition"
              >
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium">Enviar por WhatsApp</p>
                  <p className="text-xs text-gray-400">Enviar el PDF del comprobante al cliente</p>
                </div>
              </button>


              {/* Separador */}
              {canAnular && <div className="border-t border-gray-100 dark:border-[#232834] my-1" />}

              {/* Anular */}
              {canAnular && (
                <button
                  onClick={() => handleAnular(inv.id)}
                  disabled={actionLoading === 'anular'}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition"
                >
                  <TrashIcon className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Anular comprobante</p>
                    <p className="text-xs text-red-400/70">Esta accion no se puede deshacer</p>
                  </div>
                </button>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* SUNAT Queue Modal */}
      <SunatQueueModal
        isOpen={showSunatModal}
        onClose={() => setShowSunatModal(false)}
      />

      {/* Floating Button / Bottom Link */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setShowSunatModal(true)}
          className="relative flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition border border-emerald-200 dark:border-emerald-500/30 shadow-sm bg-white dark:bg-[#0D1117]"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          Conexión SUNAT
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
