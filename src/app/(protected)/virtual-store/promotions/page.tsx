'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useVirtualStoreStore } from '@/stores/virtualStoreStore';

interface PromotionFormData {
  name: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  min_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  applies_to: 'all' | 'categories' | 'products';
}

const initialFormData: PromotionFormData = {
  name: '',
  code: '',
  type: 'percentage',
  value: 10,
  min_amount: null,
  max_discount: null,
  usage_limit: null,
  starts_at: '',
  ends_at: '',
  is_active: true,
  applies_to: 'all',
};

const StorePromotionsPage = () => {
  const { currentCompany } = useAuthStore();
  const { promotions, fetchPromotions, createPromotion, updatePromotion, deletePromotion, togglePromotion, isLoadingPromotions } = useVirtualStoreStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [formData, setFormData] = useState<PromotionFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchPromotions(currentCompany.id);
    }
  }, [currentCompany?.id, fetchPromotions]);

  const handleOpenModal = (promotion?: any) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        code: promotion.code || '',
        type: promotion.type,
        value: promotion.value,
        min_amount: promotion.min_amount,
        max_discount: promotion.max_discount,
        usage_limit: promotion.usage_limit,
        starts_at: promotion.starts_at ? promotion.starts_at.split('T')[0] : '',
        ends_at: promotion.ends_at ? promotion.ends_at.split('T')[0] : '',
        is_active: promotion.is_active,
        applies_to: promotion.applies_to || 'all',
      });
    } else {
      setEditingPromotion(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) return;

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
      };
      
      if (editingPromotion) {
        await updatePromotion(currentCompany.id, editingPromotion.id, data);
      } else {
        await createPromotion(currentCompany.id, data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving promotion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (promotionId: number) => {
    if (!currentCompany?.id) return;
    if (!confirm('¿Estas seguro de eliminar esta promocion?')) return;

    try {
      await deletePromotion(currentCompany.id, promotionId);
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const handleToggle = async (promotionId: number) => {
    if (!currentCompany?.id) return;
    try {
      await togglePromotion(currentCompany.id, promotionId);
    } catch (error) {
      console.error('Error toggling promotion:', error);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const filteredPromotions = promotions.filter((promo) => {
    if (filter === 'active') {
      return promo.is_active && new Date(promo.ends_at) >= new Date();
    }
    if (filter === 'expired') {
      return new Date(promo.ends_at) < new Date();
    }
    return true;
  });

  const typeLabels: Record<string, string> = {
    percentage: 'Porcentaje',
    fixed: 'Monto fijo',
    free_shipping: 'Envio gratis',
  };

  const typeColors: Record<string, string> = {
    percentage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    fixed: 'bg-emerald-100 text-blue-800 dark:bg-emerald-500/10 dark:text-emerald-400',
    free_shipping: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Promociones
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crea codigos de descuento y promociones para tu tienda
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva Promocion
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              filter === f
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#161A22]'
            )}
          >
            {f === 'all' && 'Todas'}
            {f === 'active' && 'Activas'}
            {f === 'expired' && 'Expiradas'}
          </button>
        ))}
      </div>

      {/* Promotions Table */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 overflow-hidden">
        {isLoadingPromotions ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay promociones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crea tu primera promocion para atraer mas clientes
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
            >
              <PlusIcon className="w-4 h-4" />
              Crear promocion
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
            <thead className="bg-gray-50 dark:bg-[#161A22]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Promocion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Codigo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descuento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vigencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
              {filteredPromotions.map((promo) => {
                const isExpired = new Date(promo.ends_at) < new Date();
                
                return (
                  <tr key={promo.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {promo.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-black rounded text-sm font-mono">
                        {promo.code || '-'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', typeColors[promo.type])}>
                        {typeLabels[promo.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {promo.type === 'percentage' && `${promo.value}%`}
                        {promo.type === 'fixed' && `S/ ${promo.value}`}
                        {promo.type === 'free_shipping' && 'Envio gratis'}
                      </span>
                      {promo.min_amount && (
                        <p className="text-xs text-gray-500">Min: S/ {promo.min_amount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {promo.usage_count}
                        {promo.usage_limit && ` / ${promo.usage_limit}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p>{new Date(promo.starts_at).toLocaleDateString('es-PE')}</p>
                        <p>{new Date(promo.ends_at).toLocaleDateString('es-PE')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-black dark:text-gray-400">
                          Expirada
                        </span>
                      ) : promo.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircleIcon className="w-3 h-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <XCircleIcon className="w-3 h-3" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(promo.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          title={promo.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {promo.is_active ? (
                            <XCircleIcon className="w-4 h-4" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(promo)}
                          className="p-1.5 text-gray-400 hover:text-emerald-500 rounded"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            
            <div className="relative bg-white dark:bg-[#0D1117] rounded-xl shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {editingPromotion ? 'Editar Promocion' : 'Nueva Promocion'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej: Descuento de verano"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Codigo de descuento
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="VERANO2024"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                    >
                      Generar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de descuento *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto fijo (S/)</option>
                      <option value="free_shipping">Envio gratis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        step={formData.type === 'percentage' ? '1' : '0.01'}
                        disabled={formData.type === 'free_shipping'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {formData.type === 'percentage' ? '%' : 'S/'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Compra minima
                    </label>
                    <input
                      type="number"
                      value={formData.min_amount || ''}
                      onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="S/ 0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Limite de usos
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ilimitado"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha fin *
                    </label>
                    <input
                      type="date"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#232834] rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      required
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
                    Promocion activa
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
                    {isSubmitting ? 'Guardando...' : editingPromotion ? 'Actualizar' : 'Crear'}
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

export default StorePromotionsPage;
