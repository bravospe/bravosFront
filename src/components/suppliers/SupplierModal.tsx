'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Input, Button } from '@/components/ui';
import { useSupplierStore, Supplier } from '@/stores/supplierStore';
import validationService from '@/services/validationService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    onSuccess: () => void;
}

interface SupplierFormData {
    document_type: 'RUC' | 'DNI' | 'CE';
    document_number: string;
    name: string;
    trade_name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    department?: string;
    province?: string;
    district?: string;
    website?: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    payment_terms?: string;
    credit_limit?: number;
    notes?: string;
    is_active: boolean;
}

const SupplierModal = ({ isOpen, onClose, supplier, onSuccess }: SupplierModalProps) => {
    const { createSupplier, updateSupplier, isLoading } = useSupplierStore();
    const isEditing = !!supplier;
    const [isValidating, setIsValidating] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SupplierFormData>({
        defaultValues: {
            document_type: 'RUC',
            is_active: true,
        },
    });

    const documentType = watch('document_type');
    const documentNumber = watch('document_number');

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

        setIsValidating(true);
        try {
            let response;
            if (documentType === 'RUC') {
                response = await validationService.validateRuc(documentNumber);
            } else if (documentType === 'DNI') {
                response = await validationService.validateDni(documentNumber);
            }

            if (response?.valid && response.data) {
                setValue('name', response.data.name);
                if (response.data.trade_name) setValue('trade_name', response.data.trade_name);
                if (response.data.address) setValue('address', response.data.address);
                if (response.data.department) setValue('department', response.data.department);
                if (response.data.province) setValue('province', response.data.province);
                if (response.data.district) setValue('district', response.data.district);
                toast.success('Datos encontrados');
            } else {
                toast.error(response?.message || 'No se encontraron datos');
            }
        } catch (error: any) {
            console.error(error);
            toast.error('Error al validar el documento');
        } finally {
            setIsValidating(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (supplier) {
                reset({
                    document_type: supplier.document_type,
                    document_number: supplier.document_number,
                    name: supplier.name,
                    trade_name: supplier.trade_name || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    mobile: supplier.mobile || '',
                    address: supplier.address || '',
                    department: supplier.department || '',
                    province: supplier.province || '',
                    district: supplier.district || '',
                    website: supplier.website || '',
                    contact_person: supplier.contact_person || '',
                    contact_phone: supplier.contact_phone || '',
                    contact_email: supplier.contact_email || '',
                    payment_terms: supplier.payment_terms || '',
                    credit_limit: supplier.credit_limit || undefined,
                    notes: supplier.notes || '',
                    is_active: supplier.is_active,
                });
            } else {
                reset({
                    document_type: 'RUC',
                    document_number: '',
                    name: '',
                    trade_name: '',
                    email: '',
                    phone: '',
                    is_active: true,
                });
            }
        }
    }, [isOpen, supplier, reset]);

    const onSubmit = async (data: SupplierFormData) => {
        try {
            if (isEditing) {
                await updateSupplier(supplier.id, data);
                toast.success('Proveedor actualizado');
            } else {
                await createSupplier(data);
                toast.success('Proveedor creado');
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Document Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo Doc.
                        </label>
                        <select
                            {...register('document_type', { required: 'Requerido' })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="RUC">RUC</option>
                            <option value="DNI">DNI</option>
                            <option value="CE">Carnet Extranjería</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 relative">
                        <Input
                            label="N° Documento"
                            {...register('document_number', {
                                required: 'Número de documento requerido'
                            })}
                            error={errors.document_number?.message}
                            placeholder={documentType === 'RUC' ? '20123456789' : '12345678'}
                            className="pr-10"
                        />
                        {(documentType === 'RUC' || documentType === 'DNI') && (
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isValidating}
                                className="absolute right-2 top-8 p-2 text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
                                title="Buscar datos"
                            >
                                {isValidating ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                ) : (
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Name Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Razón Social / Nombre"
                        {...register('name', { required: 'Nombre requerido' })}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Nombre Comercial"
                        {...register('trade_name')}
                        placeholder="Opcional"
                    />
                </div>

                {/* Contact Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Email"
                        type="email"
                        {...register('email')}
                    />
                    <Input
                        label="Teléfono"
                        {...register('phone')}
                    />
                    <Input
                        label="Celular"
                        {...register('mobile')}
                    />
                </div>

                {/* Address Section */}
                <div>
                    <Input
                        label="Dirección"
                        {...register('address')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Departamento"
                        {...register('department')}
                    />
                    <Input
                        label="Provincia"
                        {...register('province')}
                    />
                    <Input
                        label="Distrito"
                        {...register('district')}
                    />
                </div>

                {/* Contact Person Section */}
                <div className="border-t border-gray-200 dark:border-[#232834] pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Persona de Contacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Nombre"
                            {...register('contact_person')}
                        />
                        <Input
                            label="Teléfono"
                            {...register('contact_phone')}
                        />
                        <Input
                            label="Email"
                            type="email"
                            {...register('contact_email')}
                        />
                    </div>
                </div>

                {/* Payment Section */}
                <div className="border-t border-gray-200 dark:border-[#232834] pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Condiciones Comerciales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Condiciones de Pago
                            </label>
                            <select
                                {...register('payment_terms')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="contado">Contado</option>
                                <option value="7_dias">7 días</option>
                                <option value="15_dias">15 días</option>
                                <option value="30_dias">30 días</option>
                                <option value="45_dias">45 días</option>
                                <option value="60_dias">60 días</option>
                            </select>
                        </div>
                        <Input
                            label="Límite de Crédito"
                            type="number"
                            step="0.01"
                            {...register('credit_limit', { valueAsNumber: true })}
                            leftAddon="S/"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
                        placeholder="Notas adicionales..."
                    />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        {...register('is_active')}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                        Proveedor activo
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#232834]">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        {isEditing ? 'Actualizar' : 'Crear'} Proveedor
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierModal;
