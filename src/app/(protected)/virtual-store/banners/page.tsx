'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsUpDownIcon,
  PhotoIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';

interface BannerFormData {
  title: string;
  subtitle: string;
  image_url: string;
  image_mobile_url: string;
  link_url: string;
  link_text: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const initialFormData: BannerFormData = {
  title: '',
  subtitle: '',
  image_url: '',
  image_mobile_url: '',
  link_url: '',
  link_text: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
};

const StoreBannersPage = () => {
  const { currentCompany } = useAuthStore();
  const { banners, fetchBanners, createBanner, updateBanner, deleteBanner, toggleBanner, isLoadingBanners } = useVirtualStoreStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState<BannerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchBanners(currentCompany.id);
    }
  }, [currentCompany?.id, fetchBanners]);

  const handleOpenModal = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        image_mobile_url: banner.image_mobile_url || '',
        link_url: banner.link_url || '',
        link_text: banner.link_text || '',
        is_active: banner.is_active,
        starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
        ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
      });
    } else {
      setEditingBanner(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        await updateBanner(currentCompany.id, editingBanner.id, formData);
      } else {
        await createBanner(currentCompany.id, formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!currentCompany?.id) return;
    if (!confirm('¿Estas seguro de eliminar este banner?')) return;

    try {
      await deleteBanner(currentCompany.id, bannerId);
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleToggle = async (bannerId: number) => {
    if (!currentCompany?.id) return;
    try {
      await toggleBanner(currentCompany.id, bannerId);
    } catch (error) {
      console.error('Error toggling banner:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Banners
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los banners de tu tienda virtual
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar Banner
        </button>
      </div>

      {/* Banners Grid */}
      {isLoadingBanners ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#1E2230]">
          <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay banners
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Agrega banners para mostrar en la pagina principal de tu tienda
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar primer banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={clsx(
                'relative bg-white dark:bg-[#0D1117] rounded-xl overflow-hidden border',
                banner.is_active
                  ? 'border-gray-200 dark:border-[#1E2230]'
                  : 'border-gray-300 dark:border-[#232834] opacity-60'
              )}
            >
              {/* Banner Image */}
              <div className="aspect-[21/9] bg-gray-100 dark:bg-black relative">
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Position badge */}
                <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded">
                  #{index + 1}
                </span>
                
                {/* Status badge */}
                <span
                  className={clsx(
                    'absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded',
                    banner.is_active
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                  )}
                >
                  {banner.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Banner Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {banner.title || 'Sin titulo'}
                </h3>
                {banner.subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate mt-1">
                    {banner.link_url}
                  </p>
                )}
                
                {/* Date range */}
                {(banner.starts_at || banner.ends_at) && (
                  <p className="text-xs text-gray-400 mt-2">
                    {banner.starts_at && `Desde: ${new Date(banner.starts_at).toLocaleDateString('es-PE')}`}
                    {banner.starts_at && banner.ends_at && ' - '}
                    {banner.ends_at && `Hasta: ${new Date(banner.ends_at).toLocaleDateString('es-PE')}`}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#1E2230]">
                  <button
                    onClick={() => handleToggle(banner.id)}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      banner.is_active
                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#161A22]'
                        : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    )}
                    title={banner.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {banner.is_active ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenModal(banner)}
                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-lg transition-colors cursor-move"
                    title="Reordenar"
                  >
                    <ArrowsUpDownIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            
            <div className="relative bg-white dark:bg-[#0D1117] rounded-xl shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titulo
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Titulo del banner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtitulo
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Subtitulo opcional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de Imagen (Desktop) *
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://ejemplo.com/banner.jpg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamano recomendado: 1920x600px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de Imagen (Mobile)
                  </label>
                  <input
                    type="url"
                    value={formData.image_mobile_url}
                    onChange={(e) => setFormData({ ...formData, image_mobile_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://ejemplo.com/banner-mobile.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamano recomendado: 768x768px</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL de Enlace
                    </label>
                    <input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="/productos/categoria"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Texto del Boton
                    </label>
                    <input
                      type="text"
                      value={formData.link_text}
                      onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ver mas"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                    Banner activo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#1E2230]">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161A22] rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Guardando...' : editingBanner ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreBannersPage;
