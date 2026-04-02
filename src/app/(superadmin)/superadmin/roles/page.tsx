'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  CubeIcon,
  BuildingOfficeIcon,
  UserIcon,
  TruckIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Modal, Badge, Input } from '@/components/ui';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

// --- Tipos ---
interface Role {
  id: number;
  name: string;
  permissions_count: number;
}

interface Permission {
  id: number;
  name: string;
}

interface GroupedPermissions {
  [key: string]: Permission[];
}

// --- Configuración de roles ---
const roleConfig: Record<string, { icon: typeof ShieldCheckIcon; color: string; label: string; desc: string }> = {
  company_admin: {
    icon: ShieldCheckIcon,
    color: 'blue',
    label: 'Administrador',
    desc: 'Acceso completo a la gestión de la empresa',
  },
  vendedor: {
    icon: ShoppingCartIcon,
    color: 'emerald',
    label: 'Vendedor',
    desc: 'Punto de venta y gestión de ventas',
  },
  contador: {
    icon: CalculatorIcon,
    color: 'violet',
    label: 'Contador',
    desc: 'Reportes y gestión contable',
  },
  almacen: {
    icon: CubeIcon,
    color: 'amber',
    label: 'Almacén',
    desc: 'Gestión de inventario y productos',
  },
};

const defaultRoleConfig = {
  icon: UserGroupIcon,
  color: 'gray',
  label: '',
  desc: 'Rol personalizado',
};

// --- Configuración de módulos ---
const moduleConfig: Record<string, { icon: typeof UserGroupIcon; label: string; color: string }> = {
  users: { icon: UserGroupIcon, label: 'Usuarios', color: 'blue' },
  companies: { icon: BuildingOfficeIcon, label: 'Empresas', color: 'slate' },
  clients: { icon: UserIcon, label: 'Clientes', color: 'cyan' },
  suppliers: { icon: TruckIcon, label: 'Proveedores', color: 'orange' },
  products: { icon: ShoppingBagIcon, label: 'Productos', color: 'pink' },
  inventory: { icon: CubeIcon, label: 'Inventario', color: 'amber' },
  invoices: { icon: DocumentTextIcon, label: 'Facturación', color: 'emerald' },
  pos: { icon: ComputerDesktopIcon, label: 'POS', color: 'indigo' },
  reports: { icon: ChartBarIcon, label: 'Reportes', color: 'violet' },
  settings: { icon: Cog6ToothIcon, label: 'Config.', color: 'gray' },
  accounting: { icon: CurrencyDollarIcon, label: 'Contabilidad', color: 'teal' },
};

// Colores para los dots de módulos y barras de progreso
const colorMap: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800', bar: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', bar: 'bg-emerald-500' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-200 dark:ring-violet-800', bar: 'bg-violet-500' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800', bar: 'bg-amber-500' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', ring: 'ring-gray-200 dark:ring-gray-800', bar: 'bg-gray-500' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-800', bar: 'bg-slate-500' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-200 dark:ring-cyan-800', bar: 'bg-cyan-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', bar: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-200 dark:ring-pink-800', bar: 'bg-pink-500' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-800', bar: 'bg-indigo-500' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-200 dark:ring-teal-800', bar: 'bg-teal-500' },
};

function getRoleConfig(roleName: string) {
  return roleConfig[roleName] || { ...defaultRoleConfig, label: roleName.replace(/_/g, ' ') };
}

