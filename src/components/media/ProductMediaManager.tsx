import { useState, useRef, useCallback, useEffect } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MediaGalleryModal from './MediaGalleryModal';
import { MediaItem } from '@/services/mediaService';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

import { getApiUrl } from '@/utils/apiConfig';
const API_BASE = getApiUrl();

export interface ProductImage {
  id: string;
  url: string;
  path?: string;
  name?: string;
  isPrimary?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  isFromGallery?: boolean;
  mediaId?: string;
}

interface ProductMediaManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

// Sortable Image Item Component
const SortableImageItem = ({
  image,
  onRemove,
  onSetPrimary,
  onPreview,
  isPrimary,
}: {
  image: ProductImage;
  onRemove: () => void;
  onSetPrimary: () => void;
  onPreview: () => void;
  isPrimary: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative aspect-square rounded-lg overflow-hidden border-2 group',
        isDragging ? 'opacity-50 border-emerald-500 z-50 shadow-xl' : 'border-gray-200 dark:border-[#232834]',
        isPrimary && 'ring-2 ring-emerald-500 ring-offset-2'
      )}
      {...attributes}
    >
      {/* Drag handle — covers the image area, sits below action buttons */}
      <div
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />

      {imageError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-black pointer-events-none">
          <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          <span className="text-xs text-gray-500 mt-1">Error</span>
        </div>
      ) : (
        <img
          src={image.url}
          alt={image.name || 'Product image'}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          onError={() => setImageError(true)}
        />
      )}

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs font-medium px-1.5 py-0.5 rounded">
          Principal
        </div>
      )}

      {/* Uploading Overlay */}
      {image.isUploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
          {image.uploadProgress !== undefined && (
            <span className="text-white text-sm mt-2">{image.uploadProgress}%</span>
          )}
        </div>
      )}

      {/* Hover Actions */}
      {!image.isUploading && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 z-10">
          {/* Preview */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-700 shadow-lg transition-colors"
            title="Ver imagen"
          >
            <EyeIcon className="w-4 h-4" />
          </button>

          {/* Set as Primary */}
          {!isPrimary && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
              className="p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-700 shadow-lg transition-colors"
              title="Establecer como principal"
            >
              <StarIconSolid className="w-4 h-4 text-yellow-500" />
            </button>
          )}
        </div>
      )}

      {/* Remove Button */}
      {!image.isUploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
          title="Eliminar"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}

      {/* Primary Star Indicator */}
      {isPrimary && (
        <div className="absolute bottom-1 right-1">
          <StarIconSolid className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

const ProductMediaManager = ({
  images,
  onChange,
  maxImages = 10,
}: ProductMediaManagerProps) => {
  const { token } = useAuthStore();
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Update parent when local changes (but not during uploads)
  const updateImages = useCallback((newImages: ProductImage[]) => {
    setLocalImages(newImages);
    // Only update parent if no uploads in progress
    if (!newImages.some(img => img.isUploading)) {
      onChange(newImages);
    }
  }, [onChange]);

  // Upload file immediately and add to images
  const uploadFile = async (file: File) => {
    const tempId = `uploading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create temporary preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newImage: ProductImage = {
        id: tempId,
        url: reader.result as string,
        name: file.name,
        isUploading: true,
        uploadProgress: 0,
        isPrimary: localImages.length === 0,
      };
      
      const updatedImages = [...localImages, newImage];
      setLocalImages(updatedImages);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'product');

        const response = await axios.post(`${API_BASE}/media/upload`, formData, {
          headers: { 'Authorization': `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setLocalImages(prev => prev.map(img =>
                img.id === tempId ? { ...img, uploadProgress: progress } : img
              ));
            }
          },
        });

        // Update with server data
        setLocalImages(prev => {
          const updated = prev.map(img =>
            img.id === tempId
              ? {
                  ...img,
                  id: response.data.data.filename || tempId,
                  url: response.data.data.url,
                  path: response.data.data.path,
                  isUploading: false,
                  uploadProgress: undefined,
                }
              : img
          );
          // Update parent
          onChange(updated);
          return updated;
        });
        
        toast.success('Imagen subida');
      } catch (error: unknown) {
        console.error('Upload error:', error);
        setLocalImages(prev => {
          const filtered = prev.filter(img => img.id !== tempId);
          onChange(filtered);
          return filtered;
        });
        const axiosError = error as { response?: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || 'Error al subir imagen');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = maxImages - localImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToUpload) {
      await uploadFile(file);
    }

    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    const remainingSlots = maxImages - localImages.length;
    
    if (remainingSlots <= 0) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    const filesToUpload = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    filesToUpload.forEach(uploadFile);
  }, [localImages, maxImages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex(img => img.id === active.id);
      const newIndex = localImages.findIndex(img => img.id === over.id);
      const newImages = arrayMove(localImages, oldIndex, newIndex);
      
      // First image is primary
      const updated = newImages.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0,
      }));
      updateImages(updated);
    }
  };

  const handleRemove = (id: string) => {
    const newImages = localImages.filter(img => img.id !== id);
    // Update primary if removed
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    updateImages(newImages);
  };

  const handleSetPrimary = (id: string) => {
    const targetImage = localImages.find(img => img.id === id);
    if (!targetImage) return;

    // Move to first position and set as primary
    const otherImages = localImages.filter(img => img.id !== id);
    const newImages = [
      { ...targetImage, isPrimary: true },
      ...otherImages.map(img => ({ ...img, isPrimary: false })),
    ];
    updateImages(newImages);
    toast.success('Imagen principal actualizada');
  };

  const handleGallerySelect = (selectedMedia: MediaItem[]) => {
    const remainingSlots = maxImages - localImages.length;
    const toAdd = selectedMedia.slice(0, remainingSlots).map((media, idx) => ({
      id: media.id,
      url: media.url,
      path: media.path,
      name: media.name,
      isPrimary: localImages.length === 0 && idx === 0,
      isFromGallery: true,
      mediaId: media.id,
    }));

    updateImages([...localImages, ...toAdd]);
    toast.success(`${toAdd.length} imagen(es) agregada(s)`);
  };

  const primaryImage = localImages.find(img => img.isPrimary) || localImages[0];

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Grid with Drag & Drop */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localImages.map(img => img.id)} strategy={rectSortingStrategy}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={clsx(
              'grid grid-cols-3 gap-3 p-3 rounded-lg border-2 border-dashed transition-colors min-h-[120px]',
              dragOver
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-gray-300 dark:border-[#232834]'
            )}
          >
            {/* Existing Images */}
            {localImages.map((image) => (
              <SortableImageItem
                key={image.id}
                image={image}
                isPrimary={image.id === (primaryImage?.id)}
                onRemove={() => handleRemove(image.id)}
                onSetPrimary={() => handleSetPrimary(image.id)}
                onPreview={() => setPreviewImage(image.url)}
              />
            ))}

            {/* Add Button */}
            {localImages.length < maxImages && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-[#232834] flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-[#161A22]/50 transition-colors">
                <div className="flex gap-2">
                  {/* Upload from device */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#1E2230] transition-colors"
                    title="Subir desde dispositivo"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  {/* Open gallery */}
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#1E2230] transition-colors"
                    title="Seleccionar de galería"
                  >
                    <Squares2X2Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Agregar</span>
              </div>
            )}

            {/* Empty State */}
            {localImages.length === 0 && !dragOver && (
              <div className="col-span-3 flex flex-col items-center justify-center py-8">
                <PhotoIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Arrastra imágenes aquí o usa los botones para agregar
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1E2230] rounded-lg hover:bg-gray-200 dark:hover:bg-[#1E2230]"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    Galería
                  </button>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Arrastra para reordenar. La primera imagen será la principal. Máximo {maxImages} imágenes.
      </p>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Vista ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <MediaGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handleGallerySelect}
        multiple
        maxSelect={maxImages - localImages.length}
        collection="products"
        selectedIds={localImages.filter(img => img.mediaId).map(img => img.mediaId!)}
      />
    </div>
  );
};

export default ProductMediaManager;
