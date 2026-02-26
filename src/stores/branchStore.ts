import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface Branch {
    id: string;
    company_id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    ubigeo?: string;
    is_main: boolean;
    is_active: boolean;
    warehouses_count?: number;
    created_at: string;
    updated_at: string;
}

interface BranchState {
    branches: Branch[];
    isLoading: boolean;
    error: string | null;

    fetchBranches: () => Promise<void>;
    createBranch: (data: Partial<Branch>) => Promise<Branch>;
    updateBranch: (id: string, data: Partial<Branch>) => Promise<Branch>;
    deleteBranch: (id: string) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    isLoading: false,
    error: null,

    fetchBranches: async () => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            if (!companyId) throw new Error('No company selected');

            const response = await axios.get<{ data: Branch[] }>(`${API_URL}/companies/${companyId}/branches`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set({ branches: response.data.data, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al cargar sedes',
                isLoading: false,
            });
        }
    },

    createBranch: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            const response = await axios.post<{ data: Branch }>(`${API_URL}/companies/${companyId}/branches`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const newBranch = response.data.data;
            
            // If new branch is main, update others locally
            let updatedBranches = [...get().branches, newBranch];
            if (newBranch.is_main) {
                updatedBranches = updatedBranches.map(b => 
                    b.id === newBranch.id ? newBranch : { ...b, is_main: false }
                );
            }

            set({
                branches: updatedBranches,
                isLoading: false
            });

            return newBranch;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al crear sede',
                isLoading: false
            });
            throw error;
        }
    },

    updateBranch: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            const response = await axios.put<{ data: Branch }>(`${API_URL}/companies/${companyId}/branches/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const updatedBranch = response.data.data;

            // If updated branch is main, update others locally
            let updatedBranches = get().branches.map(b => b.id === id ? updatedBranch : b);
            if (updatedBranch.is_main) {
                updatedBranches = updatedBranches.map(b => 
                    b.id === updatedBranch.id ? updatedBranch : { ...b, is_main: false }
                );
            }

            set({
                branches: updatedBranches,
                isLoading: false
            });

            return updatedBranch;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al actualizar sede',
                isLoading: false
            });
            throw error;
        }
    },

    deleteBranch: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = useAuthStore.getState();
            if (!token || !user) throw new Error('No authenticated');

            const companyId = user.current_company_id || user.companies?.[0]?.id;
            await axios.delete(`${API_URL}/companies/${companyId}/branches/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            set((state) => ({
                branches: state.branches.filter(b => b.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Error al eliminar sede',
                isLoading: false
            });
            throw error;
        }
    },
}));
