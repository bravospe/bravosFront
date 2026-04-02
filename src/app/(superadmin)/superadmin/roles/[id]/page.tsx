'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
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
  MagnifyingGlassIcon,
  CheckIcon,
  MinusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge } from '@/components/ui';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

// --- Types ---
interface Permission {
  id: number;
  name: string;
}

interface GroupedPermissions {
  [key: string]: Permission[];
}

interface RoleDetail {
  id: number;
  name: string;
  guard_name: string;
}

// --- Role config ---
const roleConfig: Record<string, { icon: typeof ShieldCheckIcon; color: string; label: string; desc: string }> = {
  company_admin: { icon: ShieldCheckIcon, color: 'blue', label: 'Administrador', desc: 'Acceso completo a la gestión de la empresa' },
  vendedor: { icon: ShoppingCartIcon, color: 'emerald', label: 'Vendedor', desc: 'Punto de venta y gestión de ventas' },
  contador: { icon: CalculatorIcon, color: 'violet', label: 'Contador', desc: 'Reportes y gestión contable' },
  almacen: { icon: CubeIcon, color: 'amber', label: 'Almacén', desc: 'Gestión de inventario y productos' },
};

// --- Module config ---
const moduleConfig: Record<string, { icon: typeof UserGroupIcon; label: string; color: string }> = {
  users: { icon: UserGroupIcon, label: 'Usuarios', color: 'blue' },
  companies: { icon: BuildingOfficeIcon, label: 'Empresas', color: 'slate' },
  clients: { icon: UserIcon, label: 'Clientes', color: 'cyan' },
  suppliers: { icon: TruckIcon, label: 'Proveedores', color: 'orange' },
  products: { icon: ShoppingBagIcon, label: 'Productos', color: 'pink' },
  inventory: { icon: CubeIcon, label: 'Inventario', color: 'amber' },
  invoices: { icon: DocumentTextIcon, label: 'Facturación', color: 'emerald' },
  pos: { icon: ComputerDesktopIcon, label: 'Punto de Venta', color: 'indigo' },
  reports: { icon: ChartBarIcon, label: 'Reportes', color: 'violet' },
  settings: { icon: Cog6ToothIcon, label: 'Configuración', color: 'gray' },
  accounting: { icon: CurrencyDollarIcon, label: 'Contabilidad', color: 'teal' },
};

