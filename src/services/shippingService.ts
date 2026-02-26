import api from '../lib/api';

export interface ShippingProvider {
  id: number;
  company_id: number;
  code: string;
  name: string;
  type: 'courier' | 'pickup' | 'delivery' | 'manual';
  has_credentials: boolean;
  configured_credentials?: string[];
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface ShippingZone {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  type: 'department' | 'province' | 'district' | 'custom';
  is_active: boolean;
  districts?: Array<{ ubigeo: string; name: string }>;
  rates?: ShippingRate[];
}

export interface ShippingRate {
  id: number;
  shipping_zone_id: number;
  shipping_provider_id: number;
  name: string;
  description?: string;
  min_weight?: number;
  max_weight?: number;
  min_amount?: number;
  max_amount?: number;
  price: number;
  free_shipping_threshold?: number;
  estimated_days_min?: number;
  estimated_days_max?: number;
  is_active: boolean;
  zone?: ShippingZone;
  provider?: ShippingProvider;
}

export interface CourierAgency {
  id: number;
  shipping_provider_id: number;
  name: string;
  code?: string;
  address: string;
  district_id: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  schedule?: Record<string, any>;
  is_pickup_point: boolean;
  is_delivery_point: boolean;
  is_active: boolean;
  provider?: ShippingProvider;
  district?: { ubigeo: string; name: string };
}

export interface Shipment {
  id: number;
  company_id: number;
  store_order_id: number;
  shipping_provider_id: number;
  shipping_rate_id?: number;
  tracking_number: string;
  external_tracking?: string;
  status: 'pending' | 'label_generated' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled';
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  delivery_address: string;
  delivery_district_id: string;
  delivery_reference?: string;
  delivery_notes?: string;
  package_weight?: number;
  package_length?: number;
  package_width?: number;
  package_height?: number;
  declared_value?: number;
  shipping_cost: number;
  insurance_cost?: number;
  is_cod: boolean;
  cod_amount?: number;
  label_url?: string;
  label_generated_at?: string;
  pickup_scheduled_at?: string;
  estimated_delivery_date?: string;
  delivered_at?: string;
  tracking_events?: Array<{
    date: string;
    status: string;
    description: string;
    location?: string;
  }>;
  provider?: ShippingProvider;
  order?: any;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStats {
  total: number;
  pending: number;
  label_generated: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
  returned: number;
}

export interface CalculatedRate {
  rate_id: number;
  zone_id: number;
  zone_name: string;
  provider_id: number;
  provider_name: string;
  provider_code: string;
  rate_name: string;
  base_price: number;
  final_price: number;
  is_free_shipping: boolean;
  estimated_days_min?: number;
  estimated_days_max?: number;
}

const shippingService = {
  // Providers
  getProviders: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/providers`);
    return response.data;
  },

  getProvider: async (companyId: number, providerId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/providers/${providerId}`);
    return response.data;
  },

  createProvider: async (companyId: number, data: Partial<ShippingProvider> & { credentials?: Record<string, any> }) => {
    const response = await api.post(`/companies/${companyId}/shipping/providers`, data);
    return response.data;
  },

  updateProvider: async (companyId: number, providerId: number, data: Partial<ShippingProvider> & { credentials?: Record<string, any> }) => {
    const response = await api.put(`/companies/${companyId}/shipping/providers/${providerId}`, data);
    return response.data;
  },

  deleteProvider: async (companyId: number, providerId: number) => {
    const response = await api.delete(`/companies/${companyId}/shipping/providers/${providerId}`);
    return response.data;
  },

  toggleProvider: async (companyId: number, providerId: number) => {
    const response = await api.post(`/companies/${companyId}/shipping/providers/${providerId}/toggle`);
    return response.data;
  },

  testProviderConnection: async (companyId: number, providerId: number) => {
    const response = await api.post(`/companies/${companyId}/shipping/providers/${providerId}/test-connection`);
    return response.data;
  },

