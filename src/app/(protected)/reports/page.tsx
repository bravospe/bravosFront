'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card, Select, Button } from '@/components/ui';
import { useReportsStore } from '@/stores/reportsStore';
import toast from 'react-hot-toast';

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
    description: 'Formato oficial para SUNAT',
    icon: DocumentTextIcon,
    color: 'green',
  },
  {
    id: 'purchases',
    name: 'Registro de Compras',
    description: 'Formato oficial para SUNAT',
    icon: DocumentTextIcon,
    color: 'purple',
  },
];

const colorClasses: Record<string, string> = {
  blue: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

const ReportsPage = () => {
  const {
    salesReport,
    productReport,
    clientReport,
    isLoading,
    period,
    dateFrom,
    dateTo,
    fetchSalesReport,
    fetchProductReport,
    fetchClientReport,
    exportToExcel,
    setPeriod,
    setDateRange,
  } = useReportsStore();

  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    // Fetch sales report on mount for dashboard stats
    fetchSalesReport();
  }, [fetchSalesReport]);

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setPeriod(value as typeof period);
      // Refetch current report
      if (activeReport) {
        handleReportClick(activeReport);
      }
    }
  };

  const handleReportClick = async (reportId: string) => {
    setActiveReport(reportId);

    try {
      switch (reportId) {
        case 'sales':
          await fetchSalesReport();
          break;
        case 'products':
          await fetchProductReport();
          break;
        case 'clients':
          await fetchClientReport();
          break;
        default:
          toast('Reporte no disponible aún');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar reporte');
    }
  };

  const handleExport = async (reportType: string) => {
    try {
      await exportToExcel(reportType);
      toast.success('Reporte exportado');
    } catch (err: any) {
      toast.error(err.message || 'Error al exportar');
    }
  };

  const formatCurrency = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Genera reportes y análisis de tu negocio
          </p>
        </div>
      </div>

      {/* Quick filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Período"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mes' },
                { value: 'quarter', label: 'Este trimestre' },
                { value: 'year', label: 'Este año' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />
          </div>
          {showCustomDatePicker && (
            <>
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateRange(e.target.value, dateTo)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateRange(dateFrom, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Sales Summary (always visible) */}
      {salesReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{salesReport.total_sales}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(salesReport.total_amount)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">IGV Total</p>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(salesReport.total_tax)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Ticket Promedio</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(salesReport.average_ticket)}</p>
          </Card>
        </div>
      )}

      {/* Reports grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className={`hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all ${activeReport === report.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleReportClick(report.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${colorClasses[report.color]}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {report.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={(e) => { e.stopPropagation(); handleReportClick(report.id); }}
              >
                {isLoading && activeReport === report.id ? (
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                Vista previa
              </Button>
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleExport(report.id); }}
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Data Display */}
      {activeReport === 'products' && productReport.length > 0 && (
        <Card>
          <Card.Header title="Top Productos" subtitle="Productos más vendidos en el período" />
          <Card.Body>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-black">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-right text-gray-500">Cantidad</th>
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
          </Card.Body>
        </Card>
      )}

      {activeReport === 'clients' && clientReport.length > 0 && (
        <Card>
          <Card.Header title="Top Clientes" subtitle="Clientes con más compras en el período" />
          <Card.Body>
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
          </Card.Body>
        </Card>
      )}

      {activeReport === 'sales' && salesReport?.top_products && salesReport.top_products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Card.Header title="Top Productos" />
            <Card.Body>
              <div className="space-y-3">
                {salesReport.top_products.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="text-gray-500">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Top Clientes" />
            <Card.Body>
              <div className="space-y-3">
                {salesReport.top_clients?.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="text-gray-500">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
