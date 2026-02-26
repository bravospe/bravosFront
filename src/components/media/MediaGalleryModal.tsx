import { Fragment, useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  CheckIcon,
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { mediaService, MediaItem, StorageStats } from '@/services/mediaService';
import { useAuthStore } from '@/stores/authStore';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem[]) => void;
  multiple?: boolean;
  maxSelect?: number;
  collection?: string;
  selectedIds?: string[];
}

const MediaGalleryModal = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  maxSelect = 10,
  collection = 'products',
  selectedIds = [],
}: MediaGalleryModalProps) => {
  const { currentCompany } = useAuthStore();
  const companyId = currentCompany?.id || '';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch media on open
  useEffect(() => {
    if (isOpen && companyId) {
      fetchMedia(1, true);
      fetchStorageStats();
    }
  }, [isOpen, companyId, search]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedIds));
    }
  }, [isOpen, selectedIds]);

  const fetchMedia = async (pageNum: number, reset = false) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await mediaService.list(companyId, {
        page: pageNum,
        per_page: 24,
        collection,
        images_only: true,
        search: search || undefined,
      });

      const newMedia = response.data.data;
      setMedia(prev => reset ? newMedia : [...prev, ...newMedia]);
      setPage(pageNum);
      setHasMore(pageNum < response.data.last_page);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Error al cargar medios');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    if (!companyId) return;
    try {
      const response = await mediaService.getStorageStats(companyId);
      setStorageStats(response.data);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      fetchMedia(page + 1);
    }
  }, [loading, hasMore, page]);

  const handleSelect = (item: MediaItem) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        if (!multiple) {
          newSet.clear();
        }
        if (newSet.size < maxSelect) {
          newSet.add(item.id);
        } else {
          toast.error(`Máximo ${maxSelect} imágenes permitidas`);
        }
      }
      return newSet;
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !companyId) return;

    // Validate files before upload
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        invalidFiles.push(`${file.name} (muy grande, máx 10MB)`);
      } else if (!ALLOWED_TYPES.some(type => file.type.startsWith(type.split('/')[0]))) {
        // Simple check for image/* or application/pdf
         invalidFiles.push(`${file.name} (tipo no permitido)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Algunos archivos no son válidos:\n${invalidFiles.join('\n')}`);
      if (validFiles.length === 0) return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedItems: MediaItem[] = [];
    const failedItems: string[] = [];

    // Process uploads sequentially to avoid issues
    const totalFiles = validFiles.length;
    let completed = 0;

    for (const file of validFiles) {
      try {
        // Use single upload endpoint which is more robust
        const response = await mediaService.upload(companyId, file, {
          collection,
          onProgress: (p) => {
             // Calculate total progress: (completed * 100 + current) / total
             const currentTotal = Math.round(((completed * 100) + p) / totalFiles);
             setUploadProgress(currentTotal);
          },
        });

        if (response.success) {
          uploadedItems.push(response.data);
        } else {
          failedItems.push(file.name);
        }
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        console.error(`Error uploading ${file.name}:`, error);
        console.error('Error details:', axiosError.response?.data);
        
        let msg = file.name;
        if (axiosError.response?.data?.message) {
             msg += `: ${axiosError.response.data.message}`;
        }
        if (axiosError.response?.data?.errors) {
            const errs = Object.values(axiosError.response.data.errors).flat().join(', ');
            if (errs) msg += ` (${errs})`;
        }
        
        failedItems.push(msg);
      }
      completed++;
    }

    if (uploadedItems.length > 0) {
      toast.success(`${uploadedItems.length} archivo(s) subido(s)`);
      fetchMedia(1, true);
      fetchStorageStats();
      
      // Auto-select uploaded files
      if (multiple) {
        setSelected(prev => {
          const newSet = new Set(prev);
          uploadedItems.forEach(item => {
            if (newSet.size < maxSelect) {
              newSet.add(item.id);
            }
          });
          return newSet;
        });
      } else if (uploadedItems.length > 0) {
        // If single select mode, select the last uploaded one
        setSelected(new Set([uploadedItems[uploadedItems.length - 1].id]));
      }
    }

    if (failedItems.length > 0) {
      toast.error(`${failedItems.length} archivo(s) fallaron al subir`);
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleDelete = async (mediaId: string) => {
    if (!companyId || !confirm('¿Eliminar esta imagen?')) return;

    try {
      await mediaService.delete(companyId, mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
      setSelected(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      fetchStorageStats();
      toast.success('Imagen eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleConfirm = () => {
    const selectedMedia = media.filter(m => selected.has(m.id));
    onSelect(selectedMedia);
    onClose();
  };

  const storagePercentage = storageStats?.percentage || 0;
  const storageColor = storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-[#0D1117] shadow-2xl transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#232834]">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Galería de Medios
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {multiple ? `Selecciona hasta ${maxSelect} imágenes` : 'Selecciona una imagen'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1E2230]"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22]">
                  {/* Search */}
                  <div className="relative flex-1 max-w-xs">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar archivos..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Subiendo {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4" />
                        Subir archivos
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />

                  {/* Storage Info */}
                  {storageStats && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-[#1E2230] rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full transition-all', storageColor)}
                          style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                      </div>
                      <span>{storageStats.used_readable} / {storageStats.limit_mb} MB</span>
                    </div>
                  )}
                </div>

                {/* Content - Scrollable */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={clsx(
                    'flex-1 overflow-y-auto p-6 transition-colors',
                    dragOver && 'bg-emerald-50 dark:bg-emerald-500/10'
                  )}
                >
                  {/* Drag Overlay */}
                  {dragOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-lg z-10 pointer-events-none">
                      <div className="text-center">
                        <CloudArrowUpIcon className="w-16 h-16 text-emerald-500 mx-auto" />
                        <p className="text-lg font-medium text-emerald-500 mt-2">Suelta los archivos aquí</p>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && media.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <PhotoIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        No hay imágenes
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Sube tu primera imagen o arrastra archivos aquí
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg"
                      >
                        <CloudArrowUpIcon className="w-4 h-4" />
                        Subir archivos
                      </button>
                    </div>
                  )}

                  {/* Media Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {media.map((item) => {
                      const isSelected = selected.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={clsx(
                            'relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all',
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <ImageWithFallback
                            src={item.thumbnail_url || item.url}
                            alt={item.alt_text || item.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Selection Overlay */}
                          <div
                            className={clsx(
                              'absolute inset-0 transition-opacity',
                              isSelected ? 'bg-emerald-500/20' : 'bg-black/0 group-hover:bg-black/10'
                            )}
                          />

                          {/* Checkbox */}
                          <div
                            className={clsx(
                              'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                            )}
                          >
                            {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>

                          {/* File Info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate">{item.name}</p>
                            <p className="text-xs text-white/70">{item.human_readable_size}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Loading */}
                  {loading && (
                    <div className="flex justify-center py-8">
                      <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22]">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selected.size > 0 ? (
                      <span>{selected.size} {selected.size === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}</span>
                    ) : (
                      <span>Ninguna imagen seleccionada</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-black border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={selected.size === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {multiple ? 'Agregar seleccionadas' : 'Seleccionar imagen'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MediaGalleryModal;
