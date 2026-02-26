'use client';

import { useState, useEffect, useRef } from 'react';
import { useBrandStore, Brand } from '@/stores/brandStore';
import { Button, Input } from '@/components/ui';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiUrl } from '@/utils/apiConfig';

const API_BASE = getApiUrl();

const BrandsPage = () => {
    const { brands, fetchBrands, createBrand, updateBrand, deleteBrand, isLoading } = useBrandStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: '', is_active: true });

    // Image handling
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const openModal = (brand?: Brand) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({ name: brand.name, is_active: brand.is_active });
            setPreviewUrl(brand.image || null);
        } else {
            setEditingBrand(null);
            setFormData({ name: '', is_active: true });
            setPreviewUrl(null);
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);

        // Show local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Upload image first if selected
            let imagePath = null;
            if (selectedFile) {
                setIsUploading(true);
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);
                uploadFormData.append('type', 'brand');

                const token = useAuthStore.getState().token;
                const response = await axios.post(`${API_BASE}/media/upload`, uploadFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                imagePath = response.data.data.path; // Store relative path or full? Controller expects path.
                setIsUploading(false);
            }

            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.name);
            dataToSubmit.append('is_active', formData.is_active ? '1' : '0');

            if (imagePath) {
                // If we uploaded a new one, send the path
                dataToSubmit.append('image', imagePath);
            } else if (!selectedFile && !previewUrl && editingBrand?.image) {
                // If we cleared the image? Currently no clear button logic implemented fully except replacing.
                // If we didn't change file and previewUrl is still editingBrand.image, do nothing regarding image field.
                // If we want to support deleting image, need explicit action.
            }

            if (editingBrand) {
                await updateBrand(editingBrand.id, dataToSubmit);
                toast.success('Marca actualizada');
            } else {
                await createBrand(dataToSubmit);
                toast.success('Marca creada');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar marca');
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta marca?')) {
            await deleteBrand(id);
            toast.success('Marca eliminada');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marcas</h1>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nueva Marca
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {brands.map((brand) => (
                    <div key={brand.id} className="card p-7">
                        <div className="flex flex-wrap justify-between items-center gap-7">
                            <div className="flex items-center gap-4">
                                <div className="flex justify-center items-center size-14 shrink-0 rounded-full ring-1 ring-gray-200 bg-gray-50 dark:ring-gray-700 dark:bg-black overflow-hidden">
                                    {brand.image ? (
                                        <ImageWithFallback src={brand.image} alt={brand.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                    <a href="#" onClick={(e) => { e.preventDefault(); openModal(brand); }} className="text-base font-medium text-gray-900 hover:text-emerald-500 dark:text-gray-100 transition-colors mb-px">
                                        {brand.name}
                                    </a>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {brand.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${brand.is_active
                                        ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {brand.is_active ? 'Online' : 'Offline'}
                                </span>
                                <div className="flex gap-1 ml-2">
                                    <button
                                        onClick={() => openModal(brand)}
                                        className="btn btn-icon btn-sm btn-light hover:text-emerald-500"
                                        title="Editar"
                                    >
                                        <PencilIcon className="size-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(brand.id)}
                                        className="btn btn-icon btn-sm btn-light hover:text-red-600"
                                        title="Eliminar"
                                    >
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white dark:bg-black rounded-lg p-6 space-y-4">
                        <Dialog.Title className="text-lg font-medium dark:text-white">
                            {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                        </Dialog.Title>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-center">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-[#232834] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 relative overflow-hidden"
                                >
                                    {previewUrl ? (
                                        <ImageWithFallback src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <>
                                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-1">Logo</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <Input
                                label="Nombre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm dark:text-gray-300">Activo</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">Cancelar</Button>
                                <Button variant="primary" type="submit" loading={isUploading || isLoading}>
                                    {editingBrand ? 'Actualizar' : 'Crear'}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default BrandsPage;
