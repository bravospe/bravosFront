'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArchiveBoxIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button, Select } from '@/components/ui';
import { useWarehouseStore, Warehouse } from '@/stores/warehouseStore';
import { useBranchStore } from '@/stores/branchStore';
import WarehouseModal from '@/components/inventory/WarehouseModal';

export default function WarehousesPage() {
    const { warehouses, fetchWarehouses, deleteWarehouse, isLoading } = useWarehouseStore();
    const { branches, fetchBranches } = useBranchStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        fetchWarehouses(selectedBranch || undefined);
    }, [fetchWarehouses, selectedBranch]);

    const handleCreate = () => {
        setEditingWarehouse(null);
        setIsModalOpen(true);
    };

    const handleEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este almacén?')) {
            try {
                await deleteWarehouse(id);
                toast.success('Almacén eliminado correctamente');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Error al eliminar el almacén');
            }
        }
    };

    const getBranchName = (branchId?: string) => {
        if (!branchId) return 'Sin Sede Asignada';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : 'Sede Desconocida';
    };

    const branchOptions = branches.map(b => ({
        value: b.id,
        label: b.name
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Almacenes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los almacenes físicos y virtuales de tu inventario
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-end sm:items-center">
                    <div className="w-full sm:w-64">
                        <Select
                            placeholder="Todas las Sedes"
                            options={branchOptions}
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreate} className="w-full sm:w-auto">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Almacén
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-black rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
                        <thead className="bg-gray-50 dark:bg-[#1E2230]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nombre / Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Sede
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Cargando almacenes...
                                    </td>
                                </tr>
                            ) : warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No hay almacenes registrados.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <tr key={warehouse.id} className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                    <ArchiveBoxIcon className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                        {warehouse.name}
                                                        {warehouse.is_default && (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                Predeterminado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Código: {warehouse.code || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {warehouse.branch ? warehouse.branch.name : getBranchName(warehouse.branch_id)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {warehouse.address || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${warehouse.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {warehouse.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(warehouse)}
                                                className="text-emerald-500 hover:text-blue-900 dark:text-emerald-400 dark:hover:text-blue-300 mr-3"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(warehouse.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <WarehouseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                warehouse={editingWarehouse}
            />
        </div>
    );
}
