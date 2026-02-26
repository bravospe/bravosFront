import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

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
    }) => Promise<void>
    clearError: () => void
}

const getCompanyId = () => {
    const { user } = useAuthStore.getState()
    return user?.current_company_id || user?.companies?.[0]?.id
}

const getAuthHeaders = () => {
    const { token } = useAuthStore.getState()
    return { Authorization: `Bearer ${token}` }
}

export const useInventoryStore = create<InventoryState>((set, _get) => ({
    kardex: [],
    adjustments: [],
    alerts: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchStats: async () => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/inventory/stats`, {
                headers: getAuthHeaders()
            })

            set({ stats: response.data, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar estadísticas',
                isLoading: false
            })
        }
    },

    fetchKardex: async (productId, params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/inventory/kardex`, {
                headers: getAuthHeaders(),
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
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/inventory/alerts`, {
                headers: getAuthHeaders()
            })

            set({ alerts: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar alertas',
                isLoading: false
            })
        }
    },

    fetchAdjustments: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/inventory/adjustments`, {
                headers: getAuthHeaders(),
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
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            await axios.post(`${API_URL}/companies/${companyId}/inventory/adjustments`, data, {
                headers: getAuthHeaders()
            })

            set({ isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear ajuste',
                isLoading: false
            })
            throw error
        }
    },

    clearError: () => set({ error: null })
}))
