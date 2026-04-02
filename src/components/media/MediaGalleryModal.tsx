'use client';

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
  ClipboardDocumentIcon,
  InformationCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { mediaService, MediaItem, StorageStats } from '@/services/mediaService';
import { useAuthStore } from '@/stores/authStore';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'size';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem[]) => void;
  multiple?: boolean;
  maxSelect?: number;
  selectedIds?: string[];
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Strip dangerous chars from display text
function sanitizeText(text: string): string {
  return text
    .replace(/[<>&"']/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Validate magic bytes for real image type
async function validateMagicBytes(file: File): Promise<{ valid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve({ valid: false, reason: 'No se pudo leer el archivo' });
        return;
      }
      const bytes = new Uint8Array(buffer);

      const mime = file.type;

      if (mime === 'image/jpeg') {
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          resolve({ valid: true });
          return;
        }
        resolve({ valid: false, reason: 'El archivo no es un JPEG válido (magic bytes incorrectos)' });
        return;
      }

      if (mime === 'image/png') {
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          resolve({ valid: true });
          return;
        }
        resolve({ valid: false, reason: 'El archivo no es un PNG válido (magic bytes incorrectos)' });
        return;
      }

      if (mime === 'image/gif') {
        const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
        if (sig === 'GIF87a' || sig === 'GIF89a') {
          resolve({ valid: true });
          return;
        }
        resolve({ valid: false, reason: 'El archivo no es un GIF válido (magic bytes incorrectos)' });
        return;
      }

      if (mime === 'image/webp') {
        const isRIFF = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
        const isWEBP = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
        if (isRIFF && isWEBP) {
          resolve({ valid: true });
          return;
        }
        resolve({ valid: false, reason: 'El archivo no es un WebP válido (magic bytes incorrectos)' });
        return;
      }

      resolve({ valid: false, reason: `Tipo de archivo no permitido: ${mime}` });
    };
    reader.onerror = () => resolve({ valid: false, reason: 'Error al leer el archivo' });
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

async function validateFile(file: File): Promise<{ valid: boolean; reason?: string }> {
  // Check MIME type
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      reason: `Tipo no permitido: ${file.type}. Solo se aceptan imágenes JPEG, PNG, WebP y GIF.`,
    };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      reason: `Archivo demasiado grande: ${sizeMB} MB. Máximo permitido: 5 MB.`,
    };
  }

  // Check filename for path traversal
  if (/[/\\]|\.\./.test(file.name)) {
    return {
      valid: false,
      reason: `Nombre de archivo inválido: "${file.name}". No se permiten rutas.`,
    };
  }

  // Validate magic bytes
  const magicResult = await validateMagicBytes(file);
  if (!magicResult.valid) {
    return { valid: false, reason: magicResult.reason };
  }

  return { valid: true };
}

