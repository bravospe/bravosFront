import api from '../lib/api';

export interface VirtualStore {
  id: number;
  company_id: number;
  subdomain: string;
  custom_domain?: string;
  name: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  theme_id: number;
  theme_type?: 'white' | 'neon';
  theme_config?: Record<string, any>;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  surface_color?: string;
  text_color?: string;
  text_muted_color?: string;
  is_active: boolean;
  maintenance_mode: boolean;
  social_links?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  seo_config?: {
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  };
  shipping_config?: Record<string, any>;
  payment_config?: Record<string, any>;
  analytics_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreTheme {
  id: number;
  name: string;
  code: string;
  description?: string;
  preview_image?: string;
  default_config: Record<string, any>;
  is_premium: boolean;
  category: string;
}

export interface StoreBanner {
  id: number;
  virtual_store_id: number;
  title?: string;
  subtitle?: string;
  image_url: string;
  image_mobile_url?: string;
  link_url?: string;
  link_text?: string;
  position: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface StorePromotion {
  id: number;
  virtual_store_id: number;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  min_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  applies_to: 'all' | 'categories' | 'products';
  applicable_ids?: number[];
}

export interface StoreOrder {
  id: number;
  virtual_store_id: number;
  store_customer_id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_status: 'pending' | 'label_generated' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_address?: {
    name: string;
    phone: string;
    address: string;
    district_id: string;
    reference?: string;
  };
  billing_address?: Record<string, any>;
  notes?: string;
  internal_notes?: string;
  customer?: StoreCustomer;
  items?: StoreOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StoreOrderItem {
  id: number;
  store_order_id: number;
  product_id: number;
  variant_id?: number;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
    image?: string;
  };
}

export interface StoreCustomer {
  id: number;
  company_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  status: 'active' | 'blocked';
  email_verified: boolean;
  orders_count?: number;
  total_spent?: number;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  type: 'wallet' | 'bank';
  provider: string;
  account_number: string;
  account_name: string;
  cci?: string;
  qr_path?: string;
  qr_url?: string;
  instructions?: string;
  is_active: boolean;
  sort_order: number;
}

const virtualStoreService = {
  // Settings
  getSettings: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/settings`);
    return response.data;
  },

  updateSettings: async (companyId: number, data: Partial<VirtualStore>) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/settings`, data);
    return response.data;
  },

  uploadLogo: async (companyId: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/companies/${companyId}/virtual-store/settings/logo`, formData);
    return response.data;
  },

  uploadFavicon: async (companyId: number, file: File) => {
    const formData = new FormData();
    formData.append('favicon', file);
    const response = await api.post(`/companies/${companyId}/virtual-store/settings/favicon`, formData);
    return response.data;
  },

  getPreviewUrl: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/settings/preview-url`);
    return response.data;
  },

  // Themes
  getThemes: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/themes`);
    return response.data;
  },

  applyTheme: async (companyId: number, themeId: number) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/themes/${themeId}/apply`);
    return response.data;
  },

  customizeTheme: async (companyId: number, config: Record<string, any>) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/themes/customize`, config);
    return response.data;
  },

  // Banners
  getBanners: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/banners`);
    return response.data;
  },

  createBanner: async (companyId: number, data: Partial<StoreBanner>) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/banners`, data);
    return response.data;
  },

  updateBanner: async (companyId: number, bannerId: number, data: Partial<StoreBanner>) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/banners/${bannerId}`, data);
    return response.data;
  },

  deleteBanner: async (companyId: number, bannerId: number) => {
    const response = await api.delete(`/companies/${companyId}/virtual-store/banners/${bannerId}`);
    return response.data;
  },

  reorderBanners: async (companyId: number, bannerIds: number[]) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/banners/reorder`, { banner_ids: bannerIds });
    return response.data;
  },

  toggleBanner: async (companyId: number, bannerId: number) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/banners/${bannerId}/toggle`);
    return response.data;
  },

  // Promotions
  getPromotions: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/promotions`, { params });
    return response.data;
  },

  createPromotion: async (companyId: number, data: Partial<StorePromotion>) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/promotions`, data);
    return response.data;
  },

  updatePromotion: async (companyId: number, promotionId: number, data: Partial<StorePromotion>) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/promotions/${promotionId}`, data);
    return response.data;
  },

  deletePromotion: async (companyId: number, promotionId: number) => {
    const response = await api.delete(`/companies/${companyId}/virtual-store/promotions/${promotionId}`);
    return response.data;
  },

  togglePromotion: async (companyId: number, promotionId: number) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/promotions/${promotionId}/toggle`);
    return response.data;
  },

  getPromotionStats: async (companyId: number, promotionId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/promotions/${promotionId}/stats`);
    return response.data;
  },

  // Orders
  getOrders: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/orders`, { params });
    return response.data;
  },

  getOrder: async (companyId: number, orderId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/orders/${orderId}`);
    return response.data;
  },

  getOrderStats: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/orders/stats`);
    return response.data;
  },

  updateOrderStatus: async (companyId: number, orderId: number, status: string) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/orders/${orderId}/status`, { status });
    return response.data;
  },

  confirmOrder: async (companyId: number, orderId: number) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/orders/${orderId}/confirm`);
    return response.data;
  },

  cancelOrder: async (companyId: number, orderId: number, reason: string) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  refundOrder: async (companyId: number, orderId: number, data: { amount?: number; reason: string }) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/orders/${orderId}/refund`, data);
    return response.data;
  },

  addOrderNote: async (companyId: number, orderId: number, note: string) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/orders/${orderId}/notes`, { note });
    return response.data;
  },

  exportOrders: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/orders/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Customers
  getCustomers: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/customers`, { params });
    return response.data;
  },

  getCustomer: async (companyId: number, customerId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/customers/${customerId}`);
    return response.data;
  },

  getCustomerOrders: async (companyId: number, customerId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/customers/${customerId}/orders`, { params });
    return response.data;
  },

  updateCustomer: async (companyId: number, customerId: number, data: Partial<StoreCustomer>) => {
    const response = await api.put(`/companies/${companyId}/virtual-store/customers/${customerId}`, data);
    return response.data;
  },

  deleteCustomer: async (companyId: number, customerId: number) => {
    const response = await api.delete(`/companies/${companyId}/virtual-store/customers/${customerId}`);
    return response.data;
  },

  // Dashboard
  getDashboard: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/dashboard`);
    return response.data;
  },

  // Payment Methods
  getPaymentMethods: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/virtual-store/payment-methods`);
    return response.data;
  },

  createPaymentMethod: async (companyId: number, data: FormData) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/payment-methods`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updatePaymentMethod: async (companyId: number, paymentMethodId: number, data: FormData) => {
    data.append('_method', 'PUT'); // Laravel requirement for form-data PUT
    const response = await api.post(`/companies/${companyId}/virtual-store/payment-methods/${paymentMethodId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deletePaymentMethod: async (companyId: number, paymentMethodId: number) => {
    const response = await api.delete(`/companies/${companyId}/virtual-store/payment-methods/${paymentMethodId}`);
    return response.data;
  },

  togglePaymentMethod: async (companyId: number, paymentMethodId: number) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/payment-methods/${paymentMethodId}/toggle`);
    return response.data;
  },

  reorderPaymentMethods: async (companyId: number, items: { id: number; sort_order: number }[]) => {
    const response = await api.post(`/companies/${companyId}/virtual-store/payment-methods/reorder`, { items });
    return response.data;
  },
};

export default virtualStoreService;
