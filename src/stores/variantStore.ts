import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { AttributeValue } from './attributeStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_BASE = getApiUrl();

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string;
    barcode?: string;
    price?: number;
    cost?: number;
    stock: number;
    image?: string;
    is_active: boolean;
    attribute_values: AttributeValue[];
}

interface VariantState {
    variants: ProductVariant[];
    loading: boolean;
    error: string | null;

    fetchVariants: (productId: string) => Promise<void>;
    createVariant: (productId: string, data: Partial<ProductVariant> & { attribute_value_ids: string[] }) => Promise<ProductVariant>;
    updateVariant: (productId: string, variantId: string, data: Partial<ProductVariant>) => Promise<ProductVariant>;
    deleteVariant: (productId: string, variantId: string) => Promise<void>;
    bulkCreateVariants: (productId: string, variants: Array<Partial<ProductVariant> & { attribute_value_ids: string[] }>) => Promise<ProductVariant[]>;
    clearVariants: () => void;
}

export const useVariantStore = create<VariantState>((set) => ({
    variants: [],
    loading: false,
    error: null,

    fetchVariants: async (productId: string) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) {
            set({ error: 'No company selected' });
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await api.get(`/companies/${currentCompany.id}/products/${productId}/variants`);
            set({ variants: response.data.data, loading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error fetching variants',
                loading: false
            });
        }
    },

    createVariant: async (productId, data) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.post(
            `/companies/${currentCompany.id}/products/${productId}/variants`,
            data
        );
        const newVariant = response.data.data;

        set(state => ({
            variants: [...state.variants, newVariant]
        }));

        return newVariant;
    },

    updateVariant: async (productId, variantId, data) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.put(
            `/companies/${currentCompany.id}/products/${productId}/variants/${variantId}`,
            data
        );
        const updatedVariant = response.data.data;

        set(state => ({
            variants: state.variants.map(v => v.id === variantId ? updatedVariant : v)
        }));

        return updatedVariant;
    },

    deleteVariant: async (productId, variantId) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        await api.delete(
            `/companies/${currentCompany.id}/products/${productId}/variants/${variantId}`
        );

        set(state => ({
            variants: state.variants.filter(v => v.id !== variantId)
        }));
    },

    bulkCreateVariants: async (productId, variants) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.post(
            `/companies/${currentCompany.id}/products/${productId}/variants/bulk`,
            { variants }
        );
        const newVariants = response.data.data;

        set(state => ({
            variants: [...state.variants, ...newVariants]
        }));

        return newVariants;
    },

    clearVariants: () => {
        set({ variants: [], error: null });
    },
}));
