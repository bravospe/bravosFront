import { create } from 'zustand';
import shippingService, {
  ShippingProvider,
  ShippingZone,
  ShippingRate,
  CourierAgency,
  Shipment,
  ShipmentStats,
  CalculatedRate,
} from '../services/shippingService';

interface ShippingState {
  // Providers
  providers: ShippingProvider[];
  isLoadingProviders: boolean;
  
  // Zones
  zones: ShippingZone[];
  isLoadingZones: boolean;
  
  // Rates
  rates: ShippingRate[];
  isLoadingRates: boolean;
  calculatedRates: CalculatedRate[];
  
  // Agencies
  agencies: CourierAgency[];
  isLoadingAgencies: boolean;
  
  // Shipments
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  isLoadingShipments: boolean;
  shipmentStats: ShipmentStats | null;
  shipmentsPagination: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  
  // Error
  error: string | null;
  
  // Actions - Providers
  fetchProviders: (companyId: number) => Promise<void>;
  createProvider: (companyId: number, data: Partial<ShippingProvider> & { credentials?: Record<string, any> }) => Promise<void>;
  updateProvider: (companyId: number, providerId: number, data: Partial<ShippingProvider> & { credentials?: Record<string, any> }) => Promise<void>;
  deleteProvider: (companyId: number, providerId: number) => Promise<void>;
  toggleProvider: (companyId: number, providerId: number) => Promise<void>;
  testProviderConnection: (companyId: number, providerId: number) => Promise<{ success: boolean; message: string }>;
  
  // Actions - Zones
  fetchZones: (companyId: number) => Promise<void>;
  createZone: (companyId: number, data: Partial<ShippingZone>) => Promise<void>;
  updateZone: (companyId: number, zoneId: number, data: Partial<ShippingZone>) => Promise<void>;
  deleteZone: (companyId: number, zoneId: number) => Promise<void>;
  
  // Actions - Rates
  fetchRates: (companyId: number, params?: Record<string, any>) => Promise<void>;
  createRate: (companyId: number, data: Partial<ShippingRate>) => Promise<void>;
  updateRate: (companyId: number, rateId: number, data: Partial<ShippingRate>) => Promise<void>;
  deleteRate: (companyId: number, rateId: number) => Promise<void>;
  calculateRates: (companyId: number, data: { district_id: string; weight?: number; amount: number }) => Promise<void>;
  
  // Actions - Agencies
  fetchAgencies: (companyId: number, params?: Record<string, any>) => Promise<void>;
  createAgency: (companyId: number, data: Partial<CourierAgency>) => Promise<void>;
  updateAgency: (companyId: number, agencyId: number, data: Partial<CourierAgency>) => Promise<void>;
  deleteAgency: (companyId: number, agencyId: number) => Promise<void>;
  
  // Actions - Shipments
  fetchShipments: (companyId: number, params?: Record<string, any>) => Promise<void>;
  fetchShipment: (companyId: number, shipmentId: number) => Promise<void>;
  fetchShipmentStats: (companyId: number) => Promise<void>;
  createShipment: (companyId: number, data: Partial<Shipment>) => Promise<void>;
  updateShipment: (companyId: number, shipmentId: number, data: Partial<Shipment>) => Promise<void>;
  generateLabel: (companyId: number, shipmentId: number) => Promise<{ tracking_number: string }>;
  requestPickup: (companyId: number, shipmentId: number, data: any) => Promise<void>;
  cancelShipment: (companyId: number, shipmentId: number, reason: string) => Promise<void>;
  bulkGenerateLabels: (companyId: number, shipmentIds: number[]) => Promise<any>;
  bulkRequestPickup: (companyId: number, shipmentIds: number[], pickupData: any) => Promise<any>;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  providers: [],
  isLoadingProviders: false,
  zones: [],
  isLoadingZones: false,
  rates: [],
  isLoadingRates: false,
  calculatedRates: [],
  agencies: [],
  isLoadingAgencies: false,
  shipments: [],
  selectedShipment: null,
  isLoadingShipments: false,
  shipmentStats: null,
  shipmentsPagination: { page: 1, perPage: 15, total: 0, lastPage: 1 },
  error: null,
};

