import api from '@/lib/api';

export interface SystemAlert {
  id: string;
  title: string;
  body: string;
  type: 'sunat' | 'payment' | 'suggestion' | 'reminder' | 'info' | 'warning';
  target_type: 'all' | 'company' | 'user';
  target_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  dismissals_count?: number;
  creator?: { id: string; name: string };
  created_at: string;
}

export interface AlertsListResponse {
  success: boolean;
  data: {
    data: SystemAlert[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── User-facing ──────────────────────────────────────────────────────────────

export const alertsService = {
  getActive: async (): Promise<SystemAlert[]> => {
    const res = await api.get('/alerts/active');
    return res.data.data;
  },

  dismiss: async (alertId: string): Promise<void> => {
    await api.post(`/alerts/${alertId}/dismiss`);
  },
};

// ── SuperAdmin ────────────────────────────────────────────────────────────────

export const adminAlertsService = {
  list: async (params?: Record<string, any>): Promise<AlertsListResponse['data']> => {
    const res = await api.get('/admin/alerts', { params });
    return res.data.data;
  },

  create: async (data: Partial<SystemAlert>): Promise<SystemAlert> => {
    const res = await api.post('/admin/alerts', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<SystemAlert>): Promise<SystemAlert> => {
    const res = await api.put(`/admin/alerts/${id}`, data);
    return res.data.data;
  },

  destroy: async (id: string): Promise<void> => {
    await api.delete(`/admin/alerts/${id}`);
  },

  toggleStatus: async (id: string): Promise<{ is_active: boolean }> => {
    const res = await api.post(`/admin/alerts/${id}/toggle-status`);
    return res.data.data;
  },

  sendNow: async (id: string): Promise<void> => {
    await api.post(`/admin/alerts/${id}/send-now`);
  },
};

// ── Automated Alert Configs ───────────────────────────────────────────────────

export interface AutomatedAlertConfig {
  key: string;
  title: string;
  description: string;
  is_enabled: boolean;
}

export const automatedAlertsService = {
  list: async (): Promise<AutomatedAlertConfig[]> => {
    const res = await api.get('/admin/automated-alerts');
    return res.data.data;
  },

  toggle: async (key: string): Promise<{ key: string; is_enabled: boolean }> => {
    const res = await api.post(`/admin/automated-alerts/${key}/toggle`);
    return res.data.data;
  },
};
