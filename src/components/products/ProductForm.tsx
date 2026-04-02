'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBrandStore } from '@/stores/brandStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button, Input, Toggle } from '@/components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ProductVariantsSection from '@/components/products/ProductVariantsSection';
import { ProductMediaManager, ProductImage } from '@/components/media';

interface ProductFormData {
    code: string;
    barcode: string;
    name: string;
    description: string;
    type: 'product' | 'service';
    category_id: string;
    brand_id?: string;
    unit_code: string;
    unit_name: string;
    sale_price: number;
    purchase_price: number;
    stock: number;
    min_stock: number;
    is_active: boolean;
}

interface ProductFormProps {
    productId?: string;
}

const ProductForm = ({ productId }: ProductFormProps) => {
    const router = useRouter();
    const id = productId;
    const isEditMode = !!id;

    const { createProduct, updateProduct, getProduct, isLoading } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { brands, fetchBrands } = useBrandStore();
    const { units, fetchUnits } = useSettingsStore();

    // Multi-image state using ProductMediaManager
    const [productImages, setProductImages] = useState<ProductImage[]>([]);

    // Fetch categories and brands on mount
    useEffect(() => {
        fetchCategories();
        fetchBrands();
        fetchUnits();
    }, []);

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ProductFormData>({
        defaultValues: {
            type: 'product',
            is_active: true,
            unit_code: 'NIU',
            unit_name: 'UNIDAD',
            sale_price: 0,
            purchase_price: 0,
            stock: 0,
            min_stock: 5
        }
    });

    // Watch form values for variants section
    const categoryId = watch('category_id');
    const salePrice = watch('sale_price');
    const skuCode = watch('code');

    // Load product data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const loadProduct = async () => {
                try {
                    const product = await getProduct(id);
                    if (product) {
                        reset({
                            code: product.code,
                            barcode: product.barcode || '',
                            name: product.name,
                            description: product.description || '',
                            type: 'product',
                            category_id: product.category_id,
                            brand_id: product.brand_id || '',
                            unit_code: product.unit_code || 'NIU',
                            unit_name: product.unit_name || 'UNIDAD',
                            sale_price: Number(product.sale_price),
                            purchase_price: Number(product.purchase_price || 0),
                            stock: Number(product.stock || 0),
                            min_stock: Number(product.min_stock || 0),
                            is_active: Boolean(product.is_active)
                        });

                        // Load existing images
                        if (product.image) {
                            setProductImages([{
                                id: 'existing-0',
                                url: product.image,
                                isPrimary: true,
                            }]);
                        }
                        // If product has media array (from the new media system)
                        const productData = product as { media?: Array<{ id: string; url: string; path: string; name: string; pivot?: { is_primary?: boolean } }> };
                        if (productData.media && Array.isArray(productData.media)) {
                            setProductImages(productData.media.map((m, idx: number) => ({
                                id: m.id,
                                url: m.url,
                                path: m.path,
                                name: m.name,
                                isPrimary: m.pivot?.is_primary || idx === 0,
                                isFromGallery: true,
                                mediaId: m.id,
                            })));
                        }
                    }
                } catch (error) {
                    console.error("Error loading product", error);
                    toast.error("Error al cargar el producto");
                    router.push('/products');
                }
            };
            loadProduct();
        }
    }, [isEditMode, id, getProduct, reset, router]);

    const onSubmit = async (data: ProductFormData) => {
        // Check if any images are still uploading
        if (productImages.some(img => img.isUploading)) {
            toast.error('Espera a que todas las imágenes terminen de subir');
            return;
        }

        try {
            const formData = new FormData();

            // Append simple fields
            formData.append('name', data.name);
            formData.append('code', data.code);
            formData.append('sale_price', String(data.sale_price));
            formData.append('category_id', data.category_id);
            if (data.brand_id) formData.append('brand_id', data.brand_id);
            formData.append('is_active', data.is_active ? '1' : '0');

            // Optional fields
            if (data.description) formData.append('description', data.description);
            if (data.barcode) formData.append('barcode', data.barcode);
            if (data.purchase_price) formData.append('purchase_price', String(data.purchase_price));
            if (data.stock !== undefined) formData.append('stock', String(data.stock));
            if (data.min_stock !== undefined) formData.append('min_stock', String(data.min_stock));
            if (data.unit_code) formData.append('unit_code', data.unit_code);
            if (data.unit_name) formData.append('unit_name', data.unit_name);

            // Send image paths
            productImages.forEach((img, index) => {
                if (img.path) {
                    formData.append(`image_paths[${index}]`, img.path);
                }
                if (img.mediaId) {
                    formData.append(`media_ids[${index}]`, img.mediaId);
                }
                formData.append(`image_order[${index}]`, String(index));
                formData.append(`image_primary[${index}]`, img.isPrimary ? '1' : '0');
            });

            // For backward compat, send first image path as 'image' field
            const primaryImage = productImages.find(img => img.isPrimary) || productImages[0];
            if (primaryImage?.path) {
                formData.append('image', primaryImage.path);
            }

            if (isEditMode && id) {
                await updateProduct(id, formData);
                toast.success('Producto actualizado exitosamente');
            } else {
                await createProduct(formData);
                toast.success('Producto creado exitosamente');
            }

            router.push('/products');
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar producto');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => router.push('/products')}>
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => router.push('/products')}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} loading={isLoading} variant="primary">
                        Guardar Producto
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General, Pricing, Inventory */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información General</h2>

                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Nombre del Producto"
                                {...register('name', { required: 'El nombre es requerido' })}
                                error={errors.name?.message}
                                placeholder="ej. Camiseta de Algodón"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={4}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-black dark:text-gray-100 sm:text-sm px-4 py-2.5 transition-colors"
                                    placeholder="Descripción detallada del producto..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Precios</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Precio de Venta (S/)"
                                type="number"
                                step="0.01"
                                {...register('sale_price', { required: 'Requerido', min: 0 })}
                                error={errors.sale_price?.message}
                            />
                            <Input
                                label="Costo de Compra (S/)"
                                type="number"
                                step="0.01"
                                {...register('purchase_price', { min: 0 })}
                            />
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Inventario</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Input
                                label="SKU"
                                {...register('code', { required: 'Requerido' })}
                                error={errors.code?.message}
                            />
                            <Input
                                label="Código de Barras"
                                {...register('barcode')}
                            />
                            <Input
                                label="Stock Inicial"
                                type="number"
                                {...register('stock', { min: 0 })}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Input
                                label="Stock Mínimo"
                                type="number"
                                {...register('min_stock', { min: 0 })}
                            />
                        </div>
                    </div>

                    {/* Product Variants Section */}
                    <ProductVariantsSection
                        productId={id}
                        categoryId={categoryId}
                        basePrice={salePrice || 0}
                        baseSku={skuCode || 'SKU'}
                    />
                </div>

                {/* Right Column: Status, Organization, Multimedia */}
                <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estado</h2>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Producto Activo</span>
                            <Toggle
                                checked={watch('is_active')}
                                onChange={(val) => setValue('is_active', val)}
                                size="md"
                            />
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Organización</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Categoría
                            </label>
                            <select
                                {...register('category_id')}
                                className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-black dark:text-gray-100 sm:text-sm px-4 py-2.5 appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right pr-10 transition-colors"
                            >
                                <option value="">Seleccionar Categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Marca
                            </label>
                            <select
                                {...register('brand_id')}
                                className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-black dark:text-gray-100 sm:text-sm px-4 py-2.5 appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right pr-10 transition-colors"
                            >
                                <option value="">Seleccionar Marca</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Unidad de Medida
                            </label>
                            <select
                                {...register('unit_code')}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    const unit = units.find(u => u.abbreviation === code);
                                    setValue('unit_code', code);
                                    if (unit) setValue('unit_name', unit.name);
                                }}
                                className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-black dark:text-gray-100 sm:text-sm px-4 py-2.5 appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right pr-10 transition-colors"
                            >
                                <option value="NIU">Unidad (NIU)</option>
                                {units.filter(u => u.abbreviation !== 'NIU').map((unit) => (
                                    <option key={unit.id} value={unit.abbreviation}>
                                        {unit.name} ({unit.abbreviation})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Multimedia - New ProductMediaManager */}
                    <div className="bg-white dark:bg-black shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Multimedia</h2>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Imágenes del Producto
                        </label>

                        <ProductMediaManager
                            images={productImages}
                            onChange={setProductImages}
                            maxImages={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;
