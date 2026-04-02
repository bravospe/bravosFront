'use client';

import { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import {
    XMarkIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    TagIcon,
    CubeIcon,
    BuildingStorefrontIcon,
    SparklesIcon,
    GiftIcon,
    HeartIcon,
    StarIcon,
    TruckIcon,
    WrenchScrewdriverIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    CameraIcon,
    MusicalNoteIcon,
    BookOpenIcon,
    BeakerIcon,
    CakeIcon,
    HomeIcon,
    PaintBrushIcon,
    ScissorsIcon,
    BoltIcon,
    FireIcon,
    SunIcon,
    PhotoIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { Button, Input } from '@/components/ui';
import { useCategoryStore } from '@/stores/categoryStore';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiUrl } from '@/utils/apiConfig';

const API_BASE = getApiUrl();

// Business-related icons
const CATEGORY_ICONS = [
    { name: 'shopping-bag', icon: ShoppingBagIcon },
    { name: 'shopping-cart', icon: ShoppingCartIcon },
    { name: 'tag', icon: TagIcon },
    { name: 'cube', icon: CubeIcon },
    { name: 'storefront', icon: BuildingStorefrontIcon },
    { name: 'sparkles', icon: SparklesIcon },
    { name: 'gift', icon: GiftIcon },
    { name: 'heart', icon: HeartIcon },
    { name: 'star', icon: StarIcon },
    { name: 'truck', icon: TruckIcon },
    { name: 'tools', icon: WrenchScrewdriverIcon },
    { name: 'computer', icon: ComputerDesktopIcon },
    { name: 'phone', icon: DevicePhoneMobileIcon },
    { name: 'camera', icon: CameraIcon },
    { name: 'music', icon: MusicalNoteIcon },
    { name: 'book', icon: BookOpenIcon },
    { name: 'beaker', icon: BeakerIcon },
    { name: 'cake', icon: CakeIcon },
    { name: 'home', icon: HomeIcon },
    { name: 'paint', icon: PaintBrushIcon },
    { name: 'scissors', icon: ScissorsIcon },
    { name: 'bolt', icon: BoltIcon },
    { name: 'fire', icon: FireIcon },
    { name: 'sun', icon: SunIcon },
];

interface ProductCategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
}

interface CategoryFormData {
    name: string;
    description: string;
    parent_id: string | '';
    is_active: boolean;
}

