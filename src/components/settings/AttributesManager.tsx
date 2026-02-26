'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    SwatchIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAttributeStore, Attribute } from '@/stores/attributeStore';
import { Button, Input } from '@/components/ui';
import { toast } from 'react-hot-toast';

const AttributesManager = () => {
    const {
        attributes,
        loading,
        fetchAttributes,
        createAttribute,
        updateAttribute,
        deleteAttribute,
        addAttributeValue,
        deleteAttributeValue
    } = useAttributeStore();

    const [showModal, setShowModal] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Form state
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<'text' | 'color' | 'number'>('text');
    const [formValues, setFormValues] = useState<Array<{ value: string; color_code?: string }>>([]);

    // New value form
    const [newValueText, setNewValueText] = useState('');
    const [newValueColor, setNewValueColor] = useState('#000000');
    const [addingValueFor, setAddingValueFor] = useState<string | null>(null);

    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const openCreateModal = () => {
        setEditingAttribute(null);
        setFormName('');
        setFormType('text');
        setFormValues([{ value: '', color_code: '' }]);
        setShowModal(true);
    };

    const openEditModal = (attr: Attribute) => {
        setEditingAttribute(attr);
        setFormName(attr.name);
        setFormType(attr.type);
        setFormValues(attr.values.map(v => ({ value: v.value, color_code: v.color_code })));
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formName.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        const validValues = formValues.filter(v => v.value.trim());
        if (validValues.length === 0) {
            toast.error('Agrega al menos un valor');
            return;
        }

        try {
            if (editingAttribute) {
                await updateAttribute(editingAttribute.id, {
                    name: formName,
                    type: formType
                });
                toast.success('Atributo actualizado');
            } else {
                await createAttribute({
                    name: formName,
                    type: formType,
                    values: validValues.map((v, i) => ({
                        value: v.value,
                        color_code: formType === 'color' ? v.color_code : undefined,
                        sort_order: i
                    }))
                });
                toast.success('Atributo creado');
            }
            setShowModal(false);
            fetchAttributes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handleDeleteAttribute = async (attr: Attribute) => {
        if (!confirm(`¿Eliminar el atributo "${attr.name}" y todos sus valores?`)) return;

        try {
            await deleteAttribute(attr.id);
            toast.success('Atributo eliminado');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleAddValue = async (attributeId: string) => {
        if (!newValueText.trim()) return;

        try {
            const attr = attributes.find(a => a.id === attributeId);
            await addAttributeValue(attributeId, {
                value: newValueText,
                color_code: attr?.type === 'color' ? newValueColor : undefined
            });
            setNewValueText('');
            setAddingValueFor(null);
            toast.success('Valor agregado');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al agregar valor');
        }
    };

    const handleDeleteValue = async (attributeId: string, valueId: string, valueName: string) => {
        if (!confirm(`¿Eliminar el valor "${valueName}"?`)) return;

        try {
            await deleteAttributeValue(attributeId, valueId);
            toast.success('Valor eliminado');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const addFormValue = () => {
        setFormValues([...formValues, { value: '', color_code: '' }]);
    };

    const removeFormValue = (index: number) => {
        setFormValues(formValues.filter((_, i) => i !== index));
    };

    const updateFormValue = (index: number, field: 'value' | 'color_code', val: string) => {
        setFormValues(formValues.map((v, i) => i === index ? { ...v, [field]: val } : v));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Atributos de Productos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Define atributos como Talla, Color, Material para tus variantes
                    </p>
                </div>
                <Button onClick={openCreateModal} className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Atributo
                </Button>
            </div>

            {/* Attributes List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando...</div>
            ) : attributes.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-black rounded-lg shadow">
                    <SwatchIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No hay atributos definidos</p>
                    <p className="text-sm text-gray-400 mt-1">Crea tu primer atributo para comenzar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {attributes.map(attr => (
                        <div key={attr.id} className="bg-white dark:bg-black rounded-lg shadow">
                            {/* Attribute Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E2230] rounded-t-lg"
                                onClick={() => toggleExpand(attr.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedIds.has(attr.id) ? (
                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{attr.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {attr.values.length} valores • Tipo: {attr.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => openEditModal(attr)}
                                        className="p-2 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230]"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAttribute(attr)}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230]"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Values */}
                            {expandedIds.has(attr.id) && (
                                <div className="border-t border-gray-200 dark:border-[#232834] p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {attr.values.map(val => (
                                            <div
                                                key={val.id}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1E2230] rounded-full text-sm"
                                            >
                                                {attr.type === 'color' && val.color_code && (
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: val.color_code }}
                                                    />
                                                )}
                                                <span className="text-gray-700 dark:text-gray-200">{val.value}</span>
                                                <button
                                                    onClick={() => handleDeleteValue(attr.id, val.id, val.value)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Value Form */}
                                        {addingValueFor === attr.id ? (
                                            <div className="flex items-center gap-2">
                                                {attr.type === 'color' && (
                                                    <input
                                                        type="color"
                                                        value={newValueColor}
                                                        onChange={e => setNewValueColor(e.target.value)}
                                                        className="w-8 h-8 rounded cursor-pointer"
                                                    />
                                                )}
                                                <input
                                                    type="text"
                                                    value={newValueText}
                                                    onChange={e => setNewValueText(e.target.value)}
                                                    placeholder="Nuevo valor..."
                                                    className="px-3 py-1.5 text-sm border rounded-lg dark:bg-[#1E2230] dark:border-[#232834] dark:text-white"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleAddValue(attr.id)}
                                                />
                                                <Button size="sm" onClick={() => handleAddValue(attr.id)}>
                                                    Agregar
                                                </Button>
                                                <button
                                                    onClick={() => setAddingValueFor(null)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingValueFor(attr.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 dark:border-[#232834] rounded-full text-sm text-gray-500 hover:text-emerald-500 hover:border-emerald-400"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                                Agregar valor
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-black rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {editingAttribute ? 'Editar Atributo' : 'Nuevo Atributo'}
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nombre del atributo"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Ej: Talla, Color, Material"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={formType}
                                    onChange={e => setFormType(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-[#1E2230] dark:border-[#232834] dark:text-white"
                                >
                                    <option value="text">Texto</option>
                                    <option value="color">Color</option>
                                    <option value="number">Número</option>
                                </select>
                            </div>

                            {!editingAttribute && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Valores iniciales
                                    </label>
                                    <div className="space-y-2">
                                        {formValues.map((v, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                {formType === 'color' && (
                                                    <input
                                                        type="color"
                                                        value={v.color_code || '#000000'}
                                                        onChange={e => updateFormValue(i, 'color_code', e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer"
                                                    />
                                                )}
                                                <input
                                                    type="text"
                                                    value={v.value}
                                                    onChange={e => updateFormValue(i, 'value', e.target.value)}
                                                    placeholder={`Valor ${i + 1}`}
                                                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-[#1E2230] dark:border-[#232834] dark:text-white"
                                                />
                                                {formValues.length > 1 && (
                                                    <button
                                                        onClick={() => removeFormValue(i)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addFormValue}
                                            className="text-sm text-emerald-500 hover:text-emerald-600"
                                        >
                                            + Agregar otro valor
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit}>
                                {editingAttribute ? 'Guardar Cambios' : 'Crear Atributo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributesManager;
