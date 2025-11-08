/**
 * Zustand store för UI state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar state för dashboard
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile menu state
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void

  // Modal/Dialog state (kan utökas senare)
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: collapsed => set({ sidebarCollapsed: collapsed }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: open => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Modals
      activeModal: null,
      openModal: modalId => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'calculeat-ui-storage',
      partialize: state => ({
        sidebarCollapsed: state.sidebarCollapsed, // Spara endast sidebar state
      }),
    }
  )
)
