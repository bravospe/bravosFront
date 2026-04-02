import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { ClientCategory } from './clientCategoryStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface Client {
    id: string; // UUID
    company_id: string;
    client_category_id: number | null;
    category?: ClientCategory;
    document_type: 'RUC' | 'DNI' | 'CE' | 'PASAPORTE';
    document_number: string;
    name: string;
    trade_name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedResponse<T> {
    data: T[];
    links: any;
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

interface ClientState {
    clients: Client[];
    isLoading: boolean;
    error: string | null;
    meta: PaginatedResponse<Client>['meta'] | null;

    fetchClients: (params?: { page?: number; per_page?: number; search?: string; category_id?: number; label_id?: string }) => Promise<void>;
    getClient: (id: string) => Promise<Client>;
    createClient: (data: Partial<Client>) => Promise<Client>;
    updateClient: (id: string, data: Partial<Client>) => Promise<Client>;
    deleteClient: (id: string) => Promise<void>;
    findClientByDocument: (documentNumber: string) => Promise<Client | null>;
}

export const useClientStore = create<ClientState>((set) => ({
    clients: [],
    isLoading: false,
    error: null,
    meta: null,

    fetchClients: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const response = await axios.get<any>(`${API_URL}/companies/${companyId}/clients`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 10,
                    search: params?.search,
                    category_id: params?.category_id,
                    label_id: params?.label_id,
                },
            });

            // Adapt Laravel Paginator response to Store format
            const data = response.data;
            set({
                clients: data.data,
                meta: {
                    current_page: data.current_page,
                    from: data.from,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    to: data.to,
                    total: data.total
                },
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar clientes',
                isLoading: false,
            });
        }
    },

    getClient: async (id) => {
        const { user, token } = useAuthStore.getState();
        if (!token || !user) throw new Error('No authenticated');

        const companyId = user.current_company_id || user.companies?.[0]?.id;
        if (!companyId) throw new Error('No company selected');

        const response = await axios.get<Client>(`${API_URL}/companies/${companyId}/clients/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    createClient: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const response = await axios.post<Client>(`${API_URL}/companies/${companyId}/clients`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                clients: [response.data, ...state.clients],
                isLoading: false,
            }));

            return response.data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear cliente',
                isLoading: false
            });
            throw error;
        }
    },

    updateClient: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const response = await axios.put<Client>(`${API_URL}/companies/${companyId}/clients/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                clients: state.clients.map(c => c.id === id ? response.data : c),
                isLoading: false,
            }));

            return response.data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar cliente',
                isLoading: false
            });
            throw error;
        }
    },

    deleteClient: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            await axios.delete(`${API_URL}/companies/${companyId}/clients/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                clients: state.clients.filter((c) => c.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar cliente',
                isLoading: false
            });
            throw error;
        }
    },

    findClientByDocument: async (documentNumber) => {
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) return null;

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) return null;

            const response = await axios.get<any>(`${API_URL}/companies/${companyId}/clients`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    search: documentNumber,
                    per_page: 1,
                },
            });

            // The backend search might return partial matches, so we double check
            const clients = response.data.data || [];
            return clients.find((c: any) => c.document_number === documentNumber) || null;
        } catch (error) {
            console.error('Error finding client by document:', error);
            return null;
        }
    },
}));
