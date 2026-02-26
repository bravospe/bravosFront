'use client';

import { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    DocumentTextIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { Card, Badge } from '@/components/ui';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useProductStore } from '@/stores/productStore';

const KardexPage = () => {
    const { kardex, isLoading, fetchKardex, fetchStats, stats } = useInventoryStore();
    const { products, fetchProducts } = useProductStore();
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        fetchStats();
        fetchProducts({ per_page: 100 });
    }, [fetchStats, fetchProducts]);

    useEffect(() => {
        if (selectedProduct) {
            fetchKardex(selectedProduct, { date_from: dateFrom, date_to: dateTo });
        }
    }, [selectedProduct, dateFrom, dateTo, fetchKardex]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const getMovementBadge = (type: string) => {
        const config: Record<string, { variant: 'success' | 'danger' | 'warning', label: string, icon: typeof ArrowUpIcon }> = {
            entry: { variant: 'success', label: 'Entrada', icon: ArrowUpIcon },
            exit: { variant: 'danger', label: 'Salida', icon: ArrowDownIcon },
            adjustment: { variant: 'warning', label: 'Ajuste', icon: ArrowPathIcon },
        };
        const { variant, label, icon: Icon } = config[type] || config.adjustment;
        return (
            <Badge variant={variant} size="sm">
                <Icon className="w-3 h-3 mr-1" />
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kardex</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Historial de movimientos de inventario
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-gray-500">Total Productos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_products || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-500">Activos</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.active_products || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-500">Stock Bajo</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.low_stock || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-500">Sin Stock</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.out_of_stock || 0}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Product Selector */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Producto
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                            />
                        </div>
                        {productSearch && (
                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-[#232834] rounded-lg">
                                {filteredProducts.slice(0, 10).map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => {
                                            setSelectedProduct(product.id);
                                            setProductSearch(`${product.code} - ${product.name}`);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#1E2230] border-b last:border-b-0"
                                    >
                                        <span className="font-medium">{product.code}</span> - {product.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Desde
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hasta
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Kardex Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Costo Unit.</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Saldo Cant.</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Saldo Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                            {!selectedProduct ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        Selecciona un producto para ver su kardex
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-28"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : kardex.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        No hay movimientos para este producto
                                    </td>
                                </tr>
                            ) : (
                                kardex.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {new Date(entry.created_at).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-4 py-3">{getMovementBadge(entry.movement_type)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{entry.reason}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            <span className={entry.movement_type === 'exit' ? 'text-red-600' : 'text-green-600'}>
                                                {entry.movement_type === 'exit' ? '-' : '+'}{entry.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            S/ {entry.unit_cost.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                            {entry.balance_quantity}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                            S/ {entry.balance_value.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default KardexPage;
