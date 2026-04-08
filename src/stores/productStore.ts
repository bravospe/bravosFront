import { create } from 'zustand';
import axios from 'axios';
import { Product, PaginatedResponse } from '../types';
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    meta: PaginatedResponse<Product>['meta'] | null;
    stats: { total_products: number; active_products: number; low_stock: number; out_of_stock: number } | null;

    fetchProducts: (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        category_id?: string;
        brand_id?: string;
        type?: 'product' | 'service';
        tax_type?: string;
        stock_status?: 'available' | 'low' | 'out';
        price_min?: number;
        price_max?: number;
        is_active?: boolean;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        company_id?: string;
    }) => Promise<void>;
    fetchStats: () => Promise<void>;
    getProduct: (id: string) => Promise<Product>;
    createProduct: (data: Partial<Product> | FormData) => Promise<Product>;
    updateProduct: (id: string, data: Partial<Product> | FormData) => Promise<Product>;
    deleteProduct: (id: string) => Promise<void>;
}

/** Resuelve el company_id desde el authStore con todos los fallbacks disponibles */
function resolveCompanyId(params?: { company_id?: string }): string | undefined {
    const { user, currentCompany } = useAuthStore.getState();
    return (
        params?.company_id ||
        currentCompany?.id ||
        user?.current_company_id ||
        user?.companies?.[0]?.id
    );
}

export const useProductStore = create<ProductState>((set) => ({
    products: [],
    isLoading: false,
    error: null,
    meta: null,

    fetchProducts: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = resolveCompanyId(params);
            if (!companyId) {
                throw new Error('No company selected');
            }

            const response = await axios.get<PaginatedResponse<Product>>(`${API_URL}/companies/${companyId}/products`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 15,
                    search: params?.search || undefined,
                    category_id: params?.category_id || undefined,
                    brand_id: params?.brand_id || undefined,
                    type: params?.type || undefined,
                    tax_type: params?.tax_type || undefined,
                    stock_status: params?.stock_status || undefined,
                    price_min: params?.price_min ?? undefined,
                    price_max: params?.price_max ?? undefined,
                    is_active: params?.is_active ?? undefined,
                    sort_by: params?.sort_by || undefined,
                    sort_order: params?.sort_order || undefined,
                },
            });

            set({
                products: response.data.data,
                meta: response.data.meta,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar productos',
                isLoading: false,
            });
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = resolveCompanyId();
            if (!companyId) throw new Error('No company selected');

            await axios.delete(`${API_URL}/companies/${companyId}/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                products: state.products.filter((p) => p.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar producto',
                isLoading: false
            });
            throw error;
        }
    },

    stats: null,
    fetchStats: async () => {
        try {
            const { token, user } = useAuthStore.getState();
            if (!token || !user) return;

            const companyId = resolveCompanyId();
            if (!companyId) return;

            const response = await axios.get(`${API_URL}/companies/${companyId}/inventory/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set({ stats: response.data });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    },

    getProduct: async (id) => {
        const { token, user } = useAuthStore.getState();
        if (!token || !user) throw new Error('No authenticated');

        const companyId = resolveCompanyId();
        if (!companyId) throw new Error('No company selected');

        const response = await axios.get<Product>(`${API_URL}/companies/${companyId}/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return (response.data as any).data;
    },

    createProduct: async (data: Partial<Product> | FormData) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = resolveCompanyId();
            if (!companyId) throw new Error('No company selected');

            const headers: any = { Authorization: `Bearer ${token}` };
            if (data instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const response = await axios.post<Product>(`${API_URL}/companies/${companyId}/products`, data, {
                headers,
            });

            set((state) => ({
                products: [(response.data as any).data, ...state.products],
                isLoading: false,
            }));

            return (response.data as any).data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear producto',
                isLoading: false
            });
            throw error;
        }
    },

    updateProduct: async (id: string, data: Partial<Product> | FormData) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = resolveCompanyId();
            if (!companyId) throw new Error('No company selected');

            const headers: any = { Authorization: `Bearer ${token}` };
            if (data instanceof FormData) {
                headers['Content-Type'] = 'multipart/form-data';
                data.append('_method', 'PUT');
                const response = await axios.post<Product>(`${API_URL}/companies/${companyId}/products/${id}`, data, {
                    headers,
                });

                set((state) => ({
                    products: state.products.map(p => p.id === id ? (response.data as any).data : p),
                    isLoading: false,
                }));
                return (response.data as any).data;
            } else {
                const response = await axios.put<Product>(`${API_URL}/companies/${companyId}/products/${id}`, data, {
                    headers,
                });
                set((state) => ({
                    products: state.products.map(p => p.id === id ? (response.data as any).data : p),
                    isLoading: false,
                }));
                return (response.data as any).data;
            }
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar producto',
                isLoading: false
            });
            throw error;
        }
    }
}));
