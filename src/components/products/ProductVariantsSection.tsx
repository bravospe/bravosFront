'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Attribute, useAttributeStore } from '@/stores/attributeStore';
import { ProductVariant, useVariantStore } from '@/stores/variantStore';
import { Button } from '@/components/ui';
import { toast } from 'react-hot-toast';

interface ProductVariantsSectionProps {
    productId?: string;
    categoryId?: string;
    basePrice: number;
    baseSku: string;
}

interface NewVariantRow {
    id: string;
    sku: string;
    price: string;
    stock: string;
    attributeValues: Record<string, string>; // attributeId -> valueId
}

const ProductVariantsSection = ({
    productId,
    categoryId,
    basePrice,
    baseSku
}: ProductVariantsSectionProps) => {
    const { attributes, fetchAttributes } = useAttributeStore();
    const { variants, fetchVariants, createVariant, deleteVariant, loading } = useVariantStore();

    const [categoryAttributes, setCategoryAttributes] = useState<Attribute[]>([]);
    const [newRows, setNewRows] = useState<NewVariantRow[]>([]);

    // Fetch attributes when component mounts
    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    // Fetch variants when productId changes (edit mode)
    useEffect(() => {
        if (productId) {
            fetchVariants(productId);
        }
    }, [productId, fetchVariants]);

    // Filter attributes for current category
    useEffect(() => {
        if (categoryId && attributes.length > 0) {
            // For now, show all company attributes
            // In production, this would filter based on category_attributes pivot
            setCategoryAttributes(attributes.filter(a => a.is_active && a.values.length > 0));
        } else {
            setCategoryAttributes([]);
        }
    }, [categoryId, attributes]);

    const addNewRow = () => {
        const count = newRows.length + variants.length + 1;
        setNewRows([...newRows, {
            id: `new-${Date.now()}`,
            sku: `${baseSku}-V${count}`,
            price: basePrice.toString(),
            stock: '0',
            attributeValues: {}
        }]);
    };

    const updateNewRow = (id: string, field: keyof NewVariantRow, value: any) => {
        setNewRows(rows => rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const updateNewRowAttribute = (rowId: string, attributeId: string, valueId: string) => {
        setNewRows(rows => rows.map(row =>
            row.id === rowId
                ? { ...row, attributeValues: { ...row.attributeValues, [attributeId]: valueId } }
                : row
        ));
    };

    const removeNewRow = (id: string) => {
        setNewRows(rows => rows.filter(row => row.id !== id));
    };

    const saveNewVariant = async (row: NewVariantRow) => {
        if (!productId) {
            toast.error('Guarda el producto primero');
            return;
        }

        const attributeValueIds = Object.values(row.attributeValues).filter(Boolean);
        if (attributeValueIds.length !== categoryAttributes.length) {
            toast.error('Selecciona todos los atributos');
            return;
        }

        try {
            await createVariant(productId, {
                sku: row.sku,
                price: parseFloat(row.price) || undefined,
                stock: parseFloat(row.stock) || 0,
                attribute_value_ids: attributeValueIds
            });
            setNewRows(rows => rows.filter(r => r.id !== row.id));
            toast.success('Variante creada');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear variante');
        }
    };

    const handleDeleteVariant = async (variantId: string) => {
        if (!productId) return;

        if (!confirm('¿Eliminar esta variante?')) return;

        try {
            await deleteVariant(productId, variantId);
            toast.success('Variante eliminada');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const getAttributeValueDisplay = (variant: ProductVariant, attributeId: string) => {
        const value = variant.attribute_values?.find(
            v => v.attribute_id === attributeId
        );
        return value?.value || '-';
    };

    if (!categoryId) {
        return (
            <div className="bg-white dark:bg-black shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Variantes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selecciona una categoría para habilitar las variantes del producto.
                </p>
            </div>
        );
    }

    if (categoryAttributes.length === 0) {
        return (
            <div className="bg-white dark:bg-black shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Variantes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay atributos definidos. Ve a Configuración → Atributos para crear tallas, colores, etc.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-black shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Variantes</h2>
                <Button
                    type="button"
                    size="sm"
                    onClick={addNewRow}
                    className="flex items-center gap-1"
                >
                    <PlusIcon className="h-4 w-4" />
                    Agregar Variante
                </Button>
            </div>

            {/* Variants Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
                    <thead className="bg-gray-50 dark:bg-[#1E2230]">
                        <tr>
                            {categoryAttributes.map(attr => (
                                <th key={attr.id} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {attr.name}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
                        {/* Existing variants */}
                        {variants.map(variant => (
                            <tr key={variant.id}>
                                {categoryAttributes.map(attr => (
                                    <td key={attr.id} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {getAttributeValueDisplay(variant, attr.id)}
                                    </td>
                                ))}
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                                    {variant.sku}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    S/ {(variant.price || basePrice).toFixed(2)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {variant.stock}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteVariant(variant.id)}
                                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* New variant rows */}
                        {newRows.map(row => (
                            <tr key={row.id} className="bg-blue-50 dark:bg-blue-900/20">
                                {categoryAttributes.map(attr => (
                                    <td key={attr.id} className="px-3 py-2">
                                        <select
                                            value={row.attributeValues[attr.id] || ''}
                                            onChange={(e) => updateNewRowAttribute(row.id, attr.id, e.target.value)}
                                            className="block w-full text-sm rounded-md border-gray-300 dark:border-[#232834] dark:bg-[#1E2230] dark:text-white"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {attr.values.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.value}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                ))}
                                <td className="px-3 py-2">
                                    <input
                                        type="text"
                                        value={row.sku}
                                        onChange={(e) => updateNewRow(row.id, 'sku', e.target.value)}
                                        className="block w-24 text-sm rounded-md border-gray-300 dark:border-[#232834] dark:bg-[#1E2230] dark:text-white font-mono"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        value={row.price}
                                        onChange={(e) => updateNewRow(row.id, 'price', e.target.value)}
                                        className="block w-20 text-sm rounded-md border-gray-300 dark:border-[#232834] dark:bg-[#1E2230] dark:text-white"
                                        step="0.01"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        value={row.stock}
                                        onChange={(e) => updateNewRow(row.id, 'stock', e.target.value)}
                                        className="block w-16 text-sm rounded-md border-gray-300 dark:border-[#232834] dark:bg-[#1E2230] dark:text-white"
                                    />
                                </td>
                                <td className="px-3 py-2 text-right space-x-1">
                                    <button
                                        type="button"
                                        onClick={() => saveNewVariant(row)}
                                        disabled={loading}
                                        className="text-green-600 hover:text-green-900 dark:hover:text-green-400 text-sm font-medium"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeNewRow(row.id)}
                                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                    >
                                        <TrashIcon className="h-4 w-4 inline" />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {variants.length === 0 && newRows.length === 0 && (
                            <tr>
                                <td colSpan={categoryAttributes.length + 4} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No hay variantes. Haz clic en "Agregar Variante" para crear una.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductVariantsSection;
