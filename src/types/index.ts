// User types
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  document_type?: string
  document_number?: string
  avatar?: string
  is_active: boolean
  current_company_id?: string
  current_company?: Company
  companies?: Company[]
  roles?: Role[]
  permissions?: string[]
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  guard_name: string
}

// Company types
export interface Company {
  id: string
  owner_id: string
  name: string
  trade_name?: string
  ruc: string
  address: string
  ubigeo?: string
  department?: string
  province?: string
  district?: string
  phone?: string
  email?: string
  logo?: string
  is_active: boolean
  settings?: Record<string, unknown>
  subscription?: Subscription
  created_at: string
  updated_at: string
}

// Subscription types
export interface Subscription {
  id: string
  company_id: string
  plan_id: string
  plan?: Plan
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  billing_period?: 'monthly' | 'semiannual' | 'yearly'
  trial_ends_at?: string
  starts_at?: string
  ends_at?: string
  cancelled_at?: string
  last_payment_at?: string
  next_payment_at?: string
  // Computed from API
  days_remaining?: number
  total_days?: number
  percentage_used?: number
  is_trial?: boolean
  is_expiring_soon?: boolean
  expiry_date?: string
}

export interface Plan {
  id: string
  name: string
  slug: string
  description?: string
  price_monthly: number
  price_semiannual: number
  price_yearly: number
  currency: string
  trial_days?: number
  // Limits (null = ilimitado)
  max_users: number | null
  max_products: number | null
  max_invoices_monthly: number | null
  max_sales_monthly: number | null
  max_clients: number | null
  max_suppliers: number | null
  max_warehouses: number | null
  max_branches: number | null
  max_pos_sessions: number | null
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
  // Arrays
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
  yearly_savings_percentage: number
  semiannual_savings_percentage: number
}

// Client types
export interface ClientLabel {
  id: string
  name: string
  color: string
  description?: string
}

export interface Client {
  id: string
  company_id: string
  document_type: 'RUC' | 'DNI' | 'CE' | 'PASAPORTE'
  document_number: string
  name: string
  trade_name?: string
  address?: string
  email?: string
  phone?: string
  credit_limit: number
  credit_days: number
  is_active: boolean
  client_category_id?: string
  category?: ClientCategory
  labels?: ClientLabel[]
}

export interface ClientCategory {
  id: string
  company_id: string
  name: string
  description?: string
  icon?: string
  image_path?: string
  is_active: boolean
  clients_count?: number
}

// Product types
export interface Product {
  id: string
  company_id: string
  category_id?: string
  brand_id?: string
  code: string
  barcode?: string
  name: string
  description?: string
  unit_code: string
  unit_name: string
  purchase_price: number
  sale_price: number
  wholesale_price?: number
  min_stock: number
  stock: number
  is_service: boolean
  is_active: boolean
  tax_type: 'IGV' | 'EXONERADO' | 'INAFECTO'
  tax_percentage: number
  image?: string
  category?: Category
  brand?: Brand
  total_stock?: number
}

export interface Category {
  id: string
  company_id: string
  parent_id?: string
  name: string
  slug: string
  description?: string
  is_active: boolean
}

export interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  is_active: boolean
}

// Invoice types
export interface Invoice {
  id: string
  company_id: string
  client_id?: string
  seller_id?: string
  document_type: '01' | '03' | '07' | '08'
  series: string
  correlative: number
  issue_date: string
  due_date?: string
  currency: string
  exchange_rate: number
  subtotal: number
  tax_igv: number
  total_discount: number
  total: number
  status: 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'cancelled'
  sunat_status?: string
  sunat_hash?: string
  sent_at?: string | null
  accepted_at?: string | null
  client?: Client
  seller?: User
  items?: InvoiceItem[]
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id?: string
  code: string
  description: string
  unit_code: string
  unit_name: string
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  subtotal: number
  tax_type: string
  tax_percentage: number
  tax_amount: number
  total: number
}

// POS types
export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

export interface POSSession {
  id: string
  company_id: string
  user_id: string
  cash_register_id: string
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  total_sales: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
}

export interface Sale {
  id: string
  company_id: string
  pos_session_id?: string
  invoice_id?: string
  client_id?: string
  seller_id: string
  document_type: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  payment_method: string
  cash_received?: number
  change_amount?: number
  status: string
  created_at: string
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  company_name: string
  company_ruc: string
  company_address: string
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
  links: {
    first: string
    last: string
    prev?: string
    next?: string
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