const ProductCategoryDialog = ({ isOpen, onClose, category }: ProductCategoryDialogProps) => {
    const { createCategory, updateCategory, categories, isLoading } = useCategoryStore();
    const [selectedIcon, setSelectedIcon] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,

        formState: { errors }
    } = useForm<CategoryFormData>({
        defaultValues: {
            name: '',
            description: '',
            parent_id: '',
            is_active: true,
        }
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (category) {
                setValue('name', category.name);
                setValue('description', category.description || '');
                setValue('parent_id', category.parent_id || '');
                setValue('is_active', category.is_active ?? true);
                setSelectedIcon((category as any).icon || '');
                setImagePreview((category as any).image || null);
            } else {
                reset({
                    name: '',
                    description: '',
                    parent_id: '',
                    is_active: true,
                });
                setSelectedIcon('');
                setImagePreview(null);
                setImageFile(null);
            }
        }
    }, [isOpen, category, reset, setValue]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setImageFile(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data: CategoryFormData) => {
        try {
            const payload: any = { ...data };
            if (!payload.parent_id) payload.parent_id = null;

            // Add icon
            if (selectedIcon) payload.icon = selectedIcon;

            // Upload image if new file selected
            if (imageFile) {
                setIsUploadingImage(true);
                const token = useAuthStore.getState().token;
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('type', 'category');

                try {
                    const response = await axios.post(`${API_BASE}/media/upload`, formData, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    payload.image = response.data.data.path;
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    toast.error('Error al subir imagen');
                    setIsUploadingImage(false);
                    return;
                }
                setIsUploadingImage(false);
            } else if (imagePreview && !imagePreview.startsWith('data:')) {
                // Keep existing image
                payload.image = imagePreview;
            }


            if (category) {
                // Prevent setting itself as parent
                if (payload.parent_id === category.id) {
                    toast.error('Una categoría no puede ser su propia categoría padre');
                    return;
                }
                await updateCategory(category.id, payload);
                toast.success('Categoría actualizada exitosamente');
            } else {
                await createCategory(payload);
                toast.success('Categoría creada exitosamente');
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(category ? 'Error al actualizar categoría' : 'Error al crear categoría');
        }
    };

    // Filter out current category from parent options to prevent circular dependency
    const parentOptions = categories.filter(c => !category || c.id !== category.id);

    return (
        <Transition show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black/30 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-black text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="flex items-center justify-between py-2 px-4 border-b border-gray-100 dark:border-[#1E2230]">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white">
                                        {category ? 'Editar Categoría' : 'Nueva Categoría'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-md bg-white dark:bg-black text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <Input
                                            label="Nombre"
                                            {...register('name', { required: 'Requerido' })}
                                            error={errors.name?.message}
                                        />

                                        {/* Icon and Image Row - Compact */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Icon Picker */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Icono
                                                </label>
                                                <div className="border border-gray-200 dark:border-[#232834] rounded-lg p-2 max-h-28 overflow-y-auto">
                                                    <div className="grid grid-cols-6 gap-1">
                                                        {CATEGORY_ICONS.map(({ name, icon: Icon }) => (
                                                            <button
                                                                key={name}
                                                                type="button"
                                                                onClick={() => setSelectedIcon(name)}
                                                                className={`p-1.5 rounded-md transition-colors ${selectedIcon === name
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'hover:bg-gray-100 dark:hover:bg-[#1E2230] text-gray-600 dark:text-gray-400'
                                                                    }`}
                                                                title={name}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {selectedIcon && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedIcon('')}
                                                        className="text-xs text-gray-500 hover:text-red-500 mt-1"
                                                    >
                                                        Quitar icono
                                                    </button>
                                                )}
                                            </div>

                                            {/* Image Upload */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Imagen
                                                </label>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                {imagePreview ? (
                                                    <div className="relative h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-[#232834]">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={removeImage}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                                        >
                                                            <XMarkIcon className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-[#232834] rounded-lg flex flex-col items-center justify-center hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-[#1E2230]/50 transition-colors"
                                                    >
                                                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                                                        <span className="text-xs text-gray-500 mt-1">Subir</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Categoría Padre (Opcional)
                                            </label>
                                            <select
                                                {...register('parent_id')}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-[#1E2230] dark:border-[#232834] dark:text-white sm:text-sm"
                                            >
                                                <option value="">Ninguna - Categoría Principal</option>
                                                {parentOptions.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">Selecciona una categoría padre para convertirla en subcategoría</p>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Descripción
                                            </label>
                                            <textarea
                                                {...register('description')}
                                                rows={3}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-[#1E2230] dark:border-[#232834] dark:text-white sm:text-sm"
                                                placeholder="Descripción opcional..."
                                            />
                                        </div>

                                        <div className="flex items-center pt-2">
                                            <input
                                                type="checkbox"
                                                id="is_active_cat"
                                                {...register('is_active')}
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <label htmlFor="is_active_cat" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                                Activo
                                            </label>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-[#1E2230]/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 -mx-4 -mb-4 mt-6 rounded-b-lg">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                loading={isLoading}
                                                className="inline-flex w-full justify-center sm:ml-3 sm:w-auto"
                                            >
                                                {category ? 'Guardar Cambios' : 'Crear Categoría'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={onClose}
                                                className="mt-3 inline-flex w-full justify-center sm:mt-0 sm:w-auto"
                                            >
                                                Cancelar
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

export default ProductCategoryDialog;