function sortMedia(items: MediaItem[], sortBy: SortBy): MediaItem[] {
  const copy = [...items];
  switch (sortBy) {
    case 'newest':
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':
      return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'size':
      return copy.sort((a, b) => b.size - a.size);
    default:
      return copy;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const MediaGalleryModal = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  maxSelect = 10,
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

  // New state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedMedia = sortMedia(media, sortBy);

  // Fetch media on open or search change
  useEffect(() => {
    if (isOpen && companyId) {
      fetchMedia(1, true);
      fetchStorageStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, companyId, search]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedIds));
      setDeleteConfirm(null);
      setDetailItem(null);
      setBulkDeleteConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync detail item when media list updates
  useEffect(() => {
    if (detailItem) {
      const updated = media.find((m) => m.id === detailItem.id);
      if (updated) setDetailItem(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // Open sort dropdown close on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = () => setSortOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [sortOpen]);

  const fetchMedia = async (pageNum: number, reset = false) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await mediaService.list(companyId, {
        page: pageNum,
        per_page: 30,
        images_only: true,
        search: search || undefined,
      });

      const newMedia = response.data.data;
      setMedia((prev) => (reset ? newMedia : [...prev, ...newMedia]));
      setPage(pageNum);
      setHasMore(pageNum < response.data.last_page);
    } catch {
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
    } catch {
      // ignore
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      fetchMedia(page + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, page]);

  const handleSelect = (item: MediaItem) => {
    // Dismiss delete confirm if open, but continue with selection
    if (deleteConfirm) {
      setDeleteConfirm(null);
    }
    let justAdded = false;
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        if (!multiple) {
          newSet.clear();
        }
        if (newSet.size < maxSelect) {
          newSet.add(item.id);
          justAdded = true;
        } else {
          toast.error(`Máximo ${maxSelect} imágenes permitidas`);
        }
      }
      return newSet;
    });
    // In single-select mode, auto-confirm immediately after adding an item
    if (!multiple && justAdded) {
      const selectedItems = items.filter((i) => i.id === item.id);
      onSelect(selectedItems);
      onClose();
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !companyId) return;

    const validFiles: File[] = [];
    const rejections: string[] = [];

    for (const file of Array.from(files)) {
      const result = await validateFile(file);
      if (result.valid) {
        validFiles.push(file);
      } else {
        rejections.push(`${file.name}: ${result.reason}`);
      }
    }

    if (rejections.length > 0) {
      rejections.forEach((r) => toast.error(r, { duration: 5000 }));
      if (validFiles.length === 0) return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedItems: MediaItem[] = [];
    const failedItems: string[] = [];
    const total = validFiles.length;
    let completed = 0;

    for (const file of validFiles) {
      try {
        const response = await mediaService.upload(companyId, file, {
          onProgress: (p) => {
            const current = Math.round(((completed * 100) + p) / total);
            setUploadProgress(current);
          },
        });
        if (response.success) {
          uploadedItems.push(response.data);
        } else {
          failedItems.push(file.name);
        }
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        };
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
      toast.success(`${uploadedItems.length} archivo(s) subido(s) exitosamente`);
      await fetchMedia(1, true);
      fetchStorageStats();
      if (multiple) {
        setSelected((prev) => {
          const newSet = new Set(prev);
          uploadedItems.forEach((item) => {
            if (newSet.size < maxSelect) newSet.add(item.id);
          });
          return newSet;
        });
      } else if (uploadedItems.length > 0) {
        setSelected(new Set([uploadedItems[uploadedItems.length - 1].id]));
      }
    }

    if (failedItems.length > 0) {
      toast.error(`${failedItems.length} archivo(s) fallaron al subir`);
    }

    setUploading(false);
    setUploadProgress(0);
    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (mediaId: string) => {
    if (!companyId) return;
    try {
      await mediaService.delete(companyId, mediaId);
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      setSelected((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      if (detailItem?.id === mediaId) setDetailItem(null);
      setDeleteConfirm(null);
      fetchStorageStats();
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar');
      setDeleteConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!companyId || selected.size === 0) return;
    setDeletingBulk(true);
    try {
      await mediaService.deleteMultiple(companyId, Array.from(selected));
      const deletedIds = new Set(selected);
      setMedia((prev) => prev.filter((m) => !deletedIds.has(m.id)));
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      if (detailItem && deletedIds.has(detailItem.id)) setDetailItem(null);
      fetchStorageStats();
      toast.success(`${deletedIds.size} imagen(es) eliminada(s)`);
    } catch {
      toast.error('Error al eliminar los archivos seleccionados');
      setBulkDeleteConfirm(false);
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleConfirm = () => {
    const selectedMedia = media.filter((m) => selected.has(m.id));
    onSelect(selectedMedia);
    onClose();
  };

  const handleCopyUrl = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      toast.success('URL copiada al portapapeles');
    });
  };

  const openDetail = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailItem(item);
    setEditName(item.name);
    setEditAlt(item.alt_text || '');
  };

  const handleSaveDetail = async () => {
    if (!detailItem || !companyId) return;
    const cleanName = sanitizeText(editName);
    const cleanAlt = sanitizeText(editAlt);
    if (!cleanName) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setSavingDetail(true);
    try {
      const response = await mediaService.update(companyId, detailItem.id, {
        name: cleanName,
        alt_text: cleanAlt,
      });
      setMedia((prev) => prev.map((m) => (m.id === detailItem.id ? response.data : m)));
      setDetailItem(response.data);
      toast.success('Cambios guardados');
    } catch {
      toast.error('Error al guardar cambios');
    } finally {
      setSavingDetail(false);
    }
  };

  const storagePercentage = storageStats?.percentage || 0;
  const storageColor =
    storagePercentage > 90
      ? 'bg-red-500'
      : storagePercentage > 70
      ? 'bg-yellow-500'
      : 'bg-emerald-500';

  const sortLabels: Record<SortBy, string> = {
    newest: 'Más reciente',
    oldest: 'Más antiguo',
    name: 'Nombre A-Z',
    size: 'Tamaño ↓',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
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
              <Dialog.Panel className="w-full max-w-5xl transform rounded-2xl bg-white dark:bg-[#0D1117] shadow-2xl transition-all flex flex-col max-h-[90vh]">

                {/* ── Header ── */}
                <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200 dark:border-[#232834] flex-shrink-0">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Gestor de Medios
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {multiple
                        ? `Selecciona hasta ${maxSelect} imágenes`
                        : 'Selecciona una imagen de la biblioteca'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22] flex-shrink-0">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar archivos..."
                      value={search}
                      onChange={(e) => setSearch(sanitizeText(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
                    >
                      <ChevronUpDownIcon className="w-4 h-4" />
                      {sortLabels[sortBy]}
                    </button>
                    {sortOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-[#161A22] border border-gray-200 dark:border-[#232834] rounded-xl shadow-lg overflow-hidden min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(Object.entries(sortLabels) as [SortBy, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortBy(key); setSortOpen(false); }}
                            className={clsx(
                              'w-full text-left px-4 py-2 text-sm transition-colors',
                              sortBy === key
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230]'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center border border-gray-300 dark:border-[#232834] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={clsx(
                        'p-2 transition-colors',
                        viewMode === 'grid'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-[#0D1117] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E2230]'
                      )}
                      title="Vista de cuadrícula"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={clsx(
                        'p-2 transition-colors border-l border-gray-300 dark:border-[#232834]',
                        viewMode === 'list'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-[#0D1117] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E2230]'
                      )}
                      title="Vista de lista"
                    >
                      <ListBulletIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Subiendo {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4" />
                        Subir imágenes
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </div>

                {/* ── Bulk Actions Bar ── */}
                {selected.size > 0 && (
                  <div className="flex items-center justify-between px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex-shrink-0">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {selected.size} {selected.size === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
                    </span>
                    <div className="flex items-center gap-3">
                      {bulkDeleteConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            ¿Eliminar {selected.size} elemento(s)?
                          </span>
                          <button
                            onClick={handleBulkDelete}
                            disabled={deletingBulk}
                            className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingBulk ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : 'Sí, eliminar'}
                          </button>
                          <button
                            onClick={() => setBulkDeleteConfirm(false)}
                            className="px-3 py-1 text-xs font-medium border border-gray-300 dark:border-[#232834] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setBulkDeleteConfirm(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Eliminar seleccionados
                        </button>
                      )}
                      <button
                        onClick={() => { setSelected(new Set()); setBulkDeleteConfirm(false); }}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                      >
                        Deseleccionar todo
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Main Content (scrollable) + Detail Panel ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                  {/* Media Area */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={clsx(
                      'flex-1 overflow-y-auto p-5 relative transition-colors',
                      dragOver && 'bg-emerald-50 dark:bg-emerald-500/5'
                    )}
                  >
                    {/* Drag overlay */}
                    {dragOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-lg z-10 pointer-events-none">
                        <div className="text-center">
                          <CloudArrowUpIcon className="w-14 h-14 text-emerald-500 mx-auto" />
                          <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                            Suelta los archivos aquí
                          </p>
                          <p className="text-sm text-emerald-500 mt-0.5">Solo imágenes JPEG, PNG, WebP y GIF · Máx. 5 MB</p>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!loading && media.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <PhotoIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                        <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                          No hay imágenes
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Sube tu primera imagen o arrastra archivos aquí
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <CloudArrowUpIcon className="w-4 h-4" />
                          Subir imágenes
                        </button>
                      </div>
                    )}

                    {/* ── GRID VIEW ── */}
                    {viewMode === 'grid' && media.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {sortedMedia.map((item) => {
                          const isSelected = selected.has(item.id);
                          const isPendingDelete = deleteConfirm === item.id;

                          return (
                            <div
                              key={item.id}
                              onClick={() => !isPendingDelete && handleSelect(item)}
                              className={clsx(
                                'relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all',
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

                              {/* Selection overlay tint */}
                              <div
                                className={clsx(
                                  'absolute inset-0 transition-opacity',
                                  isSelected
                                    ? 'bg-emerald-500/20'
                                    : 'bg-black/0 group-hover:bg-black/15'
                                )}
                              />

                              {/* Checkbox top-left */}
                              <div
                                className={clsx(
                                  'absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shadow',
                                  isSelected
                                    ? 'bg-emerald-500 border-emerald-500 opacity-100'
                                    : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                                )}
                              >
                                {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                              </div>

                              {/* Delete button top-right — shows inline confirm */}
                              {!isPendingDelete ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                                  className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="Eliminar"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              ) : null}

                              {/* Copy URL button bottom-right */}
                              {!isPendingDelete && (
                                <button
                                  onClick={(e) => handleCopyUrl(item.url, e)}
                                  className="absolute bottom-7 right-1.5 p-1 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="Copiar URL"
                                >
                                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Info button bottom-left */}
                              {!isPendingDelete && (
                                <button
                                  onClick={(e) => openDetail(item, e)}
                                  className="absolute bottom-7 left-1.5 p-1 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                  title="Ver detalles"
                                >
                                  <InformationCircleIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* File info bar at bottom */}
                              {!isPendingDelete && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-xs text-white truncate leading-tight">{item.name}</p>
                                  <p className="text-xs text-white/70">{item.human_readable_size}</p>
                                </div>
                              )}

                              {/* Inline delete confirm overlay */}
                              {isPendingDelete && (
                                <div
                                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl z-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-xs text-white font-semibold text-center px-2 mb-2">
                                    ¿Eliminar?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                      className="px-2.5 py-1 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                    >
                                      Sí
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                      className="px-2.5 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Selected badge */}
                              {isSelected && (
                                <div className="absolute bottom-1.5 right-1.5">
                                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 drop-shadow" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── LIST VIEW ── */}
                    {viewMode === 'list' && media.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#232834]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22]">
                              <th className="w-8 px-3 py-2.5" />
                              <th className="w-12 px-3 py-2.5" />
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Nombre
                              </th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                Tamaño
                              </th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">
                                Dimensiones
                              </th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">
                                Fecha
                              </th>
                              <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-[#232834]">
                            {sortedMedia.map((item) => {
                              const isSelected = selected.has(item.id);
                              const isPendingDelete = deleteConfirm === item.id;

                              return (
                                <tr
                                  key={item.id}
                                  onClick={() => !isPendingDelete && handleSelect(item)}
                                  className={clsx(
                                    'cursor-pointer transition-colors group',
                                    isSelected
                                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                                      : 'hover:bg-gray-50 dark:hover:bg-[#161A22]'
                                  )}
                                >
                                  {/* Checkbox */}
                                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                                    <div
                                      onClick={() => handleSelect(item)}
                                      className={clsx(
                                        'w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors',
                                        isSelected
                                          ? 'bg-emerald-500 border-emerald-500'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                                      )}
                                    >
                                      {isSelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                  </td>

                                  {/* Thumbnail */}
                                  <td className="px-3 py-2.5">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1E2230] flex-shrink-0">
                                      <ImageWithFallback
                                        src={item.thumbnail_url || item.url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </td>

                                  {/* Name */}
                                  <td className="px-3 py-2.5">
                                    <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                      {item.name}
                                    </p>
                                    {item.alt_text && (
                                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.alt_text}</p>
                                    )}
                                  </td>

                                  {/* Size */}
                                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {item.human_readable_size}
                                  </td>

                                  {/* Dimensions */}
                                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                                    {item.width && item.height
                                      ? `${item.width} × ${item.height}`
                                      : '—'}
                                  </td>

                                  {/* Date */}
                                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                                    {formatDate(item.created_at)}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                                    {isPendingDelete ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-xs text-red-500 font-medium">¿Eliminar?</span>
                                        <button
                                          onClick={() => handleDelete(item.id)}
                                          className="px-2 py-0.5 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                        >
                                          Sí
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm(null)}
                                          className="px-2 py-0.5 text-xs font-medium border border-gray-300 dark:border-[#232834] text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-[#1E2230] transition-colors"
                                        >
                                          No
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleCopyUrl(item.url)}
                                          className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                          title="Copiar URL"
                                        >
                                          <ClipboardDocumentIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => openDetail(item, e)}
                                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                          title="Ver detalles"
                                        >
                                          <InformationCircleIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm(item.id)}
                                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                          title="Eliminar"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Loading spinner */}
                    {loading && (
                      <div className="flex justify-center py-8">
                        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* ── Detail / Rename Panel ── */}
                  {detailItem && (
                    <div className="w-64 flex-shrink-0 border-l border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22] flex flex-col overflow-y-auto">
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#232834]">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Detalles</span>
                        <button
                          onClick={() => setDetailItem(null)}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-[#232834] transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Preview */}
                      <div className="p-4 border-b border-gray-200 dark:border-[#232834]">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-[#1E2230]">
                          <ImageWithFallback
                            src={detailItem.url}
                            alt={detailItem.alt_text || detailItem.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Editable fields */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={255}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Texto alternativo
                          </label>
                          <input
                            type="text"
                            value={editAlt}
                            onChange={(e) => setEditAlt(e.target.value)}
                            maxLength={255}
                            placeholder="Descripción de la imagen"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 pt-1">
                          {detailItem.width && detailItem.height && (
                            <div className="flex justify-between">
                              <span>Dimensiones</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {detailItem.width} × {detailItem.height}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Tamaño</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {detailItem.human_readable_size}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tipo</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {detailItem.mime_type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subido</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {formatDate(detailItem.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* URL copy */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={detailItem.url}
                              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-[#0D1117] text-gray-600 dark:text-gray-300 truncate"
                            />
                            <button
                              onClick={() => handleCopyUrl(detailItem.url)}
                              className="flex-shrink-0 p-1.5 border border-gray-300 dark:border-[#232834] rounded-lg text-gray-500 hover:text-emerald-500 hover:border-emerald-400 transition-colors"
                              title="Copiar URL"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="p-4 border-t border-gray-200 dark:border-[#232834]">
                        <button
                          onClick={handleSaveDetail}
                          disabled={savingDetail}
                          className="w-full py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {savingDetail ? (
                            <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Guardando…</>
                          ) : 'Guardar cambios'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-[#232834] bg-gray-50 dark:bg-[#161A22] flex-shrink-0">
                  {/* Storage bar */}
                  <div className="flex items-center gap-3">
                    {storageStats ? (
                      <>
                        <div className="w-28 h-2 bg-gray-200 dark:bg-[#232834] rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full transition-all rounded-full', storageColor)}
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {storageStats.used_readable} / {storageStats.limit_mb} MB
                          <span className="ml-1 text-gray-400">({Math.round(storagePercentage)}%)</span>
                        </span>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">Calculando almacenamiento…</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selected.size > 0
                        ? `${selected.size} ${selected.size === 1 ? 'seleccionada' : 'seleccionadas'}`
                        : 'Ninguna seleccionada'}
                    </span>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-[#232834] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2230] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={selected.size === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
