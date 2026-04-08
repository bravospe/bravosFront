import { create } from 'zustand'
import axios from 'axios'
import * as XLSX from 'xlsx'
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
    by_payment_method: Array<{ label: string; count: number; amount: number }>
    by_document_type: Array<{ label: string; count: number; amount: number }>
    by_seller: Array<{ label: string; count: number; amount: number }>
    by_cash_register: Array<{ label: string; count: number; amount: number }>
    daily_sales: Array<{ date: string; count: number; amount: number }>
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

    dateFrom: string
    dateTo: string
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

    fetchSalesReport: () => Promise<void>
    fetchProductReport: () => Promise<void>
    fetchClientReport: () => Promise<void>
    exportToExcel: (reportType: string) => Promise<void>
    setPeriod: (period: ReportsState['period']) => void
    setDateRange: (from: string, to: string) => void
    clearError: () => void
}

const getCompanyId = () => {
    const { currentCompany, user } = useAuthStore.getState()
    return currentCompany?.id || user?.companies?.[0]?.id
}

const getAuthHeaders = () => {
    const { token } = useAuthStore.getState()
    return { Authorization: `Bearer ${token}` }
}

const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date()
    const to = today.toISOString().split('T')[0]

    switch (period) {
        case 'today':
            return { from: to, to }
        case 'week': {
            const d = new Date(today)
            d.setDate(today.getDate() - 7)
            return { from: d.toISOString().split('T')[0], to }
        }
        case 'month':
            return { from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0], to }
        case 'quarter': {
            const qm = Math.floor(today.getMonth() / 3) * 3
            return { from: new Date(today.getFullYear(), qm, 1).toISOString().split('T')[0], to }
        }
        case 'year':
            return { from: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0], to }
        default:
            return { from: to, to }
    }
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

    // Combina 3 endpoints para construir el resumen completo
    fetchSalesReport: async () => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const range = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)
            const params = { start_date: range.from, end_date: range.to }
            const headers = getAuthHeaders()

            const [salesRes, productsRes, clientsRes, breakdownRes] = await Promise.all([
                axios.get(`${API_URL}/companies/${companyId}/reports/sales`, { headers, params }),
                axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-product`, { headers, params }),
                axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-client`, { headers, params }),
                axios.get(`${API_URL}/companies/${companyId}/reports/sales/breakdown`, { headers, params }).catch(() => ({ data: {} })),
            ])

            const summary = salesRes.data.summary || {}

            const topProducts = (productsRes.data.data || []).slice(0, 5).map((p: any) => ({
                id: p.id,
                name: p.name,
                quantity: Number(p.total_quantity || 0),
                amount: Number(p.total_revenue || 0),
            }))

            const topClients = (clientsRes.data.data || []).slice(0, 5).map((c: any) => ({
                id: c.id,
                name: c.name,
                total_purchases: Number(c.total_purchases || 0),
                amount: Number(c.total_spent || 0),
            }))

            set({
                salesReport: {
                    period: `${range.from} - ${range.to}`,
                    total_sales: Number(summary.total_transactions || 0),
                    total_amount: Number(summary.total_amount || 0),
                    total_tax: Number(summary.total_tax || 0),
                    average_ticket: Number(summary.average_ticket || 0),
                    top_products: topProducts,
                    top_clients: topClients,
                    by_payment_method: breakdownRes.data?.by_payment_method || [],
                    by_document_type: breakdownRes.data?.by_document_type || [],
                    by_seller: breakdownRes.data?.by_seller || [],
                    by_cash_register: breakdownRes.data?.by_cash_register || [],
                    daily_sales: [],
                },
                isLoading: false,
            })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte de ventas',
                isLoading: false,
            })
        }
    },

    fetchProductReport: async () => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const range = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(
                `${API_URL}/companies/${companyId}/reports/sales/by-product`,
                { headers: getAuthHeaders(), params: { start_date: range.from, end_date: range.to } }
            )

            const mapped: ProductReportData[] = (response.data.data || []).map((p: any) => ({
                product_id: p.id,
                product_name: p.name,
                product_code: p.code || '',
                quantity_sold: Number(p.total_quantity || 0),
                total_amount: Number(p.total_revenue || 0),
                profit: 0,
                profit_margin: 0,
            }))

            set({ productReport: mapped, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte por producto',
                isLoading: false,
            })
        }
    },

    fetchClientReport: async () => {
        const companyId = getCompanyId()
        if (!companyId) return

        set({ isLoading: true, error: null })

        try {
            const { period, dateFrom, dateTo } = get()
            const range = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

            const response = await axios.get(
                `${API_URL}/companies/${companyId}/reports/sales/by-client`,
                { headers: getAuthHeaders(), params: { start_date: range.from, end_date: range.to } }
            )

            const mapped: ClientReportData[] = (response.data.data || []).map((c: any) => ({
                client_id: c.id,
                client_name: c.name,
                document_number: c.document_number || '',
                total_purchases: Number(c.total_purchases || 0),
                total_amount: Number(c.total_spent || 0),
                last_purchase_date: c.last_purchase_date || new Date().toISOString(),
            }))

            set({ clientReport: mapped, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar reporte por cliente',
                isLoading: false,
            })
        }
    },

    exportToExcel: async (reportType: string) => {
        const companyId = getCompanyId()
        if (!companyId) return

        const { period, dateFrom, dateTo, salesReport, productReport, clientReport } = get()
        const range = period === 'custom' ? { from: dateFrom, to: dateTo } : getDateRange(period)

        let headers: string[] = []
        let rows: (string | number)[][] = []

        if (reportType === 'sales' && salesReport) {
            headers = ['Período', 'Total Ventas', 'Monto Total', 'IGV Total', 'Ticket Promedio']
            rows = [[salesReport.period, salesReport.total_sales, salesReport.total_amount, salesReport.total_tax, salesReport.average_ticket]]
            if (salesReport.top_products.length) {
                rows.push([], ['--- Top Productos ---', '', '', '', ''], ['Producto', 'Cantidad', 'Monto', '', ''])
                salesReport.top_products.forEach(p => rows.push([p.name, p.quantity, p.amount, '', '']))
            }
        } else if (reportType === 'products') {
            const data = productReport.length > 0 ? productReport : await (async () => {
                const res = await axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-product`, {
                    headers: getAuthHeaders(), params: { start_date: range.from, end_date: range.to }
                })
                return (res.data.data || []).map((p: any) => ({
                    product_name: p.name, product_code: p.code,
                    quantity_sold: p.total_quantity, total_amount: p.total_revenue
                }))
            })()
            headers = ['Producto', 'Código', 'Cant. Vendida', 'Monto Total']
            rows = data.map((p: any) => [p.product_name, p.product_code, p.quantity_sold, p.total_amount])
        } else if (reportType === 'clients') {
            const data = clientReport.length > 0 ? clientReport : await (async () => {
                const res = await axios.get(`${API_URL}/companies/${companyId}/reports/sales/by-client`, {
                    headers: getAuthHeaders(), params: { start_date: range.from, end_date: range.to }
                })
                return (res.data.data || []).map((c: any) => ({
                    client_name: c.name, document_number: c.document_number,
                    total_purchases: c.total_purchases, total_amount: c.total_spent
                }))
            })()
            headers = ['Cliente', 'Documento', 'N° Compras', 'Monto Total']
            rows = data.map((c: any) => [c.client_name, c.document_number, c.total_purchases, c.total_amount])
        } else {
            // invoices / purchases — fetch from sunat endpoints
            const endpointMap: Record<string, string> = {
                invoices: 'sunat/sales-register',
                purchases: 'sunat/purchases-register',
            }
            try {
                const res = await axios.get(
                    `${API_URL}/companies/${companyId}/reports/${endpointMap[reportType] || reportType}`,
                    { headers: getAuthHeaders(), params: { start_date: range.from, end_date: range.to } }
                )
                const data = res.data?.data || res.data || []
                if (Array.isArray(data) && data.length > 0) {
                    headers = Object.keys(data[0])
                    rows = data.map((item: any) => Object.values(item))
                } else {
                    set({ error: 'Sin datos para exportar en el período seleccionado' })
                    return
                }
            } catch (err: any) {
                set({ error: err.response?.data?.message || 'Error al obtener datos' })
                return
            }
        }

        if (rows.length === 0) {
            set({ error: 'Sin datos para exportar. Carga la vista previa primero.' })
            return
        }

        // Generar .xlsx con SheetJS
        const wsData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Ancho automático de columnas
        ws['!cols'] = headers.map((_, i) => ({
            wch: Math.max(
                headers[i]?.toString().length ?? 10,
                ...rows.map(r => String(r[i] ?? '').length)
            ) + 2
        }))

        const wb = XLSX.utils.book_new()
        const sheetName = reportType === 'sales' ? 'Ventas' :
                          reportType === 'products' ? 'Productos' :
                          reportType === 'clients' ? 'Clientes' :
                          reportType === 'invoices' ? 'Reg. Ventas' : 'Reg. Compras'
        XLSX.utils.book_append_sheet(wb, ws, sheetName)

        XLSX.writeFile(wb, `reporte-${reportType}-${range.from}-${range.to}.xlsx`)
    },

    setPeriod: (period) => {
        const range = getDateRange(period)
        set({ period, dateFrom: range.from, dateTo: range.to })
    },

    setDateRange: (from, to) => {
        set({ dateFrom: from, dateTo: to, period: 'custom' })
    },

    clearError: () => set({ error: null }),
}))
