import { create } from 'zustand'
import axios from 'axios'
import type { Product, Client } from '@/types'
import { useAuthStore } from './authStore'
import { useProductStore } from './productStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

// Types
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
}

export interface POSSession {
  id: string
  user_id: string
  cash_register_id: string
  opening_amount: number
  closing_amount: number | null
  expected_amount?: number
  difference?: number
  total_sales?: number
  total_cash?: number
  total_card?: number
  total_transfer?: number
  total_yape_plin?: number
  total_credit?: number
  notes?: string | null
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
  cash_register?: CashRegister
  user?: { id: string; name: string }
}

export interface SessionSummary {
  total_sales: number
  total_transactions: number
  by_payment_method: {
    cash: number
    card: number
    transfer: number
    yape_plin: number
    credit: number
  }
  cash_movements: {
    incomes: number
    expenses: number
  }
  expected_cash: number
}

export interface CashRegister {
  id: string
  name: string
  code: string | null
  description: string | null
  is_active: boolean
  payment_methods: string[] | null
  active_session_id: string | null
  active_user_id: string | null
  locked_at: string | null
  active_user?: { id: string; name: string } | null
}

export interface RegisterStatus {
  id: string
  name: string
  code: string | null
  status: 'available' | 'occupied' | 'inactive'
  is_active: boolean
  current_user: { id: string; name: string } | null
  locked_at: string | null
  session_opened_at?: string
  total_sales?: number
  transaction_count?: number
}

export interface SaleData {
  client_id?: string | null
  document_type: '00' | '03' | '01' // 00=Nota de Venta, 03=Boleta, 01=Factura
  payment_method: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed'
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount_type: 'percentage' | 'fixed'
    discount_percentage: number
  }>
  global_discount_type?: 'percentage' | 'fixed'
  global_discount_value?: number
  cash_received?: number
  notes?: string
}

export interface SaleResult {
  sale: {
    id: string
    total: number
    payment_method: string
    change_amount: number
    sale_number?: string
    global_discount_amount?: number
  }
  invoice?: {
    id: string
    series: string
    number: string
    correlative?: number
    verification_url?: string
  } | null
}

interface POSState {
  // Cart state
  cart: CartItem[]
  selectedClient: Client | null
  documentType: '00' | '03' | '01'
  paymentMethod: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed'
  cashReceived: number
  globalDiscountType: 'percentage' | 'fixed'
  globalDiscountValue: number

