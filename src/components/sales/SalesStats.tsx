'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSalesStore } from '@/stores/salesStore';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const periodOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape_plin: 'Yape/Plin',
  credit: 'Crédito',
  mixed: 'Mixto',
};

const SalesStats = () => {
  const { stats, isLoadingStats, fetchStats } = useSalesStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchStats(selectedPeriod);
  }, [fetchStats, selectedPeriod]);

  const formatCurrency = (value: number) => `S/ ${Number(value).toFixed(0)}`;

  if (isLoadingStats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-700 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-zinc-700 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-zinc-700 rounded-lg"></div>
          <div className="h-48 bg-zinc-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  // Prepare data for charts
  const dailyData = stats.daily_trend.map(d => ({
    ...d,
    name: new Date(d.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    total: Number(d.total),
  }));

  const paymentData = stats.by_payment_method.map(p => ({
    name: paymentMethodLabels[p.payment_method] || p.payment_method,
    value: Number(p.total),
    count: p.count,
  }));

  const documentData = stats.by_document_type.map(d => ({
    name: d.document_type === '01' ? 'Facturas' : d.document_type === '03' ? 'Boletas' : 'Otros',
    value: Number(d.total),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              selectedPeriod === option.value
                ? 'bg-emerald-500 text-black font-semibold'
                : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1E2230]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ventas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totals.count}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totals.total)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">IGV</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totals.tax)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Promedio</p>
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(stats.totals.average)}</p>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      {dailyData.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Tendencia de Ventas</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `S/${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => [formatCurrency(Number(value || 0)), 'Ventas']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods Pie */}
        {paymentData.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Por Método de Pago</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value) => formatCurrency(Number(value || 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Document Types Bar */}
        {documentData.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Por Tipo de Documento</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={documentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value, name) => [
                    name === 'value' ? formatCurrency(Number(value || 0)) : value,
                    name === 'value' ? 'Monto' : 'Cantidad',
                  ]}
                />
                <Bar dataKey="count" fill="#10b981" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Top Products & Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Products */}
        {stats.top_products.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Productos Más Vendidos</h4>
            <div className="space-y-3">
              {stats.top_products.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{Number(product.qty).toFixed(0)} unidades</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Sellers */}
        {stats.top_sellers.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Mejores Vendedores</h4>
            <div className="space-y-3">
              {stats.top_sellers.map((seller, index) => (
                <div key={seller.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.name}</p>
                      <p className="text-xs text-gray-500">{seller.count} ventas</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(seller.total)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SalesStats;
