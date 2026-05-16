/**
 * Zustand store för profilhantering
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/lib/types'

interface ProfileState {
  // Current active profile
  activeProfile: Profile | null

  // All user profiles (fetched by useProfiles, single entry per user in practice)
  profiles: Profile[]
  setProfiles: (profiles: Profile[]) => void

  // Update existing profile in store (called by useUpdateProfile.onSuccess)
  updateProfile: (id: string, data: Partial<Profile>) => void

  // Clear all profiles (on logout)
  clearProfiles: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    set => ({
      activeProfile: null,
      profiles: [],

      // Deterministic single-profile selection: is_active wins, then first, then null.
      // Multi-profile restore logic removed in E5 — one profile per user.
      setProfiles: profiles =>
        set(() => ({
          profiles,
          activeProfile: profiles.find(p => p.is_active) ?? profiles[0] ?? null,
        })),

      updateProfile: (id, data) =>
        set(state => ({
          profiles: state.profiles.map(p => (p.id === id ? { ...p, ...data } : p)),
          activeProfile:
            state.activeProfile?.id === id
              ? { ...state.activeProfile, ...data }
              : state.activeProfile,
        })),

      clearProfiles: () =>
        set({
          profiles: [],
          activeProfile: null,
        }),
    }),
    {
      name: 'calculeat-profile-storage',
      // Only persist active profile ID — profiles are refetched from Supabase on login
      partialize: state => ({
        activeProfile: state.activeProfile
          ? {
              id: state.activeProfile.id,
              profile_name: state.activeProfile.profile_name,
            }
          : null,
      }),
    }
  )
)
