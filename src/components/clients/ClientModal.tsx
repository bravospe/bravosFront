'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@/components/ui';
import { useClientStore } from '@/stores/clientStore';
import { useLabelStore } from '@/stores/labelStore';
import { Client } from '@/types';
import clsx from 'clsx';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client?: Client | null;
}

interface ClientFormData {
    document_type: string;
    document_number: string;
    name: string;
    trade_name: string;
    email: string;
    phone: string;
    address: string;
    // client_category_id: string | ''; // Removed as requested
    is_active: boolean;
    labels: string[]; // Added labels
}

const ClientModal = ({ isOpen, onClose, client }: ClientModalProps) => {
    const { createClient, updateClient, isLoading } = useClientStore();
    const { labels: availableLabels, fetchLabels } = useLabelStore();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<ClientFormData>({
        defaultValues: {
            document_type: 'RUC',
            document_number: '',
            name: '',
            trade_name: '',
            email: '',
            phone: '',
            address: '',
            is_active: true,
            labels: []
        }
    });

    useEffect(() => {
        fetchLabels();
    }, [fetchLabels]);

    useEffect(() => {
        if (isOpen) {
            if (client) {
                setValue('document_type', client.document_type as any);
                setValue('document_number', client.document_number);
                setValue('name', client.name);
                setValue('trade_name', client.trade_name || '');
                setValue('email', client.email || '');
                setValue('phone', client.phone || '');
                setValue('address', client.address || '');
                setValue('is_active', client.is_active ?? true);
                
                // Set labels
                const clientLabelIds = client.labels?.map(l => l.id) || [];
                setSelectedLabels(clientLabelIds);
                setValue('labels', clientLabelIds);
            } else {
                reset({
                    document_type: 'RUC',
                    document_number: '',
                    name: '',
                    trade_name: '',
                    email: '',
                    phone: '',
                    address: '',
                    is_active: true,
                    labels: []
                });
                setSelectedLabels([]);
            }
        }
    }, [isOpen, client, reset, setValue]);

    const toggleLabel = (labelId: string) => {
        const newLabels = selectedLabels.includes(labelId)
            ? selectedLabels.filter(id => id !== labelId)
            : [...selectedLabels, labelId];
        
        setSelectedLabels(newLabels);
        setValue('labels', newLabels);
    };

    const onSubmit = async (data: ClientFormData) => {
        try {
            const payload: any = { ...data };
            // Ensure labels is passed
            payload.labels = selectedLabels;

            if (client) {
                await updateClient(client.id, payload);
            } else {
                await createClient(payload);
            }
            onClose();
        } catch (error) {
            console.error(error);
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-black text-left shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#232834]">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                                        {client ? 'Editar Cliente' : 'Nuevo Cliente'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                            <div className="sm:col-span-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Tipo de Documento
                                                </label>
                                                <select
                                                    {...register('document_type', { required: 'Requerido' })}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-[#1E2230] dark:border-[#232834] dark:text-white sm:text-sm"
                                                >
                                                    <option value="RUC">RUC</option>
                                                    <option value="DNI">DNI</option>
                                                    <option value="CE">Carnet Extranjería</option>
                                                    <option value="PASAPORTE">Pasaporte</option>
                                                </select>
                                            </div>

                                            <Input
                                                label="Número Documento"
                                                {...register('document_number', { required: 'Requerido' })}
                                                error={errors.document_number?.message}
                                            />

                                            <div className="sm:col-span-2">
                                                <Input
                                                    label="Razón Social / Nombre Completo"
                                                    {...register('name', { required: 'Requerido' })}
                                                    error={errors.name?.message}
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Input
                                                    label="Nombre Comercial (Opcional)"
                                                    {...register('trade_name')}
                                                />
                                            </div>

                                            <Input
                                                label="Email"
                                                type="email"
                                                {...register('email')}
                                            />

                                            <Input
                                                label="Teléfono"
                                                {...register('phone')}
                                            />

                                            <div className="sm:col-span-2">
                                                <Input
                                                    label="Dirección"
                                                    {...register('address')}
                                                />
                                            </div>

                                            {/* Labels Multi-Select Section */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Etiquetas
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(availableLabels || []).map((label) => {
                                                        const isSelected = selectedLabels.includes(label.id);
                                                        return (
                                                            <button
                                                                key={label.id}
                                                                type="button"
                                                                onClick={() => toggleLabel(label.id)}
                                                                className={clsx(
                                                                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                                                                    isSelected
                                                                        ? "border-transparent text-white"
                                                                        : "bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#232834] hover:bg-gray-50 dark:hover:bg-[#1E2230]"
                                                                )}
                                                                style={{
                                                                    backgroundColor: isSelected ? label.color : undefined,
                                                                    borderColor: isSelected ? label.color : undefined
                                                                }}
                                                            >
                                                                {label.name}
                                                            </button>
                                                        );
                                                    })}
                                                    {(!availableLabels || availableLabels.length === 0) && (
                                                        <span className="text-sm text-gray-500 italic">No hay etiquetas creadas</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="sm:col-span-1 flex items-center pt-6">
                                                <input
                                                    type="checkbox"
                                                    id="is_active_client_modal"
                                                    {...register('is_active')}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <label htmlFor="is_active_client_modal" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                                    Activo
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-[#232834]">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={onClose}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                loading={isLoading}
                                            >
                                                {client ? 'Guardar Cambios' : 'Crear Cliente'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ClientModal;
