'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, Badge, Button } from '@/components/ui';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';

import {
  IllustrationNewProduct,
  IllustrationPOS,
  IllustrationStats,
  IllustrationReminders
} from '@/components/dashboard/DashboardIllustrations';

const CarouselCard = ({ stats }: { stats: any }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 'new_product',
      title: 'Producto Nuevo',
      description: 'Agrega inventario rápidamente para empezar a vender.',
      Illustration: IllustrationNewProduct,
      action: { label: 'Crear ahora', href: '/products' },
      theme: 'green',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      textClass: 'text-emerald-900 dark:text-emerald-100',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      id: 'pos_sale',
      title: 'Haz tu venta',
      description: 'Ve al Punto de Venta para facturar a tus clientes.',
      Illustration: IllustrationPOS,
      action: { label: 'Ir al POS', href: '/pos' },
      theme: 'purple',
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      textClass: 'text-purple-900 dark:text-purple-100',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      id: 'monthly_stats',
      title: 'Resumen Mensual',
      description: `Ventas del mes: ${stats?.monthly_sales?.value || 'S/ 0.00'}. Sigue creciendo.`,
      Illustration: IllustrationStats,
      action: { label: 'Ver reportes', href: '/reports/sales' },
      theme: 'green',
      bgClass: 'bg-teal-50 dark:bg-teal-900/20',
      textClass: 'text-teal-900 dark:text-teal-100',
      buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
    {
      id: 'reminder',
      title: 'Recordatorios',
      description: 'Revisa tu stock bajo y tareas pendientes.',
      Illustration: IllustrationReminders,
      action: { label: 'Ver alertas', href: '/inventories/movements' },
      theme: 'purple',
      bgClass: 'bg-violet-50 dark:bg-violet-900/20',
      textClass: 'text-violet-900 dark:text-violet-100',
      buttonClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
  ];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const nextSlide = () => {
    setIsPaused(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsPaused(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];
  const IllustrationComponent = slide.Illustration;

  return (
    <Card className={`relative overflow-hidden h-full min-h-[200px] flex flex-col justify-center transition-all hover:shadow-md border-none ${slide.bgClass} p-6`}>
      {/* Background Illustration (Right Aligned - Increased Size) */}
      <div className="absolute right-[-10%] top-[-10%] bottom-[-10%] w-[60%] flex items-center justify-end overflow-hidden pointer-events-none">
        <IllustrationComponent className="h-[210%] w-auto opacity-60" />
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={prevSlide}
          className="p-1.5 rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-sm transition-colors shadow-sm"
        >
          <ChevronLeftIcon className={`w-4 h-4 ${slide.textClass}`} />
        </button>
        <button
          onClick={nextSlide}
          className="p-1.5 rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-sm transition-colors shadow-sm"
        >
          <ChevronRightIcon className={`w-4 h-4 ${slide.textClass}`} />
        </button>
      </div>

      {/* Content - Text occupies 2/3, no extra padding on content div itself as parent has p-6 */}
      <div className="relative z-10 w-2/3 pr-4">
        <h3 className={`text-2xl font-bold mb-2 ${slide.textClass}`}>
          {slide.title}
        </h3>
        <p className={`text-sm mb-0 opacity-90 ${slide.textClass}`}>
          {slide.description}
        </p>
      </div>

      {/* Action Button - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20">
        <Link href={slide.action.href}>
          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-transform hover:scale-105 shadow-md ${slide.buttonClass}`}>
            {slide.action.label}
          </span>
        </Link>
      </div>

      {/* Laser Loader (Auto-advance progress) */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black/5 dark:bg-white/5">
          <div
            key={currentSlide}
            className="h-full"
            style={{
              width: '0%',
              backgroundColor: slide.theme === 'purple' ? '#a855f7' : '#10b981',
              boxShadow: `0 0 8px ${slide.theme === 'purple' ? '#a855f7' : '#10b981'}`,
              animation: 'carousel-progress 5s linear forwards'
            }}
          />
          <style>{`
            @keyframes carousel-progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

    </Card>
  );
};

const DashboardPage = () => {
  const { user } = useAuthStore();
  const {
    stats,
    recentInvoices,
    topProducts,
    charts,
    isLoading,
    fetchDashboardStats,
    selectedPeriod,
    setSelectedPeriod,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success" size="sm">Aceptada</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rechazada</Badge>;
      case 'annulled':
        return <Badge variant="danger" size="sm">Anulada</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const statConfig: any = {
    monthly_sales: {
      name: 'Ventas del Mes',
      icon: CurrencyDollarIcon,
      color: 'blue',
    },
    documents_issued: {
      name: 'Documentos Emitidos',
      icon: DocumentTextIcon,
      color: 'green',
    },
    pos_sales: {
      name: 'Ventas POS',
      icon: ShoppingCartIcon,
      color: 'purple',
    },
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  };

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#232834]">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-[#1E2230] rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-black rounded-xl border border-transparent dark:border-[#1E2230]"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-black rounded-xl border border-transparent dark:border-[#1E2230]"></div>
          <div className="h-80 bg-gray-200 dark:bg-black rounded-xl border border-transparent dark:border-[#1E2230]"></div>
        </div>
      </div>
    );
  }

  const statKeys = Object.keys(statConfig) as Array<keyof typeof statConfig>;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buenos días, {user?.name?.split(' ')[0] || 'Usuario'}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aquí tienes el resumen de tu negocio en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black px-4 py-2 text-sm text-gray-900 dark:text-gray-200"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="week">Últimos 7 días</option>
            <option value="month">Este mes</option>
            <option value="quarter">Últimos 3 meses</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Carousel */}
        <CarouselCard stats={stats} />

        {/* Card 2: Documents Issued (Green Gradient) */}
        {stats?.documents_issued && (
          <Card className="p-5 transition-transform hover:scale-[1.02] duration-200 bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-lg shadow-emerald-500/20">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-white">
                {stats.documents_issued.changeType !== 'neutral' && (
                  stats.documents_issued.changeType === 'positive' ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )
                )}
                {stats.documents_issued.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stats.documents_issued.value}</p>
              <p className="text-sm text-white/80">Documentos Emitidos</p>
            </div>
          </Card>
        )}

        {/* Card 3: POS Sales (Purple Gradient) */}
        {stats?.pos_sales && (
          <Card className="p-5 transition-transform hover:scale-[1.02] duration-200 bg-gradient-to-b from-[#a458fa] to-[#713db8] border-none shadow-lg shadow-purple-500/20">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                <ShoppingCartIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-white">
                {stats.pos_sales.changeType !== 'neutral' && (
                  stats.pos_sales.changeType === 'positive' ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )
                )}
                {stats.pos_sales.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stats.pos_sales.value}</p>
              <p className="text-sm text-white/80">Ventas POS</p>
            </div>
          </Card>
        )}
      </div>

      {/* Sales Chart - Full Width */}
      <Card>
        <Card.Header
          title="Ventas del Mes"
          subtitle="Comparativa diaria de ventas por canal"
        />
        <Card.Body>
          <div className="h-80 w-full min-h-[320px]">
            {charts?.daily_sales && charts.daily_sales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.daily_sales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-[#1E2230]" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-gray-500"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-gray-500"
                    tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="invoices"
                    name="Facturas/Boletas"
                    stroke="#22C55E"
                    fillOpacity={1}
                    fill="url(#colorInvoices)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pos"
                    name="Ventas POS"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorPos)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#0D1117] rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay datos de ventas para mostrar
                </p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Charts Row - Monthly Comparison + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <Card>
          <Card.Header
            title="Ventas por Mes"
            subtitle="Últimos 6 meses"
          />
          <Card.Body>
            <div className="h-72 w-full min-h-[288px]">
              {charts?.monthly_comparison && charts.monthly_comparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_comparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-[#1E2230]" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="invoices" name="Facturación" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pos" name="POS" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black rounded-lg">
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card>
          <Card.Header
            title="Métodos de Pago"
            subtitle="Distribución de ventas por método"
          />
          <Card.Body>
            <div className="h-72 w-full min-h-[288px]">
              {charts?.sales_by_payment_method && charts.sales_by_payment_method.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.sales_by_payment_method}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {charts.sales_by_payment_method.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black rounded-lg">
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Document Types + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types */}
        <Card>
          <Card.Header
            title="Tipos de Documento"
            subtitle="Distribución por tipo de comprobante"
          />
          <Card.Body>
            <div className="h-64 w-full min-h-[256px]">
              {charts?.sales_by_document_type && charts.sales_by_document_type.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.sales_by_document_type}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-[#1E2230]" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Total']}
                      labelFormatter={(label) => `Tipo: ${label}`}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                    >
                      {charts.sales_by_document_type.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black rounded-lg">
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Top products */}
        <Card>
          <Card.Header
            title="Productos Más Vendidos"
            subtitle="Top 5 del mes"
            action={
              <a href="/reports/products" className="text-sm text-emerald-500 hover:text-emerald-400">
                Ver reporte
              </a>
            }
          />
          <Card.Body>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-[#1E2230] last:border-0"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-[#1E2230] rounded-lg flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.quantity} unidades vendidas
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.revenue}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay ventas registradas este mes</p>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Recent invoices */}
      <Card>
        <Card.Header
          title="Últimos Comprobantes"
          subtitle="Documentos emitidos recientemente"
          action={
            <a href="/invoices" className="text-sm text-emerald-500 hover:text-emerald-400">
              Ver todos
            </a>
          }
        />
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1E2230]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice, index) => (
                    <tr
                      key={`${invoice.id}-${index}`}
                      className="border-b border-gray-50 dark:border-[#1E2230] last:border-0 hover:bg-gray-50 dark:hover:bg-[#161A22]"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {invoice.client}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-medium ${invoice.amount.startsWith('-') ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {invoice.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.date}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      No hay comprobantes recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DashboardPage;
