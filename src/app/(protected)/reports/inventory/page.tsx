'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, Card } from '@/components/ui';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface InventoryProduct {
  id: string;
  name: string;
  code: string;
  sku?: string;
  stock: number;
  min_stock: number;
  purchase_price: number;
  sale_price: number;
  total_stock?: number;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
}

interface InventorySummary {
  total_products: number;
  total_cost_value: number;
  total_sale_value: number;
  low_stock_count: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type StockFilter = 'all' | 'low' | 'out' | 'ok';

export default function ReportsInventoryPage() {
  const { currentCompany } = useAuthStore();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    total_products: 0,
    total_cost_value: 0,
    total_sale_value: 0,
    low_stock_count: 0,
  });
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchInventory = useCallback(async () => {
    if (!currentCompany) return;
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 25 };
      if (categoryFilter) params.category_id = categoryFilter;

      const res = await api.get(`/companies/${currentCompany.id}/reports/inventory`, { params });
      const data = res.data;

      let items: InventoryProduct[] = data.data || [];

      // Client-side stock filtering
      if (stockFilter === 'low') {
        items = items.filter((p) => (p.total_stock ?? p.stock) > 0 && (p.total_stock ?? p.stock) <= p.min_stock);
      } else if (stockFilter === 'out') {
        items = items.filter((p) => (p.total_stock ?? p.stock) === 0);
      } else if (stockFilter === 'ok') {
        items = items.filter((p) => (p.total_stock ?? p.stock) > p.min_stock);
      }

      // Client-side search
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s)
        );
      }

      setProducts(items);
      setMeta(data.meta || null);
      setSummary(data.summary || {
        total_products: 0,
        total_cost_value: 0,
        total_sale_value: 0,
        low_stock_count: 0,
      });
    } catch {
      toast.error('Error al cargar reporte de inventario');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany, currentPage, categoryFilter, stockFilter, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleExport = async () => {
    if (!currentCompany) return;
    setIsExporting(true);
    try {
      // Fetch all products (sin paginación) para el export
      const res = await api.get(`/companies/${currentCompany.id}/reports/inventory`, {
        params: { per_page: 9999 },
      });
      const allProducts: InventoryProduct[] = res.data.data || products;

      const headers = ['Producto', 'Código', 'SKU', 'Categoría', 'Marca', 'Stock', 'Stock Mín.', 'P. Costo', 'P. Venta', 'Valor Stock', 'Estado'];
      const rows = allProducts.map((p) => {
        const stock = p.total_stock ?? p.stock;
        const estado = stock === 0 ? 'Sin stock' : stock <= p.min_stock ? 'Stock bajo' : 'Normal';
        return [
          p.name,
          p.code,
          p.sku || '',
          p.category?.name || '',
          p.brand?.name || '',
          stock,
          p.min_stock,
          p.purchase_price,
          p.sale_price,
          +(stock * p.purchase_price).toFixed(2),
          estado,
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = headers.map((h, i) => ({
        wch: Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      XLSX.writeFile(wb, `inventario-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Reporte exportado');
    } catch {
      toast.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  const getStockStatus = (product: InventoryProduct) => {
    const stock = product.total_stock ?? product.stock;
    if (stock === 0) return { label: 'Sin stock', variant: 'danger' as const, color: 'text-red-500' };
    if (stock <= product.min_stock) return { label: 'Stock bajo', variant: 'warning' as const, color: 'text-yellow-500' };
    return { label: 'Normal', variant: 'success' as const, color: 'text-green-500' };
  };

  const formatCurrency = (v: number) =>
    `S/ ${Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  const getStockBarWidth = (product: InventoryProduct) => {
    const stock = product.total_stock ?? product.stock;
    if (!product.min_stock) return 100;
    const pct = Math.min(100, (stock / (product.min_stock * 3)) * 100);
    return Math.max(0, pct);
  };

  const STOCK_TABS: { id: StockFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'ok', label: 'Stock OK' },
    { id: 'low', label: 'Stock Bajo' },
    { id: 'out', label: 'Sin Stock' },
  ];

  const potentialProfit = summary.total_sale_value - summary.total_cost_value;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporte de Inventario</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estado actual del stock, valorización y alertas
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => fetchInventory()} variant="secondary">
            <ArrowPathIcon className={clsx('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
            Actualizar
          </Button>
          <Button onClick={handleExport} loading={isExporting} variant="secondary">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <CubeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_products}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500">
              <CurrencyDollarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Valor Costo</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_cost_value)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
              <ChartBarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Valor Venta</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_sale_value)}</p>
            </div>
          </div>
        </Card>

        <Card className={clsx('p-4', summary.low_stock_count > 0 && 'border-yellow-300 dark:border-yellow-600/30')}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'p-2 rounded-lg',
              summary.low_stock_count > 0
                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            )}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stock Bajo</p>
              <p className={clsx(
                'text-2xl font-bold',
                summary.low_stock_count > 0 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
              )}>
                {summary.low_stock_count}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Potential profit banner */}
      {potentialProfit > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Ganancia potencial del inventario: <span className="font-bold">{formatCurrency(potentialProfit)}</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              Margen promedio: {summary.total_sale_value > 0 ? ((potentialProfit / summary.total_sale_value) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Stock filter tabs */}
      <div className="border-b border-gray-200 dark:border-[#232834]">
        <nav className="flex gap-6">
          {STOCK_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStockFilter(tab.id); setCurrentPage(1); }}
              className={clsx(
                'py-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors',
                stockFilter === tab.id
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
            placeholder="Buscar por nombre, código o SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <FunnelIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Mín.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-32">Nivel</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">P. Costo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">P. Venta</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Val. Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-zinc-700 rounded w-16"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <CubeIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const currentStock = product.total_stock ?? product.stock;
                  const stockValue = currentStock * product.purchase_price;
                  const barWidth = getStockBarWidth(product);

                  return (
                    <tr key={product.id} className={clsx(
                      'hover:bg-gray-50 dark:hover:bg-[#161A22]/50',
                      currentStock === 0 && 'bg-red-50/30 dark:bg-red-900/5',
                      currentStock > 0 && currentStock <= product.min_stock && 'bg-yellow-50/30 dark:bg-yellow-900/5',
                    )}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.code}{product.sku ? ` · ${product.sku}` : ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        {product.category ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className={clsx('px-4 py-4 text-right font-semibold text-lg', stockStatus.color)}>
                        {currentStock}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500">
                        {product.min_stock}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-24">
                          <div className="h-2 bg-gray-200 dark:bg-[#232834] rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all',
                                currentStock === 0 ? 'bg-red-500' :
                                currentStock <= product.min_stock ? 'bg-yellow-500' :
                                'bg-emerald-500'
                              )}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(product.purchase_price)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(product.sale_price)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={stockStatus.variant} size="sm">
                          {stockStatus.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals footer */}
        {!isLoading && products.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-black">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{products.length} productos mostrados</span>
              <div className="flex gap-6">
                <span className="text-gray-500">
                  Valor costo total:{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(products.reduce((acc, p) => acc + (p.total_stock ?? p.stock) * p.purchase_price, 0))}
                  </span>
                </span>
                <span className="text-gray-500">
                  Valor venta total:{' '}
                  <span className="font-semibold text-emerald-500">
                    {formatCurrency(products.reduce((acc, p) => acc + (p.total_stock ?? p.stock) * p.sale_price, 0))}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
