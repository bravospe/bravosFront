'use client';

import { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    PhoneIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Modal } from '@/components/ui';
import { useSupplierStore, Supplier } from '@/stores/supplierStore';
import toast from 'react-hot-toast';
import SupplierModal from '@/components/suppliers/SupplierModal';

export default function SuppliersPage() {
    const {
        suppliers,
        isLoading,
        meta,
        fetchSuppliers,
        deleteSupplier,
        toggleStatus,
    } = useSupplierStore();

    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);

    useEffect(() => {
        fetchSuppliers({ page: currentPage, search });
    }, [fetchSuppliers, currentPage, search]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingSupplier(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSupplier(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        fetchSuppliers({ page: currentPage, search });
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteSupplier(deleteConfirm.id);
            toast.success('Proveedor eliminado');
            setDeleteConfirm(null);
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    const handleToggleStatus = async (supplier: Supplier) => {
        try {
            await toggleStatus(supplier.id);
            toast.success(supplier.is_active ? 'Proveedor desactivado' : 'Proveedor activado');
        } catch (err: any) {
            toast.error(err.message || 'Error al cambiar estado');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona tus proveedores y sus datos de contacto
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por RUC, nombre o razón social..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                            <BuildingOfficeIcon className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Proveedores</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{meta?.total || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Activos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {suppliers.filter(s => s.is_active).length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-[#1E2230] rounded-lg">
                            <BuildingOfficeIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Inactivos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {suppliers.filter(s => !s.is_active).length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Proveedor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Documento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Contacto
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-32"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-24"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-28"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-16 mx-auto"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 bg-zinc-700 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        No se encontraron proveedores
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {supplier.trade_name || supplier.name}
                                                </p>
                                                {supplier.trade_name && (
                                                    <p className="text-sm text-gray-500">{supplier.name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300">
                                                {supplier.document_type}
                                            </span>
                                            <p className="text-gray-900 dark:text-white mt-1">{supplier.document_number}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {supplier.email && (
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <EnvelopeIcon className="w-4 h-4" />
                                                    {supplier.email}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                    <PhoneIcon className="w-4 h-4" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => handleToggleStatus(supplier)}>
                                                <Badge variant={supplier.is_active ? 'success' : 'secondary'} size="sm">
                                                    {supplier.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(supplier)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-[#232834] flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Mostrando {((currentPage - 1) * meta.per_page) + 1} a {Math.min(currentPage * meta.per_page, meta.total)} de {meta.total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={currentPage === meta.last_page}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Supplier Modal */}
            <SupplierModal
                isOpen={showModal}
                onClose={handleCloseModal}
                supplier={editingSupplier}
                onSuccess={handleSaveSuccess}
            />

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Eliminar Proveedor"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        ¿Estás seguro de eliminar a <span className="font-medium text-gray-900 dark:text-white">{deleteConfirm?.name}</span>?
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" fullWidth onClick={() => setDeleteConfirm(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" fullWidth onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