export const useShippingStore = create<ShippingState>((set, get) => ({
  ...initialState,

  // Providers
  fetchProviders: async (companyId: number) => {
    set({ isLoadingProviders: true, error: null });
    try {
      const data = await shippingService.getProviders(companyId);
      set({ providers: Array.isArray(data) ? data : [], isLoadingProviders: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingProviders: false });
    }
  },

  createProvider: async (companyId: number, data) => {
    try {
      await shippingService.createProvider(companyId, data);
      await get().fetchProviders(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateProvider: async (companyId: number, providerId: number, data) => {
    try {
      await shippingService.updateProvider(companyId, providerId, data);
      await get().fetchProviders(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteProvider: async (companyId: number, providerId: number) => {
    try {
      await shippingService.deleteProvider(companyId, providerId);
      set({ providers: get().providers.filter(p => p.id !== providerId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleProvider: async (companyId: number, providerId: number) => {
    try {
      const response = await shippingService.toggleProvider(companyId, providerId);
      set({
        providers: get().providers.map(p =>
          p.id === providerId ? { ...p, is_active: response.is_active } : p
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  testProviderConnection: async (companyId: number, providerId: number) => {
    try {
      const result = await shippingService.testProviderConnection(companyId, providerId);
      return result;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // Zones
  fetchZones: async (companyId: number) => {
    set({ isLoadingZones: true, error: null });
    try {
      const data = await shippingService.getZones(companyId);
      set({ zones: Array.isArray(data) ? data : [], isLoadingZones: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingZones: false });
    }
  },

  createZone: async (companyId: number, data) => {
    try {
      await shippingService.createZone(companyId, data);
      await get().fetchZones(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateZone: async (companyId: number, zoneId: number, data) => {
    try {
      await shippingService.updateZone(companyId, zoneId, data);
      await get().fetchZones(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteZone: async (companyId: number, zoneId: number) => {
    try {
      await shippingService.deleteZone(companyId, zoneId);
      set({ zones: get().zones.filter(z => z.id !== zoneId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Rates
  fetchRates: async (companyId: number, params?) => {
    set({ isLoadingRates: true, error: null });
    try {
      const data = await shippingService.getRates(companyId, params);
      set({ rates: Array.isArray(data) ? data : [], isLoadingRates: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingRates: false });
    }
  },

  createRate: async (companyId: number, data) => {
    try {
      await shippingService.createRate(companyId, data);
      await get().fetchRates(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateRate: async (companyId: number, rateId: number, data) => {
    try {
      await shippingService.updateRate(companyId, rateId, data);
      await get().fetchRates(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteRate: async (companyId: number, rateId: number) => {
    try {
      await shippingService.deleteRate(companyId, rateId);
      set({ rates: get().rates.filter(r => r.id !== rateId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  calculateRates: async (companyId: number, data) => {
    set({ isLoadingRates: true, error: null });
    try {
      const result = await shippingService.calculateRates(companyId, data);
      set({ calculatedRates: result.rates, isLoadingRates: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingRates: false });
    }
  },

  // Agencies
  fetchAgencies: async (companyId: number, params?) => {
    set({ isLoadingAgencies: true, error: null });
    try {
      const data = await shippingService.getAgencies(companyId, params);
      set({ agencies: Array.isArray(data) ? data : [], isLoadingAgencies: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingAgencies: false });
    }
  },

  createAgency: async (companyId: number, data) => {
    try {
      await shippingService.createAgency(companyId, data);
      await get().fetchAgencies(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateAgency: async (companyId: number, agencyId: number, data) => {
    try {
      await shippingService.updateAgency(companyId, agencyId, data);
      await get().fetchAgencies(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteAgency: async (companyId: number, agencyId: number) => {
    try {
      await shippingService.deleteAgency(companyId, agencyId);
      set({ agencies: get().agencies.filter(a => a.id !== agencyId) });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Shipments
  fetchShipments: async (companyId: number, params?) => {
    set({ isLoadingShipments: true, error: null });
    try {
      const response = await shippingService.getShipments(companyId, params);
      set({
        shipments: response.data || response,
        shipmentsPagination: response.meta || {
          page: response.current_page || 1,
          perPage: response.per_page || 15,
          total: response.total || 0,
          lastPage: response.last_page || 1,
        },
        isLoadingShipments: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingShipments: false });
    }
  },

  fetchShipment: async (companyId: number, shipmentId: number) => {
    set({ isLoadingShipments: true, error: null });
    try {
      const data = await shippingService.getShipment(companyId, shipmentId);
      set({ selectedShipment: data, isLoadingShipments: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingShipments: false });
    }
  },

  fetchShipmentStats: async (companyId: number) => {
    try {
      const data = await shippingService.getShipmentStats(companyId);
      set({ shipmentStats: data?.summary || null });
    } catch (error: any) {
      set({ error: error.message, shipmentStats: null });
    }
  },

  createShipment: async (companyId: number, data) => {
    try {
      await shippingService.createShipment(companyId, data);
      await get().fetchShipments(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateShipment: async (companyId: number, shipmentId: number, data) => {
    try {
      await shippingService.updateShipment(companyId, shipmentId, data);
      await get().fetchShipments(companyId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  generateLabel: async (companyId: number, shipmentId: number) => {
    try {
      const result = await shippingService.generateLabel(companyId, shipmentId);
      set({
        shipments: get().shipments.map(s =>
          s.id === shipmentId
            ? { ...s, status: 'label_generated', external_tracking: result.tracking_number }
            : s
        ),
      });
      return result;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  requestPickup: async (companyId: number, shipmentId: number, data) => {
    try {
      await shippingService.requestPickup(companyId, shipmentId, data);
      set({
        shipments: get().shipments.map(s =>
          s.id === shipmentId ? { ...s, status: 'pickup_scheduled' } : s
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  cancelShipment: async (companyId: number, shipmentId: number, reason: string) => {
    try {
      await shippingService.cancelShipment(companyId, shipmentId, reason);
      set({
        shipments: get().shipments.map(s =>
          s.id === shipmentId ? { ...s, status: 'cancelled' } : s
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  bulkGenerateLabels: async (companyId: number, shipmentIds: number[]) => {
    try {
      const result = await shippingService.bulkGenerateLabels(companyId, shipmentIds);
      await get().fetchShipments(companyId);
      return result;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  bulkRequestPickup: async (companyId: number, shipmentIds: number[], pickupData) => {
    try {
      const result = await shippingService.bulkRequestPickup(companyId, shipmentIds, pickupData);
      await get().fetchShipments(companyId);
      return result;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Utils
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
