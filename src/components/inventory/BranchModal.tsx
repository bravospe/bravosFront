'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal, Input, Button } from '@/components/ui';
import { useBranchStore, Branch } from '@/stores/branchStore';
import UbigeoSelector from '@/components/ui/UbigeoSelector';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

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

const Toggle = ({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
            {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={clsx(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[#161A22]',
                checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#2A3244]'
            )}
        >
            <span
                className={clsx(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    </div>
);

const BranchModal = ({ isOpen, onClose, branch }: BranchModalProps) => {
    const { createBranch, updateBranch, isLoading } = useBranchStore();
    const isEditing = !!branch;
    const [ubigeoLabel, setUbigeoLabel] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
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

    const isMain   = watch('is_main');
    const isActive = watch('is_active');

    useEffect(() => {
        if (isOpen) {
            if (branch) {
                reset({
                    name:      branch.name,
                    code:      branch.code,
                    address:   branch.address || '',
                    phone:     branch.phone || '',
                    email:     branch.email || '',
                    ubigeo:    branch.ubigeo || '',
                    is_main:   branch.is_main,
                    is_active: branch.is_active,
                });
            } else {
                reset({
                    name: '', code: '0000', address: '', phone: '',
                    email: '', ubigeo: '', is_main: false, is_active: true,
                });
                setUbigeoLabel('');
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
                        label="Dirección"
                        {...register('address')}
                        placeholder="Av. / Jr. / Calle..."
                    />
                </div>

                <Controller
                    name="ubigeo"
                    control={control}
                    render={({ field }) => (
                        <UbigeoSelector
                            label="Ubigeo"
                            value={field.value}
                            onChange={(code, label) => {
                                field.onChange(code);
                                setUbigeoLabel(label);
                            }}
                        />
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Teléfono"
                        {...register('phone')}
                        placeholder="+51 999 999 999"
                    />
                    <Input
                        label="Email"
                        {...register('email')}
                        type="email"
                        placeholder="sede@empresa.com"
                    />
                </div>

                {/* Toggles */}
                <div className="rounded-xl border border-gray-100 dark:border-[#232834] divide-y divide-gray-100 dark:divide-[#232834] overflow-hidden">
                    <div className="px-4 py-3">
                        <Toggle
                            checked={isMain}
                            onChange={v => {
                                setValue('is_main', v);
                                if (v) setValue('code', '0000');
                            }}
                            label="Sede principal"
                            description="Código SUNAT 0000 — establecimiento principal de la empresa"
                        />
                    </div>
                    <div className="px-4 py-3">
                        <Toggle
                            checked={isActive}
                            onChange={v => setValue('is_active', v)}
                            label="Activa"
                            description="La sede aparece disponible en el sistema"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-[#232834]">
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
