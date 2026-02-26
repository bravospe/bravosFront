'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Input, Button } from '@/components/ui';
import { useBranchStore, Branch } from '@/stores/branchStore';
import toast from 'react-hot-toast';

interface BranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: Branch | null;
}

interface BranchFormData {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    ubigeo: string;
    is_main: boolean;
    is_active: boolean;
}

const BranchModal = ({ isOpen, onClose, branch }: BranchModalProps) => {
    const { createBranch, updateBranch, isLoading } = useBranchStore();
    const isEditing = !!branch;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BranchFormData>({
        defaultValues: {
            name: '',
            code: '0000',
            address: '',
            phone: '',
            email: '',
            ubigeo: '',
            is_main: false,
            is_active: true,
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (branch) {
                reset({
                    name: branch.name,
                    code: branch.code,
                    address: branch.address || '',
                    phone: branch.phone || '',
                    email: branch.email || '',
                    ubigeo: branch.ubigeo || '',
                    is_main: branch.is_main,
                    is_active: branch.is_active,
                });
            } else {
                reset({
                    name: '',
                    code: '0000',
                    address: '',
                    phone: '',
                    email: '',
                    ubigeo: '',
                    is_main: false,
                    is_active: true,
                });
            }
        }
    }, [isOpen, branch, reset]);

    const onSubmit = async (data: BranchFormData) => {
        try {
            if (isEditing) {
                await updateBranch(branch.id, data);
                toast.success('Sede actualizada');
            } else {
                await createBranch(data);
                toast.success('Sede creada');
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
            title={isEditing ? 'Editar Sede' : 'Nueva Sede'}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Nombre Comercial"
                    {...register('name', { required: 'Nombre requerido' })}
                    error={errors.name?.message}
                    placeholder="Ej: Tienda Principal"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Código SUNAT"
                        {...register('code', { required: 'Código requerido', maxLength: 4 })}
                        error={errors.code?.message}
                        placeholder="0000"
                    />
                    <Input
                        label="Ubigeo"
                        {...register('ubigeo', { maxLength: 6 })}
                        placeholder="150101"
                    />
                </div>

                <Input
                    label="Dirección"
                    {...register('address')}
                    placeholder="Dirección física del establecimiento"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Teléfono"
                        {...register('phone')}
                    />
                    <Input
                        label="Email"
                        {...register('email')}
                        type="email"
                    />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_main"
                            {...register('is_main')}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="is_main" className="text-sm text-gray-700 dark:text-gray-300">
                            Es Sede Principal (Código 0000)
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
                        {isEditing ? 'Actualizar' : 'Crear'} Sede
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default BranchModal;
