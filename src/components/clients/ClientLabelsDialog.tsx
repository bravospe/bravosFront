'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { Button, Input } from '@/components/ui';
import { useLabelStore, ClientLabel } from '@/stores/labelStore';
import toast from 'react-hot-toast';

interface ClientLabelsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

// Predefined color palette
const colorPalette = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#64748B', // Slate
    '#78716C', // Stone
    '#000000', // Black
];

const ClientLabelsDialog = ({ isOpen, onClose }: ClientLabelsDialogProps) => {
    const { labels, isLoading, createLabel, updateLabel, deleteLabel, fetchLabels } = useLabelStore();

    const [showForm, setShowForm] = useState(false);
    const [editingLabel, setEditingLabel] = useState<ClientLabel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchLabels();
        }
    }, [isOpen, fetchLabels]);

    const resetForm = () => {
        setFormData({ name: '', color: '#3B82F6', description: '' });
        setEditingLabel(null);
        setShowForm(false);
    };

    const handleEdit = (label: ClientLabel) => {
        setEditingLabel(label);
        setFormData({
            name: label.name,
            color: label.color,
            description: label.description || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        try {
            if (editingLabel) {
                await updateLabel(editingLabel.id, formData);
                toast.success('Etiqueta actualizada');
            } else {
                await createLabel(formData);
                toast.success('Etiqueta creada');
            }
            resetForm();
        } catch (error) {
            // Error already handled in store
        }
    };

    const handleDelete = async (label: ClientLabel) => {
        if (label.clients_count && label.clients_count > 0) {
            toast.error(`Esta etiqueta tiene ${label.clients_count} clientes asignados`);
            return;
        }

        try {
            await deleteLabel(label.id);
            toast.success('Etiqueta eliminada');
        } catch (error) {
            // Error already handled in store
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-black shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#232834]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                                            <TagIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Etiquetas de Clientes
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500">Administra las etiquetas para clasificar clientes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] rounded-lg"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    {/* Add/Edit Form */}
                                    {showForm ? (
                                        <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {editingLabel ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
                                            </h4>

                                            <Input
                                                label="Nombre"
                                                placeholder="Ej: VIP, Mayorista, Frecuente..."
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Color
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {colorPalette.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, color })}
                                                            className={`w-8 h-8 rounded-lg transition-all ${formData.color === color
                                                                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                                                                    : 'hover:scale-110'
                                                                }`}
                                                            style={{ backgroundColor: color }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Custom color input */}
                                                <div className="flex items-center gap-2 mt-3">
                                                    <input
                                                        type="color"
                                                        value={formData.color}
                                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                                    />
                                                    <Input
                                                        value={formData.color}
                                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                        placeholder="#RRGGBB"
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </div>

                                            <Input
                                                label="Descripción (opcional)"
                                                placeholder="Descripción de la etiqueta..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />

                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    variant="secondary"
                                                    fullWidth
                                                    onClick={resetForm}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    onClick={handleSubmit}
                                                    loading={isLoading}
                                                >
                                                    {editingLabel ? 'Guardar' : 'Crear'}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowForm(true)}
                                            className="mb-4"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-1" />
                                            Nueva Etiqueta
                                        </Button>
                                    )}

                                    {/* Labels List */}
                                    <div className="space-y-2">
                                        {labels.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                No hay etiquetas creadas
                                            </div>
                                        ) : (
                                            labels.map((label) => (
                                                <div
                                                    key={label.id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-black border border-gray-200 dark:border-[#232834] rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-4 h-4 rounded-full shadow-inner"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {label.name}
                                                            </span>
                                                            {label.clients_count !== undefined && label.clients_count > 0 && (
                                                                <span className="ml-2 text-xs text-gray-500">
                                                                    ({label.clients_count} clientes)
                                                                </span>
                                                            )}
                                                            {label.description && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {label.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(label)}
                                                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(label)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#0D1117]">
                                    <Button variant="secondary" fullWidth onClick={onClose}>
                                        Cerrar
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ClientLabelsDialog;
