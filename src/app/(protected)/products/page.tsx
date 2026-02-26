'use client';

import { useEffect, useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  SwatchIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { Toggle } from '@/components/ui';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import ProductCategoryDialog from '@/components/products/ProductCategoryDialog';
import AttributesManager from '@/components/settings/AttributesManager';
import { Product, Category } from '@/types';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

type ProductStatus = 'all' | 'active' | 'draft' | 'archived';

export default function ProductsPage() {
  const router = useRouter();
  const { products, fetchProducts, deleteProduct, updateProduct, isLoading: productsLoading, meta } = useProductStore();
  const { categories, fetchCategories, deleteCategory, isLoading: categoriesLoading } = useCategoryStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState(0); // 0: Products, 1: Categories, 2: Attributes

  // Category Modal State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchProducts({ page, search });
  }, [page, search, fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter products by status
  const filteredProducts = products.filter((product) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return product.is_active === true;
    if (statusFilter === 'draft') return product.is_active === false;
    if (statusFilter === 'archived') return product.is_active === false; // Adjust based on your data model
    return true;
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Product Handlers
  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  const handleCreateProduct = () => {
    router.push('/products/create');
  };

  const handleEditProduct = (product: Product) => {
    router.push('/products/' + product.id + '/edit');
  };

  // Category Handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      await deleteCategory(id);
    }
  };

  // Status toggle handler — optimistic update to avoid full list re-render
  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.is_active;

    // Optimistic: update local state immediately
    const { user, token } = (await import('@/stores/authStore')).useAuthStore.getState();
    if (!token || !user) return;

    const companyId = user.current_company_id || user.companies?.[0]?.id;
    if (!companyId) return;

    try {
      const { default: axios } = await import('axios');
      const { getApiUrl } = await import('@/utils/apiConfig');
      const API_URL = getApiUrl();

      await axios.put(`${API_URL}/companies/${companyId}/products/${product.id}`,
        { is_active: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the list to get updated data
      await fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  // Status filter tabs
  const statusTabs = [
    { key: 'all' as ProductStatus, label: 'Todo' },
    { key: 'active' as ProductStatus, label: 'Activo' },
    { key: 'draft' as ProductStatus, label: 'Borrador' },
    { key: 'archived' as ProductStatus, label: 'Archivado' },
  ];

  // Category hierarchy renderer
  const renderCategoryHierarchy = (parentId: string | null = null, level = 0) => {
    const subset = categories.filter((c) => (parentId ? c.parent_id === parentId : !c.parent_id));

    if (subset.length === 0) return null;

    return subset.map((category) => (
      <div key={category.id} className="relative">
        <div
          className={clsx(
            'flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230]/50 transition-colors',
            level > 0 && 'ml-6 border-l border-gray-200 dark:border-[#232834]'
          )}
        >
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
            <button
              onClick={() => handleEditCategory(category)}
              className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Editar"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar"
            >
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
      {/* Main Tabs: Products / Categories / Attributes */}
      <Tab.Group selectedIndex={mainTab} onChange={setMainTab}>
        <div className="border-b border-gray-200 dark:border-[#232834] mb-4">
          <Tab.List className="flex space-x-8">
            <Tab
              className={({ selected }) =>
                clsx(
                  'py-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none',
                  selected
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )
              }
            >
              Productos
            </Tab>
            <Tab
              className={({ selected }) =>
                clsx(
                  'py-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none flex items-center gap-1.5',
                  selected
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )
              }
            >
              <FolderIcon className="w-4 h-4" />
              Categorías
            </Tab>
            <Tab
              className={({ selected }) =>
                clsx(
                  'py-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none flex items-center gap-1.5',
                  selected
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )
              }
            >
              <SwatchIcon className="w-4 h-4" />
              Atributos
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels>
          {/* ==================== PRODUCTS PANEL ==================== */}
          <Tab.Panel>
            {/* Header: Title + Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Productos</h1>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <ArrowUpTrayIcon className="w-4 h-4 mr-1.5" />
                  Exportar
                </Button>
                <Button variant="secondary" size="sm">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  Importar
                </Button>
                <Button onClick={handleCreateProduct} size="sm">
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  Agregar producto
                </Button>
              </div>
            </div>

            {/* Products Card Container */}
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-gray-200 dark:border-[#232834]">
              {/* Status Filter Tabs */}
              <div className="border-b border-gray-200 dark:border-[#232834]">
                <nav className="flex space-x-6 px-4" aria-label="Tabs">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={clsx(
                        'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                        statusFilter === tab.key
                          ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search and Filters Bar */}
              <div className="p-4 border-b border-gray-200 dark:border-[#232834] flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                  />
                </div>

                {/* Filter Button */}
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors">
                  <FunnelIcon className="w-4 h-4" />
                  Filtrar
                  <ChevronDownIcon className="w-3 h-3" />
                </button>

                {/* Sort Button */}
                <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors">
                  <ArrowsUpDownIcon className="w-4 h-4" />
                  Ordenar
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
                  <thead className="bg-gray-50 dark:bg-[#1E2230]/50">
                    <tr>
                      {/* Checkbox Column */}
                      <th scope="col" className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 dark:border-[#232834] text-gray-900 focus:ring-gray-900 dark:bg-[#232834]"
                        />
                      </th>
                      {/* Product Column */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto
                      </th>
                      {/* Status Column */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      {/* Inventory Column */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Inventario
                      </th>
                      {/* Sale Type Column */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo de venta
                      </th>
                      {/* Brand/Supplier Column */}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marca
                      </th>
                      {/* Actions Column */}
                      <th scope="col" className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
                    {productsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Cargando productos...
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
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
                      filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/50 transition-colors"
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-[#232834] text-gray-900 focus:ring-gray-900 dark:bg-[#232834]"
                            />
                          </td>
                          {/* Product: Image + Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-[#1E2230] rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-[#232834]">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  fallbackIcon="package"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {product.code}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            <Toggle
                              checked={product.is_active ?? true}
                              onChange={() => handleToggleStatus(product)}
                              size="sm"
                            />
                          </td>
                          {/* Inventory */}
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                'text-sm',
                                (product.stock || 0) <= (product.min_stock || 0)
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
                              )}
                            >
                              {product.stock || 0} en stock
                            </span>
                          </td>
                          {/* Sale Type */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {product.unit_type || 'Unidad'}
                            </span>
                          </td>
                          {/* Brand */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {product.brand?.name || '—'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded transition-colors"
                                title="Editar"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded transition-colors"
                                title="Más opciones"
                              >
                                <EllipsisHorizontalIcon className="w-4 h-4" />
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
                <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProducts.length > 0 ? (
                      <span>{selectedProducts.length} producto(s) seleccionado(s)</span>
                    ) : (
                      <span>
                        Mostrando {(meta.current_page - 1) * meta.per_page + 1} a{' '}
                        {Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total} productos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Página {meta.current_page} de {meta.last_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === meta.last_page}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1E2230] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Administra categorías y subcategorías para tus productos
                </p>
              </div>
              <Button onClick={handleCreateCategory} size="sm">
                <PlusIcon className="w-4 h-4 mr-1.5" />
                Nueva Categoría
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
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    Crea tu primera categoría para organizar tus productos
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleCreateCategory}>
                    Crear primera categoría
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                  {renderCategoryHierarchy()}
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* ==================== ATTRIBUTES PANEL ==================== */}
          <Tab.Panel>
            <AttributesManager />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <ProductCategoryDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        category={editingCategory}
      />
    </div>
  );
}
