import { create } from 'zustand';
import axios from 'axios';
import { ClientCategory, PaginatedResponse } from '../types';
export type { ClientCategory };
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

interface ClientCategoryState {
    categories: ClientCategory[];
    isLoading: boolean;
    error: string | null;
    meta: PaginatedResponse<ClientCategory>['meta'] | null;

    fetchCategories: (params?: { page?: number; per_page?: number; search?: string; company_id?: string; active_only?: boolean }) => Promise<void>;
    getCategory: (id: string) => Promise<ClientCategory>;
    createCategory: (data: FormData | Partial<ClientCategory>) => Promise<ClientCategory>;
    updateCategory: (id: string, data: FormData | Partial<ClientCategory>) => Promise<ClientCategory>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useClientCategoryStore = create<ClientCategoryState>((set) => ({
    categories: [],
    isLoading: false,
    error: null,
    meta: null,

    fetchCategories: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = params?.company_id || user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const response = await axios.get<PaginatedResponse<ClientCategory>>(`${API_URL}/companies/${companyId}/client-categories`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 10,
                    search: params?.search,
                    active_only: params?.active_only
                },
            });

            // Handle generic response which might be array or paginated
            const responseData = response.data as any;
            
            let categories = [];
            let meta = null;

            if (Array.isArray(responseData)) {
                categories = responseData;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                categories = responseData.data;
                meta = responseData.meta;
            }

            set({
                categories: categories,
                meta: meta,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar categorías de clientes',
                isLoading: false,
            });
        }
    },

    getCategory: async (id) => {
        const { user, token } = useAuthStore.getState();
        if (!token || !user) throw new Error('No authenticated');

        const companyId = user.current_company_id || user.companies?.[0]?.id;
        if (!companyId) throw new Error('No company selected');

        const response = await axios.get<ClientCategory>(`${API_URL}/companies/${companyId}/client-categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    createCategory: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            // Determine if data is FormData or object and set headers accordingly
            const isFormData = data instanceof FormData;
            const headers: any = { Authorization: `Bearer ${token}` };
            if (isFormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const response = await axios.post<ClientCategory>(`${API_URL}/companies/${companyId}/client-categories`, data, {
                headers: headers,
            });

            set((state) => ({
                categories: [response.data, ...state.categories],
                isLoading: false,
            }));

            return response.data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear categoría',
                isLoading: false
            });
            throw error;
        }
    },

    updateCategory: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const isFormData = data instanceof FormData;
            const headers: any = { Authorization: `Bearer ${token}` };
            let url = `${API_URL}/companies/${companyId}/client-categories/${id}`;
            let method = 'put';

            if (isFormData) {
                headers['Content-Type'] = 'multipart/form-data';
                data.append('_method', 'PUT');
                method = 'post';
            }

            // Type assertion for axios method due to string index
            const response = await (axios as any)[method](url, data, {
                headers: headers,
            });

            set((state) => ({
                categories: state.categories.map(c => c.id === id ? response.data : c),
                isLoading: false,
            }));

            return response.data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar categoría',
                isLoading: false
            });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            await axios.delete(`${API_URL}/companies/${companyId}/client-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                categories: state.categories.filter((c) => c.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar categoría',
                isLoading: false
            });
            throw error;
        }
    }
}));
