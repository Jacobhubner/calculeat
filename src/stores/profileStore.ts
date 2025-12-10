/**
 * Zustand store för profilhantering
 * Hanterar flera profiler per användare och aktiv profil
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/lib/types'

interface ProfileState {
  // Current active profile
  activeProfile: Profile | null
  setActiveProfile: (profile: Profile | null) => void

  // Previously viewed profile (for copying settings to new profile)
  previousProfile: Profile | null

  // All user profiles
  profiles: Profile[]
  setProfiles: (profiles: Profile[]) => void

  // Add new profile to the list
  addProfile: (profile: Profile) => void

  // Update existing profile
  updateProfile: (id: string, data: Partial<Profile>) => void

  // Delete profile from the list
  removeProfile: (id: string) => void

  // Switch active profile
  switchProfile: (id: string) => void

  // Clear all profiles (on logout)
  clearProfiles: () => void

  // Get profile by ID
  getProfileById: (id: string) => Profile | undefined
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeProfile: null,
      previousProfile: null,
      profiles: [],

      // Set active profile
      setActiveProfile: profile =>
        set(state => ({
          // Store the current active profile as previous before switching
          previousProfile: state.activeProfile,
          activeProfile: profile,
        })),

      // Set all profiles
      setProfiles: profiles => {
        console.log('🏪 ProfileStore.setProfiles called with', profiles.length, 'profiles')

        return set(state => {
          let newActiveProfile: Profile | null = null

          if (profiles.length === 0) {
            // No profiles available
            newActiveProfile = null
          } else if (state.activeProfile) {
            // Try to find persisted profile by ID
            const matchingProfile = profiles.find(p => p.id === state.activeProfile?.id)

            if (matchingProfile) {
              // Persist ID matches a database profile → use it
              newActiveProfile = matchingProfile
            } else {
              // Persist ID not found in database → auto-select is_active or first
              console.warn('⚠️ Persisted profile not found in DB, auto-selecting active profile')
              newActiveProfile = profiles.find(p => p.is_active) || profiles[0]
            }
          } else {
            // No persist data (first login or after cache clear) → auto-select
            newActiveProfile = profiles.find(p => p.is_active) || profiles[0]
          }

          console.log('🏪 ProfileStore updating activeProfile:', {
            currentId: state.activeProfile?.id,
            currentName: state.activeProfile?.profile_name,
            currentBMR: state.activeProfile?.bmr,
            newId: newActiveProfile?.id,
            newName: newActiveProfile?.profile_name,
            newBMR: newActiveProfile?.bmr,
          })

          return {
            profiles,
            activeProfile: newActiveProfile,
          }
        })
      },

      // Add profile
      addProfile: profile =>
        set(state => ({
          profiles: [...state.profiles, profile],
          // If this is the first profile or is_active, set as active
          activeProfile:
            state.profiles.length === 0 || profile.is_active ? profile : state.activeProfile,
        })),

      // Update profile
      updateProfile: (id, data) =>
        set(state => {
          const updatedProfiles = state.profiles.map(p => (p.id === id ? { ...p, ...data } : p))

          return {
            profiles: updatedProfiles,
            // Update active profile if it's the one being updated
            activeProfile:
              state.activeProfile?.id === id
                ? { ...state.activeProfile, ...data }
                : state.activeProfile,
          }
        }),

      // Remove profile
      removeProfile: id =>
        set(state => {
          const remainingProfiles = state.profiles.filter(p => p.id !== id)

          // If we're deleting the active profile, switch to another one
          let newActiveProfile = state.activeProfile

          if (state.activeProfile?.id === id) {
            // Try to find another active profile, or just pick the first one
            newActiveProfile =
              remainingProfiles.find(p => p.is_active) || remainingProfiles[0] || null
          }

          return {
            profiles: remainingProfiles,
            activeProfile: newActiveProfile,
          }
        }),

      // Switch profile
      switchProfile: id =>
        set(state => {
          const profile = state.profiles.find(p => p.id === id)

          console.log('🔄 ProfileStore.switchProfile called:', {
            switchingToId: id,
            foundProfile: !!profile,
            profileName: profile?.profile_name,
            profileBMR: profile?.bmr,
            profileTDEE: profile?.tdee,
          })

          if (profile) {
            return { activeProfile: profile }
          }

          return state
        }),

      // Clear all profiles (on logout)
      clearProfiles: () =>
        set({
          profiles: [],
          activeProfile: null,
          previousProfile: null,
        }),

      // Get profile by ID
      getProfileById: id => {
        const state = get()
        return state.profiles.find(p => p.id === id)
      },
    }),
    {
      name: 'calculeat-profile-storage',
      // Only persist active profile ID, not full profiles array
      // Profiles will be fetched from Supabase on login
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
