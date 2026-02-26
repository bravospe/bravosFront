import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  startLoading: () => set({ isLoading: true }),
  stopLoading: () => set({ isLoading: false }),
}));
