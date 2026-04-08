'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Input, Button, Select, Toggle } from '@/components/ui';
import { useWarehouseStore, Warehouse } from '@/stores/warehouseStore';
import { useBranchStore } from '@/stores/branchStore';
import { usePlanLimit } from '@/hooks/usePlanFeature';
import toast from 'react-hot-toast';

interface WarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    warehouse: Warehouse | null;
}

interface WarehouseFormData {
    name: string;
    code: string;
    address: string;
    branch_id: string;
    is_default: boolean;
    is_active: boolean;
}

const WarehouseModal = ({ isOpen, onClose, warehouse }: WarehouseModalProps) => {
    const { warehouses, createWarehouse, updateWarehouse, isLoading } = useWarehouseStore();
    const { branches, fetchBranches } = useBranchStore();
    const isEditing = !!warehouse;

    // Check subscription limits
    const { canCreate, limit } = usePlanLimit('warehouses');
    const canCreateNew = canCreate(warehouses.length);
    const isLimitReached = !isEditing && !canCreateNew;

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<WarehouseFormData>({
        mode: 'onChange', // Validate on change for immediate feedback
        defaultValues: {
            name: '',
            code: '',
            address: '',
            branch_id: '',
            is_default: false,
            is_active: true,
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchBranches();
        }
    }, [isOpen, fetchBranches]);

    useEffect(() => {
        if (isOpen && branches.length > 0) {
            if (warehouse) {
                reset({
                    name: warehouse.name,
                    code: warehouse.code || '',
                    address: warehouse.address || '',
                    branch_id: warehouse.branch_id || '',
                    is_default: warehouse.is_default,
                    is_active: warehouse.is_active,
                });
            } else {
                // For new warehouses, try to pre-select the main branch
                const mainBranch = branches.find(b => b.is_main) || branches[0];
                reset({
                    name: '',
                    code: '',
                    address: '',
                    branch_id: mainBranch?.id || '',
                    is_default: false,
                    is_active: true,
                });
            }
        }
    }, [isOpen, warehouse, reset, branches]);

    const onSubmit = async (data: WarehouseFormData) => {
        if (!data.branch_id) {
            toast.error('Debes seleccionar una sede para crear el almacén');
            return;
        }
        
        try {
            // Clean payload: remove empty strings and only send what's necessary
            const payload: any = {
                name: data.name.trim(),
                is_default: data.is_default,
                is_active: data.is_active,
                branch_id: data.branch_id,
            };

            if (data.code && data.code.trim() !== '') {
                payload.code = data.code.trim();
            }

            if (data.address && data.address.trim() !== '') {
                payload.address = data.address.trim();
            }

            if (isEditing) {
                await updateWarehouse(warehouse.id, payload);
                toast.success('Almacén actualizado correctamente');
            } else {
                await createWarehouse(payload);
                toast.success('Almacén creado correctamente');
            }
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar el almacén');
        }
    };

    const branchOptions = branches.map((branch) => ({
        value: branch.id,
        label: `${branch.name} (${branch.code})`,
    }));

    const noBranches = branches.length === 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {noBranches && !isLoading && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                        No tienes sedes registradas. Debes crear una sede primero para poder registrar un almacén.
                    </div>
                )}

                {isLimitReached && (
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-600 dark:text-orange-400">
                        Has alcanzado el límite de almacenes de tu plan ({limit}). Mejora tu plan para crear más almacenes.
                    </div>
                )}

                <Select
                    label="Sede / Sucursal"
                    placeholder={noBranches ? "No hay sedes disponibles" : "Seleccionar Sede"}
                    options={branchOptions}
                    {...register('branch_id', { required: 'La sede es obligatoria' })}
                    error={errors.branch_id?.message}
                    disabled={noBranches || isLimitReached}
                    hint="Asigna este almacén a una sede específica."
                />

                <Input
                    label="Nombre del Almacén"
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    error={errors.name?.message}
                    placeholder="Ej: Almacén Principal"
                    disabled={isLimitReached}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Código Interno"
                        {...register('code', { 
                            maxLength: { value: 10, message: 'Máximo 10 caracteres' } 
                        })}
                        maxLength={10} // Prevent typing more than 10 characters
                        error={errors.code?.message}
                        placeholder="Ej: ALM-01"
                        disabled={isLimitReached}
                    />

                    <Input
                        label="Dirección"
                        {...register('address')}
                        placeholder="Dirección del almacén"
                        disabled={isLimitReached}
                    />
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-[#232834] bg-gray-50/50 dark:bg-[#1E2230]/30">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Almacén Predeterminado
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Se seleccionará automáticamente al crear documentos.
                            </span>
                        </div>
                        <Controller
                            name="is_default"
                            control={control}
                            render={({ field }) => (
                                <Toggle
                                    checked={field.value}
                                    onChange={field.onChange}
                                    disabled={isLimitReached}
                                />
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-[#232834] bg-gray-50/50 dark:bg-[#1E2230]/30">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Estado del Almacén
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Determina si el almacén está disponible para su uso.
                            </span>
                        </div>
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field }) => (
                                <Toggle
                                    checked={field.value}
                                    onChange={field.onChange}
                                    disabled={isLimitReached}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-[#232834]">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        fullWidth 
                        loading={isLoading}
                        disabled={noBranches || isLimitReached}
                    >
                        {isEditing ? 'Guardar Cambios' : 'Crear Almacén'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default WarehouseModal;