  // Zones
  getZones: async (companyId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/zones`);
    return response.data;
  },

  getZone: async (companyId: number, zoneId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/zones/${zoneId}`);
    return response.data;
  },

  createZone: async (companyId: number, data: Partial<ShippingZone>) => {
    const response = await api.post(`/companies/${companyId}/shipping/zones`, data);
    return response.data;
  },

  updateZone: async (companyId: number, zoneId: number, data: Partial<ShippingZone>) => {
    const response = await api.put(`/companies/${companyId}/shipping/zones/${zoneId}`, data);
    return response.data;
  },

  deleteZone: async (companyId: number, zoneId: number) => {
    const response = await api.delete(`/companies/${companyId}/shipping/zones/${zoneId}`);
    return response.data;
  },

  syncZoneDistricts: async (companyId: number, zoneId: number, districtIds: string[]) => {
    const response = await api.post(`/companies/${companyId}/shipping/zones/${zoneId}/districts`, { district_ids: districtIds });
    return response.data;
  },

  // Rates
  getRates: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/shipping/rates`, { params });
    return response.data;
  },

  getRate: async (companyId: number, rateId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/rates/${rateId}`);
    return response.data;
  },

  createRate: async (companyId: number, data: Partial<ShippingRate>) => {
    const response = await api.post(`/companies/${companyId}/shipping/rates`, data);
    return response.data;
  },

  updateRate: async (companyId: number, rateId: number, data: Partial<ShippingRate>) => {
    const response = await api.put(`/companies/${companyId}/shipping/rates/${rateId}`, data);
    return response.data;
  },

  deleteRate: async (companyId: number, rateId: number) => {
    const response = await api.delete(`/companies/${companyId}/shipping/rates/${rateId}`);
    return response.data;
  },

  calculateRates: async (companyId: number, data: { district_id: string; weight?: number; amount: number }): Promise<{ rates: CalculatedRate[]; count: number }> => {
    const response = await api.post(`/companies/${companyId}/shipping/rates/calculate`, data);
    return response.data;
  },

  // Agencies
  getAgencies: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/shipping/agencies`, { params });
    return response.data;
  },

  getAgency: async (companyId: number, agencyId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/agencies/${agencyId}`);
    return response.data;
  },

  createAgency: async (companyId: number, data: Partial<CourierAgency>) => {
    const response = await api.post(`/companies/${companyId}/shipping/agencies`, data);
    return response.data;
  },

  updateAgency: async (companyId: number, agencyId: number, data: Partial<CourierAgency>) => {
    const response = await api.put(`/companies/${companyId}/shipping/agencies/${agencyId}`, data);
    return response.data;
  },

  deleteAgency: async (companyId: number, agencyId: number) => {
    const response = await api.delete(`/companies/${companyId}/shipping/agencies/${agencyId}`);
    return response.data;
  },

  getAgenciesByProvider: async (companyId: number, providerId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/agencies/by-provider/${providerId}`);
    return response.data;
  },

  getAgenciesByDistrict: async (companyId: number, districtId: string) => {
    const response = await api.get(`/companies/${companyId}/shipping/agencies/by-district/${districtId}`);
    return response.data;
  },

  // Shipments
  getShipments: async (companyId: number, params?: Record<string, any>) => {
    const response = await api.get(`/companies/${companyId}/shipping/shipments`, { params });
    return response.data;
  },

  getShipment: async (companyId: number, shipmentId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/shipments/${shipmentId}`);
    return response.data;
  },

  getShipmentStats: async (companyId: number): Promise<{ summary: ShipmentStats; by_provider: any }> => {
    const response = await api.get(`/companies/${companyId}/shipping/shipments/stats`);
    return response.data;
  },

  createShipment: async (companyId: number, data: Partial<Shipment>) => {
    const response = await api.post(`/companies/${companyId}/shipping/shipments`, data);
    return response.data;
  },

  updateShipment: async (companyId: number, shipmentId: number, data: Partial<Shipment>) => {
    const response = await api.put(`/companies/${companyId}/shipping/shipments/${shipmentId}`, data);
    return response.data;
  },

  deleteShipment: async (companyId: number, shipmentId: number) => {
    const response = await api.delete(`/companies/${companyId}/shipping/shipments/${shipmentId}`);
    return response.data;
  },

  generateLabel: async (companyId: number, shipmentId: number) => {
    const response = await api.post(`/companies/${companyId}/shipping/shipments/${shipmentId}/generate-label`);
    return response.data;
  },

  getTracking: async (companyId: number, shipmentId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/shipments/${shipmentId}/tracking`);
    return response.data;
  },

  requestPickup: async (companyId: number, shipmentId: number, data: { pickup_date: string; pickup_time_from: string; pickup_time_to: string; pickup_address?: string; pickup_notes?: string }) => {
    const response = await api.post(`/companies/${companyId}/shipping/shipments/${shipmentId}/request-pickup`, data);
    return response.data;
  },

  cancelShipment: async (companyId: number, shipmentId: number, reason: string) => {
    const response = await api.post(`/companies/${companyId}/shipping/shipments/${shipmentId}/cancel`, { reason });
    return response.data;
  },

  downloadLabel: async (companyId: number, shipmentId: number) => {
    const response = await api.get(`/companies/${companyId}/shipping/shipments/${shipmentId}/label-pdf`);
    return response.data;
  },

  // Bulk operations
  bulkGenerateLabels: async (companyId: number, shipmentIds: number[]) => {
    const response = await api.post(`/companies/${companyId}/shipping/bulk/generate-labels`, { shipment_ids: shipmentIds });
    return response.data;
  },

  bulkRequestPickup: async (companyId: number, shipmentIds: number[], pickupData: { pickup_date: string; pickup_time_from: string; pickup_time_to: string }) => {
    const response = await api.post(`/companies/${companyId}/shipping/bulk/request-pickup`, {
      shipment_ids: shipmentIds,
      ...pickupData,
    });
    return response.data;
  },
};

export default shippingService;
