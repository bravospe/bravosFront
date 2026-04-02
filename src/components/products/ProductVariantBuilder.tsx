'use client';

import {
    useState,
    useEffect,
    useCallback,
    KeyboardEvent,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    SwatchIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    AdjustmentsHorizontalIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import { useAttributeStore } from '@/stores/attributeStore';
import { useVariantStore, ProductVariant } from '@/stores/variantStore';
import { Toggle } from '@/components/ui';
import { toast } from 'react-hot-toast';

// ---- Types ----

interface OptionValue {
    tempId: string;
    label: string;
    colorCode: string;
}

interface OptionGroup {
    tempId: string;
    name: string;
    isColor: boolean;
    values: OptionValue[];
    inputValue: string;
    isExpanded: boolean;
}

interface LocalVariant {
    tempId: string;
    combination: Array<{ groupTempId: string; valueTempId: string }>;
    label: string;
    sku: string;
    price: string;
    cost: string;
    stock: string;
    isActive: boolean;
}

export interface VariantBuilderHandle {
    saveVariants: (productId: string) => Promise<void>;
    getHasVariants: () => boolean;
}

interface Props {
    productId?: string;
    basePrice: number;
    baseSku: string;
}

// ---- Helpers ----

function uid() {
    return Math.random().toString(36).substring(2, 10);
}

function isColorName(name: string): boolean {
    return /colou?r|tono|tinta/i.test(name);
}

function cartesianProduct(
    groups: OptionGroup[]
): Array<Array<{ groupTempId: string; valueTempId: string; label: string }>> {
    const active = groups.filter((g) => g.values.length > 0);
    if (active.length === 0) return [];

    return active.reduce<
        Array<Array<{ groupTempId: string; valueTempId: string; label: string }>>
    >((acc, group) => {
        const entries = group.values.map((v) => ({
            groupTempId: group.tempId,
            valueTempId: v.tempId,
            label: v.label,
        }));
        if (acc.length === 0) return entries.map((e) => [e]);
        return acc.flatMap((combo) => entries.map((e) => [...combo, e]));
    }, []);
}

// ---- Tag Input ----

function TagInput({
    values,
    inputValue,
    isColor,
    onAdd,
    onRemove,
    onInputChange,
    placeholder,
}: {
    values: OptionValue[];
    inputValue: string;
    isColor: boolean;
    onAdd: (label: string) => void;
    onRemove: (tempId: string) => void;
    onInputChange: (v: string) => void;
    placeholder: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const val = inputValue.trim();
        if ((e.key === 'Enter' || e.key === ',') && val) {
            e.preventDefault();
            onAdd(val);
        }
        if (e.key === 'Backspace' && !inputValue && values.length > 0) {
            onRemove(values[values.length - 1].tempId);
        }
    };

    return (
        <div
            className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#111318] cursor-text focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all"
            onClick={() => inputRef.current?.focus()}
        >
            {values.map((v) => (
                <span
                    key={v.tempId}
                    className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-200 dark:border-emerald-800"
                >
                    {isColor && (
                        <span
                            className="w-3 h-3 rounded-full border border-emerald-300 dark:border-emerald-700 flex-shrink-0"
                            style={{ backgroundColor: v.colorCode || '#e5e7eb' }}
                        />
                    )}
                    {v.label}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(v.tempId);
                        }}
                        className="ml-0.5 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200"
                    >
                        <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    const val = inputValue.trim();
                    if (val) onAdd(val);
                }}
                placeholder={values.length === 0 ? placeholder : 'Agregar...'}
                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
            />
        </div>
    );
}

// ---- Main Component ----

