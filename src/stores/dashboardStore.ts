import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

interface DashboardStats {
    monthly_sales: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative' | 'neutral';
    };
    documents_issued: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative' | 'neutral';
    };
    pos_sales: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative' | 'neutral';
    };
    active_clients: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative' | 'neutral';
    };
}

interface RecentInvoice {
    id: string;
    client: string;
    amount: string;
    status: string;
    date: string;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: string;
}

// Chart data types
interface DailySalesData {
    date: string;
    fullDate: string;
    invoices: number;
    pos: number;
    total: number;
}

interface PaymentMethodData {
    name: string;
    value: number;
    color: string;
}

interface DocumentTypeData {
    name: string;
    value: number;
    count: number;
    color: string;
}

interface MonthlyComparisonData {
    month: string;
    fullMonth: string;
    invoices: number;
    pos: number;
    total: number;
}

interface ChartsData {
    daily_sales: DailySalesData[];
    sales_by_payment_method: PaymentMethodData[];
    sales_by_document_type: DocumentTypeData[];
    monthly_comparison: MonthlyComparisonData[];
}

interface DashboardState {
    stats: DashboardStats | null;
    recentInvoices: RecentInvoice[];
    topProducts: TopProduct[];
    charts: ChartsData | null;
    isLoading: boolean;
    error: string | null;
    selectedPeriod: 'week' | 'month' | 'quarter' | 'year';
    fetchDashboardStats: () => Promise<void>;
    setSelectedPeriod: (period: 'week' | 'month' | 'quarter' | 'year') => void;
}

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export const useDashboardStore = create<DashboardState>((set, get) => ({
    stats: null,
    recentInvoices: [],
    topProducts: [],
    charts: null,
    isLoading: false,
    error: null,
    selectedPeriod: 'month',

    fetchDashboardStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = useAuthStore.getState().token;
            if (!token) throw new Error('No authenticated');

            const response = await axios.get(`${API_URL}/dashboard/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    period: get().selectedPeriod,
                },
            });

            set({
                stats: response.data.stats,
                recentInvoices: response.data.recent_invoices || [],
                topProducts: response.data.top_products || [],
                charts: response.data.charts || null,
                isLoading: false,
            });
        } catch (error: any) {
            console.error('Dashboard fetch error:', error);
            set({
                error: error.response?.data?.message || 'Error al cargar estadísticas',
                isLoading: false,
            });
        }
    },

    setSelectedPeriod: (period) => {
        set({ selectedPeriod: period });
        // Re-fetch with new period
        get().fetchDashboardStats();
    },
}));

// Export types for use in components
export type { 
    DashboardStats, 
    RecentInvoice, 
    TopProduct, 
    DailySalesData, 
    PaymentMethodData, 
    DocumentTypeData, 
    MonthlyComparisonData,
    ChartsData 
};
