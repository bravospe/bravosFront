import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { Branch } from './branchStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface Warehouse {
    id: string;
    company_id: string;
    branch_id?: string;
    branch?: Branch;
    name: string;
    code?: string;
    address?: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface WarehouseState {
    warehouses: Warehouse[];
    isLoading: boolean;
    error: string | null;

    fetchWarehouses: (branchId?: string) => Promise<void>;
    createWarehouse: (data: Partial<Warehouse>) => Promise<Warehouse>;
    updateWarehouse: (id: string, data: Partial<Warehouse>) => Promise<Warehouse>;
    deleteWarehouse: (id: string) => Promise<void>;
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
    warehouses: [],
    isLoading: false,
    error: null,

    fetchWarehouses: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const params: any = {};
            if (branchId) params.branch_id = branchId;

            const response = await axios.get<{ data: Warehouse[] }>(`${API_URL}/companies/${companyId}/warehouses`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            set({ warehouses: response.data.data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar almacenes',
                isLoading: false,
            });
        }
    },

    createWarehouse: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            const response = await axios.post<{ data: Warehouse }>(`${API_URL}/companies/${companyId}/warehouses`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const newWarehouse = response.data.data;
            
            // If new warehouse is default, update others locally
            let updatedWarehouses = [...get().warehouses, newWarehouse];
            if (newWarehouse.is_default) {
                updatedWarehouses = updatedWarehouses.map(w => 
                    w.id === newWarehouse.id ? newWarehouse : { ...w, is_default: false }
                );
            }

            set({
                warehouses: updatedWarehouses,
                isLoading: false
            });

            return newWarehouse;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear almacén',
                isLoading: false
            });
            throw error;
        }
    },

    updateWarehouse: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            const response = await axios.put<{ data: Warehouse }>(`${API_URL}/companies/${companyId}/warehouses/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const updatedWarehouse = response.data.data;

            // If updated warehouse is default, update others locally
            let updatedWarehouses = get().warehouses.map(w => w.id === id ? updatedWarehouse : w);
            if (updatedWarehouse.is_default) {
                updatedWarehouses = updatedWarehouses.map(w => 
                    w.id === updatedWarehouse.id ? updatedWarehouse : { ...w, is_default: false }
                );
            }

            set({
                warehouses: updatedWarehouses,
                isLoading: false
            });

            return updatedWarehouse;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar almacén',
                isLoading: false
            });
            throw error;
        }
    },

    deleteWarehouse: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            await axios.delete(`${API_URL}/companies/${companyId}/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                warehouses: state.warehouses.filter(w => w.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar almacén',
                isLoading: false
            });
            throw error;
        }
    },
}));
