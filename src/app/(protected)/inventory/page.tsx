'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBrandStore } from '@/stores/brandStore';
import { 
    Button, Card, Table, Badge, Input, Select 
} from '@/components/ui';
import { 
    MagnifyingGlassIcon, 
    ArrowPathIcon,
    ExclamationTriangleIcon,
    ArchiveBoxXMarkIcon,
    ArchiveBoxIcon,
    ArrowTrendingUpIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ChevronDownIcon,
    ArrowsUpDownIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface Filters {
    category_id: string;
    brand_id: string;
    stock_status: '' | 'available' | 'low' | 'out';
    price_min: string;
    price_max: string;
    sort_by: string;
    sort_order: 'asc' | 'desc';
}

const EMPTY_FILTERS: Filters = {
    category_id: '',
    brand_id: '',
    stock_status: '',
    price_min: '',
    price_max: '',
    sort_by: 'name',
    sort_order: 'asc',
};

export default function InventoryOverviewPage() {
    const router = useRouter();
    const { products, fetchProducts, isLoading: productsLoading, meta } = useProductStore();
    const { stats, fetchStats } = useInventoryStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { brands, fetchBrands } = useBrandStore();
    
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [page, setPage] = useState(1);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const buildParams = useCallback(() => {
        const params: any = {
            page,
            search: debouncedSearch || undefined,
            sort_by: filters.sort_by,
            sort_order: filters.sort_order,
            per_page: 15
        };
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.brand_id) params.brand_id = filters.brand_id;
        if (filters.stock_status) params.stock_status = filters.stock_status;
        if (filters.price_min !== '') params.price_min = parseFloat(filters.price_min);
        if (filters.price_max !== '') params.price_max = parseFloat(filters.price_max);
        return params;
    }, [page, debouncedSearch, filters]);

    useEffect(() => {
        fetchProducts(buildParams());
    }, [buildParams, fetchProducts]);

    useEffect(() => {
        fetchStats();
        fetchCategories();
        fetchBrands();
    }, [fetchStats, fetchCategories, fetchBrands]);

    const handleClearFilters = () => {
        setFilters({ ...EMPTY_FILTERS });
        setSearch('');
        setShowFilters(false);
    };

    const activeFilterCount = [
        filters.category_id,
        filters.brand_id,
        filters.stock_status,
        filters.price_min,
        filters.price_max,
    ].filter(Boolean).length;

    const totalInventoryValue = useMemo(() => {
        return products.reduce((acc, p) => acc + (p.stock * (p.purchase_price || 0)), 0);
    }, [products]);

    const fmt = (n: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control de Stock</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestión inteligente de reposición e inventario.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push('/inventory/adjustments')}>
                        <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                        Ajustes
                    </Button>
                    <Button onClick={() => router.push('/inventory/reconciliation')}>
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Conciliar
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-emerald-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Valor en Stock</p>
                            <p className="text-xl font-bold">{fmt(totalInventoryValue)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ArchiveBoxIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Productos</p>
                            <p className="text-xl font-bold">{meta?.total || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card 
                    className={clsx(
                        "p-4 border-l-4 border-amber-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                        filters.stock_status === 'low' && "bg-amber-50 dark:bg-amber-900/10"
                    )}
                    onClick={() => setFilters(f => ({ ...f, stock_status: f.stock_status === 'low' ? '' : 'low' }))}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Bajo Stock</p>
                            <p className="text-xl font-bold text-amber-600">{stats?.low_stock || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card 
                    className={clsx(
                        "p-4 border-l-4 border-red-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                        filters.stock_status === 'out' && "bg-red-50 dark:bg-red-900/10"
                    )}
                    onClick={() => setFilters(f => ({ ...f, stock_status: f.stock_status === 'out' ? '' : 'out' }))}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArchiveBoxXMarkIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Agotados</p>
                            <p className="text-xl font-bold text-red-600">{stats?.out_of_stock || 0}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#0D1117] focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            'inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                            showFilters || activeFilterCount > 0
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#232834] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230]'
                        )}
                    >
                        <FunnelIcon className="w-5 h-5 mr-2" />
                        Filtros
                        {activeFilterCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <Select
                        className="w-40"
                        value={filters.sort_by}
                        onChange={(val) => setFilters(f => ({ ...f, sort_by: val }))}
                        options={[
                            { label: 'Nombre', value: 'name' },
                            { label: 'Stock (Menor)', value: 'stock' },
                            { label: 'Precio', value: 'sale_price' },
                            { label: 'Código', value: 'code' },
                        ]}
                    />
                    <button
                        onClick={() => setFilters(f => ({ ...f, sort_order: f.sort_order === 'asc' ? 'desc' : 'asc' }))}
                        className="p-2.5 rounded-xl border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
                    >
                        <ArrowsUpDownIcon className={clsx("w-5 h-5 transition-transform", filters.sort_order === 'desc' && "rotate-180")} />
                    </button>
                </div>
            </div>

            {/* Active Filters Chips */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500 mr-1">Filtros activos:</span>
                    {filters.category_id && (
                        <FilterChip 
                            label={`Cat: ${categories.find(c => c.id === filters.category_id)?.name}`} 
                            onRemove={() => setFilters(f => ({ ...f, category_id: '' }))} 
                        />
                    )}
                    {filters.brand_id && (
                        <FilterChip 
                            label={`Marca: ${brands.find(b => b.id === filters.brand_id)?.name}`} 
                            onRemove={() => setFilters(f => ({ ...f, brand_id: '' }))} 
                        />
                    )}
                    {filters.stock_status && (
                        <FilterChip 
                            label={filters.stock_status === 'low' ? 'Bajo Stock' : filters.stock_status === 'out' ? 'Agotado' : 'Disponible'} 
                            onRemove={() => setFilters(f => ({ ...f, stock_status: '' }))} 
                        />
                    )}
                    {(filters.price_min || filters.price_max) && (
                        <FilterChip 
                            label={`Precio: ${filters.price_min || 0} - ${filters.price_max || '∞'}`} 
                            onRemove={() => setFilters(f => ({ ...f, price_min: '', price_max: '' }))} 
                        />
                    )}
                    <button 
                        onClick={handleClearFilters}
                        className="text-xs text-red-500 hover:text-red-600 font-medium ml-2"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            <div className="flex gap-6 items-start">
                {/* Main Content */}
                <Card className={clsx("overflow-hidden transition-all flex-1")}>
                    <Table
                        loading={productsLoading}
                        data={products}
                        keyExtractor={(p) => p.id}
                        columns={[
                            {
                                key: 'image',
                                header: '',
                                width: '60px',
                                render: (p) => (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1E2230] border border-gray-200 dark:border-[#232834] overflow-hidden">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ArchiveBoxIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'product',
                                header: 'Producto',
                                render: (p) => (
                                    <div className="max-w-xs md:max-w-sm">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">{p.code}</span>
                                            {p.category && (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                    {p.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'stock_level',
                                header: 'Salud de Stock',
                                width: '200px',
                                render: (p) => {
                                    const min = p.min_stock || 1;
                                    const percentage = Math.min((p.stock / (min * 2)) * 100, 100);
                                    const isLow = p.stock > 0 && p.stock <= min;
                                    const isOut = p.stock <= 0;
                                    
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                                                <span className={clsx(
                                                    isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'
                                                )}>
                                                    {isOut ? 'Agotado' : isLow ? 'Bajo' : 'Óptimo'}
                                                </span>
                                                <span className="text-gray-400 tabular-nums">{p.stock} / {min} min</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={clsx(
                                                        'h-full transition-all duration-700',
                                                        isOut ? 'bg-red-500 w-full opacity-20' : 
                                                        isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                                    )}
                                                    style={{ width: `${isOut ? 100 : percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'purchase_price',
                                header: 'Costo',
                                align: 'right',
                                render: (p) => <span className="text-sm text-gray-500">{fmt(p.purchase_price || 0)}</span>
                            },
                            {
                                key: 'sale_price',
                                header: 'Venta',
                                align: 'right',
                                render: (p) => <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(p.sale_price || 0)}</span>
                            },
                            {
                                key: 'investment',
                                header: 'Inversión',
                                align: 'right',
                                render: (p) => (
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {fmt(p.stock * (p.purchase_price || 0))}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Capital en stock</p>
                                    </div>
                                )
                            },
                            {
                                key: 'actions',
                                header: '',
                                align: 'right',
                                render: (p) => (
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                            onClick={() => router.push(`/inventory/kardex?product_id=${p.id}`)}
                                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
                                            title="Ver Kardex"
                                        >
                                            <ArrowPathIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => router.push(`/inventory/adjustments?product_id=${p.id}&action=adjust`)}
                                            className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                                            title="Ajustar Stock"
                                        >
                                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                    
                    {/* Pagination */}
                    {meta && meta.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#232834] flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Mostrando {products.length} de {meta.total} productos
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                                <Button size="sm" variant="secondary" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Filters Sidebar Drawer (Desktop) */}
                {showFilters && (
                    <Card className="w-72 sticky top-6 hidden lg:block p-5 h-fit border-emerald-500/20 shadow-xl animate-in slide-in-from-right-10 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-emerald-500" />
                                Filtros Avanzados
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoría</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#232834] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={filters.category_id}
                                    onChange={(e) => setFilters(f => ({ ...f, category_id: e.target.value }))}
                                >
                                    <option value="">Todas</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Marca</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#232834] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={filters.brand_id}
                                    onChange={(e) => setFilters(f => ({ ...f, brand_id: e.target.value }))}
                                >
                                    <option value="">Todas</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Precio de Venta</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="Mín" 
                                        className="w-full bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#232834] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.price_min}
                                        onChange={(e) => setFilters(f => ({ ...f, price_min: e.target.value }))}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Máx" 
                                        className="w-full bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#232834] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.price_max}
                                        onChange={(e) => setFilters(f => ({ ...f, price_max: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <Button fullWidth variant="secondary" onClick={handleClearFilters}>
                                Limpiar Filtros
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            {label}
            <button onClick={onRemove} className="hover:text-emerald-900 dark:hover:text-emerald-200">
                <XMarkIcon className="w-3.5 h-3.5" />
            </button>
        </span>
    );
}
