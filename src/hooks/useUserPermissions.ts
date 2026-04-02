import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useUserPermissions() {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const permissions: string[] = user?.permissions?.map((p: any) => p.name) || [];
    const roles: string[] = user?.roles?.map((r: any) => r.name) || [];

    const hasPermission = (perm: string) =>
      roles.includes('superadmin') ||
      roles.includes('company_admin') ||
      permissions.includes(perm);

    const hasRole = (role: string) => roles.includes(role);

    const isAdmin = roles.includes('superadmin') || roles.includes('company_admin');

    const can = {
      // Ventas / POS
      pos: hasPermission('pos.access'),
      sales: hasPermission('accounting.view'),
      // Comprobantes
      invoices: hasPermission('invoices.view'),
      // Clientes
      clients: hasPermission('clients.view'),
      // Proveedores
      suppliers: hasPermission('suppliers.view'),
      // Productos / Catálogo
      products: hasPermission('products.view'),
      // Inventario
      inventory: hasPermission('inventory.view'),
      // Reportes
      reports: hasPermission('reports.view'),
      // Contabilidad
      accounting: hasPermission('accounting.view'),
      // Configuración
      settings: hasPermission('settings.view'),
      // Usuarios
      users: hasPermission('users.view'),
    };

    return { permissions, roles, hasPermission, hasRole, isAdmin, can };
  }, [user]);
}
