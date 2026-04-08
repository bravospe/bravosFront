import api from '@/lib/api';

// Storage Management Types
export interface CompanyStorageSummary {
  id: string;
  name: string;
  ruc: string;
  plan: string;
  plan_id: string | null;
  used_bytes: number;
  used_readable: string;
  limit_bytes: number;
  limit_readable: string;
  file_count: number;
  percentage: number;
  status: string;
  created_at: string;
}

export interface StorageTotals {
  used_bytes: number;
  used_readable: string;
  limit_bytes: number;
  limit_readable: string;
  file_count: number;
  companies_count: number;
  companies_near_limit: number;
  companies_over_limit: number;
  global_percentage: number;
}

export interface StorageListResponse {
  success: boolean;
  data: {
    companies: CompanyStorageSummary[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
    totals: StorageTotals;
  };
}

export interface MediaItem {
  id: string;
  name: string;
  file_name: string;
  mime_type: string;
  path: string;
  size: number;
  collection: string;
  url: string;
  created_at: string;
}

export interface CollectionStats {
  collection: string;
  count: number;
  size_bytes: number;
  size_readable: string;
}

export interface MimeTypeStats {
  mime_type: string;
  count: number;
  size_bytes: number;
  size_readable: string;
}

export interface CompanyStorageDetail {
  success: boolean;
  data: {
    company: {
      id: string;
      name: string;
      ruc: string;
    };
    plan: {
      id: string | null;
      name: string;
      storage_limit_mb: number;
    };
    storage: {
      used_bytes: number;
      used_readable: string;
      used_mb: number;
      limit_bytes: number;
      limit_readable: string;
      remaining_bytes: number;
      remaining_readable: string;
      file_count: number;
      percentage: number;
    };
    by_collection: CollectionStats[];
    by_mime_type: MimeTypeStats[];
    recent_uploads: MediaItem[];
    largest_files: MediaItem[];
  };
}

export const superAdminService = {
  // Storage Management
  storage: {
    /**
     * Get all companies storage overview
     */
    async list(params?: {
      page?: number;
      per_page?: number;
      search?: string;
      sort_by?: string;
      sort_dir?: 'asc' | 'desc';
    }): Promise<StorageListResponse> {
      const { data } = await api.get<StorageListResponse>('/admin/storage', { params });
      return data;
    },

    /**
     * Get detailed storage info for a company
     */
    async getCompanyDetail(companyId: string): Promise<CompanyStorageDetail> {
      const { data } = await api.get<CompanyStorageDetail>(`/admin/storage/${companyId}`);
      return data;
    },

    /**
     * Recalculate storage for a specific company
     */
    async recalculate(companyId: string): Promise<{ success: boolean; message: string; data: any }> {
      const { data } = await api.post(`/admin/storage/${companyId}/recalculate`);
      return data;
    },

    /**
     * Recalculate storage for all companies
     */
    async recalculateAll(): Promise<{ success: boolean; message: string; data: any[] }> {
      const { data } = await api.post('/admin/storage/recalculate-all');
      return data;
    },
  },

  /**
   * Membership Payments Management
   */
  payments: {
    /**
     * List all membership payments (with filtering)
     */
    async list(params?: {
      page?: number;
      per_page?: number;
      status?: 'pending' | 'approved' | 'rejected';
      search?: string;
    }): Promise<PaginatedResponse<ManualPayment>> {
      const { data } = await api.get<PaginatedResponse<ManualPayment>>('/admin/membership/payments', { params });
      return data;
    },

    /**
     * Approve a membership payment
     */
    async approve(paymentId: string, notes?: string): Promise<{ success: boolean; message: string }> {
      const { data } = await api.post(`/admin/membership/payments/${paymentId}/approve`, { notes });
      return data;
    },

    /**
     * Reject a membership payment
     */
    async reject(paymentId: string, reason: string): Promise<{ success: boolean; message: string }> {
      const { data } = await api.post(`/admin/membership/payments/${paymentId}/reject`, { reason });
      return data;
    },
  },

  /**
   * Background Worker / Invoice Engine Monitoring
   */
  worker: {
    /**
     * Get global worker status (heartbeat, queue size, etc.)
     */
    async getStatus(): Promise<{
      success: boolean;
      data: {
        is_running: boolean;
        last_heartbeat: string;
        queue_size: number;
        processed_last_24h: number;
        error_count_last_24h: number;
        uptime: string;
      };
    }> {
      try {
        const { data } = await api.get('/admin/worker/status');
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Retornar estado offline seguro si no existe el endpoint
          return {
            success: true,
            data: {
              is_running: false,
              last_heartbeat: new Date().toISOString(),
              queue_size: 0,
              processed_last_24h: 0,
              error_count_last_24h: 0,
              uptime: '0%'
            }
          };
        }
        throw err;
      }
    },

    /**
     * Get real-time logs of processing across all companies
     */
    async getLogs(params?: {
      page?: number;
      per_page?: number;
      status?: string;
      company_id?: string;
    }): Promise<any> {
      try {
        const { data } = await api.get('/admin/worker/logs', { params });
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return { success: true, data: { logs: [], pagination: {} } };
        }
        throw err;
      }
    },

    /**
     * Push all pending SUNAT documents into the queue immediately
     */
    async push(): Promise<{ success: boolean; message: string; queue_size?: number }> {
      const { data } = await api.post('/admin/worker/push');
      return data;
    },

    /**
     * Force restart the background service (if stuck)
     */
    async restart(): Promise<{ success: boolean; message: string }> {
      const { data } = await api.post('/admin/worker/restart');
      return data;
    },
  },
};

export default superAdminService;