// --- Action labels ---
const actionLabels: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  manage: 'Gestionar',
  adjust: 'Ajustar',
  access: 'Acceder',
  open_session: 'Abrir caja',
  close_session: 'Cerrar caja',
  adjust_prices: 'Ajustar precios',
  export: 'Exportar',
  send_sunat: 'Enviar SUNAT',
  cancel: 'Anular',
};

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/5', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-500/10' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/5', text: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-500/10' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/5', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-500/10' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-500/5', text: 'text-gray-600 dark:text-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-500/10' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-500/5', text: 'text-slate-600 dark:text-slate-400', iconBg: 'bg-slate-100 dark:bg-slate-500/10' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/5', text: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-500/10' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/5', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-500/10' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-500/5', text: 'text-pink-600 dark:text-pink-400', iconBg: 'bg-pink-100 dark:bg-pink-500/10' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/5', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-500/10' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-500/5', text: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-100 dark:bg-teal-500/10' },
};

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const isNew = roleId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [roleName, setRoleName] = useState('');
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [initialPermissions, setInitialPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Compute all unique actions across all modules
  const allActions = useMemo(() => {
    const actions = new Set<string>();
    Object.values(groupedPermissions).forEach(perms => {
      perms.forEach(p => {
        const action = p.name.split('.').slice(1).join('.');
        if (action) actions.add(action);
      });
    });
    // Sort common actions first, then alphabetically
    const priority = ['view', 'create', 'edit', 'delete', 'manage', 'access', 'export'];
    return Array.from(actions).sort((a, b) => {
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedPermissions]);

  const filteredModules = useMemo(() => {
    const entries = Object.entries(groupedPermissions);
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(([module]) => {
      const config = moduleConfig[module];
      return module.toLowerCase().includes(q) || (config?.label || '').toLowerCase().includes(q);
    });
  }, [groupedPermissions, searchQuery]);

  const totalPermissions = useMemo(() => {
    return Object.values(groupedPermissions).reduce((sum, perms) => sum + perms.length, 0);
  }, [groupedPermissions]);

  const hasChanges = useMemo(() => {
    if (isNew) return roleName.trim() !== '' || selectedPermissions.size > 0;
    if (roleName !== (role?.name || '')) return true;
    if (selectedPermissions.size !== initialPermissions.size) return true;
    for (const p of selectedPermissions) {
      if (!initialPermissions.has(p)) return true;
    }
    return false;
  }, [isNew, roleName, role, selectedPermissions, initialPermissions]);

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      if (isNew) {
        const permsRes = await api.get('/admin/permissions');
        setGroupedPermissions(permsRes.data);
        setLoading(false);
        return;
      }

      const [roleRes, permsRes] = await Promise.all([
        api.get(`/admin/roles/${roleId}`),
        api.get('/admin/permissions'),
      ]);

      setRole(roleRes.data.role);
      setRoleName(roleRes.data.role.name);
      const perms = new Set<string>(roleRes.data.permissions as string[]);
      setSelectedPermissions(perms);
      setInitialPermissions(new Set(perms));
      setGroupedPermissions(permsRes.data);
      setLoading(false);
    } catch {
      toast.error('Error al cargar los datos del rol');
      router.push('/superadmin/roles');
    }
  };

  const togglePermission = useCallback((permName: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  }, []);

  const toggleModule = useCallback((module: string, perms: Permission[]) => {
    const modulePermNames = perms.map(p => p.name);
    const allSelected = modulePermNames.every(name => selectedPermissions.has(name));

    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (allSelected) {
        modulePermNames.forEach(name => next.delete(name));
      } else {
        modulePermNames.forEach(name => next.add(name));
      }
      return next;
    });
  }, [selectedPermissions]);

  const toggleAction = useCallback((action: string) => {
    const actionPerms: string[] = [];
    Object.values(groupedPermissions).forEach(perms => {
      perms.forEach(p => {
        if (p.name.split('.').slice(1).join('.') === action) {
          actionPerms.push(p.name);
        }
      });
    });
    const allSelected = actionPerms.every(name => selectedPermissions.has(name));

    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (allSelected) {
        actionPerms.forEach(name => next.delete(name));
      } else {
        actionPerms.forEach(name => next.add(name));
      }
      return next;
    });
  }, [groupedPermissions, selectedPermissions]);

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    Object.values(groupedPermissions).forEach(perms => {
      perms.forEach(p => all.add(p.name));
    });
    setSelectedPermissions(all);
  }, [groupedPermissions]);

  const deselectAll = useCallback(() => {
    setSelectedPermissions(new Set());
  }, []);

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }
    if (selectedPermissions.size === 0) {
      toast.error('Selecciona al menos un permiso');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: roleName.trim().toLowerCase().replace(/\s+/g, '_'),
        permissions: Array.from(selectedPermissions),
      };

      if (isNew) {
        await api.post('/admin/roles', payload);
        toast.success('Rol creado correctamente');
      } else {
        await api.put(`/admin/roles/${roleId}`, payload);
        toast.success('Rol actualizado correctamente');
      }
      router.push('/superadmin/roles');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const isProtectedRole = role?.name === 'company_admin';

  // Check module selection state
  const getModuleState = (perms: Permission[]): 'all' | 'some' | 'none' => {
    const selected = perms.filter(p => selectedPermissions.has(p.name)).length;
    if (selected === 0) return 'none';
    if (selected === perms.length) return 'all';
    return 'some';
  };

  // Check action column selection state
  const getActionState = (action: string): 'all' | 'some' | 'none' => {
    const actionPerms: string[] = [];
    Object.values(groupedPermissions).forEach(perms => {
      perms.forEach(p => {
        if (p.name.split('.').slice(1).join('.') === action) actionPerms.push(p.name);
      });
    });
    const selected = actionPerms.filter(name => selectedPermissions.has(name)).length;
    if (selected === 0) return 'none';
    if (selected === actionPerms.length) return 'all';
    return 'some';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-[#1E2230] rounded-lg animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-[#1E2230] rounded animate-pulse" />
        </div>
        <div className="h-12 w-full bg-gray-100 dark:bg-[#0D1117] rounded-xl animate-pulse" />
        <div className="h-96 w-full bg-gray-100 dark:bg-[#0D1117] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/superadmin/roles')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-[#1E2230] transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isNew ? 'Nuevo Rol' : `Editar Rol`}
              </h1>
              {!isNew && (
                <Badge variant="secondary" size="sm">
                  {role?.name}
                </Badge>
              )}
            </div>
            <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <button onClick={() => router.push('/superadmin/roles')} className="hover:text-emerald-500 transition-colors">
                Roles
              </button>
              <span>/</span>
              <span className="text-gray-700 dark:text-gray-300">
                {isNew ? 'Nuevo' : (roleConfig[role?.name || '']?.label || role?.name)}
              </span>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/superadmin/roles')}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!hasChanges || isProtectedRole}
            onClick={handleSubmit}
          >
            {isNew ? 'Crear Rol' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Protected Role Warning */}
      {isProtectedRole && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <InformationCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Este es un rol protegido del sistema. Puedes ver sus permisos pero no modificarlos.
          </p>
        </div>
      )}

      {/* Role Name Input */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#1E2230] p-5">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Rol
        </label>
        <input
          type="text"
          value={roleName}
          onChange={e => setRoleName(e.target.value)}
          placeholder="Ej: supervisor, cajero, gerente..."
          disabled={isProtectedRole}
          className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#161B22] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {!isNew && roleName && (
          <p className="mt-1.5 text-xs text-gray-400">
            Se guardará como: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">{roleName.trim().toLowerCase().replace(/\s+/g, '_')}</span>
          </p>
        )}
      </div>

      {/* Permission Matrix */}
      <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#1E2230] overflow-hidden">
        {/* Matrix Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#1E2230]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Matriz de Permisos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedPermissions.size}</span> de {totalPermissions} permisos seleccionados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#232834] bg-white dark:bg-[#161B22] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                />
              </div>
              {!isProtectedRole && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="xs" onClick={selectAll}>
                    Todo
                  </Button>
                  <Button variant="ghost" size="xs" onClick={deselectAll}>
                    Nada
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161B22]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56 sticky left-0 bg-gray-50 dark:bg-[#161B22] z-10">
                  Módulo
                </th>
                {allActions.map(action => {
                  const actionState = getActionState(action);
                  return (
                    <th key={action} className="px-3 py-3 text-center min-w-[90px]">
                      <button
                        onClick={() => !isProtectedRole && toggleAction(action)}
                        disabled={isProtectedRole}
                        className={clsx(
                          'text-xs font-semibold uppercase tracking-wider transition-colors',
                          isProtectedRole
                            ? 'cursor-default text-gray-500 dark:text-gray-400'
                            : 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400',
                          actionState === 'all' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {actionLabels[action] || action.replace(/_/g, ' ')}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1E2230]">
              {filteredModules.map(([module, perms]) => {
                const config = moduleConfig[module] || { icon: CubeIcon, label: module, color: 'gray' };
                const colors = colorMap[config.color] || colorMap.gray;
                const ModIcon = config.icon;
                const moduleState = getModuleState(perms);
                const modulePermActions = new Set(perms.map(p => p.name.split('.').slice(1).join('.')));

                return (
                  <tr
                    key={module}
                    className={clsx(
                      'group transition-colors',
                      moduleState === 'all'
                        ? 'bg-emerald-50/50 dark:bg-emerald-500/5'
                        : 'hover:bg-gray-50 dark:hover:bg-[#161B22]/50'
                    )}
                  >
                    {/* Module Name Cell */}
                    <td className="px-5 py-3 sticky left-0 bg-white dark:bg-[#0D1117] group-hover:bg-gray-50 dark:group-hover:bg-[#161B22]/50 z-10 transition-colors">
                      <button
                        onClick={() => !isProtectedRole && toggleModule(module, perms)}
                        disabled={isProtectedRole}
                        className={clsx(
                          'flex items-center gap-3 w-full',
                          !isProtectedRole && 'cursor-pointer'
                        )}
                      >
                        <div className={clsx('p-1.5 rounded-lg', colors.iconBg, colors.text)}>
                          <ModIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 dark:text-white block">
                            {config.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {perms.filter(p => selectedPermissions.has(p.name)).length}/{perms.length}
                          </span>
                        </div>
                        {!isProtectedRole && (
                          <div className={clsx(
                            'ml-auto w-4 h-4 rounded flex items-center justify-center border transition-colors',
                            moduleState === 'all'
                              ? 'bg-emerald-500 border-emerald-500'
                              : moduleState === 'some'
                                ? 'bg-emerald-500/50 border-emerald-500'
                                : 'border-gray-300 dark:border-gray-600'
                          )}>
                            {moduleState === 'all' && <CheckIcon className="w-3 h-3 text-white" />}
                            {moduleState === 'some' && <MinusIcon className="w-3 h-3 text-white" />}
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Permission Cells */}
                    {allActions.map(action => {
                      const permName = `${module}.${action}`;
                      const permExists = modulePermActions.has(action);

                      if (!permExists) {
                        return (
                          <td key={action} className="px-3 py-3 text-center">
                            <span className="text-gray-200 dark:text-gray-700 text-xs">—</span>
                          </td>
                        );
                      }

                      const isSelected = selectedPermissions.has(permName);

                      return (
                        <td key={action} className="px-3 py-3 text-center">
                          <button
                            onClick={() => !isProtectedRole && togglePermission(permName)}
                            disabled={isProtectedRole}
                            className={clsx(
                              'w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-150',
                              isProtectedRole && 'cursor-default',
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/25'
                                : clsx(
                                  'border-gray-200 dark:border-gray-600',
                                  !isProtectedRole && 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                )
                            )}
                          >
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No se encontraron módulos con ese criterio
            </p>
          </div>
        )}

        {/* Matrix Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#1E2230] bg-gray-50 dark:bg-[#161B22]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </span>
                Activo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-lg border-2 border-gray-200 dark:border-gray-600" />
                Inactivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-gray-300 dark:text-gray-600">—</span>
                No aplica
              </span>
            </div>
            {!isProtectedRole && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/superadmin/roles')}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={!hasChanges}
                  onClick={handleSubmit}
                >
                  {isNew ? 'Crear Rol' : 'Guardar Cambios'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
