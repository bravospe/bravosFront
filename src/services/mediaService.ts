import api from '@/lib/api'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

import { getApiUrl } from '@/utils/apiConfig';
const API_URL = getApiUrl();

export interface MediaItem {
  id: string;
  name: string;
  file_name: string;
  mime_type: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  collection: string;
  url: string;
  thumbnail_url: string;
  human_readable_size: string;
  created_at: string;
  updated_at: string;
}

export interface MediaListResponse {
  success: boolean;
  data: {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface StorageStats {
  used_bytes: number;
  used_readable: string;
  used_mb: number;
  limit_mb: number;
  limit_bytes: number;
  remaining_mb: number;
  remaining_bytes: number;
  percentage: number;
  file_count: number;
  by_collection: {
    collection: string;
    count: number;
    size_bytes: number;
    size_readable: string;
  }[];
}

export interface UploadResponse {
  success: boolean;
  data: MediaItem;
  message: string;
}

export const mediaService = {
  /**
   * List media files with pagination and filters
   */
  async list(companyId: string, params?: {
    page?: number;
    per_page?: number;
    collection?: string;
    images_only?: boolean;
    search?: string;
  }): Promise<MediaListResponse> {
    const { data } = await api.get<MediaListResponse>(
      `/companies/${companyId}/media`,
      { params }
    );
    return data;
  },

  /**
   * Upload a single file to the media library
   */
  async upload(
    companyId: string,
    file: File,
    options?: {
      collection?: string;
      alt_text?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.collection) formData.append('collection', options.collection);
    if (options?.alt_text) formData.append('alt_text', options.alt_text);

    const token = useAuthStore.getState().token;
    
    // Use direct axios call to avoid default Content-Type: application/json header from api instance
    const { data } = await axios.post<UploadResponse>(
      `${API_URL}/companies/${companyId}/media/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        },
      }
    );
    return data;
  },

  /**
   * Upload multiple files at once
   */
  async uploadMultiple(
    companyId: string,
    files: File[],
    options?: {
      collection?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{ success: boolean; data: MediaItem[]; errors: any[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files[]', file));
    if (options?.collection) formData.append('collection', options.collection);

    const token = useAuthStore.getState().token;

    // Use direct axios call to avoid default Content-Type: application/json header from api instance
    const { data } = await axios.post(
      `${API_URL}/companies/${companyId}/media/upload-multiple`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        },
      }
    );
    return data;
  },

  /**
   * Get a single media item
   */
  async get(companyId: string, mediaId: string): Promise<{ success: boolean; data: MediaItem }> {
    const { data } = await api.get(`/companies/${companyId}/media/${mediaId}`);
    return data;
  },

  /**
   * Update media metadata (alt_text, name)
   */
  async update(
    companyId: string,
    mediaId: string,
    updates: { alt_text?: string; name?: string }
  ): Promise<{ success: boolean; data: MediaItem }> {
    const { data } = await api.put(`/companies/${companyId}/media/${mediaId}`, updates);
    return data;
  },

  /**
   * Delete a single media item
   */
  async delete(companyId: string, mediaId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/companies/${companyId}/media/${mediaId}`);
    return data;
  },

  /**
   * Delete multiple media items
   */
  async deleteMultiple(
    companyId: string,
    ids: string[]
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/companies/${companyId}/media/bulk-delete`, {
      data: { ids },
    });
    return data;
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(companyId: string): Promise<{ success: boolean; data: StorageStats }> {
    const { data } = await api.get(`/companies/${companyId}/media/storage-stats`);
    return data;
  },

  /**
   * Recalculate storage usage
   */
  async recalculateStorage(companyId: string): Promise<{ success: boolean; data: any }> {
    const { data } = await api.post(`/companies/${companyId}/media/recalculate-storage`);
    return data;
  },
};

export default mediaService;
