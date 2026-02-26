import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_BASE = getApiUrl();

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface AttributeValue {
    id: string;
    attribute_id: string;
    value: string;
    color_code?: string;
    sort_order: number;
}

export interface Attribute {
    id: string;
    company_id: string;
    name: string;
    slug: string;
    type: 'text' | 'color' | 'number';
    is_active: boolean;
    sort_order: number;
    values: AttributeValue[];
}

interface AttributeState {
    attributes: Attribute[];
    loading: boolean;
    error: string | null;

    fetchAttributes: () => Promise<void>;
    getAttributeById: (id: string) => Attribute | undefined;
    createAttribute: (data: { name: string; type: string; values?: Array<{ value: string; color_code?: string; sort_order?: number }> }) => Promise<Attribute>;
    updateAttribute: (id: string, data: Partial<Attribute>) => Promise<Attribute>;
    deleteAttribute: (id: string) => Promise<void>;
    addAttributeValue: (attributeId: string, data: Partial<AttributeValue>) => Promise<AttributeValue>;
    updateAttributeValue: (attributeId: string, valueId: string, data: Partial<AttributeValue>) => Promise<AttributeValue>;
    deleteAttributeValue: (attributeId: string, valueId: string) => Promise<void>;
}

export const useAttributeStore = create<AttributeState>((set, get) => ({
    attributes: [],
    loading: false,
    error: null,

    fetchAttributes: async () => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) {
            set({ error: 'No company selected' });
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await api.get(`/companies/${currentCompany.id}/attributes`);
            set({ attributes: response.data.data, loading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error fetching attributes',
                loading: false
            });
        }
    },

    getAttributeById: (id: string) => {
        return get().attributes.find(a => a.id === id);
    },

    createAttribute: async (data) => {
        const authStore = useAuthStore.getState();
        let currentCompany = authStore.currentCompany;

        // Fallback: Try to recover company from user if missing
        if (!currentCompany && authStore.user) {
            const user = authStore.user;
            const companyFromUser = (user as any).currentCompany || (user as any).current_company || (user as any).companies?.[0];

            if (companyFromUser) {
                console.log('[AttributeStore] Recovered company from user object:', companyFromUser);
                authStore.setCurrentCompany(companyFromUser);
                currentCompany = companyFromUser;
            }
        }

        console.log('[AttributeStore] Creating attribute, currentCompany:', currentCompany);
        console.log('[AttributeStore] Creating attribute, data:', data);

        if (!currentCompany) {
            console.error('[AttributeStore] No company selected! User state:', authStore.user);
            throw new Error('No company selected. Please log out and back in.');
        }

        try {
            const url = `/companies/${currentCompany.id}/attributes`;
            console.log('[AttributeStore] POST to:', url);
            const response = await api.post(url, data);
            console.log('[AttributeStore] Response:', response.data);
            const newAttribute = response.data.data;

            set(state => ({
                attributes: [...state.attributes, newAttribute]
            }));

            return newAttribute;
        } catch (error: any) {
            console.error('[AttributeStore] Error creating attribute:', error.response?.data || error.message);
            throw error;
        }
    },

    updateAttribute: async (id, data) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.put(`/companies/${currentCompany.id}/attributes/${id}`, data);
        const updatedAttribute = response.data.data;

        set(state => ({
            attributes: state.attributes.map(a => a.id === id ? updatedAttribute : a)
        }));

        return updatedAttribute;
    },

    deleteAttribute: async (id) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        await api.delete(`/companies/${currentCompany.id}/attributes/${id}`);

        set(state => ({
            attributes: state.attributes.filter(a => a.id !== id)
        }));
    },

    addAttributeValue: async (attributeId, data) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.post(
            `/companies/${currentCompany.id}/attributes/${attributeId}/values`,
            data
        );
        const newValue = response.data.data;

        set(state => ({
            attributes: state.attributes.map(a =>
                a.id === attributeId
                    ? { ...a, values: [...a.values, newValue] }
                    : a
            )
        }));

        return newValue;
    },

    updateAttributeValue: async (attributeId, valueId, data) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        const response = await api.put(
            `/companies/${currentCompany.id}/attributes/${attributeId}/values/${valueId}`,
            data
        );
        const updatedValue = response.data.data;

        set(state => ({
            attributes: state.attributes.map(a =>
                a.id === attributeId
                    ? { ...a, values: a.values.map(v => v.id === valueId ? updatedValue : v) }
                    : a
            )
        }));

        return updatedValue;
    },

    deleteAttributeValue: async (attributeId, valueId) => {
        const currentCompany = useAuthStore.getState().currentCompany;
        if (!currentCompany) throw new Error('No company selected');

        await api.delete(
            `/companies/${currentCompany.id}/attributes/${attributeId}/values/${valueId}`
        );

        set(state => ({
            attributes: state.attributes.map(a =>
                a.id === attributeId
                    ? { ...a, values: a.values.filter(v => v.id !== valueId) }
                    : a
            )
        }));
    },
}));
