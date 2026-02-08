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

  // Tools section state
  toolsSectionExpanded: boolean
  toggleToolsSection: () => void
  setToolsSectionExpanded: (expanded: boolean) => void

  // Mobile drawer state
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void
  toggleMobileDrawer: () => void

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

      // Tools section
      toolsSectionExpanded: true,
      toggleToolsSection: () =>
        set(state => ({ toolsSectionExpanded: !state.toolsSectionExpanded })),
      setToolsSectionExpanded: expanded => set({ toolsSectionExpanded: expanded }),

      // Mobile drawer
      mobileDrawerOpen: false,
      setMobileDrawerOpen: open => set({ mobileDrawerOpen: open }),
      toggleMobileDrawer: () => set(state => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),

      // Modals
      activeModal: null,
      openModal: modalId => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'calculeat-ui-storage',
      partialize: state => ({
        sidebarCollapsed: state.sidebarCollapsed,
        toolsSectionExpanded: state.toolsSectionExpanded, // Spara tools section state
      }),
    }
  )
)
