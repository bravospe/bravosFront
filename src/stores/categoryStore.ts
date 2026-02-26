
import { create } from 'zustand';
import axios from 'axios';
import { Category } from '../types';
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;

    fetchCategories: (companyId?: string) => Promise<void>;
    createCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
    updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, _get) => ({
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async (companyId) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');

            const targetCompanyId = companyId || currentCompany?.id;
            if (!targetCompanyId) throw new Error('No company selected');

            const response = await axios.get(`${API_URL}/companies/${targetCompanyId}/categories`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { per_page: 100 }
            });

            const categoriesData = response.data.data ? response.data.data : response.data;
            set({ categories: categoriesData, isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al cargar categorías', isLoading: false });
        }
    },

    createCategory: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            const response = await axios.post(`${API_URL}/companies/${currentCompany.id}/categories`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newCategory = response.data.data || response.data;
            set(state => ({
                categories: [...state.categories, newCategory],
                isLoading: false
            }));
            return newCategory;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al crear categoría', isLoading: false });
            throw error;
        }
    },

    updateCategory: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            const response = await axios.put(`${API_URL}/companies/${currentCompany.id}/categories/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedCategory = response.data.data || response.data;
            set(state => ({
                categories: state.categories.map(c => c.id === id ? updatedCategory : c),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al actualizar categoría', isLoading: false });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { currentCompany, token } = useAuthStore.getState();
            if (!token) throw new Error('No authenticated');
            if (!currentCompany) throw new Error('No company selected');

            await axios.delete(`${API_URL}/companies/${currentCompany.id}/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            set(state => ({
                categories: state.categories.filter(c => c.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Error al eliminar categoría', isLoading: false });
            throw error;
        }
    }
}));
