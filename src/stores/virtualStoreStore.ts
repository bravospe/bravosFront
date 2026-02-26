import { create } from 'zustand';
import virtualStoreService, {
  VirtualStore,
  StoreTheme,
  StoreBanner,
  StorePromotion,
  StoreOrder,
  StoreCustomer,
} from '../services/virtualStoreService';

interface VirtualStoreState {
  // Store settings
  settings: VirtualStore | null;
  themes: StoreTheme[];
  isLoadingSettings: boolean;
  
  // Banners
  banners: StoreBanner[];
  isLoadingBanners: boolean;
  
  // Promotions
  promotions: StorePromotion[];
  isLoadingPromotions: boolean;
  promotionsPagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  
  // Orders
  orders: StoreOrder[];
  selectedOrder: StoreOrder | null;
  isLoadingOrders: boolean;
  orderStats: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    total_revenue: number;
  } | null;
  ordersPagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  
  // Customers
  customers: StoreCustomer[];
  selectedCustomer: StoreCustomer | null;
  isLoadingCustomers: boolean;
  customersPagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  
  // Dashboard
  dashboardData: any;
  isLoadingDashboard: boolean;
  
  // Error
  error: string | null;
  
  // Actions - Settings
  fetchSettings: (companyId: number) => Promise<void>;
  updateSettings: (companyId: number, data: Partial<VirtualStore>) => Promise<void>;
  fetchThemes: (companyId: number) => Promise<void>;
  applyTheme: (companyId: number, themeId: number) => Promise<void>;
  
  // Actions - Banners
  fetchBanners: (companyId: number) => Promise<void>;
  createBanner: (companyId: number, data: Partial<StoreBanner>) => Promise<void>;
  updateBanner: (companyId: number, bannerId: number, data: Partial<StoreBanner>) => Promise<void>;
  deleteBanner: (companyId: number, bannerId: number) => Promise<void>;
  reorderBanners: (companyId: number, bannerIds: number[]) => Promise<void>;
  toggleBanner: (companyId: number, bannerId: number) => Promise<void>;
  
  // Actions - Promotions
  fetchPromotions: (companyId: number, params?: Record<string, any>) => Promise<void>;
  createPromotion: (companyId: number, data: Partial<StorePromotion>) => Promise<void>;
  updatePromotion: (companyId: number, promotionId: number, data: Partial<StorePromotion>) => Promise<void>;
  deletePromotion: (companyId: number, promotionId: number) => Promise<void>;
  togglePromotion: (companyId: number, promotionId: number) => Promise<void>;
  
  // Actions - Orders
  fetchOrders: (companyId: number, params?: Record<string, any>) => Promise<void>;
  fetchOrder: (companyId: number, orderId: number) => Promise<void>;
  fetchOrderStats: (companyId: number) => Promise<void>;
  updateOrderStatus: (companyId: number, orderId: number, status: string) => Promise<void>;
  confirmOrder: (companyId: number, orderId: number) => Promise<void>;
  cancelOrder: (companyId: number, orderId: number, reason: string) => Promise<void>;
  
  // Actions - Customers
  fetchCustomers: (companyId: number, params?: Record<string, any>) => Promise<void>;
  fetchCustomer: (companyId: number, customerId: number) => Promise<void>;
  
  // Actions - Dashboard
  fetchDashboard: (companyId: number) => Promise<void>;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  settings: null,
  themes: [],
  isLoadingSettings: false,
  banners: [],
  isLoadingBanners: false,
  promotions: [],
  isLoadingPromotions: false,
  promotionsPagination: { page: 1, perPage: 15, total: 0, lastPage: 1 },
  orders: [],
  selectedOrder: null,
  isLoadingOrders: false,
  orderStats: null,
  ordersPagination: { page: 1, perPage: 15, total: 0, lastPage: 1 },
  customers: [],
  selectedCustomer: null,
  isLoadingCustomers: false,
  customersPagination: { page: 1, perPage: 15, total: 0, lastPage: 1 },
  dashboardData: null,
  isLoadingDashboard: false,
  error: null,
};

