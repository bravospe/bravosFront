'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Card, Select, Button } from '@/components/ui';
import { useReportsStore } from '@/stores/reportsStore';
import toast from 'react-hot-toast';

// ─── Breakdown card tabs ───────────────────────────────────────────────────────
const BREAKDOWN_TABS = [
  { id: 'payment', label: 'Método de Pago' },
  { id: 'doctype', label: 'Tipo Comprobante' },
  { id: 'caja',    label: 'Caja' },
  { id: 'seller',  label: 'Vendedores' },
] as const;

type BreakdownTab = (typeof BREAKDOWN_TABS)[number]['id'];

const DOC_LABELS: Record<string, string> = {
  '01': 'Factura', '03': 'Boleta', '07': 'N. Crédito',
  '08': 'N. Débito', '00': 'N. Venta', 'null': 'Sin comprobante',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  yape: 'Yape', plin: 'Plin', yape_plin: 'Yape / Plin',
  credit: 'Crédito', mixed: 'Mixto', other: 'Otro',
};

const BAR_COLORS = ['#10B981','#6366F1','#F59E0B','#EF4444','#3B82F6','#EC4899','#8B5CF6'];

function BreakdownBar({ items, formatCurrency }: {
  items: Array<{ label: string; count: number; amount: number }>;
  formatCurrency: (v: number) => string;
}) {
  const max = Math.max(...items.map(i => i.amount), 1);
  if (!items.length) return (
    <div className="flex items-center justify-center h-full py-6">
      <p className="text-white/40 text-sm">Sin datos para este período</p>
    </div>
  );
  return (
    <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: 160 }}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-white/80 truncate max-w-[55%]">{item.label}</span>
            <span className="text-[11px] text-white/60 font-mono">{formatCurrency(item.amount)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.amount / max) * 100}%`, background: BAR_COLORS[idx % BAR_COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const reports = [
  {
    id: 'sales',
    name: 'Reporte de Ventas',
    description: 'Ventas por período, totales y tendencias',
    icon: CurrencyDollarIcon,
    color: 'blue',
  },
  {
    id: 'products',
    name: 'Reporte por Productos',
    description: 'Top productos, cantidad vendida, rentabilidad',
    icon: ChartBarIcon,
    color: 'cyan',
  },
  {
    id: 'clients',
    name: 'Reporte por Clientes',
    description: 'Top clientes, frecuencia de compra',
    icon: UsersIcon,
    color: 'orange',
  },
  {
    id: 'invoices',
    name: 'Registro de Ventas',
    description: 'Formato oficial SUNAT — Registro de ventas e ingresos',
    icon: DocumentTextIcon,
    color: 'green',
    sunat: true,
  },
  {
    id: 'purchases',
    name: 'Registro de Compras',
    description: 'Formato oficial SUNAT — Registro de compras',
    icon: DocumentTextIcon,
    color: 'purple',
    sunat: true,
  },
];

const colorClasses: Record<string, string> = {
  blue: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const ReportsPage = () => {
  const {
    salesReport,
    productReport,
    clientReport,
    isLoading,
    error,
    period,
    dateFrom,
    dateTo,
    fetchSalesReport,
    fetchProductReport,
    fetchClientReport,
    exportToExcel,
    setPeriod,
    setDateRange,
    clearError,
  } = useReportsStore();

  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('payment');

  // Carga inicial
  useEffect(() => {
    fetchSalesReport();
  }, []); // eslint-disable-line

  // Mostrar errores del store como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Re-fetch al cambiar período (excepto custom, que espera las fechas)
  const handlePeriodChange = useCallback(async (value: string) => {
    if (value === 'custom') {
      setShowCustomDatePicker(true);
      return;
    }
    setShowCustomDatePicker(false);
    setPeriod(value as typeof period);

    // Re-fetch summary siempre
    await fetchSalesReport();

    // Re-fetch reporte activo si hay uno seleccionado
    if (activeReport && activeReport !== 'invoices' && activeReport !== 'purchases') {
      if (activeReport === 'products') await fetchProductReport();
      else if (activeReport === 'clients') await fetchClientReport();
    }
  }, [activeReport, setPeriod, fetchSalesReport, fetchProductReport, fetchClientReport]);

  // Re-fetch cuando se confirman las fechas custom
  const handleCustomDateChange = useCallback(async (from: string, to: string) => {
    setDateRange(from, to);
    if (from && to) {
      await fetchSalesReport();
      if (activeReport === 'products') await fetchProductReport();
      else if (activeReport === 'clients') await fetchClientReport();
    }
  }, [activeReport, setDateRange, fetchSalesReport, fetchProductReport, fetchClientReport]);

  const handleReportClick = async (reportId: string) => {
    setActiveReport(reportId);
    try {
      if (reportId === 'sales') await fetchSalesReport();
      else if (reportId === 'products') await fetchProductReport();
      else if (reportId === 'clients') await fetchClientReport();
      // invoices y purchases se manejan vía export directo
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar reporte');
    }
  };

  const handleExport = async (reportId: string) => {
    setExportLoading(reportId);
    try {
      await exportToExcel(reportId);
      toast.success('Reporte exportado');
    } catch (err: any) {
      toast.error(err.message || 'Error al exportar');
    } finally {
      setExportLoading(null);
    }
  };

  const formatCurrency = (value: number) =>
    `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const isReportLoading = (id: string) => isLoading && activeReport === id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Genera reportes y análisis de tu negocio
        </p>
      </div>

      {/* Filtro de período */}
      <div className="bg-white dark:bg-[#161A22] rounded-2xl border border-gray-100 dark:border-[#232834] p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pills de período */}
          {[
            { value: 'today',   label: 'Hoy' },
            { value: 'week',    label: 'Semana' },
            { value: 'month',   label: 'Mes' },
            { value: 'quarter', label: 'Trimestre' },
            { value: 'year',    label: 'Año' },
            { value: 'custom',  label: 'Personalizado' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                period === p.value
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-[#1E2230] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#232834]'
              )}
            >
              {p.label}
            </button>
          ))}

          {/* Rango activo con icono de calendario */}
          {dateFrom && dateTo && !showCustomDatePicker && (
            <div className="ml-auto flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CalendarDaysIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {new Date(dateFrom + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
              </span>
              <ArrowRightIcon className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {new Date(dateTo + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Fechas custom */}
        {showCustomDatePicker && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-[#232834]">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleCustomDateChange(e.target.value, dateTo)}
                  className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleCustomDateChange(dateFrom, e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-sm"
                />
              </div>
            </div>
            {dateFrom && dateTo && (
              <div className="flex items-end">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CalendarDaysIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {new Date(dateFrom + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {new Date(dateTo + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Summary */}
      {isLoading && !salesReport ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse bg-white dark:bg-[#161A22] border border-gray-100 dark:border-[#232834] h-32" />
          ))}
          <div className="md:col-span-2 rounded-2xl animate-pulse bg-[#111827] h-32" />
        </div>
      ) : salesReport ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">

          {/* ── Card 1: Total Ventas ── */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 bottom-2 w-14 h-14 rounded-full bg-white/10" />
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1">Total Ventas</p>
            <p className="text-4xl font-bold text-white relative z-10">{salesReport.total_sales}</p>
            <p className="text-xs text-emerald-200 mt-1 relative z-10">transacciones</p>
          </div>

          {/* ── Card 2: Monto Total ── */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-[#161A22] border border-gray-100 dark:border-[#232834] shadow-sm">
            <div className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-sm">S/</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesReport.total_amount)}</p>
            <div className="mt-3 h-1 rounded-full bg-gray-100 dark:bg-[#232834]">
              <div className="h-1 rounded-full bg-green-500" style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">IGV: {formatCurrency(salesReport.total_tax)}</p>
          </div>

          {/* ── Card 3: Breakdown con tabs (span 2) ── */}
          <div className="md:col-span-2 shadow-xl rounded-[20px]">
            <div className="relative overflow-hidden rounded-[20px] bg-[#111827] border border-white/[0.04] p-5 h-full flex">
              {/* Decorative blobs */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              <div className="absolute right-0 bottom-0 w-20 h-20 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

              {/* ── Columna izquierda: título + tabs verticales (1/3) ── */}
              <div className="relative z-10 flex flex-col w-1/3 pr-5 border-r border-white/[0.06]">
                <p className="text-[17px] text-white font-semibold uppercase tracking-wider mb-4">Desglose</p>
                {/* Tabs verticales */}
                <div className="flex flex-col gap-1">
                  {BREAKDOWN_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setBreakdownTab(tab.id)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-[10px] text-[12px] font-bold transition-all duration-200',
                        breakdownTab === tab.id
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Columna derecha: chart (2/3) ── */}
              <div className="relative z-10 flex-1 pl-5 flex flex-col justify-center">
                {breakdownTab === 'payment' && (
                  <BreakdownBar
                    formatCurrency={formatCurrency}
                    items={salesReport.by_payment_method.map(i => ({
                      ...i, label: PAYMENT_LABELS[i.label] || i.label,
                    }))}
                  />
                )}
                {breakdownTab === 'doctype' && (
                  <BreakdownBar
                    formatCurrency={formatCurrency}
                    items={salesReport.by_document_type.map(i => ({
                      ...i, label: DOC_LABELS[i.label] || i.label,
                    }))}
                  />
                )}
                {breakdownTab === 'caja' && (
                  <BreakdownBar formatCurrency={formatCurrency} items={salesReport.by_cash_register} />
                )}
                {breakdownTab === 'seller' && (
                  <BreakdownBar formatCurrency={formatCurrency} items={salesReport.by_seller} />
                )}
              </div>
            </div>
          </div>

        </div>
      ) : null}

      {/* Tarjetas de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const isActive = activeReport === report.id;
          const loading = isReportLoading(report.id);
          const exporting = exportLoading === report.id;

          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-emerald-500' : 'hover:ring-2 hover:ring-emerald-500/40'}`}
              onClick={() => handleReportClick(report.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${colorClasses[report.color]}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                    {(report as any).sunat && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        SUNAT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {!(report as any).sunat ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleReportClick(report.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <EyeIcon className="w-4 h-4 mr-1.5" />
                    )}
                    {loading ? 'Cargando...' : 'Vista previa'}
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-xs">
                    <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                    Disponible en exportación
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => handleExport(report.id)}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  )}
                  {exporting ? '...' : '.xlsx'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Vista previa: Ventas */}
      {activeReport === 'sales' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Card.Header title="Top Productos" subtitle={`${dateFrom} → ${dateTo}`} />
            <Card.Body>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-zinc-700 rounded animate-pulse" />)}
                </div>
              ) : salesReport?.top_products?.length ? (
                <div className="space-y-3">
                  {salesReport.top_products.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-white text-sm">{item.name}</span>
                      </div>
                      <span className="text-gray-500 text-sm">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Sin datos en este período</p>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Top Clientes" subtitle={`${dateFrom} → ${dateTo}`} />
            <Card.Body>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-zinc-700 rounded animate-pulse" />)}
                </div>
              ) : salesReport?.top_clients?.length ? (
                <div className="space-y-3">
                  {salesReport.top_clients.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-900 dark:text-white text-sm">{item.name}</span>
                      </div>
                      <span className="text-gray-500 text-sm">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Sin datos en este período</p>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Vista previa: Productos */}
      {activeReport === 'products' && (
        <Card>
          <Card.Header title="Productos más vendidos" subtitle={`${dateFrom} → ${dateTo}`} />
          <Card.Body>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-zinc-700 rounded animate-pulse" />)}
              </div>
            ) : productReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500">Producto</th>
                      <th className="px-4 py-2 text-right text-gray-500">Cant.</th>
                      <th className="px-4 py-2 text-right text-gray-500">Monto</th>
                      <th className="px-4 py-2 text-right text-gray-500">Ganancia</th>
                      <th className="px-4 py-2 text-right text-gray-500">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                    {productReport.slice(0, 10).map((item) => (
                      <tr key={item.product_id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.product_code}</p>
                        </td>
                        <td className="px-4 py-2 text-right">{item.quantity_sold}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.total_amount)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatCurrency(item.profit)}</td>
                        <td className="px-4 py-2 text-right">{item.profit_margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Sin ventas de productos en este período</p>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Vista previa: Clientes */}
      {activeReport === 'clients' && (
        <Card>
          <Card.Header title="Clientes con más compras" subtitle={`${dateFrom} → ${dateTo}`} />
          <Card.Body>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-zinc-700 rounded animate-pulse" />)}
              </div>
            ) : clientReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500">Cliente</th>
                      <th className="px-4 py-2 text-right text-gray-500">Compras</th>
                      <th className="px-4 py-2 text-right text-gray-500">Monto Total</th>
                      <th className="px-4 py-2 text-right text-gray-500">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                    {clientReport.slice(0, 10).map((item) => (
                      <tr key={item.client_id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-900 dark:text-white">{item.client_name}</p>
                          <p className="text-xs text-gray-500">{item.document_number}</p>
                        </td>
                        <td className="px-4 py-2 text-right">{item.total_purchases}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.total_amount)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">
                          {new Date(item.last_purchase_date).toLocaleDateString('es-PE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Sin clientes con compras en este período</p>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
