'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    PlusIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useProductStore } from '@/stores/productStore';
import toast from 'react-hot-toast';

const reasonLabels: Record<string, string> = {
    damaged: 'Dañado',
    lost: 'Perdido',
    found: 'Encontrado',
    correction: 'Corrección',
    initial: 'Inventario Inicial',
    other: 'Otro',
};

const StockAdjustmentsPage = () => {
    const searchParams = useSearchParams();
    const { adjustments, isLoading, fetchAdjustments, createAdjustment } = useInventoryStore();
    const { products, fetchProducts, getProduct } = useProductStore();
    const [showModal, setShowModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        adjustment_type: 'increase' as 'increase' | 'decrease',
        reason: 'correction',
        quantity: 0,
        notes: '',
    });

    useEffect(() => {
        fetchAdjustments();
        fetchProducts({ per_page: 100 });
    }, [fetchAdjustments, fetchProducts]);

    // Handle deep link for adjustment
    useEffect(() => {
        const productId = searchParams.get('product_id');
        const action = searchParams.get('action');

        if (productId && action === 'adjust' && products.length > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
                handleProductSelect(product);
                setShowModal(true);
            } else {
                // If not in the initial 100, fetch it specifically
                getProduct(productId).then(p => {
                    handleProductSelect(p);
                    setShowModal(true);
                });
            }
        }
    }, [searchParams, products, getProduct]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleProductSelect = (product: { id: string; name: string; code?: string }) => {
        setFormData(prev => ({
            ...prev,
            product_id: product.id,
            product_name: `${product.code || ''} - ${product.name}`
        }));
        setProductSearch('');
    };

    const handleSubmit = async () => {
        if (!formData.product_id || formData.quantity <= 0) {
            toast.error('Selecciona un producto y cantidad válida');
            return;
        }

        try {
            await createAdjustment({
                product_id: formData.product_id,
                adjustment_type: formData.adjustment_type,
                reason: formData.reason,
                quantity: formData.quantity,
                notes: formData.notes,
            });
            toast.success('Ajuste registrado correctamente');
            setShowModal(false);
            setFormData({
                product_id: '',
                product_name: '',
                adjustment_type: 'increase',
                reason: 'correction',
                quantity: 0,
                notes: '',
            });
            fetchAdjustments();
        } catch (err: any) {
            toast.error(err.message || 'Error al registrar ajuste');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajustes de Stock</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Registra ajustes manuales de inventario
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Ajuste
                </Button>
            </div>

            {/* Adjustments Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-32"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20 mx-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 ml-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-28"></div></td>
                                    </tr>
                                ))
                            ) : adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        No hay ajustes registrados
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map((adjustment) => (
                                    <tr key={adjustment.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {new Date(adjustment.created_at).toLocaleDateString('es-PE')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {adjustment.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{adjustment.product_code}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant={adjustment.adjustment_type === 'increase' ? 'success' : 'danger'}
                                                size="sm"
                                            >
                                                {adjustment.adjustment_type === 'increase' ? (
                                                    <><ArrowUpIcon className="w-3 h-3 mr-1" /> Aumento</>
                                                ) : (
                                                    <><ArrowDownIcon className="w-3 h-3 mr-1" /> Disminución</>
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {reasonLabels[adjustment.reason] || adjustment.reason}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold">
                                            <span className={adjustment.adjustment_type === 'increase' ? 'text-green-600' : 'text-red-600'}>
                                                {adjustment.adjustment_type === 'increase' ? '+' : '-'}{adjustment.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {adjustment.notes || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* New Adjustment Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nuevo Ajuste de Stock"
                size="md"
            >
                <div className="space-y-4">
                    {/* Product Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Producto *
                        </label>
                        {formData.product_id ? (
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-black rounded-lg">
                                <span className="text-sm font-medium">{formData.product_name}</span>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, product_id: '', product_name: '' }))}
                                    className="text-red-500 text-sm"
                                >
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                                {productSearch && (
                                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-[#232834] rounded-lg shadow-lg">
                                        {filteredProducts.slice(0, 10).map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleProductSelect(product)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#1E2230]"
                                            >
                                                <span className="font-medium">{product.code}</span> - {product.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Adjustment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Ajuste
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, adjustment_type: 'increase' }))}
                                className={`p-3 rounded-lg border-2 transition-colors ${formData.adjustment_type === 'increase'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-[#232834]'
                                    }`}
                            >
                                <ArrowUpIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <span className="text-sm font-medium">Aumento</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, adjustment_type: 'decrease' }))}
                                className={`p-3 rounded-lg border-2 transition-colors ${formData.adjustment_type === 'decrease'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-[#232834]'
                                    }`}
                            >
                                <ArrowDownIcon className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                <span className="text-sm font-medium">Disminución</span>
                            </button>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Motivo
                        </label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                        >
                            {Object.entries(reasonLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <Input
                        label="Cantidad *"
                        type="number"
                        min="1"
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    />

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notas
                        </label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black"
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button fullWidth onClick={handleSubmit}>
                            Registrar Ajuste
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StockAdjustmentsPage;
