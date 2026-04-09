'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProductStore } from '@/stores/productStore';
import { useInventoryStore } from '@/stores/inventoryStore';
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
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function InventoryOverviewPage() {
    const router = useRouter();
    const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
    const { stats, fetchStats } = useInventoryStore();
    
    const [search, setSearch] = useState('');
    const [statusTab, setStatusTab] = useState(0); // 0: All, 1: Low, 2: Out
    
    useEffect(() => {
        fetchProducts({ per_page: 500 }); // Fetch a good amount for local filtering
        fetchStats();
    }, [fetchProducts, fetchStats]);

    const filteredProducts = useMemo(() => {
        let result = [...products];
        
        if (search) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                p.code.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (statusTab === 1) { // Low Stock
            result = result.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0));
        } else if (statusTab === 2) { // Out of Stock
            result = result.filter(p => p.stock <= 0);
        }

        return result;
    }, [products, search, statusTab]);

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
                        Gestión inteligente de reposición y salud de inventario.
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
                            <p className="text-xs text-gray-500 uppercase font-semibold">Valor Total</p>
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
                            <p className="text-xs text-gray-500 uppercase font-semibold">Items Totales</p>
                            <p className="text-xl font-bold">{products.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-amber-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => setStatusTab(1)}>
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
                <Card className="p-4 border-l-4 border-red-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => setStatusTab(2)}>
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

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Tab.Group selectedIndex={statusTab} onChange={setStatusTab}>
                        <Tab.List className="flex p-1 space-x-1 bg-gray-100 dark:bg-[#0D1117] rounded-xl w-fit">
                            {['Todos', 'Bajo Stock', 'Agotado'].map((category) => (
                                <Tab
                                    key={category}
                                    className={({ selected }) =>
                                        clsx(
                                            'w-24 md:w-32 py-2 text-sm font-medium rounded-lg transition-all',
                                            selected
                                                ? 'bg-white dark:bg-[#1E2230] text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        )
                                    }
                                >
                                    {category}
                                </Tab>
                            ))}
                        </Tab.List>
                    </Tab.Group>

                    <div className="relative w-full md:w-80">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Stock Table */}
            <Card className="overflow-hidden">
                <Table
                    loading={productsLoading}
                    data={filteredProducts}
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
            </Card>
        </div>
    );
}
