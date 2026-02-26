import { create } from 'zustand';
import ubigeoService, { Department, Province, District } from '../services/ubigeoService';

interface UbigeoState {
  departments: Department[];
  provinces: Record<string, Province[]>; // keyed by department_id
  districts: Record<string, District[]>; // keyed by province_id
  isLoadingDepartments: boolean;
  isLoadingProvinces: boolean;
  isLoadingDistricts: boolean;
  
  // Actions
  fetchDepartments: () => Promise<void>;
  fetchProvinces: (departmentId: string) => Promise<void>;
  fetchDistricts: (provinceId: string) => Promise<void>;
  getProvincesByDepartment: (departmentId: string) => Province[];
  getDistrictsByProvince: (provinceId: string) => District[];
}

export const useUbigeoStore = create<UbigeoState>((set, get) => ({
  departments: [],
  provinces: {},
  districts: {},
  isLoadingDepartments: false,
  isLoadingProvinces: false,
  isLoadingDistricts: false,

  fetchDepartments: async () => {
    // Return cached if available
    if (get().departments.length > 0) return;
    
    set({ isLoadingDepartments: true });
    try {
      const departments = await ubigeoService.getDepartments();
      set({ departments, isLoadingDepartments: false });
    } catch (error) {
      console.error('Error fetching departments:', error);
      set({ isLoadingDepartments: false });
    }
  },

  fetchProvinces: async (departmentId: string) => {
    // Return cached if available
    if (get().provinces[departmentId]) return;
    
    set({ isLoadingProvinces: true });
    try {
      const provinces = await ubigeoService.getProvinces(departmentId);
      set((state) => ({
        provinces: { ...state.provinces, [departmentId]: provinces },
        isLoadingProvinces: false,
      }));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      set({ isLoadingProvinces: false });
    }
  },

  fetchDistricts: async (provinceId: string) => {
    // Return cached if available
    if (get().districts[provinceId]) return;
    
    set({ isLoadingDistricts: true });
    try {
      const districts = await ubigeoService.getDistricts(provinceId);
      set((state) => ({
        districts: { ...state.districts, [provinceId]: districts },
        isLoadingDistricts: false,
      }));
    } catch (error) {
      console.error('Error fetching districts:', error);
      set({ isLoadingDistricts: false });
    }
  },

  getProvincesByDepartment: (departmentId: string) => {
    return get().provinces[departmentId] || [];
  },

  getDistrictsByProvince: (provinceId: string) => {
    return get().districts[provinceId] || [];
  },
}));
