import { create } from 'zustand'
import api from '@/lib/api'

export interface PlanFull {
  id: string
  name: string
  slug: string
  description?: string
  price_monthly: number
  price_semiannual: number
  price_yearly: number
  currency: string
  trial_days: number
  // Limits
  max_users: number | null
  max_products: number | null
  max_invoices_monthly: number | null
  max_sales_monthly: number | null
  max_clients: number | null
  max_suppliers: number | null
  max_warehouses: number | null
  max_branches: number | null
  max_pos_sessions: number | null
  max_cash_registers: number | null
  storage_limit_mb: number | null
  // Feature flags
  has_pos: boolean
  has_invoicing: boolean
  has_inventory: boolean
  has_clients: boolean
  has_suppliers: boolean
  has_quotes: boolean
  has_credit_notes: boolean
  has_dispatch_guides: boolean
  has_product_variants: boolean
  has_multi_warehouse: boolean
  has_multi_branch: boolean
  has_reports_advanced: boolean
  has_api_access: boolean
  has_barcode_scanner: boolean
  has_email_support: boolean
  has_priority_support: boolean
  has_whatsapp_integration: boolean
  has_custom_branding: boolean
  // Modules
  modules: string[]
  features: string[]
  // Display
  is_active: boolean
  is_popular: boolean
  is_recommended: boolean
  badge?: string
  badge_color?: string
  sort_order: number
  // Computed
  yearly_savings: number
  yearly_savings_percentage: number
  semiannual_savings_percentage: number
}

export interface SubscriptionFull {
  id: string
  company_id: string
  plan_id: string
  plan?: PlanFull
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  billing_period?: 'monthly' | 'semiannual' | 'yearly'
  trial_ends_at?: string
  starts_at?: string
  ends_at?: string
  cancelled_at?: string
  last_payment_at?: string
  next_payment_at?: string
  // Computed from backend
  days_remaining?: number
  is_trial?: boolean
  is_expiring_soon?: boolean
}

interface SubscriptionState {
  subscription: SubscriptionFull | null
  availablePlans: PlanFull[]
  loading: boolean
  plansLoading: boolean
  initialized: boolean  // true después del primer fetchSubscription

  // Computed getters
  isActive: () => boolean
  isOnTrial: () => boolean
  isExpired: () => boolean
  isExpiringSoon: () => boolean
  daysRemaining: () => number
  currentPlan: () => PlanFull | null

  // Feature checks
  canUse: (feature: keyof PlanFull) => boolean
  getLimit: (resource: 'users' | 'products' | 'invoices' | 'sales' | 'clients' | 'suppliers' | 'warehouses' | 'branches' | 'pos_sessions' | 'cash_registers') => number | null

  // Actions
  fetchSubscription: () => Promise<void>
  fetchPlans: () => Promise<void>
  subscribe: (planId: string, billingPeriod: 'monthly' | 'semiannual' | 'yearly') => Promise<void>
  cancelSubscription: () => Promise<void>
}

const limitMap = {
  users: 'max_users',
  products: 'max_products',
  invoices: 'max_invoices_monthly',
  sales: 'max_sales_monthly',
  clients: 'max_clients',
  suppliers: 'max_suppliers',
  warehouses: 'max_warehouses',
  branches: 'max_branches',
  pos_sessions: 'max_pos_sessions',
  cash_registers: 'max_cash_registers',
} as const

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  availablePlans: [],
  loading: false,
  plansLoading: false,
  initialized: false,

  isActive: () => {
    const s = get().subscription
    if (!s) return false
    if (s.status === 'trial') {
      return !!s.trial_ends_at && new Date(s.trial_ends_at) > new Date()
    }
    return s.status === 'active' && (!s.ends_at || new Date(s.ends_at) > new Date())
  },

  isOnTrial: () => {
    const s = get().subscription
    return !!s && s.status === 'trial' && !!s.trial_ends_at && new Date(s.trial_ends_at) > new Date()
  },

  isExpired: () => {
    // No mostrar paywall hasta que se haya cargado la suscripción al menos una vez
    if (!get().initialized) return false
    const s = get().subscription
    if (!s) return true
    return s.status === 'expired' || s.status === 'cancelled'
  },

  isExpiringSoon: () => {
    const days = get().daysRemaining()
    return days > 0 && days <= 7
  },

  daysRemaining: () => {
    const s = get().subscription
    if (!s) return 0
    const expiryDate = s.status === 'trial' ? s.trial_ends_at : s.ends_at
    if (!expiryDate) return 0
    const diff = new Date(expiryDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  },

  currentPlan: () => get().subscription?.plan ?? null,

  canUse: (feature) => {
    const plan = get().currentPlan()
    if (!plan) return false
    if (!get().isActive()) return false
    const value = plan[feature]
    if (typeof value === 'boolean') return value
    return true
  },

  getLimit: (resource) => {
    const plan = get().currentPlan()
    if (!plan) return 0
    const key = limitMap[resource] as keyof PlanFull
    const val = plan[key]
    return val === null ? null : (val as number)
  },

  fetchSubscription: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/subscriptions/current')
      set({ subscription: data.data, loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  fetchPlans: async () => {
    set({ plansLoading: true })
    try {
      const { data } = await api.get('/subscriptions/plans')
      set({ availablePlans: data.data || [], plansLoading: false })
    } catch {
      set({ plansLoading: false })
    }
  },

  subscribe: async (planId, billingPeriod) => {
    const { data } = await api.post('/subscriptions/subscribe', {
      plan_id: planId,
      billing_period: billingPeriod,
      payment_method: 'manual',
    })
    set({ subscription: data.data })
  },

  cancelSubscription: async () => {
    await api.post('/subscriptions/cancel')
    await get().fetchSubscription()
  },
}))
