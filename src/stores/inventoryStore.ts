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
            // Intentar obtener del Kardex oficial
            const response = await api.get(`/companies/${companyId}/inventory/kardex`, {
                params: { product_id: productId, ...params }
            })
            const kardexData = Array.isArray(response.data) ? response.data : (response.data.data || [])
            set({ kardex: kardexData, isLoading: false })
        } catch (error: any) {
            // Si el endpoint no existe (501), fallback a los ajustes del producto
            if (error.response?.status === 501 || error.response?.status === 404) {
                try {
                    const adjRes = await api.get(`/companies/${companyId}/inventory/adjustments`, {
                        params: { product_id: productId, per_page: 100 }
                    })
                    
                    const movements = (adjRes.data.data || []).map((a: any) => ({
                        id: a.id,
                        product_id: a.product_id,
                        movement_type: a.adjustment_type === 'increase' ? 'entry' : 'exit',
                        reason: a.reason === 'initial' ? 'Saldo Inicial' : (a.notes || a.reason),
                        quantity: a.quantity,
                        unit_cost: 0,
                        total_cost: 0,
                        balance_quantity: 0, // Se calculará en el componente o aquí
                        balance_value: 0,
                        created_at: a.created_at
                    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                    // Calcular saldo acumulado
                    let currentBalance = 0;
                    const kardexWithBalance = movements.map((m: any) => {
                        if (m.movement_type === 'entry') currentBalance += m.quantity;
                        else currentBalance -= m.quantity;
                        return { ...m, balance_quantity: currentBalance };
                    }).reverse(); // Revertir para mostrar lo más nuevo arriba

                    set({ kardex: kardexWithBalance, isLoading: false })
                    return;
                } catch (e) {
                    console.error('Error in virtual kardex:', e)
                }
            }
            
            set({
                error: error.response?.data?.message || 'Error al cargar kardex',
                isLoading: false,
                kardex: []
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
