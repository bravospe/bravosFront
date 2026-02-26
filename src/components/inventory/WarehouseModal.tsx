'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Input, Button } from '@/components/ui';
import { useWarehouseStore, Warehouse } from '@/stores/warehouseStore';
import { useBranchStore } from '@/stores/branchStore';
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
    const { createWarehouse, updateWarehouse, isLoading } = useWarehouseStore();
    const { branches, fetchBranches } = useBranchStore();
    const isEditing = !!warehouse;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<WarehouseFormData>({
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
                reset({
                    name: '',
                    code: '',
                    address: '',
                    branch_id: '',
                    is_default: false,
                    is_active: true,
                });
            }
        }
    }, [isOpen, warehouse, reset, fetchBranches]);

    const onSubmit = async (data: WarehouseFormData) => {
        try {
            const payload = {
                ...data,
                branch_id: data.branch_id || null, // Convert empty string to null
            };

            if (isEditing) {
                await updateWarehouse(warehouse.id, payload);
                toast.success('Almacén actualizado');
            } else {
                await createWarehouse(payload);
                toast.success('Almacén creado');
            }
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sede / Sucursal
                    </label>
                    <select
                        {...register('branch_id')}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-[#1E2230] dark:border-[#232834] dark:text-white sm:text-sm"
                    >
                        <option value="">Seleccionar Sede (Opcional)</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name} ({branch.code})
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Asigna este almacén a una sede específica.
                    </p>
                </div>

                <Input
                    label="Nombre del Almacén"
                    {...register('name', { required: 'Nombre requerido' })}
                    error={errors.name?.message}
                    placeholder="Ej: Almacén Principal"
                />

                <Input
                    label="Código Interno"
                    {...register('code')}
                    placeholder="Ej: ALM-01"
                />

                <Input
                    label="Dirección"
                    {...register('address')}
                    placeholder="Dirección del almacén"
                />

                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_default"
                            {...register('is_default')}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                            Es Almacén Predeterminado
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            {...register('is_active')}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                            Activo
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#232834]">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth loading={isLoading}>
                        {isEditing ? 'Actualizar' : 'Crear'} Almacén
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default WarehouseModal;
