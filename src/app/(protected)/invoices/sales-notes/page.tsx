'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, Modal } from '@/components/ui';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface SaleItem {
  id: string;
  product_id: string;
  product?: { name: string; code: string };
  code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
}

interface SaleNote {
  id: string;
  sale_number?: string;
  document_type: string;
  payment_method: string;
  total: number;
  tax_amount: number;
  subtotal: number;
  discount_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid';
  notes?: string;
  created_at: string;
  client?: {
    id: string;
    name?: string;
    business_name?: string;
    document_type: string;
    document_number: string;
  };
  seller?: { id: string; name: string };
  items?: SaleItem[];
  invoice?: { id: string; series: string; correlative: number; document_type: string };
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_CONFIG = {
  pending: { variant: 'warning' as const, label: 'Pendiente', icon: ClockIcon },
  completed: { variant: 'success' as const, label: 'Completada', icon: CheckCircleIcon },
  cancelled: { variant: 'danger' as const, label: 'Anulada', icon: XCircleIcon },
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
  other: 'Otro',
};

export default function SalesNotesPage() {
  const { currentCompany } = useAuthStore();
  const [notes, setNotes] = useState<SaleNote[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedNote, setSelectedNote] = useState<SaleNote | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [summary, setSummary] = useState({ total: 0, amount: 0, pending: 0 });
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [showWaInput, setShowWaInput] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waSending, setWaSending] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: 15,
        document_type: '00', // Nota de Venta (código SUNAT)
      };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (search) params.search = search;

      const res = await api.get(`/companies/${currentCompany.id}/sales`, { params });
      const data = res.data;
      const items: SaleNote[] = data.data || [];
      setNotes(items);
      setMeta(data.meta || null);

      // Compute summary
      setSummary({
        total: data.meta?.total || items.length,
        amount: items.reduce((acc, s) => acc + Number(s.total || 0), 0),
        pending: items.filter((s) => s.status === 'pending').length,
      });
    } catch {
      // Fallback: show empty state gracefully
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentPage, statusFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleViewDetail = async (note: SaleNote) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/sales/${note.id}`);
      setSelectedNote(res.data.data || note);
    } catch {
      setSelectedNote(note);
    }
    setShowDetailModal(true);
  };

  const handleDownloadTicket = async (note: SaleNote) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/sales/${note.id}/ticket`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ticket-NV-${note.sale_number || note.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Error al descargar ticket');
    }
  };

  const handleDownloadPdf = async (note: SaleNote) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/sales/${note.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NV-${note.sale_number || note.id.substring(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Error al descargar PDF');
    }
  };

  const handleSendEmail = async (note: SaleNote) => {
    const email = emailAddress.trim();
    if (!email) { toast.error('Ingresa un correo electrónico'); return; }
    setEmailSending(true);
    try {
      await api.post(`/companies/${currentCompany!.id}/sales/${note.id}/send-email`, { email });
      toast.success('Nota de venta enviada por correo');
      setShowEmailInput(false);
      setEmailAddress('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar por correo');
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendWhatsapp = async (note: SaleNote) => {
    const phone = waPhone.trim();
    if (!phone) { toast.error('Ingresa un número de WhatsApp'); return; }
    setWaSending(true);
    try {
      await api.post(`/companies/${currentCompany!.id}/sales/${note.id}/send-whatsapp`, { phone });
      toast.success('Nota de venta enviada por WhatsApp');
      setShowWaInput(false);
      setWaPhone('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar por WhatsApp');
    } finally {
      setWaSending(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatCurrency = (v: number) => `S/ ${Number(v || 0).toFixed(2)}`;

  const getStatusBadge = (status: SaleNote['status']) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas de Venta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ventas internas sin comprobante electrónico SUNAT
          </p>
        </div>
        <Button onClick={() => fetchNotes()} variant="secondary">
          <ArrowPathIcon className={clsx('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Notas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(summary.amount)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{summary.pending}</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Anulada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-zinc-700 rounded w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron notas de venta</p>
                    <p className="text-sm text-gray-400 mt-1">Las ventas registradas desde el POS aparecerán aquí</p>
                  </td>
                </tr>
              ) : (
                notes.map((note, index) => (
                  <tr key={note.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {note.sale_number || `NV-${String(index + 1).padStart(4, '0')}`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {note.client?.name || note.client?.business_name || 'Cliente General'}
                      </p>
                      {note.client?.document_number && (
                        <p className="text-xs text-gray-500">{note.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(note.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {PAYMENT_METHODS[note.payment_method] || note.payment_method}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(note.total)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(note.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(note)}
                          className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadTicket(note)}
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                          title="Imprimir Ticket"
                        >
                          <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(note)}
                          className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg"
                          title="Descargar PDF"
                        >
                          <DocumentArrowDownIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {((currentPage - 1) * meta.per_page) + 1}–{Math.min(currentPage * meta.per_page, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))} disabled={currentPage === meta.last_page}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedNote(null); setShowEmailInput(false); setEmailAddress(''); setShowWaInput(false); setWaPhone(''); }}
        title="Detalle de Nota de Venta"
        size="lg"
      >
        {selectedNote && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedNote.client?.name || selectedNote.client?.business_name || 'Cliente General'}
                </p>
                {selectedNote.client?.document_number && (
                  <p className="text-sm text-gray-500">
                    {selectedNote.client.document_type}: {selectedNote.client.document_number}
                  </p>
                )}
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-end">{getStatusBadge(selectedNote.status)}</div>
                <p className="text-xs text-gray-500">Fecha: {formatDate(selectedNote.created_at)}</p>
                <p className="text-xs text-gray-500">
                  Pago: {PAYMENT_METHODS[selectedNote.payment_method] || selectedNote.payment_method}
                </p>
              </div>
            </div>

            {selectedNote.items && selectedNote.items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Productos</h4>
                <div className="border border-gray-200 dark:border-[#232834] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-black">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-gray-500">P. Unit.</th>
                        <th className="px-3 py-2 text-right text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                      {selectedNote.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <p className="text-gray-900 dark:text-white">{item.description || item.product?.name}</p>
                            {item.product?.code && <p className="text-xs text-gray-500">{item.product.code}</p>}
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
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
                  <span>{formatCurrency(selectedNote.subtotal)}</span>
                </div>
                {selectedNote.discount_amount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento</span>
                    <span>-{formatCurrency(selectedNote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>IGV</span>
                  <span>{formatCurrency(selectedNote.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#232834]">
                  <span>Total</span>
                  <span>{formatCurrency(selectedNote.total)}</span>
                </div>
              </div>
            </div>

            {selectedNote.notes && (
              <div className="p-3 bg-gray-50 dark:bg-[#1E2230] rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Notas</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedNote.notes}</p>
              </div>
            )}

            {selectedNote.invoice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Comprobante generado</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">
                    {selectedNote.invoice.series}-{String(selectedNote.invoice.correlative).padStart(8, '0')}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-[#232834] space-y-3">
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => handleDownloadTicket(selectedNote)}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Ticket
                </Button>
                <Button variant="secondary" fullWidth onClick={() => handleDownloadPdf(selectedNote)}>
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  fullWidth
                  className="border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => { setShowWaInput(!showWaInput); setShowEmailInput(false); }}
                >
                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  className="border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => { setShowEmailInput(!showEmailInput); setShowWaInput(false); }}
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Correo
                </Button>
              </div>
              {showWaInput && (
                <div className="flex gap-2 items-center">
                  <input
                    type="tel"
                    placeholder="Ej: 987445560"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendWhatsapp(selectedNote)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-sm focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleSendWhatsapp(selectedNote)}
                    disabled={waSending}
                    className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                  >
                    {waSending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  <button onClick={() => { setShowWaInput(false); setWaPhone(''); }} className="p-2 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              {showEmailInput && (
                <div className="flex gap-2 items-center">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendEmail(selectedNote)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-sm focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleSendEmail(selectedNote)}
                    disabled={emailSending}
                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  >
                    {emailSending ? 'Enviando...' : 'Enviar'}
                  </Button>
                  <button onClick={() => { setShowEmailInput(false); setEmailAddress(''); }} className="p-2 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
