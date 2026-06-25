import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown>;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (name: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: {},

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  
  openModal: (name, data = {}) =>
    set({ activeModal: name, modalData: data }),
  
  closeModal: () =>
    set({ activeModal: null, modalData: {} }),
}));
