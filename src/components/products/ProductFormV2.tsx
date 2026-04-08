'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useBrandStore } from '@/stores/brandStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { Button, Input, Toggle } from '@/components/ui';
import {
    ArrowLeftIcon,
    TagIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
    PhotoIcon,
    BanknotesIcon,
    ArchiveBoxIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowTopRightOnSquareIcon,
    BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProductVariantBuilder, { VariantBuilderHandle } from '@/components/products/ProductVariantBuilder';
import { ProductMediaManager, ProductImage } from '@/components/media';

// ---- Types ----

interface ProductFormData {
    code: string;
    barcode: string;
    name: string;
    description: string;
    is_service: boolean;
    category_id: string;
    brand_id: string;
    unit_code: string;
    unit_name: string;
    sale_price: number;
    purchase_price: number;
    wholesale_price: number;
    stock: number;
    min_stock: number;
    is_active: boolean;
    tax_type: 'gravado' | 'exonerado' | 'inafecto';
}

interface Props {
    productId?: string;
}

// Maps legacy uppercase values (IGV, EXONERADO, INAFECTO) or any unknown
// value to the lowercase values the backend now expects.
function normalizeTaxType(value: string | undefined): 'gravado' | 'exonerado' | 'inafecto' | 'gratuito' {
    const map: Record<string, 'gravado' | 'exonerado' | 'inafecto' | 'gratuito'> = {
        IGV: 'gravado',
        GRAVADO: 'gravado',
        gravado: 'gravado',
        EXONERADO: 'exonerado',
        exonerado: 'exonerado',
        INAFECTO: 'inafecto',
        inafecto: 'inafecto',
        GRATUITO: 'gratuito',
        gratuito: 'gratuito',
    };
    return map[value ?? ''] ?? 'gravado';
}

// ---- Margin Indicator ----

function MarginIndicator({ sale, purchase }: { sale: number; purchase: number }) {
    if (!sale || !purchase || purchase <= 0) return null;
    const margin = ((sale - purchase) / purchase) * 100;
    const isGood = margin >= 30;
    const isWarning = margin >= 0 && margin < 30;

    return (
        <div
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                isGood
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : isWarning
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
        >
            {isGood ? (
                <CheckCircleIcon className="w-3 h-3" />
            ) : (
                <ExclamationTriangleIcon className="w-3 h-3" />
            )}
            Margen {margin.toFixed(0)}%
        </div>
    );
}

// ---- Section Card ----

function SectionCard({
    icon,
    title,
    subtitle,
    children,
    iconColor = 'emerald',
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    iconColor?: 'emerald' | 'blue' | 'violet' | 'amber' | 'gray';
}) {
    const colorMap = {
        emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
        amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        gray: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
    };

    return (
        <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1E2230] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-[#1E2230]">
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[iconColor]}`}
                >
                    {icon}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                </div>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

// ---- Select Field ----

function SelectField({
    label,
    id,
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
                {label}
            </label>
            <select
                id={id}
                {...props}
                className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-[#111318] dark:text-gray-100 text-sm px-3 py-2.5 transition-colors appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e%27)] bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right pr-10"
            >
                {children}
            </select>
        </div>
    );
}

// ---- Main Component ----

const ProductFormV2 = ({ productId }: Props) => {
    const router = useRouter();
    const isEditMode = !!productId;
    const variantBuilderRef = useRef<VariantBuilderHandle>(null);

    const { createProduct, updateProduct, getProduct, isLoading } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { brands, fetchBrands } = useBrandStore();
    const { units, fetchUnits } = useSettingsStore();
    const { createAdjustment } = useInventoryStore();
    const { warehouses, fetchWarehouses } = useWarehouseStore();

    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

    useEffect(() => {
        fetchCategories();
        fetchBrands();
        fetchUnits();
        fetchWarehouses().then(() => {
            // Pre-select default warehouse
            const defaultWh = useWarehouseStore.getState().warehouses.find((w) => w.is_default);
            if (defaultWh) setSelectedWarehouseId(defaultWh.id);
        });
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch,
        setValue,
    } = useForm<ProductFormData>({
        defaultValues: {
            is_service: false,
            is_active: true,
            unit_code: 'NIU',
            unit_name: 'UNIDAD',
            sale_price: 0,
            purchase_price: 0,
            wholesale_price: 0,
            stock: 0,
            min_stock: 5,
            tax_type: 'gravado',
        },
    });

    const salePrice = watch('sale_price');
    const purchasePrice = watch('purchase_price');
    const skuCode = watch('code');
    const isService = watch('is_service');

    // Load product data in edit mode
    useEffect(() => {
        if (!isEditMode || !productId) return;

        getProduct(productId)
            .then((product) => {
                if (!product) {
                    toast.error('Producto no encontrado');
                    router.push('/products');
                    return;
                }

                reset({
                    code: product.code,
                    barcode: product.barcode || '',
                    name: product.name,
                    description: product.description || '',
                    is_service: product.is_service || false,
                    category_id: product.category_id || '',
                    brand_id: product.brand_id || '',
                    unit_code: product.unit_code || 'NIU',
                    unit_name: product.unit_name || 'UNIDAD',
                    sale_price: Number(product.sale_price),
                    purchase_price: Number(product.purchase_price || 0),
                    wholesale_price: Number((product as any).wholesale_price || 0),
                    stock: Number(product.stock || 0),
                    min_stock: Number(product.min_stock || 0),
                    is_active: Boolean(product.is_active),
                    tax_type: normalizeTaxType((product as any).tax_type),
                });

                // Load images
                const productData = product as {
                    media?: Array<{
                        id: string;
                        url: string;
                        path: string;
                        name: string;
                        pivot?: { is_primary?: boolean };
                    }>;
                    image?: string;
                };

                if (productData.media?.length) {
                    setProductImages(
                        productData.media.map((m, idx) => ({
                            id: m.id,
                            url: m.url,
                            path: m.path,
                            name: m.name,
                            isPrimary: m.pivot?.is_primary || idx === 0,
                            isFromGallery: true,
                            mediaId: m.id,
                        }))
                    );
                } else if (productData.image) {
                    setProductImages([
                        { id: 'existing-0', url: productData.image, isPrimary: true },
                    ]);
                }
            })
            .catch(() => {
                toast.error('Error al cargar el producto');
                router.push('/products');
            });
    }, [isEditMode, productId]);

    // ---- Submit ----

    const onSubmit = async (data: ProductFormData) => {
        if (productImages.some((img) => img.isUploading)) {
            toast.error('Espera a que todas las imágenes terminen de subir');
            return;
        }

        try {
            const formData = new FormData();

            formData.append('name', data.name);
            formData.append('code', data.code);
            formData.append('sale_price', String(data.sale_price));
            formData.append('is_active', data.is_active ? '1' : '0');
            formData.append('is_service', data.is_service ? '1' : '0');
            formData.append('tax_type', normalizeTaxType(data.tax_type));

            if (data.category_id) formData.append('category_id', data.category_id);
            if (data.brand_id) formData.append('brand_id', data.brand_id);
            if (data.description) formData.append('description', data.description);
            if (data.barcode) formData.append('barcode', data.barcode);
            if (data.purchase_price) formData.append('purchase_price', String(data.purchase_price));
            if (data.wholesale_price) formData.append('wholesale_price', String(data.wholesale_price));
            if (!data.is_service) {
                formData.append('stock', String(data.stock));
                formData.append('min_stock', String(data.min_stock));
            }
            if (data.unit_code) formData.append('unit_code', data.unit_code);
            if (data.unit_name) formData.append('unit_name', data.unit_name);

            productImages.forEach((img, index) => {
                if (img.path) formData.append(`image_paths[${index}]`, img.path);
                if (img.mediaId) formData.append(`media_ids[${index}]`, img.mediaId);
                formData.append(`image_order[${index}]`, String(index));
                formData.append(`image_primary[${index}]`, img.isPrimary ? '1' : '0');
            });

            const primaryImage = productImages.find((img) => img.isPrimary) || productImages[0];
            if (primaryImage?.path) formData.append('image', primaryImage.path);

            let savedId = productId;

            if (isEditMode && productId) {
                await updateProduct(productId, formData);
                toast.success('Producto actualizado');
            } else {
                // For new products: send stock=0 to product API, then create a
                // proper inventory movement so it is tracked in the kardex.
                formData.set('stock', '0');
                const created = await createProduct(formData);
                savedId = (created as any)?.id || productId;

                // Create initial stock movement if stock > 0
                if (savedId && data.stock > 0 && !data.is_service) {
                    try {
                        await createAdjustment({
                            product_id: savedId,
                            adjustment_type: 'increase',
                            reason: 'initial',
                            quantity: data.stock,
                            ...(selectedWarehouseId ? { warehouse_id: selectedWarehouseId } : {}),
                            notes: 'Stock inicial al crear el producto',
                        } as any);
                    } catch {
                        // Non-fatal — product was still created
                        toast.error('El producto fue creado pero no se pudo registrar el stock inicial. Ve a Inventario → Ajustes.');
                    }
                }

                toast.success('Producto creado');
            }

            // Save variants if any
            if (savedId && variantBuilderRef.current?.getHasVariants()) {
                await variantBuilderRef.current.saveVariants(savedId);
            }

            router.push('/products');
        } catch (error: any) {
            console.error(error);
            const responseData = error?.response?.data;
            if (responseData?.existing_product_id) {
                toast.error('Ya existe un producto con ese código. Redirigiendo a edición…');
                router.push(`/products/${responseData.existing_product_id}/edit`);
            } else if (responseData?.message) {
                toast.error(responseData.message);
            } else {
                toast.error('Error al guardar producto');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0C0F16]">
            {/* ---- Sticky Header ---- */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#1E2230] px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.push('/products')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230] text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-sm min-w-0">
                            <span className="text-gray-500 dark:text-gray-400">Productos</span>
                            <span className="text-gray-300 dark:text-gray-600">/</span>
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {isEditMode ? watch('name') || 'Editar producto' : 'Nuevo producto'}
                            </span>
                        </div>
                        {isDirty && (
                            <span className="flex-shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                Sin guardar
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => router.push('/products')}
                            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors"
                        >
                            Cancelar
                        </button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            loading={isLoading}
                            variant="primary"
                            size="sm"
                        >
                            {isEditMode ? 'Guardar cambios' : 'Crear producto'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ---- Body ---- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ======== LEFT COLUMN (2/3) ======== */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Type Selector */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('is_service', false)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                    !isService
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#111318] hover:border-gray-300 dark:hover:border-[#2A3040]'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        !isService
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 dark:bg-[#1E2230] text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <CubeIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            !isService
                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        Producto físico
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Con inventario y stock
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue('is_service', true)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                    isService
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-[#1E2230] bg-white dark:bg-[#111318] hover:border-gray-300 dark:hover:border-[#2A3040]'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isService
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-[#1E2230] text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <WrenchScrewdriverIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            isService
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        Servicio
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Sin control de inventario
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Images */}
                        <SectionCard
                            icon={<PhotoIcon className="w-4 h-4" />}
                            title="Imágenes"
                            subtitle="Arrastra para reordenar · La primera es la principal"
                            iconColor="gray"
                        >
                            <ProductMediaManager
                                images={productImages}
                                onChange={setProductImages}
                                maxImages={10}
                            />
                        </SectionCard>

                        {/* Basic Info */}
                        <SectionCard
                            icon={<InformationCircleIcon className="w-4 h-4" />}
                            title="Información general"
                            iconColor="blue"
                        >
                            <div className="space-y-4">
                                <Input
                                    label="Nombre del producto"
                                    {...register('name', { required: 'El nombre es requerido' })}
                                    error={errors.name?.message}
                                    placeholder="ej. Camiseta de algodón premium"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Descripción{' '}
                                        <span className="font-normal text-gray-400">(opcional)</span>
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={3}
                                        placeholder="Describe las características principales del producto..."
                                        className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-[#111318] dark:text-gray-100 text-sm px-3.5 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Pricing */}
                        <SectionCard
                            icon={<BanknotesIcon className="w-4 h-4" />}
                            title="Precios"
                            subtitle="Precios en soles peruanos (S/)"
                            iconColor="emerald"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Input
                                            label="Precio de venta (S/)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('sale_price', {
                                                required: 'Requerido',
                                                min: { value: 0, message: 'Mínimo 0' },
                                            })}
                                            error={errors.sale_price?.message}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            label="Costo de compra (S/)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('purchase_price', { min: 0 })}
                                        />
                                    </div>
                                </div>

                                {salePrice > 0 && purchasePrice > 0 && (
                                    <div className="flex items-center gap-2">
                                        <MarginIndicator
                                            sale={salePrice}
                                            purchase={purchasePrice}
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Ganancia: S/{' '}
                                            {(Number(salePrice) - Number(purchasePrice)).toFixed(2)}{' '}
                                            por unidad
                                        </span>
                                    </div>
                                )}

                                {/* Advanced pricing */}
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced((v) => !v)}
                                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <TagIcon className="w-4 h-4" />
                                    {showAdvanced ? 'Ocultar' : 'Ver'} precios adicionales y
                                    tributación
                                </button>

                                {showAdvanced && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-[#1E2230]">
                                        <Input
                                            label="Precio mayorista (S/)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('wholesale_price', { min: 0 })}
                                        />
                                        <SelectField
                                            label="Tipo de IGV"
                                            {...register('tax_type')}
                                        >
                                            <option value="gravado">Gravado (18% IGV)</option>
                                            <option value="exonerado">Exonerado</option>
                                            <option value="inafecto">Inafecto</option>
                                            <option value="gratuito">Gratuito</option>
                                        </SelectField>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* Inventory — only for physical products */}
                        {!isService && (
                            <SectionCard
                                icon={<ArchiveBoxIcon className="w-4 h-4" />}
                                title="Inventario"
                                subtitle="Códigos y stock inicial"
                                iconColor="amber"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="SKU / Código interno"
                                            {...register('code', { required: 'Requerido' })}
                                            error={errors.code?.message}
                                            placeholder="ej. CAM-001"
                                        />
                                        <Input
                                            label="Código de barras"
                                            {...register('barcode')}
                                            placeholder="EAN-13, UPC, etc."
                                        />
                                    </div>

                                    {/* Stock mínimo — always visible */}
                                    <Input
                                        label="Stock mínimo de alerta"
                                        type="number"
                                        min="0"
                                        {...register('min_stock', { min: 0 })}
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                                        Se generará una alerta cuando el stock baje de este nivel.
                                    </p>

                                    {/* Stock inicial — only on create */}
                                    {!isEditMode ? (
                                        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-4 space-y-3">
                                            <div className="flex items-start gap-2.5">
                                                <BuildingStorefrontIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                                        Stock inicial
                                                    </p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                        Se registrará como movimiento de entrada en el módulo de
                                                        inventario (kardex) con motivo &ldquo;Stock inicial&rdquo;.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    label="Cantidad inicial"
                                                    type="number"
                                                    min="0"
                                                    {...register('stock', { min: 0 })}
                                                    placeholder="0"
                                                />

                                                {/* Warehouse selector */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        Almacén de destino
                                                    </label>
                                                    {warehouses.length > 0 ? (
                                                        <select
                                                            value={selectedWarehouseId}
                                                            onChange={(e) =>
                                                                setSelectedWarehouseId(e.target.value)
                                                            }
                                                            className="block w-full rounded-lg border border-gray-300 dark:border-[#232834] shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white dark:bg-[#111318] dark:text-gray-100 text-sm px-3 py-2.5 transition-colors appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e%27)] bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right pr-10"
                                                        >
                                                            <option value="">Sin almacén específico</option>
                                                            {warehouses.map((w) => (
                                                                <option key={w.id} value={w.id}>
                                                                    {w.name}
                                                                    {w.is_default ? ' (Principal)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 py-2.5">
                                                            Sin almacenes configurados.{' '}
                                                            <Link
                                                                href="/inventory/warehouses"
                                                                className="text-amber-600 dark:text-amber-400 underline"
                                                            >
                                                                Crear almacén →
                                                            </Link>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Edit mode: show current stock as read-only */
                                        <div className="rounded-xl border border-gray-200 dark:border-[#1E2230] bg-gray-50 dark:bg-[#0E1117] p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <ArchiveBoxIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Stock actual:{' '}
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {watch('stock')} unidades
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Usa el módulo de inventario para ajustar
                                                            el stock.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/inventory/adjustments"
                                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Ajustar stock
                                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        {/* Variants */}
                        <ProductVariantBuilder
                            ref={variantBuilderRef}
                            productId={productId}
                            basePrice={salePrice || 0}
                            baseSku={skuCode || 'SKU'}
                        />
                    </div>

                    {/* ======== RIGHT COLUMN (1/3) — Sticky Sidebar ======== */}
                    <div className="space-y-4 lg:sticky lg:top-[73px] lg:self-start">
                        {/* Status */}
                        <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1E2230] rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                                Estado
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {watch('is_active') ? 'Activo' : 'Inactivo'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {watch('is_active')
                                            ? 'Visible en catálogo y POS'
                                            : 'Oculto del catálogo'}
                                    </p>
                                </div>
                                <Toggle
                                    checked={watch('is_active')}
                                    onChange={(val) => setValue('is_active', val)}
                                    size="md"
                                />
                            </div>
                            <div
                                className={`mt-3 h-1.5 rounded-full ${
                                    watch('is_active')
                                        ? 'bg-emerald-500'
                                        : 'bg-gray-200 dark:bg-[#232834]'
                                } transition-colors`}
                            />
                        </div>

                        {/* Organization */}
                        <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1E2230] rounded-xl p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Organización
                            </h3>

                            <SelectField
                                label="Categoría"
                                id="category_id"
                                {...register('category_id')}
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </SelectField>

                            <SelectField
                                label="Marca"
                                id="brand_id"
                                {...register('brand_id')}
                            >
                                <option value="">Sin marca</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </SelectField>

                            <SelectField
                                label="Unidad de medida"
                                id="unit_code"
                                {...register('unit_code')}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    const unit = units.find((u) => u.abbreviation === code);
                                    setValue('unit_code', code);
                                    if (unit) setValue('unit_name', unit.name);
                                }}
                            >
                                <option value="NIU">Unidad (NIU)</option>
                                {units
                                    .filter((u) => u.abbreviation !== 'NIU')
                                    .map((unit) => (
                                        <option key={unit.id} value={unit.abbreviation}>
                                            {unit.name} ({unit.abbreviation})
                                        </option>
                                    ))}
                            </SelectField>
                        </div>

                        {/* Summary card — shows a quick preview */}
                        {(watch('name') || salePrice > 0) && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-5">
                                <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                                    Resumen
                                </h3>
                                <div className="space-y-2">
                                    {watch('name') && (
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                                            {watch('name')}
                                        </p>
                                    )}
                                    {salePrice > 0 && (
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                            S/ {Number(salePrice).toFixed(2)}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {isService ? (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                Servicio
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                Producto físico
                                            </span>
                                        )}
                                        {watch('is_active') && (
                                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                Activo
                                            </span>
                                        )}
                                        {watch('tax_type') !== 'IGV' && (
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                                {watch('tax_type')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save button (also at bottom of sidebar for convenience) */}
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            loading={isLoading}
                            variant="primary"
                            className="w-full"
                        >
                            {isEditMode ? 'Guardar cambios' : 'Crear producto'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductFormV2;
