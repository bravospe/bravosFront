import api from '@/lib/api'
import type { User, Company, LoginCredentials, RegisterData } from '@/types'
import { clearAuthCookies } from '@/utils/cookieHelper'
import { getBaseUrl } from '@/utils/apiConfig'

interface AuthResponse {
  user: User
  token: string
  token_type: string
}

import axios from 'axios'

// Get the base URL (without /api/v1) for Sanctum cookie request
const BASE_URL = getBaseUrl()

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Get CSRF cookie first and wait for it to be set
      await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { 
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
        }
      })
      
      // Small delay to ensure cookie is properly set in browser
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Now perform the login with the CSRF token
      const { data } = await api.post<AuthResponse>('/auth/login', credentials)
      return data
    } catch (error: any) {
      // If we get a 419 error, clear cookies and try again once
      if (error.response?.status === 419 && !error.config?._retry) {
        console.warn('Got 419 error, clearing cookies and retrying...')
        clearAuthCookies()
        
        // Retry the entire login process
        await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
          }
        })
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { data } = await api.post<AuthResponse>('/auth/login', credentials)
        return data
      }
      
      throw error
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', userData)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/send-otp', { phone });
    return data;
  },

  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/verify-otp', { phone, code });
    return data;
  },

  async me(): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data
  },

  async updateProfile(profileData: Partial<User>): Promise<{ user: User }> {
    const { data } = await api.put<{ user: User }>('/auth/profile', profileData)
    return data
  },

  async updatePassword(passwords: {
    current_password: string
    password: string
    password_confirmation: string
  }): Promise<void> {
    await api.put('/auth/password', passwords)
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(data: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<void> {
    await api.post('/auth/reset-password', data)
  },
}

export const companyService = {
  async list(): Promise<{ data: Company[] }> {
    const { data } = await api.get('/companies')
    return data
  },

  async get(id: string): Promise<Company> {
    const { data } = await api.get<{ data: Company }>(`/companies/${id}`)
    return data.data
  },

  async create(companyData: Partial<Company>): Promise<Company> {
    const { data } = await api.post<{ data: Company }>('/companies', companyData)
    return data.data
  },

  async update(id: string, companyData: Partial<Company>): Promise<Company> {
    const { data } = await api.put<{ data: Company }>(`/companies/${id}`, companyData)
    return data.data
  },

  async switchCompany(id: string): Promise<void> {
    await api.post(`/companies/${id}/switch`)
  },
}
