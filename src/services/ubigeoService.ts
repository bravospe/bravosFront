import api from '../lib/api';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/v1';
  return baseURL.replace('/v1', '');
};

export interface Department {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  department_id: string;
  name: string;
}

export interface District {
  id: string;
  province_id: string;
  department_id: string;
  name: string;
}

export interface UbigeoDetail {
  ubigeo: string;
  department_id: string;
  department_name: string;
  province_id: string;
  province_name: string;
  district_id: string;
  district_name: string;
  full_location: string;
}

export const ubigeoService = {
  /**
   * Get all departments
   */
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/ubigeo/departments');
    return response.data.data;
  },

  /**
   * Get provinces by department
   */
  getProvinces: async (departmentId: string): Promise<Province[]> => {
    const response = await api.get('/ubigeo/provinces', {
      params: { department_id: departmentId }
    });
    return response.data.data;
  },

  /**
   * Get districts by province
   */
  getDistricts: async (provinceId: string): Promise<District[]> => {
    const response = await api.get('/ubigeo/districts', {
      params: { province_id: provinceId }
    });
    return response.data.data;
  },

  /**
   * Get ubigeo details by code
   */
  getUbigeo: async (ubigeo: string): Promise<UbigeoDetail> => {
    const response = await api.get(`/ubigeo/${ubigeo}`);
    return response.data.data;
  },

  /**
   * Search districts by name
   */
  search: async (query: string): Promise<UbigeoDetail[]> => {
    const response = await api.get('/ubigeo/search', {
      params: { q: query }
    });
    return response.data.data;
  },
};

export default ubigeoService;
