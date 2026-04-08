import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface ClientLabel {
    id: string
    name: string
    color: string // Hex color code
    description?: string
    clients_count?: number
    created_at?: string
    updated_at?: string
}

interface LabelState {
    labels: ClientLabel[]
    isLoading: boolean
    error: string | null

    // Actions
    fetchLabels: () => Promise<void>
    createLabel: (data: Omit<ClientLabel, 'id'>) => Promise<ClientLabel>
    updateLabel: (id: string, data: Partial<ClientLabel>) => Promise<void>
    deleteLabel: (id: string) => Promise<void>
    clearError: () => void
}

const getAuthHeaders = () => {
    const { token } = useAuthStore.getState()
    return { Authorization: `Bearer ${token}` }
}

const getCompanyId = () => {
    const { user } = useAuthStore.getState()
    return user?.current_company_id || user?.companies?.[0]?.id
}

export const useLabelStore = create<LabelState>()(
    persist(
        (set, get) => ({
            labels: [],
            isLoading: false,
            error: null,

            fetchLabels: async () => {
                const companyId = getCompanyId()
                if (!companyId) {
                    return
                }

                set({ isLoading: true, error: null })

                try {
                    const response = await axios.get(`${API_URL}/companies/${companyId}/client-labels`, {
                        headers: getAuthHeaders()
                    })
                    set({ labels: response.data.data || get().labels, isLoading: false })
                } catch (error: any) {
                    // Use local labels if API not available
                    set({ isLoading: false })
                }
            },

            createLabel: async (data) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        const response = await axios.post(`${API_URL}/companies/${companyId}/client-labels`, data, {
                            headers: getAuthHeaders()
                        })
                        const newLabel = response.data.data
                        set(state => ({ labels: [...state.labels, newLabel], isLoading: false }))
                        return newLabel
                    } else {
                        // Local-only mode
                        const newLabel: ClientLabel = {
                            id: Date.now().toString(),
                            name: data.name,
                            color: data.color,
                            description: data.description,
                            clients_count: 0,
                        }
                        set(state => ({ labels: [...state.labels, newLabel], isLoading: false }))
                        return newLabel
                    }
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al crear etiqueta', isLoading: false })
                    throw error
                }
            },

            updateLabel: async (id, data) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        await axios.put(`${API_URL}/companies/${companyId}/client-labels/${id}`, data, {
                            headers: getAuthHeaders()
                        })
                    }

                    set(state => ({
                        labels: state.labels.map(l => l.id === id ? { ...l, ...data } : l),
                        isLoading: false
                    }))
                } catch (error: any) {
                    // Update locally anyway
                    set(state => ({
                        labels: state.labels.map(l => l.id === id ? { ...l, ...data } : l),
                        isLoading: false
                    }))
                }
            },

            deleteLabel: async (id) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        await axios.delete(`${API_URL}/companies/${companyId}/client-labels/${id}`, {
                            headers: getAuthHeaders()
                        })
                    }

                    set(state => ({
                        labels: state.labels.filter(l => l.id !== id),
                        isLoading: false
                    }))
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al eliminar etiqueta', isLoading: false })
                    throw error
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'bravos-client-labels-v2',
            partialize: () => ({}),
        }
    )
)
