import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { getApiUrl } from '@/utils/apiConfig'

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    useUIStore.getState().startLoading()

    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Extract and send XSRF token from cookie (Client only)
    if (typeof document !== 'undefined') {
      const xsrfCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
      if (xsrfCookie) {
        const xsrfToken = decodeURIComponent(xsrfCookie.split('=')[1])
        config.headers['X-XSRF-TOKEN'] = xsrfToken
      }
    }
    
    const company = useAuthStore.getState().currentCompany
    if (company) {
      config.headers['X-Company-ID'] = company.id
    }
    
    return config
  },
  (error) => {
    useUIStore.getState().stopLoading()
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().stopLoading()
    return response
  },
  async (error) => {
    useUIStore.getState().stopLoading()
    
    // Handle 419 CSRF token mismatch - retry once
    if (error.response?.status === 419 && !error.config._retry) {
      error.config._retry = true
      
      // Get a fresh CSRF cookie
      const { getBaseUrl } = await import('@/utils/apiConfig')
      const BASE_URL = getBaseUrl()
      
      try {
        await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
          }
        })
        
        // Wait a bit for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Update XSRF token in the failed request
        if (typeof document !== 'undefined') {
          const xsrfCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
          if (xsrfCookie) {
            const xsrfToken = decodeURIComponent(xsrfCookie.split('=')[1])
            error.config.headers['X-XSRF-TOKEN'] = xsrfToken
          }
        }
        
        // Retry the request
        return api.request(error.config)
      } catch (retryError) {
        return Promise.reject(error)
      }
    }
    
    if (error.response?.status === 401) {
      // Don't logout if it's a chat operation (might be a transient error)
      const isChatEndpoint = error.config.url?.includes('/admin/whatsapp');
      
      if (!isChatEndpoint) {
        // Token expired or invalid
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Global Axios Interceptor (for legacy/direct usages)
axios.interceptors.request.use(
  (config) => {
    if (config.url?.includes(API_URL) || config.baseURL?.includes(API_URL)) {
        useUIStore.getState().startLoading()
    }
    return config;
  },
  (error) => {
    useUIStore.getState().stopLoading()
    return Promise.reject(error)
  }
);

axios.interceptors.response.use(
  (response) => {
    useUIStore.getState().stopLoading()
    return response;
  },
  (error) => {
    useUIStore.getState().stopLoading()
    return Promise.reject(error)
  }
);

export default api
