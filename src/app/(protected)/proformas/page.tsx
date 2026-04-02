'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightCircleIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, Modal } from '@/components/ui';
import CreateQuotationModal from '@/components/invoices/CreateQuotationModal';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface QuotationItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
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
  };
  seller?: {
    id: string;
    name: string;
  };
  items?: QuotationItem[];
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_CONFIG = {
  draft: { variant: 'secondary' as const, label: 'Borrador', icon: DocumentTextIcon },
  sent: { variant: 'info' as const, label: 'Enviada', icon: ArrowPathIcon },
  accepted: { variant: 'success' as const, label: 'Aceptada', icon: CheckCircleIcon },
  rejected: { variant: 'danger' as const, label: 'Rechazada', icon: XCircleIcon },
  converted: { variant: 'warning' as const, label: 'Convertida', icon: DocumentCheckIcon },
};

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'draft', label: 'Borradores' },
  { id: 'sent', label: 'Enviadas' },
  { id: 'accepted', label: 'Aceptadas' },
  { id: 'converted', label: 'Convertidas' },
];

export default function ProformasPage() {
  const { currentCompany } = useAuthStore();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDocType, setConvertDocType] = useState<'01' | '03'>('01');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchQuotations = useCallback(async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, per_page: 15 };
      if (activeTab !== 'all') params.filter = { status: activeTab } as any;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get(`/companies/${currentCompany.id}/quotations`, { params });
      const data = res.data;
      setQuotations(data.data || []);
      setMeta(data.meta || null);
    } catch {
      toast.error('Error al cargar proformas');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentPage, activeTab, dateFrom, dateTo]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleViewDetail = async (q: Quotation) => {
    try {
      const res = await api.get(`/companies/${currentCompany!.id}/quotations/${q.id}`);
      setSelectedQuotation(res.data.data || q);
      setShowDetailModal(true);
    } catch {
      setSelectedQuotation(q);
      setShowDetailModal(true);
    }
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (q: Quotation) => {
    if (!confirm(`¿Eliminar proforma ${q.number}?`)) return;
    if (!currentCompany) return;
    try {
      await api.delete(`/companies/${currentCompany.id}/quotations/${q.id}`);
      toast.success('Proforma eliminada');
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const filtered = quotations.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.number.toLowerCase().includes(s) ||
      q.client?.name?.toLowerCase().includes(s) ||
      q.client?.business_name?.toLowerCase().includes(s) ||
      q.client?.document_number?.includes(s)
    );
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatCurrency = (v: number, currency = 'PEN') =>
    `${currency === 'USD' ? '$' : 'S/'} ${Number(v || 0).toFixed(2)}`;

  const getStatusBadge = (status: Quotation['status']) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  const isExpired = (q: Quotation) =>
    q.status === 'sent' && new Date(q.validity_date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proformas / Cotizaciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona cotizaciones y conviértelas a comprobantes electrónicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchQuotations()} variant="secondary">
            <ArrowPathIcon className={clsx('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
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
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={clsx(
                'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o número..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Emisión</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vencimiento</th>
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
                        <div className="h-4 bg-zinc-700 rounded w-24"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron proformas</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-4">
                      <span className="font-mono font-medium text-gray-900 dark:text-white">{q.number}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-900 dark:text-white">
                        {q.client?.name || q.client?.business_name || 'Sin cliente'}
                      </p>
                      {q.client?.document_number && (
                        <p className="text-xs text-gray-500">{q.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-sm">
                      {formatDate(q.issue_date)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={clsx(
                        isExpired(q) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {formatDate(q.validity_date)}
                        {isExpired(q) && <span className="ml-1 text-xs">(Vencida)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(q.total, q.currency)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(q)}
                          className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {!['converted', 'rejected'].includes(q.status) && (
                          <button
                            onClick={() => { setSelectedQuotation(q); setShowConvertModal(true); }}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Convertir a comprobante"
                          >
                            <ArrowRightCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        {q.status !== 'converted' && (
                          <button
                            onClick={() => handleDelete(q)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
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
        onClose={() => { setShowDetailModal(false); setSelectedQuotation(null); }}
        title={selectedQuotation ? `Proforma ${selectedQuotation.number}` : 'Detalle'}
        size="lg"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedQuotation.client?.name || selectedQuotation.client?.business_name || 'Sin cliente'}
                </p>
                {selectedQuotation.client?.document_number && (
                  <p className="text-sm text-gray-500">
                    {selectedQuotation.client.document_type}: {selectedQuotation.client.document_number}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase mb-1">Estado</p>
                <div className="flex justify-end">{getStatusBadge(selectedQuotation.status)}</div>
                <p className="text-xs text-gray-500 mt-2">
                  Válida hasta: <span className="font-medium">{formatDate(selectedQuotation.validity_date)}</span>
                </p>
              </div>
            </div>

            {selectedQuotation.items && selectedQuotation.items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Productos</h4>
                <div className="border border-gray-200 dark:border-[#232834] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-black">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500">Producto</th>
                        <th className="px-3 py-2 text-right text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-gray-500">P. Unit.</th>
                        <th className="px-3 py-2 text-right text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                      {selectedQuotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">{item.product_name}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price, selectedQuotation.currency)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total, selectedQuotation.currency)}</td>
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
                  <span>{formatCurrency(selectedQuotation.subtotal, selectedQuotation.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>IGV (18%)</span>
                  <span>{formatCurrency(selectedQuotation.tax_igv, selectedQuotation.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#232834]">
                  <span>Total</span>
                  <span>{formatCurrency(selectedQuotation.total, selectedQuotation.currency)}</span>
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
                <Button
                  onClick={() => { setShowConvertModal(true); }}
                  className="flex-1"
                >
                  <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
                  Convertir a Comprobante
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Quotation Modal */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { fetchQuotations(); setShowCreateModal(false); }}
      />

      {/* Convert Modal */}
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
            <button
              onClick={() => setConvertDocType('01')}
              className={clsx(
                'p-4 rounded-lg border-2 text-center transition-colors',
                convertDocType === '01'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-gray-200 dark:border-[#232834] hover:border-gray-300'
              )}
            >
              <DocumentCheckIcon className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-medium text-gray-900 dark:text-white">Factura</p>
              <p className="text-xs text-gray-500">Tipo 01</p>
            </button>
            <button
              onClick={() => setConvertDocType('03')}
              className={clsx(
                'p-4 rounded-lg border-2 text-center transition-colors',
                convertDocType === '03'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-gray-200 dark:border-[#232834] hover:border-gray-300'
              )}
            >
              <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium text-gray-900 dark:text-white">Boleta</p>
              <p className="text-xs text-gray-500">Tipo 03</p>
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowConvertModal(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleConvert} loading={actionLoading === 'convert'}>
              <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
              Convertir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
