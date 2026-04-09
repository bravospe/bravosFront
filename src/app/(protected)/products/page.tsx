'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Tab } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  FolderOpenIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  PencilIcon as PencilIconSolid,
  TrashIcon as TrashIconSolid,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui';
import { Toggle } from '@/components/ui';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBrandStore } from '@/stores/brandStore';
import ProductCategoryDialog from '@/components/products/ProductCategoryDialog';
import ProductImportModal from '@/components/products/ProductImportModal';
import { Product, Category } from '@/types';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import axios from 'axios';
import { getApiUrl } from '@/utils/apiConfig';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = getApiUrl();

type ProductStatus = 'all' | 'active' | 'draft' | 'archived';

const STATUS_LABELS: Record<ProductStatus, string> = {
  all: 'Todo',
  active: 'Activo',
  draft: 'Borrador',
  archived: 'Archivado',
};

interface Filters {
  category_id: string;
  brand_id: string;
  type: '' | 'product' | 'service';
  tax_type: '' | 'gravado' | 'exonerado' | 'inafecto';
  stock_status: '' | 'available' | 'low' | 'out';
  price_min: string;
  price_max: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

const EMPTY_FILTERS: Filters = {
  category_id: '',
  brand_id: '',
  type: '',
  tax_type: '',
  stock_status: '',
  price_min: '',
  price_max: '',
  sort_by: 'name',
  sort_order: 'asc',
};

function countActiveFilters(f: Filters): number {
  return [
    f.category_id,
    f.brand_id,
    f.type,
    f.tax_type,
    f.stock_status,
    f.price_min,
    f.price_max,
  ].filter(Boolean).length;
}

export default function ProductsPage() {
  const router = useRouter();
  const { products, fetchProducts, deleteProduct, updateProduct, isLoading: productsLoading, meta } = useProductStore();
  const { categories, fetchCategories, deleteCategory, isLoading: categoriesLoading } = useCategoryStore();
  const { brands, fetchBrands } = useBrandStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'archive' | 'delete' | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [mainTab, setMainTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS);
  const filterRef = useRef<HTMLDivElement>(null);

  // Category Modal State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sales History Modal State
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState<any>(null);

  const { user } = useAuthStore();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page and selection when search or filters change
  useEffect(() => { setPage(1); setSelectedProducts([]); setBulkAction(''); }, [debouncedSearch, filters, statusFilter]);

  // Build fetch params from filters + status
  const buildParams = useCallback(() => {
    const params: Record<string, any> = {
      page,
      search: debouncedSearch || undefined,
      sort_by: filters.sort_by || 'name',
      sort_order: filters.sort_order || 'asc',
    };
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.brand_id) params.brand_id = filters.brand_id;
    if (filters.type) params.type = filters.type;
    if (filters.tax_type) params.tax_type = filters.tax_type;
    if (filters.stock_status) params.stock_status = filters.stock_status;
    if (filters.price_min !== '') params.price_min = parseFloat(filters.price_min);
    if (filters.price_max !== '') params.price_max = parseFloat(filters.price_max);
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [page, debouncedSearch, filters, statusFilter]);

  useEffect(() => {
    fetchProducts(buildParams());
  }, [buildParams, fetchProducts]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFilters]);

