import api from '@/lib/api';

export interface ValidationResponse {
    valid: boolean;
    message?: string;
    data?: {
        success: boolean;
        ruc?: string;
        dni?: string;
        name: string;
        trade_name?: string | null;
        address?: string;
        ubigeo?: string;
        department?: string;
        province?: string;
        district?: string;
        status?: string;
        condition?: string;
        first_name?: string;
        last_name_paternal?: string;
        last_name_maternal?: string;
    };
}

const validationService = {
    validateRuc: async (ruc: string): Promise<ValidationResponse> => {
        const response = await api.post('/validation/ruc', { ruc });
        return response.data;
    },

    validateDni: async (dni: string): Promise<ValidationResponse> => {
        const response = await api.post('/validation/dni', { dni });
        return response.data;
    },

    validateCe: async (ce: string): Promise<ValidationResponse> => {
        const response = await api.post('/validation/ce', { ce });
        return response.data;
    }
};

export default validationService;
