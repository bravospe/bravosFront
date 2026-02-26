import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface ProductUnit {
    id: string
    name: string
    abbreviation: string
    is_default: boolean
    is_active: boolean
}

export interface NotificationSettings {
    email_sales: boolean
    email_reports: boolean
    email_low_stock: boolean
    push_sales: boolean
    push_low_stock: boolean
    push_reminders: boolean
}

export interface UserProfile {
    name: string
    email: string
    phone?: string
    avatar_url?: string
    timezone: string
    language: string
}

interface SettingsState {
    // Product Units
    units: ProductUnit[]

    // Notification Settings
    notifications: NotificationSettings

    // User Profile
    profile: UserProfile | null

    // Loading states
    isLoading: boolean
    error: string | null

    // Actions
    fetchUnits: () => Promise<void>
    createUnit: (data: Partial<ProductUnit>) => Promise<void>
    updateUnit: (id: string, data: Partial<ProductUnit>) => Promise<void>
    deleteUnit: (id: string) => Promise<void>

    fetchNotifications: () => Promise<void>
    updateNotifications: (data: Partial<NotificationSettings>) => Promise<void>

    fetchProfile: () => Promise<void>
    updateProfile: (data: Partial<UserProfile>) => Promise<void>
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>

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

// Default units
const defaultUnits: ProductUnit[] = [
    { id: '1', name: 'Unidad', abbreviation: 'UND', is_default: true, is_active: true },
    { id: '2', name: 'Kilogramo', abbreviation: 'KG', is_default: false, is_active: true },
    { id: '3', name: 'Gramo', abbreviation: 'GR', is_default: false, is_active: true },
    { id: '4', name: 'Docena', abbreviation: 'DOC', is_default: false, is_active: true },
    { id: '5', name: 'Caja', abbreviation: 'CJA', is_default: false, is_active: true },
    { id: '6', name: 'Bolsa', abbreviation: 'BLS', is_default: false, is_active: true },
]

const defaultNotifications: NotificationSettings = {
    email_sales: true,
    email_reports: true,
    email_low_stock: true,
    push_sales: false,
    push_low_stock: true,
    push_reminders: true,
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            units: defaultUnits,
            notifications: defaultNotifications,
            profile: null,
            isLoading: false,
            error: null,

            fetchUnits: async () => {
                const companyId = getCompanyId()
                if (!companyId) {
                    set({ units: defaultUnits })
                    return
                }

                set({ isLoading: true, error: null })

                try {
                    const response = await axios.get(`${API_URL}/companies/${companyId}/settings/units`, {
                        headers: getAuthHeaders()
                    })
                    set({ units: response.data.data || defaultUnits, isLoading: false })
                } catch (error: any) {
                    // If endpoint doesn't exist, use defaults
                    set({ units: defaultUnits, isLoading: false })
                }
            },

            createUnit: async (data) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        const response = await axios.post(`${API_URL}/companies/${companyId}/settings/units`, data, {
                            headers: getAuthHeaders()
                        })
                        const newUnit = response.data.data
                        set(state => ({ units: [...state.units, newUnit], isLoading: false }))
                    } else {
                        // Local-only mode
                        const newUnit: ProductUnit = {
                            id: Date.now().toString(),
                            name: data.name || '',
                            abbreviation: data.abbreviation || '',
                            is_default: data.is_default || false,
                            is_active: data.is_active !== false,
                        }
                        set(state => ({ units: [...state.units, newUnit], isLoading: false }))
                    }
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al crear unidad', isLoading: false })
                    throw error
                }
            },

            updateUnit: async (id, data) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        await axios.put(`${API_URL}/companies/${companyId}/settings/units/${id}`, data, {
                            headers: getAuthHeaders()
                        })
                    }

                    set(state => ({
                        units: state.units.map(u => u.id === id ? { ...u, ...data } : u),
                        isLoading: false
                    }))
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al actualizar unidad', isLoading: false })
                    throw error
                }
            },

            deleteUnit: async (id) => {
                const companyId = getCompanyId()
                set({ isLoading: true, error: null })

                try {
                    if (companyId) {
                        await axios.delete(`${API_URL}/companies/${companyId}/settings/units/${id}`, {
                            headers: getAuthHeaders()
                        })
                    }

                    set(state => ({
                        units: state.units.filter(u => u.id !== id),
                        isLoading: false
                    }))
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al eliminar unidad', isLoading: false })
                    throw error
                }
            },

            fetchNotifications: async () => {
                set({ isLoading: true, error: null })

                try {
                    const response = await axios.get(`${API_URL}/user/notification-settings`, {
                        headers: getAuthHeaders()
                    })
                    set({ notifications: response.data || defaultNotifications, isLoading: false })
                } catch (error: any) {
                    set({ notifications: defaultNotifications, isLoading: false })
                }
            },

            updateNotifications: async (data) => {
                set({ isLoading: true, error: null })

                try {
                    await axios.put(`${API_URL}/user/notification-settings`, data, {
                        headers: getAuthHeaders()
                    })
                    set(state => ({
                        notifications: { ...state.notifications, ...data },
                        isLoading: false
                    }))
                } catch (error: any) {
                    // Update locally anyway
                    set(state => ({
                        notifications: { ...state.notifications, ...data },
                        isLoading: false
                    }))
                }
            },

            fetchProfile: async () => {
                set({ isLoading: true, error: null })

                try {
                    const response = await axios.get(`${API_URL}/user/profile`, {
                        headers: getAuthHeaders()
                    })
                    set({ profile: response.data, isLoading: false })
                } catch (error: any) {
                    const { user } = useAuthStore.getState()
                    set({
                        profile: {
                            name: user?.name || '',
                            email: user?.email || '',
                            timezone: 'America/Lima',
                            language: 'es',
                        },
                        isLoading: false
                    })
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null })

                try {
                    await axios.put(`${API_URL}/user/profile`, data, {
                        headers: getAuthHeaders()
                    })
                    set(state => ({
                        profile: state.profile ? { ...state.profile, ...data } : null,
                        isLoading: false
                    }))
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al actualizar perfil', isLoading: false })
                    throw error
                }
            },

            updatePassword: async (currentPassword, newPassword) => {
                set({ isLoading: true, error: null })

                try {
                    await axios.put(`${API_URL}/user/password`, {
                        current_password: currentPassword,
                        password: newPassword,
                        password_confirmation: newPassword,
                    }, {
                        headers: getAuthHeaders()
                    })
                    set({ isLoading: false })
                } catch (error: any) {
                    set({ error: error.response?.data?.message || 'Error al cambiar contraseña', isLoading: false })
                    throw error
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'bravos-settings',
            partialize: (state) => ({
                units: state.units,
                notifications: state.notifications,
            }),
        }
    )
)