  // Session state
  currentSession: POSSession | null
  cashRegisters: CashRegister[]
  registersStatus: RegisterStatus[]
  isSessionLoading: boolean
  sessionSummary: SessionSummary | null
  sessionHistory: { data: POSSession[]; total: number; current_page: number; last_page: number } | null

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
  applyDiscount: (productId: string, discount: number, discountType?: 'percentage' | 'fixed') => void
  setItemDiscountType: (productId: string, type: 'percentage' | 'fixed') => void
  clearCart: () => void
  setClient: (client: Client | null) => void
  setDocumentType: (type: '00' | '03' | '01') => void
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'yape_plin' | 'credit' | 'mixed') => void
  setCashReceived: (amount: number) => void
  setGlobalDiscount: (type: 'percentage' | 'fixed', value: number) => void

  // API Actions
  fetchCashRegisters: () => Promise<void>
  fetchCurrentSession: () => Promise<void>
  openSession: (cashRegisterId: string, openingAmount: number) => Promise<void>
  closeSession: (closingAmount: number, notes?: string) => Promise<POSSession>
  registerMovement: (type: 'income' | 'expense', amount: number, description: string) => Promise<void>
  fetchSessionSummary: () => Promise<void>
  fetchSessionHistory: (params?: { date_from?: string; date_to?: string; cash_register_id?: string; status?: string; page?: number }) => Promise<void>
  fetchRegistersStatus: () => Promise<void>
  forceCloseSession: (sessionId: string, closingAmount?: number, notes?: string) => Promise<void>
  searchProducts: (query: string) => Promise<void>
  fetchFrequentProducts: () => Promise<void>
  processSale: (sendToSunat?: boolean) => Promise<SaleResult>

  // Computed (as functions)
  getSubtotal: () => number
  getTaxAmount: () => number
  getGlobalDiscountAmount: () => number
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
  globalDiscountType: 'percentage',
  globalDiscountValue: 0,
  currentSession: null,
  cashRegisters: [],
  registersStatus: [],
  isSessionLoading: false,
  sessionSummary: null,
  sessionHistory: null,
  searchResults: [],
  frequentProducts: [],
  isSearching: false,
  isProcessing: false,
  error: null,
  lastSale: null,

  // Cart Actions
  addToCart: (product, quantity = 1) => set((state) => {
    const stock = product.stock ?? Infinity
    const existingIndex = state.cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      const currentQty = state.cart[existingIndex].quantity
      if (currentQty >= stock) return state // already at max stock
      const newCart = [...state.cart]
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: Math.min(currentQty + quantity, stock) }
      return { cart: newCart }
    }

    const newItem: CartItem = {
      product,
      quantity: Math.min(quantity, stock),
      unitPrice: Number(product.sale_price),
      discount: 0,
      discountType: 'percentage',
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
      cart: state.cart.map(item => {
        if (item.product.id !== productId) return item
        const stock = item.product.stock ?? Infinity
        return { ...item, quantity: Math.min(quantity, stock) }
      })
    }
  }),

  updatePrice: (productId, price) => set((state) => ({
    cart: state.cart.map(item =>
      item.product.id === productId
        ? { ...item, unitPrice: price }
        : item
    )
  })),

  applyDiscount: (productId, discount, discountType) => set((state) => ({
    cart: state.cart.map(item =>
      item.product.id === productId
        ? { ...item, discount, ...(discountType ? { discountType } : {}) }
        : item
    )
  })),

  setItemDiscountType: (productId, type) => set((state) => ({
    cart: state.cart.map(item =>
      item.product.id === productId
        ? { ...item, discountType: type, discount: 0 }
        : item
    )
  })),

  clearCart: () => set({
    cart: [],
    selectedClient: null,
    cashReceived: 0,
    globalDiscountType: 'percentage',
    globalDiscountValue: 0,
    lastSale: null,
  }),

  setClient: (client) => set({ selectedClient: client }),
  setDocumentType: (type) => set({ documentType: type }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCashReceived: (amount) => set({ cashReceived: amount }),
  setGlobalDiscount: (type, value) => set({ globalDiscountType: type, globalDiscountValue: value }),

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

  closeSession: async (closingAmount: number, notes?: string) => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    set({ isSessionLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/companies/${companyId}/pos/close-session`, {
        closing_amount: closingAmount,
        ...(notes ? { notes } : {}),
      }, {
        headers: getAuthHeaders()
      })
      set({ currentSession: null, sessionSummary: null, isSessionLoading: false })
      return response.data.session
    } catch (error: any) {
      set({
        isSessionLoading: false,
        error: error.response?.data?.message || 'Error al cerrar sesión'
      })
      throw error
    }
  },

  registerMovement: async (type, amount, description) => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    await axios.post(`${API_URL}/companies/${companyId}/pos/movement`, {
      type,
      amount,
      description,
    }, { headers: getAuthHeaders() })
  },

  fetchSessionSummary: async () => {
    const companyId = getCompanyId()
    if (!companyId) return
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/summary`, {
        headers: getAuthHeaders()
      })
      set({ sessionSummary: response.data.summary })
    } catch {
      // No open session or other error
    }
  },

  fetchSessionHistory: async (params = {}) => {
    const companyId = getCompanyId()
    if (!companyId) return
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/sessions`, {
        headers: getAuthHeaders(),
        params,
      })
      set({ sessionHistory: response.data })
    } catch (error: any) {
      console.error('Error fetching session history', error)
    }
  },

  fetchRegistersStatus: async () => {
    const companyId = getCompanyId()
    if (!companyId) return
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/pos/registers-status`, {
        headers: getAuthHeaders()
      })
      set({ registersStatus: response.data.data || [] })
    } catch (error: any) {
      console.error('Error fetching registers status', error)
    }
  },

  forceCloseSession: async (sessionId, closingAmount, notes) => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    await axios.post(`${API_URL}/companies/${companyId}/pos/force-close-session/${sessionId}`, {
      ...(closingAmount !== undefined ? { closing_amount: closingAmount } : {}),
      ...(notes ? { notes } : {}),
    }, { headers: getAuthHeaders() })

    // Refresh statuses
    get().fetchRegistersStatus()
    get().fetchCashRegisters()
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
      set({ frequentProducts: response.data.products || response.data.data || response.data || [] })
    } catch (error: any) {
      console.error('Error fetching frequent products:', error)
      set({ frequentProducts: [] })
    }
  },

  processSale: async (sendToSunat?: boolean) => {
    const companyId = getCompanyId()
    if (!companyId) throw new Error('No company selected')

    const { cart, selectedClient, documentType, paymentMethod, cashReceived, globalDiscountType, globalDiscountValue } = get()

    if (cart.length === 0) {
      throw new Error('El carrito está vacío')
    }

    set({ isProcessing: true, error: null })

    try {
      const saleData: SaleData = {
        client_id: selectedClient?.id || null,
        document_type: documentType,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          discount_type: item.discountType,
          discount_percentage: Number(item.discount || 0)
        })),
        ...(globalDiscountValue > 0 ? {
          global_discount_type: globalDiscountType,
          global_discount_value: Number(globalDiscountValue),
        } : {}),
        cash_received: paymentMethod === 'cash' ? Number(cashReceived) : undefined,
        send_to_sunat: sendToSunat !== undefined ? sendToSunat : true,
      }

      const response = await axios.post<SaleResult>(`${API_URL}/companies/${companyId}/pos/sale`, saleData, {
        headers: getAuthHeaders()
      })

      const result = response.data

      // Decrement stock in productStore for each sold item
      const soldItems = cart
      const productState = useProductStore.getState()
      const decrementStock = (p: Product) => {
        const soldItem = soldItems.find(item => item.product.id === p.id)
        if (soldItem) return { ...p, stock: Math.max(0, (p.stock || 0) - soldItem.quantity) }
        return p
      }
      useProductStore.setState({
        products: productState.products.map(decrementStock),
      })

      // Also decrement in searchResults and frequentProducts within posStore
      const { searchResults, frequentProducts } = get()
      set({
        isProcessing: false,
        lastSale: result,
        cart: [],
        selectedClient: null,
        cashReceived: 0,
        globalDiscountType: 'percentage',
        globalDiscountValue: 0,
        searchResults: searchResults.map(decrementStock),
        frequentProducts: frequentProducts.map(decrementStock),
      })

      return result
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || 'Error al procesar venta';

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
      const grossAmount = Number(item.quantity) * Number(item.unitPrice)
      let discount = 0
      if (item.discountType === 'fixed') {
        discount = Number(item.discount) * Number(item.quantity)
        discount = Math.min(discount, grossAmount)
      } else {
        discount = grossAmount * (Number(item.discount) / 100)
      }
      return sum + (grossAmount - discount)
    }, 0)
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal()
    const base = subtotal / 1.18
    return subtotal - base
  },

  getGlobalDiscountAmount: () => {
    const { globalDiscountType, globalDiscountValue } = get()
    if (!globalDiscountValue || globalDiscountValue <= 0) return 0
    const subtotal = get().getSubtotal()
    if (globalDiscountType === 'fixed') return Math.min(globalDiscountValue, subtotal)
    return subtotal * (globalDiscountValue / 100)
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const globalDiscount = get().getGlobalDiscountAmount()
    return Math.max(0, subtotal - globalDiscount)
  },

  getChange: () => {
    const { cashReceived } = get()
    const total = get().getTotal()
    return Math.max(0, cashReceived - total)
  },
}))
