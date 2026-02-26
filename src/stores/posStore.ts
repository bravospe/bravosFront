import { create } from 'zustand'
import axios from 'axios'
import type { Product, Client } from '@/types'
import { useAuthStore } from './authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

// Types
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

export interface POSSession {
  id: string
  user_id: string
  cash_register_id: string
  opening_amount: number
  closing_amount: number | null
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
}

export interface CashRegister {
  id: string
  name: string
  code: string | null
  description: string | null
  is_active: boolean
}

export interface SaleData {
  client_id?: string | null
  document_type: '03' | '01' // 03=Boleta, 01=Factura
  payment_method: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed'
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount: number
  }>
  cash_received?: number
  notes?: string
}

export interface SaleResult {
  sale: {
    id: string
    total: number
    payment_method: string
    change_amount: number
  }
  invoice?: {
    id: string
    series: string
    number: string
  }
}

interface POSState {
  // Cart state
  cart: CartItem[]
  selectedClient: Client | null
  documentType: '03' | '01'
  paymentMethod: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed'
  cashReceived: number

  // Session state
  currentSession: POSSession | null
  cashRegisters: CashRegister[]
  isSessionLoading: boolean

  // Products state
  searchResults: Product[]
  frequentProducts: Product[]
  isSearching: boolean

  // Processing state
  isProcessing: boolean
  error: string | null
  lastSale: SaleResult | null

  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updatePrice: (productId: string, price: number) => void
  applyDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  setClient: (client: Client | null) => void
  setDocumentType: (type: '03' | '01') => void
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed') => void
  setCashReceived: (amount: number) => void

  // API Actions
  fetchCashRegisters: () => Promise<void>
  fetchCurrentSession: () => Promise<void>
  openSession: (cashRegisterId: string, openingAmount: number) => Promise<void>
  closeSession: () => Promise<void>
  searchProducts: (query: string) => Promise<void>
  fetchFrequentProducts: () => Promise<void>
  processSale: () => Promise<SaleResult>

  // Computed (as functions)
  getSubtotal: () => number
  getTaxAmount: () => number
  getTotal: () => number
  getChange: () => number
}

const getCompanyId = () => {
  const { user } = useAuthStore.getState()
  return user?.current_company_id || user?.companies?.[0]?.id
}

const getAuthHeaders = () => {
  const { token } = useAuthStore.getState()
  return {
    Authorization: `Bearer ${token}`,
    'X-Requested-With': 'XMLHttpRequest'
  }
}

