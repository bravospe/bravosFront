import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

// Types
export interface InvoiceItem {
    id: string
    product_id: string
    product_name: string
    product_code: string
    quantity: number
    unit_price: number
    discount: number
    subtotal: number
    tax_amount: number
    total: number
}

export interface Invoice {
    id: string
    company_id: string
    client_id: string
    sale_id?: string
    document_type: '01' | '03' | '07' | '08' // 01=Factura, 03=Boleta, 07=NC, 08=ND
    series: string
    number: string
    issue_date: string
    due_date?: string
    currency: string
    exchange_rate: number
    subtotal: number
    tax_amount: number
    discount_amount: number
    total: number
    sunat_status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'annulled'
    sunat_response?: string
    sunat_hash?: string
    xml_path?: string
    pdf_path?: string
    cdr_path?: string
    payment_status: 'pending' | 'partial' | 'paid'
    notes?: string
    created_at: string
    updated_at: string
    // Relations
    client?: {
        id: string
        name?: string
        business_name?: string
        document_type: string
        document_number: string
    }
    items?: InvoiceItem[]
}

interface InvoiceMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface InvoiceState {
    invoices: Invoice[]
    currentInvoice: Invoice | null
    isLoading: boolean
    error: string | null
    meta: InvoiceMeta | null

    // Filters
    filters: {
        search?: string
        document_type?: string
        sunat_status?: string
        payment_status?: string
        date_from?: string
        date_to?: string
    }

    // Actions
    fetchInvoices: (params?: { page?: number; per_page?: number }) => Promise<void>
    getInvoice: (id: string) => Promise<Invoice>
    createInvoice: (data: Partial<Invoice>) => Promise<Invoice>
    updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>
    deleteInvoice: (id: string) => Promise<void>

    // SUNAT Actions
    sendToSunat: (id: string) => Promise<void>
    downloadPdf: (id: string) => Promise<void>
    downloadXml: (id: string) => Promise<void>
    downloadCdr: (id: string) => Promise<void>
    sendEmail: (id: string, email: string) => Promise<void>

    // State management
    setFilters: (filters: InvoiceState['filters']) => void
    setCurrentInvoice: (invoice: Invoice | null) => void
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

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
    invoices: [],
    currentInvoice: null,
    isLoading: false,
    error: null,
    meta: null,
    filters: {},

    fetchInvoices: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { filters } = get()
            const response = await axios.get(`${API_URL}/companies/${companyId}/invoices`, {
                headers: getAuthHeaders(),
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 15,
                    ...filters
                }
            })

            set({
                invoices: response.data.data,
                meta: response.data.meta,
                isLoading: false
            })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar comprobantes',
                isLoading: false
            })
        }
    },

    getInvoice: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.get<Invoice>(`${API_URL}/companies/${companyId}/invoices/${id}`, {
                headers: getAuthHeaders()
            })

            set({ currentInvoice: response.data, isLoading: false })
            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar comprobante',
                isLoading: false
            })
            throw error
        }
    },

    createInvoice: async (data) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.post<Invoice>(`${API_URL}/companies/${companyId}/invoices`, data, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                invoices: [response.data, ...state.invoices],
                isLoading: false
            }))

            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear comprobante',
                isLoading: false
            })
            throw error
        }
    },

    updateInvoice: async (id, data) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.put<Invoice>(`${API_URL}/companies/${companyId}/invoices/${id}`, data, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                invoices: state.invoices.map(inv => inv.id === id ? response.data : inv),
                currentInvoice: state.currentInvoice?.id === id ? response.data : state.currentInvoice,
                isLoading: false
            }))

            return response.data
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar comprobante',
                isLoading: false
            })
            throw error
        }
    },

    deleteInvoice: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            await axios.delete(`${API_URL}/companies/${companyId}/invoices/${id}`, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                invoices: state.invoices.filter(inv => inv.id !== id),
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al anular comprobante',
                isLoading: false
            })
            throw error
        }
    },

    sendToSunat: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        set({ isLoading: true, error: null })

        try {
            const response = await axios.post<Invoice>(`${API_URL}/companies/${companyId}/invoices/${id}/send-sunat`, {}, {
                headers: getAuthHeaders()
            })

            set((state) => ({
                invoices: state.invoices.map(inv => inv.id === id ? response.data : inv),
                currentInvoice: state.currentInvoice?.id === id ? response.data : state.currentInvoice,
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al enviar a SUNAT',
                isLoading: false
            })
            throw error
        }
    },

    downloadPdf: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/invoices/${id}/pdf`, {
                headers: getAuthHeaders(),
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `comprobante-${id}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al descargar PDF' })
            throw error
        }
    },

    downloadXml: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/invoices/${id}/xml`, {
                headers: getAuthHeaders(),
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `comprobante-${id}.xml`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al descargar XML' })
            throw error
        }
    },

    downloadCdr: async (id) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        try {
            const response = await axios.get(`${API_URL}/companies/${companyId}/invoices/${id}/cdr`, {
                headers: getAuthHeaders(),
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cdr-${id}.xml`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al descargar CDR' })
            throw error
        }
    },

    sendEmail: async (id, email) => {
        const companyId = getCompanyId()
        if (!companyId) throw new Error('No company selected')

        try {
            await axios.post(`${API_URL}/companies/${companyId}/invoices/${id}/send-email`, { email }, {
                headers: getAuthHeaders()
            })
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al enviar email' })
            throw error
        }
    },

    setFilters: (filters) => set({ filters }),
    setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
    clearError: () => set({ error: null })
}))