  const handleOpenFilters = () => {
    setPendingFilters(filters);
    setShowFilters((v) => !v);
  };

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const cleared = { ...EMPTY_FILTERS };
    setPendingFilters(cleared);
    setFilters(cleared);
    setShowFilters(false);
  };

  const activeFilterCount = countActiveFilters(filters);

  const fetchProductHistory = async (product: Product, page = 1) => {
    const companyId = user?.current_company_id || user?.companies?.[0]?.id;
    if (!companyId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/products/${product.id}/sales-history`, {
        params: { page, per_page: 10 },
      });
      setHistoryData(res.data.data || []);
      setHistoryMeta(res.data.meta || null);
      setHistoryPage(page);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = (product: Product) => {
    setHistoryProduct(product);
    fetchProductHistory(product, 1);
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;
    if (bulkAction === 'delete') {
      if (!confirm(`¿Eliminar ${selectedProducts.length} producto${selectedProducts.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return;
    }
    setBulkLoading(true);
    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedProducts.map(id => deleteProduct(id)));
      } else {
        const patch =
          bulkAction === 'activate'   ? { is_active: true } :
          bulkAction === 'deactivate' ? { is_active: false } :
          /* archive */                 { is_active: false, status: 'archived' };
        await Promise.all(selectedProducts.map(id => updateProduct(id, patch)));
      }
      setSelectedProducts([]);
      setBulkAction('');
      fetchProducts(buildParams());
    } catch (e) {
      console.error('Error en acción masiva:', e);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCreateProduct = () => router.push('/products/create');
  const handleEditProduct = (product: Product) => router.push('/products/' + product.id + '/edit');

  const handleExport = async () => {
    const { token } = useAuthStore.getState();
    const companyId = user?.current_company_id || user?.companies?.[0]?.id;
    if (!companyId) return;
    try {
      const res = await axios.get(`${API_URL}/companies/${companyId}/products/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `productos_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { console.error('Error al exportar'); }
  };

  // Category Handlers
  const handleCreateCategory = () => { setEditingCategory(null); setIsCategoryDialogOpen(true); };
  const handleEditCategory = (category: Category) => { setEditingCategory(category); setIsCategoryDialogOpen(true); };
  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      await deleteCategory(id);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    // Toggle between active ↔ draft (archived stays archived until explicit action)
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    const { user, token } = (await import('@/stores/authStore')).useAuthStore.getState();
    if (!token || !user) return;
    const companyId = user.current_company_id || user.companies?.[0]?.id;
    if (!companyId) return;
    try {
      const { default: axios } = await import('axios');
      const { getApiUrl } = await import('@/utils/apiConfig');
      const API_URL = getApiUrl();
      await axios.put(`${API_URL}/companies/${companyId}/products/${product.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProducts(buildParams());
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const statusTabs = [
    { key: 'all' as ProductStatus, label: 'Todo' },
    { key: 'active' as ProductStatus, label: 'Activo' },
    { key: 'draft' as ProductStatus, label: 'Borrador' },
    { key: 'archived' as ProductStatus, label: 'Archivado' },
  ];

  const renderCategoryHierarchy = (parentId: string | null = null, level = 0) => {
    const subset = categories.filter((c) => (parentId ? c.parent_id === parentId : !c.parent_id));
    if (subset.length === 0) return null;
    return subset.map((category) => (
      <div key={category.id} className="relative">
        <div className={clsx(
          'flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230]/50 transition-colors',
          level > 0 && 'ml-6 border-l border-gray-200 dark:border-[#232834]'
        )}>
          <div className="flex items-center gap-3">
            <div className="text-gray-400">
              {categories.filter((c) => c.parent_id === category.id).length > 0 ? (
                <FolderOpenIcon className="w-5 h-5 text-emerald-500" />
              ) : (
                <FolderIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
              {category.description && (
                <span className="ml-2 text-sm text-gray-500 truncate max-w-xs inline-block align-bottom">
                  - {category.description}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleEditCategory(category)} className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Editar">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteCategory(category.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {renderCategoryHierarchy(category.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-0">
      <Tab.Group selectedIndex={mainTab} onChange={setMainTab}>
        <div className="border-b border-gray-200 dark:border-[#232834] mb-4">
          <Tab.List className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            <Tab className={({ selected }) => clsx('py-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none whitespace-nowrap', selected ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')}>
              Productos
            </Tab>
            <Tab className={({ selected }) => clsx('py-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none flex items-center gap-1.5 whitespace-nowrap', selected ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')}>
              <FolderIcon className="w-4 h-4" /> Categorías
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels>
          {/* ==================== PRODUCTS PANEL ==================== */}
          <Tab.Panel>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Productos</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleExport} title="Exportar productos"
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setIsImportModalOpen(true)} title="Importar productos"
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                <Button onClick={handleCreateProduct} size="sm">
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  <span className="hidden xs:inline">Agregar</span>
                  <span className="hidden sm:inline"> producto</span>
                </Button>
              </div>
            </div>

            {/* Products Card */}
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-[#232834]">
              {/* Status Filter Tabs */}
              <div className="border-b border-gray-200 dark:border-[#232834] overflow-x-auto">
                <nav className="flex space-x-4 sm:space-x-6 px-4 min-w-max" aria-label="Tabs">
                  {statusTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                      className={clsx('py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        statusFilter === tab.key
                          ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400')}>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search, Filter and Sort Bar */}
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-[#232834]">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[160px]">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Buscar productos" value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  {/* Filter Button */}
                  <div className="relative" ref={filterRef}>
                    <button onClick={handleOpenFilters}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors',
                        activeFilterCount > 0
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border-gray-300 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#232834]'
                      )}>
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Filtros</span>
                      {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-emerald-600 text-white rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    {/* Filter Panel Dropdown */}
                    {showFilters && (
                      <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#232834] rounded-xl shadow-xl z-30 p-4 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Filtros</span>
                          <button onClick={() => setShowFilters(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tipo de producto */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tipo</label>
                          <div className="flex gap-2 flex-wrap">
                            {[{ v: '', l: 'Todos' }, { v: 'product', l: 'Producto' }, { v: 'service', l: 'Servicio' }].map(({ v, l }) => (
                              <button key={v} onClick={() => setPendingFilters(f => ({ ...f, type: v as any }))}
                                className={clsx('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                                  pendingFilters.type === v
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                    : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#232834] border-gray-300 dark:border-[#2E3547] hover:bg-gray-50')}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Categoría */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Categoría</label>
                          <select value={pendingFilters.category_id}
                            onChange={(e) => setPendingFilters(f => ({ ...f, category_id: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white">
                            <option value="">Todas las categorías</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Marca */}
                        {brands.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Marca</label>
                            <select value={pendingFilters.brand_id}
                              onChange={(e) => setPendingFilters(f => ({ ...f, brand_id: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white">
                              <option value="">Todas las marcas</option>
                              {brands.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Precio */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Precio de venta (S/)</label>
                          <div className="flex items-center gap-2">
                            <input type="number" placeholder="Mín" min="0" step="0.01"
                              value={pendingFilters.price_min}
                              onChange={(e) => setPendingFilters(f => ({ ...f, price_min: e.target.value }))}
                              className="w-1/2 px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input type="number" placeholder="Máx" min="0" step="0.01"
                              value={pendingFilters.price_max}
                              onChange={(e) => setPendingFilters(f => ({ ...f, price_max: e.target.value }))}
                              className="w-1/2 px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            />
                          </div>
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Estado de stock</label>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { v: '', l: 'Todos' },
                              { v: 'available', l: 'Con stock' },
                              { v: 'low', l: 'Bajo stock' },
                              { v: 'out', l: 'Sin stock' },
                            ].map(({ v, l }) => (
                              <button key={v} onClick={() => setPendingFilters(f => ({ ...f, stock_status: v as any }))}
                                className={clsx('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                                  pendingFilters.stock_status === v
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                    : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#232834] border-gray-300 dark:border-[#2E3547] hover:bg-gray-50')}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tipo de impuesto */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tipo de impuesto</label>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { v: '', l: 'Todos' },
                              { v: 'gravado', l: 'Gravado' },
                              { v: 'exonerado', l: 'Exonerado' },
                              { v: 'inafecto', l: 'Inafecto' },
                            ].map(({ v, l }) => (
                              <button key={v} onClick={() => setPendingFilters(f => ({ ...f, tax_type: v as any }))}
                                className={clsx('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                                  pendingFilters.tax_type === v
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                    : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-[#232834] border-gray-300 dark:border-[#2E3547] hover:bg-gray-50')}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Ordenar */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Ordenar por</label>
                          <div className="flex gap-2">
                            <select value={pendingFilters.sort_by}
                              onChange={(e) => setPendingFilters(f => ({ ...f, sort_by: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white">
                              <option value="name">Nombre</option>
                              <option value="sale_price">Precio de venta</option>
                              <option value="purchase_price">Precio de compra</option>
                              <option value="created_at">Fecha de creación</option>
                              <option value="code">Código</option>
                            </select>
                            <button onClick={() => setPendingFilters(f => ({ ...f, sort_order: f.sort_order === 'asc' ? 'desc' : 'asc' }))}
                              className="px-3 py-2 text-sm border border-gray-300 dark:border-[#2E3547] rounded-lg bg-white dark:bg-[#232834] text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                              title={pendingFilters.sort_order === 'asc' ? 'Ascendente' : 'Descendente'}>
                              {pendingFilters.sort_order === 'asc' ? '↑ Asc' : '↓ Desc'}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-[#232834]">
                          <button onClick={handleClearFilters}
                            className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#2E3547] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors">
                            Limpiar
                          </button>
                          <button onClick={handleApplyFilters}
                            className="flex-1 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sort quick button */}
                  <button
                    onClick={() => setFilters(f => ({ ...f, sort_order: f.sort_order === 'asc' ? 'desc' : 'asc' }))}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] transition-colors"
                    title={filters.sort_order === 'asc' ? 'Orden ascendente' : 'Orden descendente'}>
                    <ArrowsUpDownIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Ordenar</span>
                  </button>
                </div>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {filters.category_id && (
                      <FilterChip label={`Cat: ${categories.find(c => c.id === filters.category_id)?.name || filters.category_id}`}
                        onRemove={() => setFilters(f => ({ ...f, category_id: '' }))} />
                    )}
                    {filters.brand_id && (
                      <FilterChip label={`Marca: ${brands.find(b => b.id === filters.brand_id)?.name || filters.brand_id}`}
                        onRemove={() => setFilters(f => ({ ...f, brand_id: '' }))} />
                    )}
                    {filters.type && (
                      <FilterChip label={filters.type === 'product' ? 'Producto' : 'Servicio'}
                        onRemove={() => setFilters(f => ({ ...f, type: '' }))} />
                    )}
                    {filters.tax_type && (
                      <FilterChip label={`IGV: ${filters.tax_type}`} onRemove={() => setFilters(f => ({ ...f, tax_type: '' }))} />
                    )}
                    {filters.stock_status && (
                      <FilterChip label={{ available: 'Con stock', low: 'Bajo stock', out: 'Sin stock' }[filters.stock_status] || filters.stock_status}
                        onRemove={() => setFilters(f => ({ ...f, stock_status: '' }))} />
                    )}
                    {(filters.price_min || filters.price_max) && (
                      <FilterChip
                        label={`S/ ${filters.price_min || '0'} — ${filters.price_max || '∞'}`}
                        onRemove={() => setFilters(f => ({ ...f, price_min: '', price_max: '' }))} />
                    )}
                    <button onClick={handleClearFilters} className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      Limpiar todo
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Action Bar */}
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white border-b border-gray-700 dark:border-gray-200">
                  {/* Count + deselect */}
                  <button onClick={() => setSelectedProducts([])} className="flex items-center gap-1.5 text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 transition-colors mr-1">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-white dark:text-gray-900 whitespace-nowrap">
                    {selectedProducts.length} seleccionado{selectedProducts.length > 1 ? 's' : ''}
                  </span>
                  <div className="w-px h-4 bg-gray-600 dark:bg-gray-300 mx-1" />
                  {/* Action select */}
                  <select
                    value={bulkAction}
                    onChange={e => setBulkAction(e.target.value as typeof bulkAction)}
                    className="text-sm border border-gray-600 dark:border-gray-300 rounded-lg bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-gray-900"
                  >
                    <option value="">Seleccionar acción…</option>
                    <option value="activate">✓ Activar</option>
                    <option value="deactivate">○ Desactivar</option>
                    <option value="archive">⊟ Archivar</option>
                    <option value="delete">✕ Eliminar</option>
                  </select>
                  {/* Apply button */}
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || bulkLoading}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      bulkAction === 'delete'
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {bulkLoading
                      ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : bulkAction === 'activate'   ? <CheckCircleIcon className="w-3.5 h-3.5" />
                        : bulkAction === 'deactivate' ? <NoSymbolIcon className="w-3.5 h-3.5" />
                          : bulkAction === 'archive'   ? <ArchiveBoxIcon className="w-3.5 h-3.5" />
                            : bulkAction === 'delete'    ? <TrashIcon className="w-3.5 h-3.5" />
                              : null}
                    Aplicar
                  </button>
                </div>
              )}

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
                  <thead className="bg-gray-50 dark:bg-[#1E2230]/50">
                    <tr>
                      <th scope="col" className="w-10 px-3 py-3 hidden sm:table-cell">
                        <input type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 dark:border-[#232834] text-gray-900 focus:ring-gray-900 dark:bg-[#232834]"
                        />
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                        Estado
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Stock
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Precio
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                        Tipo de venta
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                        Marca
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                        Ventas
                      </th>
                      <th scope="col" className="w-10 px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
                    {productsLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Cargando productos...
                          </div>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-[#1E2230] rounded-lg flex items-center justify-center mb-3">
                              <FolderIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">No se encontraron productos</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              Intenta ajustar los filtros o crea un nuevo producto
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/50 transition-colors">
                          {/* Checkbox */}
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <input type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-[#232834] text-gray-900 focus:ring-gray-900 dark:bg-[#232834]"
                            />
                          </td>
                          {/* Product */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-[#1E2230] rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-[#232834]">
                                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" fallbackIcon="package" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px] lg:max-w-xs">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.code}</p>
                                {/* Mobile: show stock inline */}
                                <p className="text-xs text-gray-400 dark:text-gray-500 md:hidden mt-0.5">
                                  <span className={(product.stock || 0) <= (product.min_stock || 0) ? 'text-red-500' : ''}>
                                    {product.stock || 0} en stock
                                  </span>
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Toggle checked={product.is_active ?? true} onChange={() => handleToggleStatus(product)} size="sm" />
                          </td>
                          {/* Stock */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={clsx('text-sm', (product.stock || 0) <= (product.min_stock || 0) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white')}>
                              {product.stock || 0}
                            </span>
                          </td>
                          {/* Precio */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                              S/ {Number(product.sale_price).toFixed(2)}
                            </span>
                          </td>
                          {/* Tipo de venta */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{product.unit_type || 'Unidad'}</span>
                          </td>
                          {/* Marca */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{product.brand?.name || '—'}</span>
                          </td>
                          {/* Rendimiento de ventas */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <SalesBars count={(product as any).sales_count ?? 0} />
                          </td>
                          {/* Actions */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleOpenHistory(product)}
                                className="p-1.5 text-blue-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded transition-colors" title="Historial de ventas">
                                <ClockIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditProduct(product)}
                                className="p-1.5 text-emerald-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded transition-colors" title="Editar">
                                <PencilIconSolid className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-red-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded transition-colors" title="Eliminar">
                                <TrashIconSolid className="w-4 h-4" />
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
              {meta && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="hidden sm:inline">
                      Mostrando {(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      ← Ant.
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {meta.current_page} / {meta.last_page}
                    </span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.last_page}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Sig. →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* ==================== CATEGORIES PANEL ==================== */}
          <Tab.Panel>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Categorías</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra categorías y subcategorías para tus productos</p>
              </div>
              <Button onClick={handleCreateCategory} size="sm">
                <PlusIcon className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Nueva </span>Categoría
              </Button>
            </div>
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-[#232834] overflow-hidden">
              {categoriesLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando categorías...
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-[#1E2230] rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FolderIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">No hay categorías creadas</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Crea tu primera categoría para organizar tus productos</p>
                  <Button variant="secondary" size="sm" onClick={handleCreateCategory}>Crear primera categoría</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#1E2230]">{renderCategoryHierarchy()}</div>
              )}
            </div>
          </Tab.Panel>

        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <ProductCategoryDialog isOpen={isCategoryDialogOpen} onClose={() => setIsCategoryDialogOpen(false)} category={editingCategory} />
      <ProductImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImported={() => fetchProducts(buildParams())} />

      {/* Sales History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setHistoryProduct(null)} />
          <div className="relative bg-white dark:bg-[#0F1117] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-[#232834]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-[#232834]">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Historial de ventas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{historyProduct.name}</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-20">
                  <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <ClockIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Este producto no tiene ventas registradas</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100 dark:divide-[#1E2230]">
                  <thead className="bg-gray-50 dark:bg-[#1E2230]/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comprobante</th>
                      <th className="px-4 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                      <th className="px-4 sm:px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant.</th>
                      <th className="px-4 sm:px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">P. unit.</th>
                      <th className="px-4 sm:px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#0F1117] divide-y divide-gray-100 dark:divide-[#1E2230]">
                    {historyData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/40 transition-colors">
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap w-fit',
                              row.source === 'comprobante' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                              {row.source === 'comprobante' ? 'Comprobante' : 'Nota de Venta'}
                            </span>
                            <span className="text-xs text-gray-900 dark:text-white font-mono">{row.number}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[180px] truncate hidden sm:table-cell">{row.client || '—'}</td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-gray-900 dark:text-white text-right tabular-nums">{Number(row.quantity).toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-gray-900 dark:text-white text-right tabular-nums hidden sm:table-cell">S/ {Number(row.unit_price).toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right tabular-nums">S/ {Number(row.total).toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                          {row.created_at ? format(parseISO(row.created_at), 'dd MMM yyyy', { locale: es }) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => { setHistoryProduct(null); router.push(`/invoices?open=${row.uuid}`); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Ver detalle">
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {historyMeta && (
              <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {historyMeta.total} registro{historyMeta.total !== 1 ? 's' : ''}
                  {historyMeta.last_page > 1 && ` · Pág. ${historyMeta.current_page}/${historyMeta.last_page}`}
                </span>
                {historyMeta.last_page > 1 && (
                  <div className="flex gap-2">
                    <button onClick={() => fetchProductHistory(historyProduct, historyPage - 1)} disabled={historyPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Anterior
                    </button>
                    <button onClick={() => fetchProductHistory(historyProduct, historyPage + 1)} disabled={historyPage === historyMeta.last_page}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#232834] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Battery-style sales performance indicator (4 equal bars) */
function SalesBars({ count }: { count: number }) {
  const filled = count === 0 ? 0 : count <= 5 ? 1 : count <= 20 ? 2 : count <= 50 ? 3 : 4;
  const color = filled === 4 ? 'bg-green-500' : filled === 3 ? 'bg-green-400' : filled === 2 ? 'bg-yellow-400' : 'bg-orange-400';
  return (
    <div className="flex items-center gap-[3px]" title={count > 0 ? `${count} venta${count !== 1 ? 's' : ''}` : 'Sin ventas'}>
      <div className="flex items-center gap-[2px]">
        {[1, 2, 3, 4].map((bar) => (
          <div key={bar} className={clsx('w-[3.5px] h-[10px] rounded-[1px]', bar <= filled ? color : 'bg-gray-200 dark:bg-gray-700')} />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 tabular-nums w-6 text-right">{count > 0 ? count : '—'}</span>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-[#232834]">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full">
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}