export const usePOSStore = create<POSState>((set, get) => ({
  // Initial state
  cart: [],
  selectedClient: null,
  documentType: '03',
  paymentMethod: 'cash',
  cashReceived: 0,
  currentSession: null,
  cashRegisters: [],
  isSessionLoading: false,
  searchResults: [],
  frequentProducts: [],
  isSearching: false,
  isProcessing: false,
  error: null,
  lastSale: null,

  // Cart Actions
  addToCart: (product, quantity = 1) => set((state) => {
    const existingIndex = state.cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      const newCart = [...state.cart]
      newCart[existingIndex].quantity += quantity
      return { cart: newCart }
    }

    const newItem: CartItem = {
      product,
      quantity,
      unitPrice: Number(product.sale_price),
      discount: 0,
    }

    return { cart: [...state.cart, newItem] }
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId)
  })),

  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter(item => item.product.id !== productId) }
    }

    return {
      cart: state.cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    }
  }),

  updatePrice: (productId, price) => set((state) => ({
    cart: state.cart.map(item =>
      item.product.id === productId
        ? { ...item, unitPrice: price }
        : item
    )
  })),

  applyDiscount: (productId, discount) => set((state) => ({
    cart: state.cart.map(item =>
      item.product.id === productId
        ? { ...item, discount }
        : item
    )
  })),

  clearCart: () => set({
    cart: [],
    selectedClient: null,
    cashReceived: 0,
    lastSale: null,
  }),

  setClient: (client) => set({ selectedClient: client }),
  setDocumentType: (type) => set({ documentType: type }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCashReceived: (amount) => set({ cashReceived: amount }),

  // API Actions
  fetchCashRegisters: async () => {
    const companyId = getCompanyId()
    if (!companyId) return
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/cash-registers`, {
        headers: getAuthHeaders()
      })
      set({ cashRegisters: response.data.data || response.data })
    } catch (error: any) {
      console.error('Error fetching cash registers', error)
    }
  },

  fetchCurrentSession: async () => {
    const companyId = getCompanyId()
    if (!companyId) return

    set({ isSessionLoading: true, error: null })
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/session`, {
        headers: getAuthHeaders()
      })
      set({ currentSession: response.data.session, isSessionLoading: false })
    } catch (error: any) {
      set({
        currentSession: null,
        isSessionLoading: false,
        error: error.response?.data?.message || 'Error al obtener sesión'
      })
    }
  },

  openSession: async (cashRegisterId, openingAmount) => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    set({ isSessionLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/companies/${companyId}/pos/open-session`, {
        cash_register_id: cashRegisterId,
        opening_amount: openingAmount
      }, {
        headers: getAuthHeaders()
      })
      set({ currentSession: response.data.session, isSessionLoading: false })
    } catch (error: any) {
      set({
        isSessionLoading: false,
        error: error.response?.data?.message || 'Error al abrir sesión'
      })
      throw error
    }
  },

  closeSession: async () => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    set({ isSessionLoading: true, error: null })
    try {
      await axios.post(`${API_URL}/companies/${companyId}/pos/close-session`, {}, {
        headers: getAuthHeaders()
      })
      set({ currentSession: null, isSessionLoading: false })
    } catch (error: any) {
      set({
        isSessionLoading: false,
        error: error.response?.data?.message || 'Error al cerrar sesión'
      })
      throw error
    }
  },

  searchProducts: async (query) => {
    const companyId = getCompanyId()
    if (!companyId) return

    if (!query.trim()) {
      set({ searchResults: [] })
      return
    }

    set({ isSearching: true })
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/products`, {
        headers: getAuthHeaders(),
        params: { query: query, limit: 20 }
      })
      set({ searchResults: response.data.products || response.data.data || [], isSearching: false })
    } catch (error: any) {
      console.error('Error searching products:', error)
      set({ searchResults: [], isSearching: false })
    }
  },

  fetchFrequentProducts: async () => {
    const companyId = getCompanyId()
    if (!companyId) return

    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/frequent-products`, {
        headers: getAuthHeaders()
      })
      set({ frequentProducts: response.data.data || response.data })
    } catch (error: any) {
      console.error('Error fetching frequent products:', error)
    }
  },

  processSale: async () => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    const { cart, selectedClient, documentType, paymentMethod, cashReceived } = get()

    if (cart.length === 0) {
      throw new Error('El carrito está vacío')
    }

    set({ isProcessing: true, error: null })

    try {
      const saleData: SaleData = {
        client_id: selectedClient?.id || null, // Explicit null if undefined
        document_type: documentType,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          discount: Number(item.discount || 0)
        })),
        cash_received: paymentMethod === 'cash' ? Number(cashReceived) : undefined
      }

      const response = await axios.post<SaleResult>(`${API_URL}/companies/${companyId}/pos/sale`, saleData, {
        headers: getAuthHeaders()
      })

      const result = response.data

      set({
        isProcessing: false,
        lastSale: result,
        cart: [],
        selectedClient: null,
        cashReceived: 0
      })

      return result
    } catch (error: any) {
      // Improve 422 error display
      let errorMessage = error.response?.data?.message || 'Error al procesar venta';

      // If validation errors exist, append first one
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage += `: ${firstError[0]}`;
        } else {
          errorMessage += `: ${firstError}`;
        }
      }

      set({
        isProcessing: false,
        error: errorMessage
      })
      throw new Error(errorMessage);
    }
  },

  // Computed
  getSubtotal: () => {
    const { cart } = get()
    return cart.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice)
      const discount = itemTotal * (Number(item.discount) / 100)
      return sum + (itemTotal - discount)
    }, 0)
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal()
    // IGV is included in price, so we calculate base and tax
    const base = subtotal / 1.18
    return subtotal - base
  },

  getTotal: () => get().getSubtotal(),

  getChange: () => {
    const { cashReceived } = get()
    const total = get().getTotal()
    return Math.max(0, cashReceived - total)
  },
}))
