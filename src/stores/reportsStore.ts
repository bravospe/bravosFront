import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface SalesReportData {
    period: string
    total_sales: number
    total_amount: number
    total_tax: number
    average_ticket: number
    top_products: Array<{
        id: string
        name: string
        quantity: number
        amount: number
    }>
    top_clients: Array<{
        id: string
        name: string
        total_purchases: number
        amount: number
    }>
    by_payment_method: Array<{
        method: string
        count: number
        amount: number
    }>
    by_document_type: Array<{
        type: string
        count: number
        amount: number
    }>
    daily_sales: Array<{
        date: string
        count: number
        amount: number
    }>
}

export interface ProductReportData {
    product_id: string
    product_name: string
    product_code: string
    quantity_sold: number
    total_amount: number
    profit: number
    profit_margin: number
}

export interface ClientReportData {
    client_id: string
    client_name: string
    document_number: string
    total_purchases: number
    total_amount: number
    last_purchase_date: string
}

interface ReportsState {
    salesReport: SalesReportData | null
    productReport: ProductReportData[]
    clientReport: ClientReportData[]
    isLoading: boolean
    error: string | null

    // Filters
    dateFrom: string
    dateTo: string
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

    // Actions
    fetchSalesReport: (params?: { date_from?: string; date_to?: string }) => Promise<void>
    fetchProductReport: (params?: { date_from?: string; date_to?: string }) => Promise<void>
    fetchClientReport: (params?: { date_from?: string; date_to?: string }) => Promise<void>
    exportToExcel: (reportType: string) => Promise<void>
    setPeriod: (period: ReportsState['period']) => void
    setDateRange: (from: string, to: string) => void
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

// Helper to calculate date range based on period
const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date()
    const to = today.toISOString().split('T')[0]
    let from = to

    switch (period) {
        case 'today':
            from = to
            break
        case 'week':
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - 7)
            from = weekStart.toISOString().split('T')[0]
            break
        case 'month':
            from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
            break
        case 'quarter':
            const quarterMonth = Math.floor(today.getMonth() / 3) * 3
            from = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0]
            break
        case 'year':
            from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
            break
    }

    return { from, to }
}

export const useReportsStore = create<ReportsState>((set, get) => ({
    salesReport: null,
    productReport: [],
    clientReport: [],
    isLoading: false,
    error: null,
    dateFrom: '',
    dateTo: '',
    period: 'month',

    fetchSalesReport: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const dateRange = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(`${API_URL}/companies/${companyId}/reports/sales`, {
                headers: getAuthHeaders(),
                params: {
                    date_from: params?.date_from || dateRange.from,
                    date_to: params?.date_to || dateRange.to
                }
            })

            set({ salesReport: response.data, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte de ventas',
                isLoading: false
            })
        }
    },

    fetchProductReport: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const dateRange = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-product`, {
                headers: getAuthHeaders(),
                params: {
                    date_from: params?.date_from || dateRange.from,
                    date_to: params?.date_to || dateRange.to
                }
            })

            set({ productReport: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte por producto',
                isLoading: false
            })
        }
    },

    fetchClientReport: async (params) => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const dateRange = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-client`, {
                headers: getAuthHeaders(),
                params: {
                    date_from: params?.date_from || dateRange.from,
                    date_to: params?.date_to || dateRange.to
                }
            })

            set({ clientReport: response.data.data || [], isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte por cliente',
                isLoading: false
            })
        }
    },

    exportToExcel: async (reportType) => {
        const companyId = getCompanyId()
        if (!companyId) return

        try {
            const { period, dateFrom, dateTo } = get()
            const dateRange = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(`${API_URL}/companies/${companyId}/reports/${reportType}/export`, {
                headers: getAuthHeaders(),
                params: {
                    date_from: dateRange.from,
                    date_to: dateRange.to,
                    format: 'xlsx'
                },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `reporte-${reportType}-${dateRange.from}-${dateRange.to}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al exportar reporte' })
        }
    },

    setPeriod: (period) => {
        set({ period })
        const dateRange = getDateRange(period)
        set({ dateFrom: dateRange.from, dateTo: dateRange.to })
    },

    setDateRange: (from, to) => {
        set({ dateFrom: from, dateTo: to, period: 'custom' })
    },

    clearError: () => set({ error: null })
}))
