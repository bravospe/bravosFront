'use client';

import { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  CubeIcon,
  GlobeAltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Input, Badge, Modal } from '@/components/ui';
import { useSettingsStore, ProductUnit } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

// Common timezones for Peru/Latin America
const timezones = [
  { value: 'America/Lima', label: 'Lima, Perú (GMT-5)' },
  { value: 'America/Bogota', label: 'Bogotá, Colombia (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago, Chile (GMT-4)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires, Argentina (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo, Brasil (GMT-3)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'Europe/Madrid', label: 'Madrid, España (GMT+1)' },
];

const SettingsPage = () => {
  const { user } = useAuthStore();
  const {
    units,
    notifications,
    profile,
    isLoading,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    updateNotifications,
    fetchProfile,
    updateProfile,
    updatePassword,
  } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'units' | 'timezone'>('profile');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  const [unitForm, setUnitForm] = useState({ name: '', abbreviation: '', is_active: true });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    timezone: 'America/Lima',
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUnits();
    fetchProfile();
  }, [fetchUnits, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        timezone: profile.timezone || 'America/Lima',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm);
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    try {
      await updatePassword(passwordForm.current, passwordForm.new);
      toast.success('Contraseña actualizada');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar contraseña');
    }
  };

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    await updateNotifications({ [key]: !notifications[key] });
  };

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
    try {
      await deleteUnit(unit.id);
      toast.success('Unidad eliminada');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const sections = [
    { id: 'profile', name: 'Información Personal', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'timezone', name: 'Zona Horaria', icon: GlobeAltIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración General</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-2 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as typeof activeSection)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#161A22]'
                  }`}
              >
                <section.icon className="w-5 h-5" />
                {section.name}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <>
              <Card>
                <Card.Header
                  title="Información Personal"
                  subtitle="Actualiza tu información de contacto"
                />
                <Card.Body>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-[#232834]">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">
                          {profileForm.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <Button variant="secondary" size="sm">
                          Cambiar foto
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG. Máximo 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre completo"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                      <Input
                        label="Correo electrónico"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                      <Input
                        label="Teléfono"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+51 999 999 999"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveProfile} loading={isLoading}>
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header
                  title="Cambiar Contraseña"
                  subtitle="Asegúrate de usar una contraseña segura"
                />
                <Card.Body>
                  <div className="space-y-4 max-w-md">
                    <Input
                      label="Contraseña actual"
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    />
                    <Input
                      label="Nueva contraseña"
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    />
                    <Input
                      label="Confirmar contraseña"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    />

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleChangePassword}
                        loading={isLoading}
                        disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                      >
                        Cambiar contraseña
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card>
              <Card.Header
                title="Preferencias de Notificaciones"
                subtitle="Configura cómo y cuándo quieres recibir notificaciones"
              />
              <Card.Body>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Notificaciones por Email</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Nuevas ventas</p>
                          <p className="text-sm text-gray-500">Recibe un email cuando se registre una nueva venta</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('email_sales')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.email_sales ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email_sales ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Reportes semanales</p>
                          <p className="text-sm text-gray-500">Resumen semanal de ventas y rendimiento</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('email_reports')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.email_reports ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email_reports ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Stock bajo</p>
                          <p className="text-sm text-gray-500">Alerta cuando un producto tenga stock bajo</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('email_low_stock')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.email_low_stock ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email_low_stock ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="pt-6 border-t border-gray-200 dark:border-[#232834]">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Notificaciones Push</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Ventas en tiempo real</p>
                          <p className="text-sm text-gray-500">Notificación instantánea de cada venta</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('push_sales')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.push_sales ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push_sales ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Alertas de stock</p>
                          <p className="text-sm text-gray-500">Notificación cuando un producto esté por agotarse</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('push_low_stock')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.push_low_stock ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push_low_stock ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Recordatorios</p>
                          <p className="text-sm text-gray-500">Recordatorios de cierres de caja y tareas pendientes</p>
                        </div>
                        <button
                          onClick={() => handleToggleNotification('push_reminders')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.push_reminders ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#1E2230]'
                            }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push_reminders ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Units Section */}
          {activeSection === 'units' && (
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Abreviatura</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#1E2230]">
                      {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-[#161A22]/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{unit.name}</span>
                              {unit.is_default && (
                                <Badge variant="info" size="sm">Por defecto</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{unit.abbreviation}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={unit.is_active ? 'success' : 'secondary'} size="sm">
                              {unit.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUnit(unit)}
                                className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              {!unit.is_default && (
                                <button
                                  onClick={() => handleDeleteUnit(unit)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Timezone Section */}
          {activeSection === 'timezone' && (
            <Card>
              <Card.Header
                title="Zona Horaria"
                subtitle="Configura la zona horaria para tu cuenta"
              />
              <Card.Body>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zona horaria
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black focus:ring-2 focus:ring-emerald-500"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-emerald-400">
                      <strong>Hora actual:</strong> {mounted ? new Date().toLocaleString('es-PE', { timeZone: profileForm.timezone }) : ''}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} loading={isLoading}>
                      Guardar zona horaria
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

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

export default SettingsPage;
