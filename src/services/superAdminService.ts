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
};

export default superAdminService;
