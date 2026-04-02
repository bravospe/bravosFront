'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { useSettingsStore, ProductUnit } from '@/stores/settingsStore';
import toast from 'react-hot-toast';

const UnitsManager = () => {
  const {
    units,
    isLoading,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  } = useSettingsStore();

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  const [unitForm, setUnitForm] = useState({ name: '', abbreviation: '', is_active: true });

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSaveUnit = async () => {
    if (!unitForm.name || !unitForm.abbreviation) {
      toast.error('Nombre y abreviatura son requeridos');
      return;
    }

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, unitForm);
        toast.success('Unidad actualizada');
      } else {
        await createUnit(unitForm);
        toast.success('Unidad creada');
      }
      setShowUnitModal(false);
      setUnitForm({ name: '', abbreviation: '', is_active: true });
      setEditingUnit(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleEditUnit = (unit: ProductUnit) => {
    setEditingUnit(unit);
    setUnitForm({ name: unit.name, abbreviation: unit.abbreviation, is_active: unit.is_active });
    setShowUnitModal(true);
  };

  const handleDeleteUnit = async (unit: ProductUnit) => {
    if (unit.is_default) {
      toast.error('No puedes eliminar la unidad por defecto');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;
    
    try {
      await deleteUnit(unit.id);
      toast.success('Unidad eliminada');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header
          title="Unidades de Producto"
          subtitle="Administra las unidades de medida para tus productos"
          action={
            <Button size="sm" onClick={() => { setEditingUnit(null); setUnitForm({ name: '', abbreviation: '', is_active: true }); setShowUnitModal(true); }}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Nueva Unidad
            </Button>
          }
        />
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Abreviatura</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No hay unidades configuradas.
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{unit.name}</span>
                          {unit.is_default && (
                            <Badge variant="info" size="sm">Por defecto</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-sm">{unit.abbreviation}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={unit.is_active ? 'success' : 'secondary'} size="sm">
                          {unit.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditUnit(unit)}
                            className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {!unit.is_default && (
                            <button
                              onClick={() => handleDeleteUnit(unit)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Unit Modal */}
      <Modal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        title={editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Kilogramo"
            value={unitForm.name}
            onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
          />
          <Input
            label="Abreviatura"
            placeholder="Ej: KG"
            value={unitForm.abbreviation}
            onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value.toUpperCase() })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unit_active"
              checked={unitForm.is_active}
              onChange={(e) => setUnitForm({ ...unitForm, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="unit_active" className="text-sm text-gray-700 dark:text-gray-300">
              Unidad activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowUnitModal(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleSaveUnit} loading={isLoading}>
              {editingUnit ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnitsManager;
