'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useBranchStore, Branch } from '@/stores/branchStore';
import BranchModal from '@/components/inventory/BranchModal';

export default function BranchesPage() {
    const { branches, fetchBranches, deleteBranch, isLoading } = useBranchStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleCreate = () => {
        setEditingBranch(null);
        setIsModalOpen(true);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta sede?')) {
            await deleteBranch(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sedes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los establecimientos anexos de tu empresa (SUNAT)
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nueva Sede
                </Button>
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
                                    Dirección
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Almacenes
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1E2230]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Cargando sedes...
                                    </td>
                                </tr>
                            ) : branches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No hay sedes registradas.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-[#1E2230]/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                                                    <BuildingOfficeIcon className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                        {branch.name}
                                                        {branch.is_main && (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                Principal
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Código: {branch.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{branch.address || '-'}</div>
                                            <div className="text-xs text-gray-500">{branch.ubigeo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${branch.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {branch.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {branch.warehouses_count || 0} almacenes
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(branch)}
                                                className="text-emerald-500 hover:text-blue-900 dark:text-emerald-400 dark:hover:text-blue-300 mr-3"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(branch.id)}
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

            <BranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                branch={editingBranch}
            />
        </div>
    );
}
