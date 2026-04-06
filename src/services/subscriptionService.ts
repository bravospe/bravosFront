import api from '@/lib/api';
import { ManualPayment, PaginatedResponse } from '@/types';

export const subscriptionService = {
  /**
   * Submit a manual payment proof for a membership plan
   */
  async submitManualPayment(formData: FormData): Promise<{ success: boolean; message: string; data: ManualPayment }> {
    const { data } = await api.post<{ success: boolean; message: string; data: ManualPayment }>(
      '/membership/payments', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  /**
   * Get the current status of the last manual payment for the company
   */
  async getLatestManualPayment(): Promise<{ success: boolean; data: ManualPayment | null }> {
    const { data } = await api.get<{ success: boolean; data: ManualPayment | null }>('/membership/payments/latest');
    return data;
  },

  /**
   * List all payments made by the company
   */
  async getPaymentHistory(): Promise<PaginatedResponse<ManualPayment>> {
    const { data } = await api.get<PaginatedResponse<ManualPayment>>('/membership/payments/history');
    return data;
  },
};

export default subscriptionService;