const ProductVariantBuilder = forwardRef<VariantBuilderHandle, Props>(
    ({ productId, basePrice, baseSku }, ref) => {
        const { attributes, fetchAttributes, createAttribute, addAttributeValue } =
            useAttributeStore();
        const {
            variants: existingVariants,
            fetchVariants,
            deleteVariant,
            updateVariant,
            bulkCreateVariants,
            loading: variantLoading,
        } = useVariantStore();

        const [hasVariants, setHasVariants] = useState(false);
        const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
        const [generatedVariants, setGeneratedVariants] = useState<LocalVariant[]>([]);
        const [savingVariants, setSavingVariants] = useState(false);
        const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

        // Track edits on existing variants (edit mode)
        const [existingEdits, setExistingEdits] = useState<
            Record<string, { price: string; stock: string; sku: string; is_active: boolean }>
        >({});

        useEffect(() => {
            fetchAttributes();
        }, [fetchAttributes]);

        useEffect(() => {
            if (productId) {
                fetchVariants(productId).then(() => {
                    // If product already has variants, enable the toggle
                    setHasVariants(true);
                });
            }
        }, [productId, fetchVariants]);

        // Initialize existing edits when variants load
        useEffect(() => {
            const edits: typeof existingEdits = {};
            existingVariants.forEach((v) => {
                edits[v.id] = {
                    price: v.price?.toString() ?? '',
                    stock: v.stock.toString(),
                    sku: v.sku,
                    is_active: v.is_active,
                };
            });
            setExistingEdits(edits);
        }, [existingVariants]);

        // Auto-regenerate variant matrix when option groups change
        useEffect(() => {
            const combos = cartesianProduct(optionGroups);

            setGeneratedVariants((prev) => {
                return combos.map((combo) => {
                    const key = combo.map((c) => c.valueTempId).join('|');
                    const existing = prev.find(
                        (v) =>
                            v.combination
                                .map((c) => c.valueTempId)
                                .join('|') === key
                    );
                    if (existing) return existing;

                    const label = combo.map((c) => c.label).join(' / ');
                    const skuSuffix = combo
                        .map((c) => c.label.slice(0, 3).toUpperCase())
                        .join('-');
                    return {
                        tempId: uid(),
                        combination: combo.map((c) => ({
                            groupTempId: c.groupTempId,
                            valueTempId: c.valueTempId,
                        })),
                        label,
                        sku: `${baseSku}-${skuSuffix}`,
                        price: basePrice.toString(),
                        cost: '',
                        stock: '0',
                        isActive: true,
                    };
                });
            });
        }, [optionGroups, basePrice, baseSku]);

        // ---- Option Group Handlers ----

        const addOptionGroup = () => {
            setOptionGroups((prev) => [
                ...prev,
                {
                    tempId: uid(),
                    name: '',
                    isColor: false,
                    values: [],
                    inputValue: '',
                    isExpanded: true,
                },
            ]);
        };

        const updateOptionGroup = useCallback(
            (tempId: string, patch: Partial<OptionGroup>) => {
                setOptionGroups((prev) =>
                    prev.map((g) =>
                        g.tempId === tempId
                            ? {
                                  ...g,
                                  ...patch,
                                  isColor:
                                      patch.name !== undefined
                                          ? isColorName(patch.name)
                                          : g.isColor,
                              }
                            : g
                    )
                );
            },
            []
        );

        const removeOptionGroup = useCallback((tempId: string) => {
            setOptionGroups((prev) => prev.filter((g) => g.tempId !== tempId));
        }, []);

        const addValue = useCallback((groupTempId: string, label: string) => {
            setOptionGroups((prev) =>
                prev.map((g) => {
                    if (g.tempId !== groupTempId) return g;
                    if (g.values.some((v) => v.label.toLowerCase() === label.toLowerCase()))
                        return { ...g, inputValue: '' };
                    return {
                        ...g,
                        inputValue: '',
                        values: [
                            ...g.values,
                            { tempId: uid(), label, colorCode: '#6b7280' },
                        ],
                    };
                })
            );
        }, []);

        const removeValue = useCallback((groupTempId: string, valueTempId: string) => {
            setOptionGroups((prev) =>
                prev.map((g) =>
                    g.tempId === groupTempId
                        ? { ...g, values: g.values.filter((v) => v.tempId !== valueTempId) }
                        : g
                )
            );
        }, []);

        const updateValueColor = useCallback(
            (groupTempId: string, valueTempId: string, colorCode: string) => {
                setOptionGroups((prev) =>
                    prev.map((g) =>
                        g.tempId === groupTempId
                            ? {
                                  ...g,
                                  values: g.values.map((v) =>
                                      v.tempId === valueTempId ? { ...v, colorCode } : v
                                  ),
                              }
                            : g
                    )
                );
            },
            []
        );

        // ---- Variant Matrix Handlers ----

        const updateVariantField = useCallback(
            (tempId: string, field: keyof LocalVariant, value: string | boolean) => {
                setGeneratedVariants((prev) =>
                    prev.map((v) =>
                        v.tempId === tempId ? { ...v, [field]: value } : v
                    )
                );
            },
            []
        );

        const applyToAll = (field: 'price' | 'stock' | 'cost', value: string) => {
            setGeneratedVariants((prev) =>
                prev.map((v) => ({ ...v, [field]: value }))
            );
        };

        // ---- Existing Variant Handlers ----

        const handleDeleteExisting = async (variantId: string) => {
            if (!productId) return;
            if (!confirm('¿Eliminar esta variante?')) return;
            try {
                await deleteVariant(productId, variantId);
                toast.success('Variante eliminada');
            } catch {
                toast.error('Error al eliminar variante');
            }
        };

        const handleSaveExistingEdit = async (variantId: string) => {
            if (!productId) return;
            const edit = existingEdits[variantId];
            if (!edit) return;
            try {
                await updateVariant(productId, variantId, {
                    sku: edit.sku,
                    price: parseFloat(edit.price) || undefined,
                    stock: parseInt(edit.stock) || 0,
                    is_active: edit.is_active,
                });
                setEditingVariantId(null);
                toast.success('Variante actualizada');
            } catch {
                toast.error('Error al actualizar variante');
            }
        };

        // ---- Save Logic (called by parent form) ----

        const saveVariants = useCallback(
            async (pid: string) => {
                if (!hasVariants) return;

                // Save edits on existing variants
                if (existingVariants.length > 0) {
                    for (const v of existingVariants) {
                        const edit = existingEdits[v.id];
                        if (!edit) continue;
                        const changed =
                            edit.sku !== v.sku ||
                            edit.stock !== v.stock.toString() ||
                            edit.price !== (v.price?.toString() ?? '') ||
                            edit.is_active !== v.is_active;
                        if (changed) {
                            await updateVariant(pid, v.id, {
                                sku: edit.sku,
                                price: parseFloat(edit.price) || undefined,
                                stock: parseInt(edit.stock) || 0,
                                is_active: edit.is_active,
                            });
                        }
                    }
                }

                // Create new variants from the builder
                const activeNew = generatedVariants.filter((v) => v.isActive);
                if (activeNew.length === 0) return;

                setSavingVariants(true);
                try {
                    // Build valueId map: valueTempId -> attributeValueId
                    const valueIdMap: Record<string, string> = {};
                    await fetchAttributes();
                    const currentAttrs = useAttributeStore.getState().attributes;

                    for (const group of optionGroups) {
                        if (group.values.length === 0) continue;

                        // Find or create attribute
                        let attr = currentAttrs.find(
                            (a) => a.name.toLowerCase() === group.name.toLowerCase()
                        );

                        if (!attr) {
                            attr = await createAttribute({
                                name: group.name,
                                type: group.isColor ? 'color' : 'text',
                                values: group.values.map((v, i) => ({
                                    value: v.label,
                                    color_code: group.isColor ? v.colorCode : undefined,
                                    sort_order: i,
                                })),
                            });

                            // Map temp ids to real ids (order-based from API response)
                            group.values.forEach((v, i) => {
                                if (attr!.values[i]) {
                                    valueIdMap[v.tempId] = attr!.values[i].id;
                                }
                            });
                        } else {
                            // Attribute exists — find or create each value
                            for (const optVal of group.values) {
                                const existingVal = attr.values.find(
                                    (av) =>
                                        av.value.toLowerCase() === optVal.label.toLowerCase()
                                );
                                if (existingVal) {
                                    valueIdMap[optVal.tempId] = existingVal.id;
                                } else {
                                    const newVal = await addAttributeValue(attr.id, {
                                        value: optVal.label,
                                        color_code: group.isColor ? optVal.colorCode : undefined,
                                        sort_order: attr.values.length,
                                    });
                                    valueIdMap[optVal.tempId] = newVal.id;
                                }
                            }
                        }
                    }

                    // Build payload
                    const variantsPayload = activeNew.map((v) => ({
                        sku: v.sku,
                        price: parseFloat(v.price) || undefined,
                        cost: parseFloat(v.cost) || undefined,
                        stock: parseInt(v.stock) || 0,
                        is_active: true,
                        attribute_value_ids: v.combination
                            .map((c) => valueIdMap[c.valueTempId])
                            .filter(Boolean),
                    }));

                    await bulkCreateVariants(pid, variantsPayload);
                    setGeneratedVariants([]);
                    setOptionGroups([]);
                } finally {
                    setSavingVariants(false);
                }
            },
            [
                hasVariants,
                optionGroups,
                generatedVariants,
                existingVariants,
                existingEdits,
                fetchAttributes,
                createAttribute,
                addAttributeValue,
                bulkCreateVariants,
                updateVariant,
            ]
        );

        useImperativeHandle(ref, () => ({
            saveVariants,
            getHasVariants: () => hasVariants,
        }));

        // ---- Render ----

        const hasExisting = existingVariants.length > 0;
        const hasNew = generatedVariants.length > 0;

        return (
            <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1E2230] rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1E2230]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                            <AdjustmentsHorizontalIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Variantes del producto
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tallas, colores, materiales, etc.
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={hasVariants}
                        onChange={setHasVariants}
                        size="md"
                    />
                </div>

                {!hasVariants && (
                    <div className="px-6 py-8 text-center">
                        <CubeIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Activa las variantes para ofrecer este producto en distintas
                            opciones como talla, color o material.
                        </p>
                    </div>
                )}

                {hasVariants && (
                    <div className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                        {/* ---- Existing Variants (edit mode) ---- */}
                        {hasExisting && (
                            <div className="px-6 py-5">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    Variantes guardadas ({existingVariants.length})
                                </h4>
                                <div className="rounded-lg border border-gray-200 dark:border-[#1E2230] overflow-hidden">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-[#1A1F2E]">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Variante
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    SKU
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Precio
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Stock
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Activo
                                                </th>
                                                <th className="px-4 py-2.5" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                                            {existingVariants.map((v) => {
                                                const isEditing = editingVariantId === v.id;
                                                const edit = existingEdits[v.id];
                                                const variantLabel =
                                                    v.attribute_values
                                                        ?.map((av) => av.value)
                                                        .join(' / ') || v.sku;

                                                return (
                                                    <tr
                                                        key={v.id}
                                                        className="bg-white dark:bg-[#111318] hover:bg-gray-50 dark:hover:bg-[#151922] transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {v.attribute_values
                                                                    ?.filter((av) => av.color_code)
                                                                    .map((av) => (
                                                                        <span
                                                                            key={av.id}
                                                                            className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    av.color_code ||
                                                                                    '#e5e7eb',
                                                                            }}
                                                                        />
                                                                    ))}
                                                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {variantLabel}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isEditing && edit ? (
                                                                <input
                                                                    type="text"
                                                                    value={edit.sku}
                                                                    onChange={(e) =>
                                                                        setExistingEdits((prev) => ({
                                                                            ...prev,
                                                                            [v.id]: {
                                                                                ...prev[v.id],
                                                                                sku: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                    className="w-24 text-xs rounded border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1 font-mono"
                                                                />
                                                            ) : (
                                                                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                                                    {v.sku}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isEditing && edit ? (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-500">
                                                                        S/
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        value={edit.price}
                                                                        onChange={(e) =>
                                                                            setExistingEdits(
                                                                                (prev) => ({
                                                                                    ...prev,
                                                                                    [v.id]: {
                                                                                        ...prev[v.id],
                                                                                        price: e.target
                                                                                            .value,
                                                                                    },
                                                                                })
                                                                            )
                                                                        }
                                                                        step="0.01"
                                                                        className="w-20 text-xs rounded border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-900 dark:text-white">
                                                                    S/ {Number(v.price ?? 0).toFixed(2)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isEditing && edit ? (
                                                                <input
                                                                    type="number"
                                                                    value={edit.stock}
                                                                    onChange={(e) =>
                                                                        setExistingEdits((prev) => ({
                                                                            ...prev,
                                                                            [v.id]: {
                                                                                ...prev[v.id],
                                                                                stock: e.target.value,
                                                                            },
                                                                        }))
                                                                    }
                                                                    className="w-16 text-xs rounded border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className={`text-sm font-medium ${
                                                                        v.stock === 0
                                                                            ? 'text-red-500'
                                                                            : 'text-gray-900 dark:text-white'
                                                                    }`}
                                                                >
                                                                    {v.stock}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {edit && (
                                                                <Toggle
                                                                    checked={edit.is_active}
                                                                    onChange={(val) =>
                                                                        setExistingEdits((prev) => ({
                                                                            ...prev,
                                                                            [v.id]: {
                                                                                ...prev[v.id],
                                                                                is_active: val,
                                                                            },
                                                                        }))
                                                                    }
                                                                    size="sm"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1 justify-end">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleSaveExistingEdit(v.id)
                                                                            }
                                                                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                                        >
                                                                            Guardar
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setEditingVariantId(null)
                                                                            }
                                                                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#1E2230]"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditingVariantId(v.id)
                                                                        }
                                                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-[#1E2230]"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteExisting(v.id)
                                                                    }
                                                                    className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                >
                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ---- Option Group Builder ---- */}
                        <div className="px-6 py-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {hasExisting ? 'Agregar más opciones' : 'Opciones de variante'}
                                </h4>
                                <button
                                    type="button"
                                    onClick={addOptionGroup}
                                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Nueva opción
                                </button>
                            </div>

                            {optionGroups.length === 0 && (
                                <div
                                    onClick={addOptionGroup}
                                    className="border-2 border-dashed border-gray-200 dark:border-[#232834] rounded-xl py-6 px-4 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group"
                                >
                                    <PlusIcon className="w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto mb-1.5 group-hover:text-emerald-500 transition-colors" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                        Haz clic para agregar una opción
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                                        Por ejemplo: &ldquo;Talla&rdquo; con valores S, M, L, XL
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {optionGroups.map((group, idx) => (
                                    <div
                                        key={group.tempId}
                                        className="border border-gray-200 dark:border-[#1E2230] rounded-xl overflow-hidden"
                                    >
                                        {/* Group header */}
                                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1F2E]">
                                            <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) =>
                                                    updateOptionGroup(group.tempId, {
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Nombre de la opción (ej. Talla, Color)"
                                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                            />
                                            <div className="flex items-center gap-1">
                                                {group.isColor && (
                                                    <span className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                                                        <SwatchIcon className="w-3 h-3" />
                                                        Color
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateOptionGroup(group.tempId, {
                                                            isExpanded: !group.isExpanded,
                                                        })
                                                    }
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                                                >
                                                    {group.isExpanded ? (
                                                        <ChevronUpIcon className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDownIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeOptionGroup(group.tempId)}
                                                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Group body */}
                                        {group.isExpanded && (
                                            <div className="px-4 py-3 space-y-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                                                        Valores{' '}
                                                        <span className="text-gray-400 dark:text-gray-600 font-normal">
                                                            (Enter o coma para agregar)
                                                        </span>
                                                    </label>
                                                    <TagInput
                                                        values={group.values}
                                                        inputValue={group.inputValue}
                                                        isColor={group.isColor}
                                                        onAdd={(label) =>
                                                            addValue(group.tempId, label)
                                                        }
                                                        onRemove={(vid) =>
                                                            removeValue(group.tempId, vid)
                                                        }
                                                        onInputChange={(val) =>
                                                            updateOptionGroup(group.tempId, {
                                                                inputValue: val,
                                                            })
                                                        }
                                                        placeholder={
                                                            group.isColor
                                                                ? 'Rojo, Azul, Verde...'
                                                                : 'S, M, L, XL...'
                                                        }
                                                    />
                                                </div>

                                                {/* Color picker for color attributes */}
                                                {group.isColor && group.values.length > 0 && (
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                                                            Colores
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {group.values.map((v) => (
                                                                <div
                                                                    key={v.tempId}
                                                                    className="flex items-center gap-2 bg-gray-50 dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#232834] rounded-lg px-2.5 py-1.5"
                                                                >
                                                                    <div className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden cursor-pointer flex-shrink-0">
                                                                        <div
                                                                            className="w-full h-full"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    v.colorCode ||
                                                                                    '#6b7280',
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="color"
                                                                            value={
                                                                                v.colorCode || '#6b7280'
                                                                            }
                                                                            onChange={(e) =>
                                                                                updateValueColor(
                                                                                    group.tempId,
                                                                                    v.tempId,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                        {v.label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ---- Generated Variant Matrix ---- */}
                        {hasNew && (
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Variantes generadas ({generatedVariants.length})
                                    </h4>
                                    {/* Bulk actions */}
                                    <div className="flex items-center gap-2">
                                        <BulkApplyButton
                                            label="Precio"
                                            onApply={(val) => applyToAll('price', val)}
                                            placeholder="S/ precio"
                                            type="number"
                                        />
                                        <BulkApplyButton
                                            label="Stock"
                                            onApply={(val) => applyToAll('stock', val)}
                                            placeholder="Cantidad"
                                            type="number"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-[#1E2230] overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-[#1A1F2E]">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-6">
                                                        <input
                                                            type="checkbox"
                                                            checked={generatedVariants.every(
                                                                (v) => v.isActive
                                                            )}
                                                            onChange={(e) => {
                                                                setGeneratedVariants((prev) =>
                                                                    prev.map((v) => ({
                                                                        ...v,
                                                                        isActive: e.target.checked,
                                                                    }))
                                                                );
                                                            }}
                                                            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        Variante
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        SKU
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        Precio S/
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        Costo S/
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        Stock
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
                                                {generatedVariants.map((v) => {
                                                    // Find color values for visual indicator
                                                    const colorValues = v.combination
                                                        .map((c) => {
                                                            const group = optionGroups.find(
                                                                (g) => g.tempId === c.groupTempId
                                                            );
                                                            if (!group?.isColor) return null;
                                                            return group.values.find(
                                                                (val) => val.tempId === c.valueTempId
                                                            );
                                                        })
                                                        .filter(Boolean) as OptionValue[];

                                                    return (
                                                        <tr
                                                            key={v.tempId}
                                                            className={`${
                                                                v.isActive
                                                                    ? 'bg-white dark:bg-[#111318]'
                                                                    : 'bg-gray-50 dark:bg-[#0E1117] opacity-60'
                                                            } hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={v.isActive}
                                                                    onChange={(e) =>
                                                                        updateVariantField(
                                                                            v.tempId,
                                                                            'isActive',
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    {colorValues.map((cv) => (
                                                                        <span
                                                                            key={cv.tempId}
                                                                            className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    cv.colorCode ||
                                                                                    '#e5e7eb',
                                                                            }}
                                                                        />
                                                                    ))}
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {v.label}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={v.sku}
                                                                    onChange={(e) =>
                                                                        updateVariantField(
                                                                            v.tempId,
                                                                            'sku',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-28 text-xs font-mono rounded-md border border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={v.price}
                                                                    onChange={(e) =>
                                                                        updateVariantField(
                                                                            v.tempId,
                                                                            'price',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    step="0.01"
                                                                    className="w-24 text-xs rounded-md border border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={v.cost}
                                                                    onChange={(e) =>
                                                                        updateVariantField(
                                                                            v.tempId,
                                                                            'cost',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    step="0.01"
                                                                    placeholder="—"
                                                                    className="w-24 text-xs rounded-md border border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-400"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={v.stock}
                                                                    onChange={(e) =>
                                                                        updateVariantField(
                                                                            v.tempId,
                                                                            'stock',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-20 text-xs rounded-md border border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#1A1F2E] text-gray-900 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Las variantes se guardarán al guardar el producto.
                                    Desmarca las combinaciones que no quieras crear.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

ProductVariantBuilder.displayName = 'ProductVariantBuilder';
export default ProductVariantBuilder;

// ---- Bulk Apply Button ----

function BulkApplyButton({
    label,
    onApply,
    placeholder,
    type,
}: {
    label: string;
    onApply: (val: string) => void;
    placeholder: string;
    type: string;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded-md border border-gray-200 dark:border-[#232834] hover:border-emerald-400 dark:hover:border-emerald-700 transition-all"
            >
                {label} para todas
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#232834] rounded-lg shadow-lg p-3 min-w-[160px]">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Aplicar {label.toLowerCase()} a todas
                    </p>
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full text-sm rounded-md border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#111318] text-gray-900 dark:text-white px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && value) {
                                onApply(value);
                                setValue('');
                                setOpen(false);
                            }
                            if (e.key === 'Escape') setOpen(false);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (value) {
                                onApply(value);
                                setValue('');
                                setOpen(false);
                            }
                        }}
                        className="w-full text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-1.5 transition-colors"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
}