export const useVirtualStoreStore = create<VirtualStoreState>((set, get) => ({
  ...initialState,

  // Settings
  fetchSettings: async (companyId: number) => {
    set({ isLoadingSettings: true });
    try {
      const response = await virtualStoreService.getSettings(companyId);
      
      if (!response) {
        throw new Error('No se pudo obtener la configuración de la tienda');
      }

      // Backend returns { data: {...} } or just {...}
      const storeData = response.data || response;
      
      if (storeData) {
        // Map slug to subdomain for compatibility if needed, or use slug
        if (!storeData.subdomain && storeData.slug) {
            storeData.subdomain = storeData.slug;
        }
      }
      
      set({ settings: storeData });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      set({ error: error.message || 'Error al cargar la configuración', settings: null });
    } finally {
      set({ isLoadingSettings: false });
    }
  },

  updateSettings: async (companyId: number, data: Partial<VirtualStore>) => {
    // No ponemos isLoadingSettings en true para evitar desmontar o parpadear el formulario
    set({ error: null });
    try {
      const response = await virtualStoreService.updateSettings(companyId, data);
      
      // Mapeamos el slug al subdomain si es necesario
      const storeData = response.data || response.store || response;
      if (storeData && !storeData.subdomain && storeData.slug) {
          storeData.subdomain = storeData.slug;
      }

      set({ settings: storeData });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchThemes: async (companyId: number) => {
    try {
      const data = await virtualStoreService.getThemes(companyId);
      // Backend returns { data: [...] } usually
      set({ themes: Array.isArray(data) ? data : data.data || data.themes || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  applyTheme: async (companyId: number, themeId: number) => {
    try {
      await virtualStoreService.applyTheme(companyId, themeId);
      await get().fetchSettings(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Banners
  fetchBanners: async (companyId: number) => {
    set({ isLoadingBanners: true, error: null });
    try {
      const data = await virtualStoreService.getBanners(companyId);
      set({ 
        banners: Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []), 
        isLoadingBanners: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingBanners: false, banners: [] });
    }
  },

  createBanner: async (companyId: number, data: Partial<StoreBanner>) => {
    try {
      await virtualStoreService.createBanner(companyId, data);
      await get().fetchBanners(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateBanner: async (companyId: number, bannerId: number, data: Partial<StoreBanner>) => {
    try {
      await virtualStoreService.updateBanner(companyId, bannerId, data);
      await get().fetchBanners(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteBanner: async (companyId: number, bannerId: number) => {
    try {
      await virtualStoreService.deleteBanner(companyId, bannerId);
      set({ banners: get().banners.filter(b => b.id !== bannerId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reorderBanners: async (companyId: number, bannerIds: number[]) => {
    try {
      await virtualStoreService.reorderBanners(companyId, bannerIds);
      await get().fetchBanners(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleBanner: async (companyId: number, bannerId: number) => {
    try {
      await virtualStoreService.toggleBanner(companyId, bannerId);
      set({
        banners: get().banners.map(b =>
          b.id === bannerId ? { ...b, is_active: !b.is_active } : b
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Promotions
  fetchPromotions: async (companyId: number, params?: Record<string, any>) => {
    set({ isLoadingPromotions: true, error: null });
    try {
      const response = await virtualStoreService.getPromotions(companyId, params);
      set({
        promotions: Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []),
        promotionsPagination: response?.meta || {
          page: response?.current_page || 1,
          perPage: response?.per_page || 15,
          total: response?.total || 0,
          lastPage: response?.last_page || 1,
        },
        isLoadingPromotions: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingPromotions: false, promotions: [] });
    }
  },

  createPromotion: async (companyId: number, data: Partial<StorePromotion>) => {
    try {
      await virtualStoreService.createPromotion(companyId, data);
      await get().fetchPromotions(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updatePromotion: async (companyId: number, promotionId: number, data: Partial<StorePromotion>) => {
    try {
      await virtualStoreService.updatePromotion(companyId, promotionId, data);
      await get().fetchPromotions(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePromotion: async (companyId: number, promotionId: number) => {
    try {
      await virtualStoreService.deletePromotion(companyId, promotionId);
      set({ promotions: get().promotions.filter(p => p.id !== promotionId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  togglePromotion: async (companyId: number, promotionId: number) => {
    try {
      await virtualStoreService.togglePromotion(companyId, promotionId);
      set({
        promotions: get().promotions.map(p =>
          p.id === promotionId ? { ...p, is_active: !p.is_active } : p
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Orders
  fetchOrders: async (companyId: number, params?: Record<string, any>) => {
    set({ isLoadingOrders: true, error: null });
    try {
      const response = await virtualStoreService.getOrders(companyId, params);
      set({
        orders: Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []),
        ordersPagination: response?.meta || {
          page: response?.current_page || 1,
          perPage: response?.per_page || 15,
          total: response?.total || 0,
          lastPage: response?.last_page || 1,
        },
        isLoadingOrders: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingOrders: false, orders: [] });
    }
  },

  fetchOrder: async (companyId: number, orderId: number) => {
    set({ isLoadingOrders: true, error: null });
    try {
      const data = await virtualStoreService.getOrder(companyId, orderId);
      set({ selectedOrder: data, isLoadingOrders: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingOrders: false });
    }
  },

  fetchOrderStats: async (companyId: number) => {
    try {
      const data = await virtualStoreService.getOrderStats(companyId);
      set({ orderStats: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateOrderStatus: async (companyId: number, orderId: number, status: string) => {
    try {
      await virtualStoreService.updateOrderStatus(companyId, orderId, status);
      set({
        orders: get().orders.map(o =>
          o.id === orderId ? { ...o, status: status as any } : o
        ),
        selectedOrder: get().selectedOrder?.id === orderId
          ? { ...get().selectedOrder!, status: status as any }
          : get().selectedOrder,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  confirmOrder: async (companyId: number, orderId: number) => {
    try {
      await virtualStoreService.confirmOrder(companyId, orderId);
      await get().fetchOrder(companyId, orderId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  cancelOrder: async (companyId: number, orderId: number, reason: string) => {
    try {
      await virtualStoreService.cancelOrder(companyId, orderId, reason);
      await get().fetchOrder(companyId, orderId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Customers
  fetchCustomers: async (companyId: number, params?: Record<string, any>) => {
    set({ isLoadingCustomers: true, error: null });
    try {
      const response = await virtualStoreService.getCustomers(companyId, params);
      set({
        customers: Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []),
        customersPagination: response?.meta || {
          page: response?.current_page || 1,
          perPage: response?.per_page || 15,
          total: response?.total || 0,
          lastPage: response?.last_page || 1,
        },
        isLoadingCustomers: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingCustomers: false, customers: [] });
    }
  },

  fetchCustomer: async (companyId: number, customerId: number) => {
    set({ isLoadingCustomers: true, error: null });
    try {
      const data = await virtualStoreService.getCustomer(companyId, customerId);
      set({ selectedCustomer: data, isLoadingCustomers: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingCustomers: false });
    }
  },

  // Dashboard
  fetchDashboard: async (companyId: number) => {
    set({ isLoadingDashboard: true, error: null });
    try {
      const data = await virtualStoreService.getDashboard(companyId);
      set({ dashboardData: data, isLoadingDashboard: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingDashboard: false });
    }
  },

  // Utils
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
