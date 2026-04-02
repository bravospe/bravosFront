'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input } from '@/components/ui';
import { useClientStore } from '@/stores/clientStore';
import { useLabelStore } from '@/stores/labelStore';
import validationService from '@/services/validationService';
import { Client } from '@/types';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (client: Client) => void;
    client?: Client | null;
    initialData?: any; // Using any for simplicity here
}

interface ClientFormData {
    document_type: string;
    document_number: string;
    name: string;
    trade_name: string;
    email: string;
    phone: string;
    address: string;
    is_active: boolean;
    labels: string[]; 
}

const ClientModal = ({ isOpen, onClose, onSuccess, client, initialData }: ClientModalProps) => {
    const { createClient, updateClient, findClientByDocument, isLoading } = useClientStore();
    const { labels: availableLabels, fetchLabels } = useLabelStore();
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [lastValidatedDoc, setLastValidatedDoc] = useState('');
    const [existingClient, setExistingClient] = useState<Client | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
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
            setExistingClient(null);
            setLastValidatedDoc('');
            if (client) {
                setValue('document_type', client.document_type as any);
                setValue('document_number', client.document_number);
                setValue('name', client.name);
                setValue('trade_name', client.trade_name || '');
                setValue('email', client.email || '');
                setValue('phone', client.phone || '');
                setValue('address', client.address || '');
                setValue('is_active', client.is_active ?? true);
                
                const clientLabelIds = client.labels?.map(l => l.id) || [];
                setSelectedLabels(clientLabelIds);
                setValue('labels', clientLabelIds);
            } else if (initialData) {
                reset({
                    document_type: initialData.document_type || 'RUC',
                    document_number: initialData.document_number || '',
                    name: initialData.name || '',
                    trade_name: initialData.trade_name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    is_active: initialData.is_active ?? true,
                    labels: initialData.labels || []
                });
                setSelectedLabels(initialData.labels || []);
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
    }, [isOpen, client, initialData, reset, setValue]);

    const toggleLabel = (labelId: string) => {
        const newLabels = selectedLabels.includes(labelId)
            ? selectedLabels.filter(id => id !== labelId)
            : [...selectedLabels, labelId];
        
        setSelectedLabels(newLabels);
        setValue('labels', newLabels);
    };

    const documentType = watch('document_type');
    const documentNumber = watch('document_number');

    // Automatic search when length matches
    useEffect(() => {
        const timer = setTimeout(() => {
            const validateAutomated = async () => {
                if (client) return; // Don't auto-validate when editing

                const isDni = documentType === 'DNI' && documentNumber.length === 8;
                const isRuc = documentType === 'RUC' && documentNumber.length === 11;
                
                if (isDni || isRuc) {
                    handleSearch();
                }
            };

            validateAutomated();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [documentNumber, documentType, client]);

    const handleSearch = async () => {
        if (!documentNumber) {
            toast.error('Ingresa un número de documento');
            return;
        }

        if (documentType === 'RUC' && documentNumber.length !== 11) {
            toast.error('RUC debe tener 11 dígitos');
            return;
        }

        if (documentType === 'DNI' && documentNumber.length !== 8) {
            toast.error('DNI debe tener 8 dígitos');
            return;
        }

        if (documentType === 'CE' && (documentNumber.length < 8 || documentNumber.length > 12)) {
            toast.error('CE debe tener entre 8 y 12 caracteres');
            return;
        }

        // Prevent multiple validations for the same number
        if (documentNumber === lastValidatedDoc && !client) return;
        setLastValidatedDoc(documentNumber);

        setIsValidating(true);
        try {
            // Check internal DB first
            if (!client) {
                const existing = await findClientByDocument(documentNumber);
                if (existing) {
                    setExistingClient(existing);
                    setIsValidating(false);
                    return;
                }
            }
            setExistingClient(null);

            let response;
            if (documentType === 'RUC') {
                response = await validationService.validateRuc(documentNumber);
            } else if (documentType === 'DNI') {
                response = await validationService.validateDni(documentNumber);
            } else if (documentType === 'CE') {
                response = await validationService.validateCe(documentNumber);
            }

            if (response?.valid && response.data) {
                setValue('name', response.data.name);
                if (response.data.trade_name) setValue('trade_name', response.data.trade_name);
                if (response.data.address) setValue('address', response.data.address);
                toast.success('Datos encontrados');
            } else {
                setValue('name', '');
                setValue('trade_name', '');
                setValue('address', '');
                toast.error(response?.message || 'No se encontraron datos');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al validar el documento');
        } finally {
            setIsValidating(false);
        }
    };

    const onSubmit = async (data: ClientFormData) => {
        try {
            const payload: any = { ...data };
            payload.labels = selectedLabels;

            if (client) {
                const updated = await updateClient(client.id, payload);
                if (onSuccess) onSuccess(updated);
            } else {
                const created = await createClient(payload);
                if (onSuccess) onSuccess(created);
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
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-black text-left shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200 dark:border-[#232834]">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white">
                                        {client ? 'Editar Cliente' : 'Nuevo Cliente'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1E2230] focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="p-4">
                                    {existingClient && (
                                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="text-center sm:text-left">
                                                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                                                    ¡Cliente ya registrado!
                                                </p>
                                                <p className="text-xs text-amber-700 dark:text-amber-500">
                                                    {existingClient.name} ({existingClient.document_type}: {existingClient.document_number})
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    type="button" 
                                                    variant="primary" 
                                                    size="xs"
                                                    onClick={() => {
                                                        if (onSuccess) onSuccess(existingClient);
                                                        onClose();
                                                    }}
                                                >
                                                    Usar este cliente
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="xs"
                                                    onClick={() => {
                                                        setExistingClient(null);
                                                        setValue('document_number', '');
                                                        setLastValidatedDoc('');
                                                    }}
                                                >
                                                    Limpiar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-12 gap-4">
                                            {/* Doc Type & Number */}
                                            <div className="col-span-4">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Tipo
                                                </label>
                                                <select
                                                    {...register('document_type', { required: 'Requerido' })}
                                                    className="block w-full h-[38px] rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-[#1E2230] dark:border-[#232834] dark:text-white text-sm px-2"
                                                >
                                                    <option value="RUC">RUC</option>
                                                    <option value="DNI">DNI</option>
                                                    <option value="CE">CE</option>
                                                    <option value="PASAPORTE">PAS</option>
                                                </select>
                                            </div>

                                            <div className="col-span-8 relative">
                                                <Input
                                                    label="Número Documento"
                                                    labelClassName="text-xs"
                                                    {...register('document_number', { required: 'Requerido' })}
                                                    error={errors.document_number?.message}
                                                    className="pr-10 h-[38px] text-sm"
                                                />
                                                {(documentType === 'RUC' || documentType === 'DNI' || documentType === 'CE') && (
                                                    <button
                                                        type="button"
                                                        onClick={handleSearch}
                                                        disabled={isValidating}
                                                        className="absolute right-2 top-7 p-1.5 text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
                                                        title="Buscar datos"
                                                    >
                                                        {isValidating ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                                        ) : (
                                                            <MagnifyingGlassIcon className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <div className="col-span-12">
                                                <Input
                                                    label="Razón Social / Nombre Completo"
                                                    labelClassName="text-xs"
                                                    {...register('name', { required: 'Requerido' })}
                                                    error={errors.name?.message}
                                                    className="h-[38px] text-sm"
                                                />
                                            </div>

                                            {/* Trade Name - Only if editing */}
                                            {client && (
                                                <div className="col-span-12">
                                                    <Input
                                                        label="Nombre Comercial (Opcional)"
                                                        labelClassName="text-xs"
                                                        {...register('trade_name')}
                                                        className="h-[38px] text-sm"
                                                    />
                                                </div>
                                            )}

                                            {/* Email & Phone */}
                                            <div className="col-span-7">
                                                <Input
                                                    label="Email"
                                                    labelClassName="text-xs"
                                                    type="email"
                                                    {...register('email')}
                                                    className="h-[38px] text-sm"
                                                />
                                            </div>

                                            <div className="col-span-5">
                                                <Input
                                                    label="Teléfono"
                                                    labelClassName="text-xs"
                                                    {...register('phone')}
                                                    className="h-[38px] text-sm"
                                                />
                                            </div>

                                            {/* Address & Labels in one row */}
                                            <div className="col-span-7">
                                                <Input
                                                    label="Dirección"
                                                    labelClassName="text-xs"
                                                    {...register('address')}
                                                    className="h-[38px] text-sm"
                                                />
                                            </div>

                                            <div className="col-span-5">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Etiquetas
                                                </label>
                                                <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1 border border-gray-200 dark:border-[#232834] rounded-md bg-gray-50 dark:bg-[#1E2230]/50">
                                                    {(availableLabels || []).map((label) => {
                                                        const isSelected = selectedLabels.includes(label.id);
                                                        return (
                                                            <button
                                                                key={label.id}
                                                                type="button"
                                                                onClick={() => toggleLabel(label.id)}
                                                                className={clsx(
                                                                    "px-3 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
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
                                                        <span className="text-[10px] text-gray-500 italic">No hay etiquetas</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-[#232834]">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={onClose}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                size="sm"
                                                loading={isLoading}
                                            >
                                                {client ? 'Guardar' : 'Crear'}
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