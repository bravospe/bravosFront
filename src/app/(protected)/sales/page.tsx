'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Modal, Badge } from '@/components/ui';
import { useSalesStore, type SaleWithRelations } from '@/stores/salesStore';
import SaleDetailModal from '@/components/sales/SaleDetailModal';
import SalesStats from '@/components/sales/SalesStats';
import toast from 'react-hot-toast';

const periodOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
  { value: 'custom', label: 'Personalizado' },
];

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape_plin: 'Yape/Plin',
  credit: 'Crédito',
  mixed: 'Mixto',
};

const SalesPage = () => {
  // Main sales page component
  const {
    sales,
    summary,
    meta,
    filters,
    isLoading,
    isExporting,
    fetchSales,
    getSale,
    cancelSale,
    exportSales,
    setFilters,
    resetFilters,
    setCurrentSale,
    currentSale,
  } = useSalesStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load sales on mount and filter change
  useEffect(() => {
    fetchSales(currentPage);
  }, [fetchSales, currentPage, filters]);

  const handleViewDetail = async (sale: SaleWithRelations) => {
    try {
      await getSale(sale.id);
      setShowDetail(true);
    } catch {
      toast.error('Error al cargar detalle');
    }
  };

  const handleCancelSale = async (sale: SaleWithRelations) => {
    if (!confirm('¿Estás seguro de anular esta venta?')) return;
    
    setActionLoading(sale.id);
    try {
      await cancelSale(sale.id);
      toast.success('Venta anulada correctamente');
      fetchSales(currentPage);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Error al anular venta');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePeriodChange = (period: string) => {
    setFilters({ period: period as typeof filters.period, date_from: undefined, date_to: undefined });
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `S/ ${Number(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'danger' | 'warning'; label: string; icon: typeof CheckCircleIcon }> = {
      completed: { variant: 'success', label: 'Completada', icon: CheckCircleIcon },
      cancelled: { variant: 'danger', label: 'Anulada', icon: XCircleIcon },
      pending: { variant: 'warning', label: 'Pendiente', icon: ClockIcon },
    };
    const { variant, label, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === '01' ? 'Factura' : type === '03' ? 'Boleta' : 'S/D';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Ventas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consulta y gestiona todas las ventas realizadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportSales('excel')} disabled={isExporting}>
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Exportar
          </Button>
          <Button variant="secondary" onClick={() => setShowStats(true)}>
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Estadísticas
          </Button>
          <Button onClick={() => fetchSales(1)} variant="secondary">
            <ArrowPathIcon className={clsx("w-5 h-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <ShoppingCartIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transacciones</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_transactions}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BanknotesIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Ventas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_amount)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <DocumentArrowDownIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">IGV Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_tax)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <UserIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Promedio</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.average_ticket)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePeriodChange(option.value)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              filters.period === option.value
                ? 'bg-emerald-500 text-black font-semibold'
                : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1E2230]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, documento..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            value={filters.search || ''}
            onChange={(e) => {
              setFilters({ search: e.target.value });
              setCurrentPage(1);
            }}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
        {(filters.payment_method || filters.seller_id || filters.status) && (
          <Button variant="secondary" onClick={resetFilters}>
            <XMarkIcon className="w-5 h-5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método de Pago
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.payment_method || ''}
                onChange={(e) => setFilters({ payment_method: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="yape_plin">Yape/Plin</option>
                <option value="credit">Crédito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.status || ''}
                onChange={(e) => setFilters({ status: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Anulada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo Documento
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                value={filters.document_type || ''}
                onChange={(e) => setFilters({ document_type: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                <option value="03">Boleta</option>
                <option value="01">Factura</option>
              </select>
            </div>
            {filters.period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({ date_from: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({ date_to: e.target.value || undefined })}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Sales Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Fecha / SUNAT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Vendedor
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Método
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-28"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-32"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <ShoppingCartIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    No se encontraron ventas para este período
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(sale.created_at)}
                        </span>
                      </div>
                      {sale.invoice && (
                        (sale.invoice as any).accepted_at ? (
                          <div className="flex items-center gap-1 mt-0.5 ml-6">
                            <CheckCircleIcon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              {new Date((sale.invoice as any).accepted_at).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-0.5 ml-6">
                            <ClockIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                            <span className="text-[11px] text-yellow-600 dark:text-yellow-400">Pendiente SUNAT</span>
                          </div>
                        )
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {sale.invoice ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 mb-1">
                            {getDocumentTypeLabel(sale.invoice.document_type)}
                          </span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.invoice.series}-{sale.invoice.correlative}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin comprobante</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {sale.client?.name || 'Cliente General'}
                      </p>
                      {sale.client?.document_number && (
                        <p className="text-xs text-gray-500">{sale.client.document_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {sale.seller?.name || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-blue-700 dark:text-blue-300">
                        {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(sale)}
                          className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => handleCancelSale(sale)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Anular venta"
                            disabled={actionLoading === sale.id}
                          >
                            {actionLoading === sale.id ? (
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                              <XCircleIcon className="w-5 h-5" />
                            )}
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
              Mostrando {((currentPage - 1) * meta.per_page) + 1} a {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
                disabled={currentPage === meta.last_page}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setCurrentSale(null); }}
        sale={currentSale}
      />

      {/* Stats Modal */}
      <Modal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title="Estadísticas de Ventas"
        size="xl"
      >
        <SalesStats />
      </Modal>
    </div>
  );
};

export default SalesPage;
