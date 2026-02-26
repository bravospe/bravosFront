import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Client } from '../types';

interface ClientsParams {
  page?: number;
  per_page?: number;
  search?: string;
  document_type?: string;
  status?: 'active' | 'inactive';
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const useClients = (companyId: string, params: ClientsParams = {}) => {
  return useQuery<ClientsResponse>({
    queryKey: ['clients', companyId, params],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/clients`, { params });
      return data;
    },
    enabled: !!companyId,
  });
};

export const useClient = (companyId: string, clientId: string) => {
  return useQuery<{ success: boolean; data: Client }>({
    queryKey: ['clients', companyId, clientId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/clients/${clientId}`);
      return data;
    },
    enabled: !!companyId && !!clientId,
  });
};

export const useCreateClient = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const { data } = await api.post(`/companies/${companyId}/clients`, clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
    },
  });
};

export const useUpdateClient = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...clientData }: Partial<Client> & { id: string }) => {
      const { data } = await api.put(`/companies/${companyId}/clients/${id}`, clientData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      queryClient.invalidateQueries({ queryKey: ['clients', companyId, variables.id] });
    },
  });
};

export const useDeleteClient = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data } = await api.delete(`/companies/${companyId}/clients/${clientId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
    },
  });
};

export const useSearchClient = (companyId: string) => {
  return useMutation({
    mutationFn: async (params: { document_type: 'DNI' | 'RUC'; document_number: string }) => {
      const { data } = await api.get(`/companies/${companyId}/clients/search`, { params });
      return data;
    },
  });
};
