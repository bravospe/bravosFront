import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  currentCompany: Company | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: User, token: string) => void
  setCurrentCompany: (company: Company) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  initializeCompany: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentCompany: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        console.log('[AuthStore] setAuth called with user:', user);
        // Backend may return currentCompany (camelCase) or current_company (snake_case)
        const companyFromUser = (user as any).currentCompany || (user as any).current_company;
        console.log('[AuthStore] user.currentCompany:', companyFromUser);
        console.log('[AuthStore] user.companies:', user.companies);
        const selectedCompany = companyFromUser || user.companies?.[0] || null;
        console.log('[AuthStore] Selected company:', selectedCompany);
        set({
          user,
          token,
          currentCompany: selectedCompany,
          isAuthenticated: true,
        });
      },

      setCurrentCompany: (company) => set({
        currentCompany: company,
      }),

      initializeCompany: () => set((state) => {
        if (state.currentCompany || !state.user) return {};

        const user = state.user;
        const companyFromUser = (user as any).currentCompany || (user as any).current_company;
        const selectedCompany = companyFromUser || user.companies?.[0] || null;

        console.log('[AuthStore] Auto-initializing company:', selectedCompany);

        if (selectedCompany) {
          return { currentCompany: selectedCompany };
        }
        return {};
      }),


      logout: () => set({
        user: null,
        token: null,
        currentCompany: null,
        isAuthenticated: false,
      }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null,
      })),
    }),
    {
      name: 'bravos-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentCompany: state.currentCompany,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
