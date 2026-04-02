import { useSubscriptionStore, type PlanFull } from '@/stores/subscriptionStore'

export type PlanFeature = keyof PlanFull

export interface LimitStatus {
  limit: number | null
  unlimited: boolean
  canCreate: (current: number) => boolean
}

/**
 * Verifica si el plan activo incluye un feature booleano.
 * Uso: const canUsePOS = usePlanFeature('has_pos')
 */
export function usePlanFeature(feature: PlanFeature): boolean {
  const { canUse } = useSubscriptionStore()
  return canUse(feature)
}

/**
 * Retorna el límite de un recurso del plan activo.
 * null = ilimitado.
 */
export function usePlanLimit(
  resource: 'users' | 'products' | 'invoices' | 'sales' | 'clients' | 'suppliers' | 'warehouses' | 'branches' | 'pos_sessions'
): LimitStatus {
  const { getLimit, isActive } = useSubscriptionStore()
  const limit = isActive() ? getLimit(resource) : 0

  return {
    limit,
    unlimited: limit === null,
    canCreate: (current: number) => {
      if (!isActive()) return false
      if (limit === null) return true
      return current < limit
    },
  }
}

/**
 * Devuelve un mensaje de upgrade según el feature bloqueado.
 */
export function useUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    has_pos: 'El Punto de Venta no está incluido en tu plan actual.',
    has_invoicing: 'La facturación electrónica requiere un plan superior.',
    has_reports_advanced: 'Los reportes avanzados están disponibles desde el plan Medio.',
    has_api_access: 'El acceso a la API está disponible en el plan Profesional.',
    has_multi_warehouse: 'Los multi-almacenes están disponibles desde el plan Medio.',
    has_multi_branch: 'Las multi-sucursales requieren el plan Profesional.',
    has_suppliers: 'La gestión de proveedores requiere un plan superior.',
    has_quotes: 'Las cotizaciones requieren un plan superior.',
    max_users: 'Has alcanzado el límite de usuarios de tu plan.',
    max_products: 'Has alcanzado el límite de productos de tu plan.',
    max_clients: 'Has alcanzado el límite de clientes de tu plan.',
  }
  return messages[feature] ?? 'Esta función no está disponible en tu plan actual. Mejora tu suscripción.'
}
