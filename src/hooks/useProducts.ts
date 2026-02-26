import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Product } from '../types';

interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: string;
  type?: 'product' | 'service';
  stock_status?: 'low' | 'out' | 'available';
  is_active?: boolean;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const useProducts = (companyId: string, params: ProductsParams = {}) => {
  return useQuery<ProductsResponse>({
    queryKey: ['products', companyId, params],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/products`, { params });
      return data;
    },
    enabled: !!companyId,
  });
};

export const useProduct = (companyId: string, productId: string) => {
  return useQuery<{ success: boolean; data: Product }>({
    queryKey: ['products', companyId, productId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/products/${productId}`);
      return data;
    },
    enabled: !!companyId && !!productId,
  });
};

export const useCreateProduct = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const { data } = await api.post(`/companies/${companyId}/products`, productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
    },
  });
};

export const useUpdateProduct = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...productData }: Partial<Product> & { id: string }) => {
      const { data } = await api.put(`/companies/${companyId}/products/${id}`, productData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products', companyId, variables.id] });
    },
  });
};

export const useDeleteProduct = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete(`/companies/${companyId}/products/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
    },
  });
};

export const useUpdateStock = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      type,
      reason,
    }: {
      productId: string;
      quantity: number;
      type: 'add' | 'subtract' | 'set';
      reason?: string;
    }) => {
      const { data } = await api.patch(
        `/companies/${companyId}/products/${productId}/stock`,
        { quantity, type, reason }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products', companyId, variables.productId] });
    },
  });
};

export const useSearchProducts = (companyId: string) => {
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data } = await api.get(`/companies/${companyId}/products/search`, {
        params: { q: searchTerm },
      });
      return data;
    },
  });
};
