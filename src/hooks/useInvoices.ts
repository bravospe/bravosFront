import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Invoice, InvoiceItem } from '../types';

interface InvoicesParams {
  page?: number;
  per_page?: number;
  search?: string;
  type?: '01' | '03' | '07' | '08';
  sunat_status?: 'accepted' | 'pending' | 'rejected' | 'annulled';
  payment_status?: 'paid' | 'pending' | 'partial';
  date_from?: string;
  date_to?: string;
}

interface InvoicesResponse {
  success: boolean;
  data: Invoice[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateInvoiceData {
  document_type: '01' | '03' | '07' | '08';
  client_id?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }>;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit';
  notes?: string;
  reference_document?: {
    type: string;
    series: string;
    number: string;
  };
  credit_note_reason?: string;
}

export const useInvoices = (companyId: string, params: InvoicesParams = {}) => {
  return useQuery<InvoicesResponse>({
    queryKey: ['invoices', companyId, params],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/invoices`, { params });
      return data;
    },
    enabled: !!companyId,
  });
};

export const useInvoice = (companyId: string, invoiceId: string) => {
  return useQuery<{ success: boolean; data: Invoice & { items: InvoiceItem[] } }>({
    queryKey: ['invoices', companyId, invoiceId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/invoices/${invoiceId}`);
      return data;
    },
    enabled: !!companyId && !!invoiceId,
  });
};

export const useCreateInvoice = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      const { data } = await api.post(`/companies/${companyId}/invoices`, invoiceData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
    },
  });
};

export const useCancelInvoice = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason: string }) => {
      const { data } = await api.post(
        `/companies/${companyId}/invoices/${invoiceId}/cancel`,
        { reason }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId, variables.invoiceId] });
    },
  });
};

export const useResendInvoice = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post(`/companies/${companyId}/invoices/${invoiceId}/resend`);
      return data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId, invoiceId] });
    },
  });
};

export const useDownloadInvoicePdf = (companyId: string) => {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.get(`/companies/${companyId}/invoices/${invoiceId}/pdf`);
      return data;
    },
  });
};

export const useSendInvoiceEmail = (companyId: string) => {
  return useMutation({
    mutationFn: async ({ invoiceId, email }: { invoiceId: string; email?: string }) => {
      const { data } = await api.post(
        `/companies/${companyId}/invoices/${invoiceId}/send-email`,
        { email }
      );
      return data;
    },
  });
};
