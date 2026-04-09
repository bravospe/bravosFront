import { create } from 'zustand'
import api from '@/lib/api'
import { useAuthStore } from './authStore'

export interface KardexEntry {
    id: string
    product_id: string
    warehouse_id?: string
    movement_type: 'entry' | 'exit' | 'adjustment'
    reason: string
    quantity: number
    unit_cost: number
    total_cost: number
    balance_quantity: number
    balance_value: number
    reference_type?: string
    reference_id?: string
    notes?: string
    created_at: string
    user_name?: string
}

export interface StockAdjustment {
    id: string
    product_id: string
    product_name?: string
    product_code?: string
    warehouse_id?: string
    adjustment_type: 'increase' | 'decrease'
    reason: 'damaged' | 'lost' | 'found' | 'correction' | 'initial' | 'other'
    quantity: number
    notes?: string
    created_at: string
    user_name?: string
}

export interface StockAlert {
    id: string
    product_id: string
    product_name: string
    product_code: string
    current_stock: number
    min_stock: number
    status: 'low' | 'out'
}

interface InventoryState {
    kardex: KardexEntry[]
    adjustments: StockAdjustment[]
    alerts: StockAlert[]
    stats: {
        total_products: number
        active_products: number
        low_stock: number
        out_of_stock: number
    } | null
    isLoading: boolean
    error: string | null

    // Actions
    fetchStats: () => Promise<void>
    fetchKardex: (productId: string, params?: { date_from?: string; date_to?: string }) => Promise<void>
    fetchAlerts: () => Promise<void>
    fetchAdjustments: (params?: { page?: number }) => Promise<void>
    createAdjustment: (data: {
        product_id: string
        adjustment_type: 'increase' | 'decrease'
        reason: string
        quantity: number
        notes?: string
        warehouse_id?: string
    }) => Promise<void>
    clearError: () => void
}

const ensureCompany = () => {
    const authStore = useAuthStore.getState();
    if (!authStore.currentCompany && authStore.user) {
        const user = authStore.user;
        const companyFromUser = (user as any).currentCompany || 
                                (user as any).current_company || 
                                (user as any).companies?.[0];
        
        if (companyFromUser) {
            authStore.setCurrentCompany(companyFromUser);
            return companyFromUser.id;
        }
    }
    return authStore.currentCompany?.id || authStore.user?.current_company_id || authStore.user?.companies?.[0]?.id;
};

export const useInventoryStore = create<InventoryState>((set, _get) => ({
    kardex: [],
    adjustments: [],
    alerts: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchStats: async () => {
        const companyId = ensureCompany()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await api.get(`/companies/${companyId}/inventory/stats`)
            set({ stats: response.data, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar estadísticas',
                isLoading: false
            })
        }
    },

    fetchKardex: async (productId, params) => {
        const companyId = ensureCompany()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await api.get(`/companies/${companyId}/inventory/kardex`, {
                params: {
                    product_id: productId,
                    ...params
                }
            })

            set({ kardex: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar kardex',
                isLoading: false
            })
        }
    },

    fetchAlerts: async () => {
        const companyId = ensureCompany()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await api.get(`/companies/${companyId}/inventory/alerts`)
            set({ alerts: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar alertas',
                isLoading: false
            })
        }
    },

    fetchAdjustments: async (params) => {
        const companyId = ensureCompany()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await api.get(`/companies/${companyId}/inventory/adjustments`, {
                params
            })

            set({ adjustments: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar ajustes',
                isLoading: false
            })
        }
    },

    createAdjustment: async (data) => {
        const companyId = ensureCompany()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            await api.post(`/companies/${companyId}/inventory/adjustments`, data)
            set({ isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear ajuste',
                isLoading: false
            })
            throw error
        }
    },

    reconcileInitialStock: async (products) => {
        const companyId = ensureCompany()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })
        let success = 0
        let failed = 0

        // 1. Obtener todos los ajustes previos para evitar duplicados
        try {
            const adjRes = await api.get(`/companies/${companyId}/inventory/adjustments`, {
                params: { reason: 'initial', per_page: 1000 }
            })
            const existingIds = new Set((adjRes.data.data || []).map((a: any) => a.product_id))

            // 2. Filtrar productos que necesitan conciliación (stock > 0 y sin ajuste inicial)
            const toReconcile = products.filter(p => p.stock > 0 && !existingIds.has(p.id))

            // 3. Crear ajustes en serie (para no saturar la API)
            for (const prod of toReconcile) {
                try {
                    await api.post(`/companies/${companyId}/inventory/adjustments`, {
                        product_id: prod.id,
                        adjustment_type: 'increase',
                        reason: 'initial',
                        quantity: prod.stock,
                        notes: 'Conciliación automática de saldo inicial (Migración)'
                    })
                    success++
                } catch (e) {
                    console.error(`Error conciliando producto ${prod.id}:`, e)
                    failed++
                }
            }

            set({ isLoading: false })
            return { success, failed }
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error en la conciliación',
                isLoading: false
            })
            return { success, failed }
        }
    },

    clearError: () => set({ error: null })
}))