function getRoleBadge(roleName: string): { label: string; variant: 'info' | 'secondary' | 'warning' } {
  if (roleName === 'company_admin') return { label: 'Protegido', variant: 'warning' };
  if (roleConfig[roleName]) return { label: 'Predefinido', variant: 'info' };
  return { label: 'Personalizado', variant: 'secondary' };
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [rolePermissions, setRolePermissions] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPermissions = useMemo(() => {
    return Object.values(groupedPermissions).reduce((sum, perms) => sum + perms.length, 0);
  }, [groupedPermissions]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ]);
      setRoles(rolesRes.data);
      setGroupedPermissions(permsRes.data);

      // Fetch permissions for each role to show module chips
      const permPromises = rolesRes.data.map((role: Role) =>
        api.get(`/admin/roles/${role.id}`).then(res => ({ id: role.id, permissions: res.data.permissions as string[] }))
      );
      const permResults = await Promise.all(permPromises);
      const permMap: Record<number, string[]> = {};
      permResults.forEach(r => { permMap[r.id] = r.permissions; });
      setRolePermissions(permMap);

      setLoading(false);
    } catch {
      toast.error('Error al cargar datos');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.role) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/roles/${deleteModal.role.id}`);
      toast.success('Rol eliminado correctamente');
      setDeleteModal({ open: false, role: null });
      setDeleteConfirmName('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar el rol');
    } finally {
      setDeleting(false);
    }
  };

  const getActiveModules = (roleId: number): string[] => {
    const perms = rolePermissions[roleId] || [];
    const modules = new Set<string>();
    perms.forEach(p => {
      const mod = p.split('.')[0];
      if (mod) modules.add(mod);
    });
    return Array.from(modules);
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(role => {
      const config = getRoleConfig(role.name);
      return (
        role.name.toLowerCase().includes(q) ||
        config.label.toLowerCase().includes(q) ||
        config.desc.toLowerCase().includes(q)
      );
    });
  }, [roles, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-[#1E2230] rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-[#1E2230] rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-[#1E2230] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-[#0D1117] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles y Permisos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los niveles de acceso para los usuarios del sistema
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/superadmin/roles/new')}
          icon={<PlusIcon className="w-4 h-4" />}
        >
          Nuevo Rol
        </Button>
      </div>

      {/* Stats + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{roles.length}</span> roles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{totalPermissions}</span> permisos disponibles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{Object.keys(groupedPermissions).length}</span> módulos
            </span>
          </div>
        </div>
        {roles.length > 4 && (
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar rol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          const config = getRoleConfig(role.name);
          const badge = getRoleBadge(role.name);
          const colors = colorMap[config.color] || colorMap.gray;
          const activeModules = getActiveModules(role.id);
          const progressPercent = totalPermissions > 0 ? Math.round((role.permissions_count / totalPermissions) * 100) : 0;
          const RoleIcon = config.icon;

          return (
            <Card
              key={role.id}
              className="group hover:shadow-lg transition-all duration-200 border-none bg-white dark:bg-[#0D1117] cursor-pointer"
              padding="none"
              onClick={() => router.push(`/superadmin/roles/${role.id}`)}
            >
              <div className="p-6">
                {/* Top: Icon + Badge + Actions */}
                <div className="flex items-start justify-between">
                  <div className={clsx('p-3 rounded-xl', colors.bg, colors.text)}>
                    <RoleIcon className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                    {role.name !== 'company_admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, role });
                          setDeleteConfirmName('');
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Name + Description */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {config.label}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{role.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{config.desc}</p>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {role.permissions_count} de {totalPermissions} permisos
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-[#1E2230] rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-500', colors.bar)}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Active Modules Chips */}
                {activeModules.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {activeModules.slice(0, 6).map(mod => {
                      const modConfig = moduleConfig[mod];
                      if (!modConfig) return null;
                      const modColors = colorMap[modConfig.color] || colorMap.gray;
                      const ModIcon = modConfig.icon;
                      return (
                        <span
                          key={mod}
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium',
                            modColors.bg, modColors.text
                          )}
                        >
                          <ModIcon className="w-3 h-3" />
                          {modConfig.label}
                        </span>
                      );
                    })}
                    {activeModules.length > 6 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-[#1E2230] text-gray-500">
                        +{activeModules.length - 6} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-100 dark:border-[#1E2230] flex items-center justify-end">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver detalle <ChevronRightIcon className="w-3 h-3" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRoles.length === 0 && !loading && (
        <div className="text-center py-12">
          <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No se encontraron roles con ese criterio' : 'No hay roles creados'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => {
          setDeleteModal({ open: false, role: null });
          setDeleteConfirmName('');
        }}
        title="Eliminar Rol"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 dark:text-rose-300">
              Esta acción es irreversible. Se eliminará el rol <strong className="font-bold">{deleteModal.role?.name}</strong> y
              los usuarios que lo tengan asignado perderán los permisos asociados.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Escribe <strong className="font-mono text-gray-900 dark:text-white">{deleteModal.role?.name}</strong> para confirmar
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              placeholder={deleteModal.role?.name}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteModal({ open: false, role: null });
                setDeleteConfirmName('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmName !== deleteModal.role?.name}
              loading={deleting}
              onClick={handleDelete}
            >
              Eliminar Rol
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
