import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface Brand {
    id: string;
    company_id: string;
    name: string;
    slug: string;
    image?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface BrandState {
    brands: Brand[];
    isLoading: boolean;
    error: string | null;

    fetchBrands: (companyId?: string) => Promise<void>;
    createBrand: (data: FormData | Partial<Brand>) => Promise<Brand>;
    updateBrand: (id: string, data: FormData | Partial<Brand>) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, _get) => ({
    brands: [],
    isLoading: false,
    error: null,

    fetchBrands: async (companyId) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');

            const targetCompanyId = companyId || currentCompany?.id;
            if (!targetCompanyId) throw new Error('No company selected');

            const response = await axios.get(`${API_URL}/companies/${targetCompanyId}/brands`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { per_page: 100 }
            });

            // Handle unwrapping if necessary, similar to category/product
            const brandsData = response.data.data ? response.data.data : response.data;
            set({ brands: brandsData, isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al cargar marcas', isLoading: false });
        }
    },

    createBrand: async (data: FormData | Partial<Brand>) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            const response = await axios.post(`${API_URL}/companies/${currentCompany.id}/brands`, data, {
                headers: { Authorization: `Bearer ${token}` } // FormData headers are handled automatically by axios
            });

            const newBrand = response.data.data || response.data;
            set(state => ({
                brands: [newBrand, ...state.brands], // Add to beginning
                isLoading: false
            }));
            return newBrand;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al crear marca', isLoading: false });
            throw error;
        }
    },

    updateBrand: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            // Put requests with FormData usually need a trick in Laravel (_method=PUT) if using FormData
            // If it's simple JSON, just PUT.
            // If data is FormData, we should use POST with _method=PUT check

            let response;
            if (data instanceof FormData) {
                data.append('_method', 'PUT');
                response = await axios.post(`${API_URL}/companies/${currentCompany.id}/brands/${id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                response = await axios.put(`${API_URL}/companies/${currentCompany.id}/brands/${id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            const updatedBrand = response.data.data || response.data;
            set(state => ({
                brands: state.brands.map(b => b.id === id ? updatedBrand : b),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al actualizar marca', isLoading: false });
            throw error;
        }
    },

    deleteBrand: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            await axios.delete(`${API_URL}/companies/${currentCompany.id}/brands/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set(state => ({
                brands: state.brands.filter(b => b.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al eliminar marca', isLoading: false });
            throw error;
        }
    }
}));
