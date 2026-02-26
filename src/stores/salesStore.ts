import { create } from 'zustand'
import api from '@/lib/api'
import { useAuthStore } from './authStore'
import type { Sale, Client, User } from '@/types'

// Extended Sale type with relations
export interface SaleWithRelations extends Sale {
  client?: Client
  seller?: User
  invoice?: {
    id: string
    series: string
    correlative: number
    document_type: string
    status: string
  }
  items?: Array<{
    id: string
    product_id: string
    product?: {
      id: string
      name: string
      code: string
    }
    code: string
    description: string
    quantity: number
    unit_price: number
    discount_amount: number
    tax_amount: number
    total: number
  }>
  notes?: string
}

interface SalesSummary {
  total_transactions: number
  total_amount: number
  total_tax: number
  average_ticket: number
}

interface SalesStats {
  period: {
    name: string
    start: string
    end: string
  }
  totals: {
    count: number
    total: number
    tax: number
    average: number
  }
  by_payment_method: Array<{
    payment_method: string
    count: number
    total: number
  }>
  by_document_type: Array<{
    document_type: string
    count: number
    total: number
  }>
  daily_trend: Array<{
    date: string
    count: number
    total: number
  }>
  hourly_distribution: Array<{
    hour: string
    count: number
    total: number
  }>
  top_sellers: Array<{
    id: string
    name: string
    count: number
    total: number
  }>
  top_products: Array<{
    id: string
    name: string
    code: string
    qty: number
    revenue: number
  }>
}

interface SalesFilters {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'
  date_from?: string
  date_to?: string
  client_id?: string
  seller_id?: string
  payment_method?: string
  status?: string
  document_type?: string
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

interface SalesState {
  // Data
  sales: SaleWithRelations[]
  currentSale: SaleWithRelations | null
  summary: SalesSummary | null
  stats: SalesStats | null
  
  // Pagination
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  } | null
  
  // Filters
  filters: SalesFilters
  
  // Loading states
  isLoading: boolean
  isLoadingStats: boolean
  isExporting: boolean
  error: string | null
  
  // Actions
  fetchSales: (page?: number) => Promise<void>
  getSale: (id: string) => Promise<void>
  updateSale: (id: string, data: { notes?: string }) => Promise<void>
  cancelSale: (id: string) => Promise<void>
  fetchStats: (period?: string) => Promise<void>
  exportSales: (format: 'excel' | 'pdf') => Promise<void>
  setFilters: (filters: SalesFilters) => void
  resetFilters: () => void
  setCurrentSale: (sale: SaleWithRelations | null) => void
}

const getCompanyId = () => {
  const { user } = useAuthStore.getState()
  return user?.current_company_id || user?.companies?.[0]?.id
}

const defaultFilters: SalesFilters = {
  period: 'today',
  sort_by: 'created_at',
  sort_dir: 'desc',
}

export const useSalesStore = create<SalesState>((set, get) => ({
  // Initial state
  sales: [],
  currentSale: null,
  summary: null,
  stats: null,
  meta: null,
  filters: { ...defaultFilters },
  isLoading: false,
  isLoadingStats: false,
  isExporting: false,
  error: null,
  
  // Fetch sales with filters
  fetchSales: async (page = 1) => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    set({ isLoading: true, error: null })
    
    try {
      const { filters } = get()
      const params: Record<string, unknown> = {
        page,
        per_page: 20,
        ...filters,
      }
      
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })
      
      const response = await api.get(`/companies/${companyId}/sales`, { params })
      
      set({
        sales: response.data.data,
        meta: response.data.meta,
        summary: response.data.summary,
        isLoading: false,
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      set({
        error: err.response?.data?.message || 'Error al cargar ventas',
        isLoading: false,
      })
    }
  },
  
  // Get single sale
  getSale: async (id: string) => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get(`/companies/${companyId}/sales/${id}`)
      set({
        currentSale: response.data.data,
        isLoading: false,
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      set({
        error: err.response?.data?.message || 'Error al cargar venta',
        isLoading: false,
      })
    }
  },
  
  // Update sale notes
  updateSale: async (id: string, data: { notes?: string }) => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    try {
      const response = await api.put(`/companies/${companyId}/sales/${id}`, data)
      
      // Update in list
      set(state => ({
        sales: state.sales.map(s => s.id === id ? response.data.data : s),
        currentSale: state.currentSale?.id === id ? response.data.data : state.currentSale,
      }))
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      throw new Error(err.response?.data?.message || 'Error al actualizar venta')
    }
  },
  
  // Cancel sale
  cancelSale: async (id: string) => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    try {
      await api.delete(`/companies/${companyId}/sales/${id}`)
      
      // Update in list
      set(state => ({
        sales: state.sales.map(s => s.id === id ? { ...s, status: 'cancelled' } : s),
        currentSale: state.currentSale?.id === id ? { ...state.currentSale, status: 'cancelled' } : state.currentSale,
      }))
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      throw new Error(err.response?.data?.message || 'Error al anular venta')
    }
  },
  
  // Fetch statistics
  fetchStats: async (period = 'month') => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    set({ isLoadingStats: true })
    
    try {
      const response = await api.get(`/companies/${companyId}/sales/stats`, {
        params: { period }
      })
      
      set({
        stats: response.data.data,
        isLoadingStats: false,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      set({ isLoadingStats: false })
    }
  },
  
  // Export sales
  exportSales: async (format: 'excel' | 'pdf') => {
    const companyId = getCompanyId()
    if (!companyId) return
    
    set({ isExporting: true })
    
    try {
      const { filters } = get()
      const response = await api.get(`/companies/${companyId}/sales/export`, {
        params: { format, ...filters }
      })
      
      // TODO: Handle actual file download
      if (response.data.data?.download_url) {
        window.open(response.data.data.download_url, '_blank')
      } else {
        console.log('Export prepared:', response.data)
        // Temporary feedback until backend implements file generation
        // toast.success('Exportación generada (Simulación)') 
        // We can't use toast here directly as it's not a React component, 
        // but the UI calling this can handle success state
      }
      
      set({ isExporting: false })
    } catch (error) {
      console.error('Error exporting:', error)
      set({ isExporting: false, error: 'Error al exportar ventas' })
    }
  },
  
  // Set filters
  setFilters: (filters: SalesFilters) => {
    set({ filters: { ...get().filters, ...filters } })
  },
  
  // Reset filters
  resetFilters: () => {
    set({ filters: { ...defaultFilters } })
  },
  
  // Set current sale
  setCurrentSale: (sale: SaleWithRelations | null) => {
    set({ currentSale: sale })
  },
}))
