import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface Supplier {
    id: string
    company_id: string
    document_type: 'RUC' | 'DNI' | 'CE'
    document_number: string
    name: string
    trade_name?: string
    email?: string
    phone?: string
    mobile?: string
    address?: string
    ubigeo?: string
    department?: string
    province?: string
    district?: string
    website?: string
    contact_person?: string
    contact_phone?: string
    contact_email?: string
    payment_terms?: string
    credit_limit?: number
    is_active: boolean
    notes?: string
    created_at: string
    updated_at: string
}

interface SupplierMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface SupplierState {
    suppliers: Supplier[]
    currentSupplier: Supplier | null
    isLoading: boolean
    error: string | null
    meta: SupplierMeta | null

    // Actions
    fetchSuppliers: (params?: { page?: number; per_page?: number; search?: string }) => Promise<void>
    getSupplier: (id: string) => Promise<Supplier>
    createSupplier: (data: Partial<Supplier>) => Promise<Supplier>
    updateSupplier: (id: string, data: Partial<Supplier>) => Promise<Supplier>
    deleteSupplier: (id: string) => Promise<void>
    toggleStatus: (id: string) => Promise<void>
    setCurrentSupplier: (supplier: Supplier | null) => void
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

export const useSupplierStore = create<SupplierState>((set, get) => ({
    suppliers: [],
    currentSupplier: null,
    isLoading: false,
    error: null,
    meta: null,

    fetchSuppliers: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/suppliers`, {
                headers: getAuthHeaders(),
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 15,
                    search: params?.search
                }
            })

            set({
                suppliers: response.data.data,
                meta: response.data.meta,
                isLoading: false
            })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar proveedores',
                isLoading: false
            })
        }
    },

    getSupplier: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get<Supplier>(`${API_URL}/companies/${companyId}/suppliers/${id}`, {
                headers: getAuthHeaders()
            })

            set({ currentSupplier: response.data, isLoading: false })
            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar proveedor',
                isLoading: false
            })
            throw error
        }
    },

    createSupplier: async (data) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.post<Supplier>(`${API_URL}/companies/${companyId}/suppliers`, data, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                suppliers: [response.data, ...state.suppliers],
                isLoading: false
            }))

            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear proveedor',
                isLoading: false
            })
            throw error
        }
    },

    updateSupplier: async (id, data) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.put<Supplier>(`${API_URL}/companies/${companyId}/suppliers/${id}`, data, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                suppliers: state.suppliers.map(s => s.id === id ? response.data : s),
                currentSupplier: state.currentSupplier?.id === id ? response.data : state.currentSupplier,
                isLoading: false
            }))

            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar proveedor',
                isLoading: false
            })
            throw error
        }
    },

    deleteSupplier: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            await axios.delete(`${API_URL}/companies/${companyId}/suppliers/${id}`, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                suppliers: state.suppliers.filter(s => s.id !== id),
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar proveedor',
                isLoading: false
            })
            throw error
        }
    },

    toggleStatus: async (id) => {
        const { suppliers } = get()
        const supplier = suppliers.find(s => s.id === id)
        if (!supplier) return

        try {
            await get().updateSupplier(id, { is_active: !supplier.is_active })
        } catch (error) {
            // Error handled in updateSupplier
        }
    },

    setCurrentSupplier: (supplier) => set({ currentSupplier: supplier }),
    clearError: () => set({ error: null })
}))
