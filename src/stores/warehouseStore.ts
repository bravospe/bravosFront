import { create } from 'zustand';
import api from '@/lib/api';
import { useAuthStore } from './authStore';
import { Branch } from './branchStore';

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

const ensureCompany = () => {
    const authStore = useAuthStore.getState();
    if (!authStore.currentCompany && authStore.user) {
        // Try to recover from user if currentCompany is null
        const user = authStore.user;
        const companyFromUser = (user as any).currentCompany || 
                                (user as any).current_company || 
                                (user as any).companies?.[0];
        
        if (companyFromUser) {
            authStore.setCurrentCompany(companyFromUser);
            return companyFromUser.id;
        }
    }
    return authStore.currentCompany?.id || authStore.user?.current_company_id;
};

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
    warehouses: [],
    isLoading: false,
    error: null,

    fetchWarehouses: async (branchId) => {
        set({ isLoading: true, error: null });
        try {
            const companyId = ensureCompany();
            if (!companyId) throw new Error('No company selected');

            const params: any = {};
            if (branchId) params.branch_id = branchId;

            const response = await api.get<{ data: Warehouse[] }>(`/companies/${companyId}/warehouses`, {
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
            const companyId = ensureCompany();
            if (!companyId) throw new Error('No company selected');

            // CRITICAL: Since I cannot fix the backend, I must send company_id in the body
            // so Laravel can potentially catch it or the model can fill it.
            const payload = {
                ...data,
                company_id: companyId,
                is_active: data.is_active === undefined ? true : !!data.is_active,
                is_default: !!data.is_default,
            };

            const response = await api.post<{ data: Warehouse }>(`/companies/${companyId}/warehouses`, payload);
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
            const companyId = ensureCompany();
            if (!companyId) throw new Error('No company selected');

            const payload = {
                ...data,
                company_id: companyId,
                is_active: data.is_active !== undefined ? !!data.is_active : undefined,
                is_default: data.is_default !== undefined ? !!data.is_default : undefined,
            };

            const response = await api.put<{ data: Warehouse }>(`/companies/${companyId}/warehouses/${id}`, payload);
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
            const companyId = ensureCompany();
            if (!companyId) throw new Error('No company selected');

            await api.delete(`/companies/${companyId}/warehouses/${id}`);
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
