/**
 * Zustand store för mätningar (measurement sets)
 * Hanterar sparade mätningar med datumbaserad namngivning
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeasurementSet } from '@/lib/types'

interface MeasurementSetState {
  // Currently selected measurement set
  activeMeasurementSet: MeasurementSet | null
  setActiveMeasurementSet: (measurementSet: MeasurementSet | null) => void

  // Last active measurement set ID (persists across logout for restoration)
  lastActiveMeasurementSetId: string | null

  // All user measurement sets (saved in database)
  measurementSets: MeasurementSet[]
  setMeasurementSets: (sets: MeasurementSet[]) => void

  // Unsaved measurement sets (local only, not yet in database)
  unsavedMeasurementSets: MeasurementSet[]
  addUnsavedMeasurementSet: (measurementSet: MeasurementSet) => void
  removeUnsavedMeasurementSet: (tempId: string) => void
  updateUnsavedMeasurementSet: (tempId: string, data: Partial<MeasurementSet>) => void
  replaceAllUnsavedWithNew: (measurementSet: MeasurementSet) => void

  // Add new measurement set to the list
  addMeasurementSet: (measurementSet: MeasurementSet) => void

  // Update existing measurement set
  updateMeasurementSet: (id: string, data: Partial<MeasurementSet>) => void

  // Delete measurement set from the list
  removeMeasurementSet: (id: string) => void

  // Clear all measurement sets (on logout)
  clearMeasurementSets: () => void

  // Get measurement set by ID (checks both saved and unsaved)
  getMeasurementSetById: (id: string) => MeasurementSet | undefined

  // Get measurement set by date
  getMeasurementSetByDate: (date: string) => MeasurementSet | undefined
}

export const useMeasurementSetStore = create<MeasurementSetState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeMeasurementSet: null,
      lastActiveMeasurementSetId: null,
      measurementSets: [],
      unsavedMeasurementSets: [],

      // Set active measurement set
      setActiveMeasurementSet: measurementSet =>
        set(state => {
          const newLastActiveId =
            measurementSet && !measurementSet.id.startsWith('temp-')
              ? measurementSet.id
              : state.lastActiveMeasurementSetId
          console.log('📦 setActiveMeasurementSet', {
            newActiveId: measurementSet?.id,
            isTemp: measurementSet?.id?.startsWith('temp-'),
            lastActiveId: newLastActiveId,
          })
          return {
            activeMeasurementSet: measurementSet,
            lastActiveMeasurementSetId: newLastActiveId,
          }
        }),

      // Set all measurement sets
      setMeasurementSets: sets =>
        set(state => {
          console.log('📦 setMeasurementSets called', {
            setsCount: sets.length,
            currentActive: state.activeMeasurementSet?.id,
            lastActiveId: state.lastActiveMeasurementSetId,
          })

          // If we have an active set, try to find it in the new list
          if (state.activeMeasurementSet) {
            const found = sets.find(s => s.id === state.activeMeasurementSet?.id)
            console.log('  ↳ Has active set, found in new list:', !!found)
            return {
              measurementSets: sets,
              activeMeasurementSet: found || state.activeMeasurementSet,
            }
          }
          // If no active set but we have a lastActiveMeasurementSetId, try to restore it
          if (state.lastActiveMeasurementSetId) {
            const lastActive = sets.find(s => s.id === state.lastActiveMeasurementSetId)
            console.log(
              '  ↳ Trying to restore lastActive:',
              state.lastActiveMeasurementSetId,
              'found:',
              !!lastActive
            )
            if (lastActive) {
              return {
                measurementSets: sets,
                activeMeasurementSet: lastActive,
              }
            }
          }
          // If no active set and no lastActive, but we have saved sets, auto-select the first one
          // This prevents creating a new card when logging back in
          if (sets.length > 0) {
            console.log('  ↳ No lastActive found, selecting first set')
            return {
              measurementSets: sets,
              activeMeasurementSet: sets[0],
            }
          }
          // No active set and no saved sets - keep as null
          console.log('  ↳ No sets available, keeping null')
          return {
            measurementSets: sets,
            activeMeasurementSet: null,
          }
        }),

      // Add unsaved measurement set (local only, not in database yet)
      addUnsavedMeasurementSet: measurementSet =>
        set(state => {
          console.log('📦 Zustand: addUnsavedMeasurementSet', {
            newSetId: measurementSet.id,
            currentUnsavedCount: state.unsavedMeasurementSets.length,
            currentUnsavedIds: state.unsavedMeasurementSets.map(s => s.id),
          })
          return {
            unsavedMeasurementSets: [measurementSet, ...state.unsavedMeasurementSets],
            // Auto-select the newly added unsaved set
            activeMeasurementSet: measurementSet,
          }
        }),

      // Remove unsaved measurement set (after saving to database)
      removeUnsavedMeasurementSet: tempId =>
        set(state => {
          console.log('📦 Zustand: removeUnsavedMeasurementSet', {
            removingId: tempId,
            currentUnsavedCount: state.unsavedMeasurementSets.length,
            currentUnsavedIds: state.unsavedMeasurementSets.map(s => s.id),
          })
          return {
            unsavedMeasurementSets: state.unsavedMeasurementSets.filter(s => s.id !== tempId),
          }
        }),

      // Update unsaved measurement set
      updateUnsavedMeasurementSet: (tempId, data) =>
        set(state => ({
          unsavedMeasurementSets: state.unsavedMeasurementSets.map(s =>
            s.id === tempId ? { ...s, ...data } : s
          ),
          // Update active set if it's the one being updated
          activeMeasurementSet:
            state.activeMeasurementSet?.id === tempId
              ? { ...state.activeMeasurementSet, ...data }
              : state.activeMeasurementSet,
        })),

      // Replace all unsaved cards with a new one (atomic operation to prevent race conditions)
      replaceAllUnsavedWithNew: measurementSet =>
        set(state => {
          console.log('📦 Zustand: replaceAllUnsavedWithNew', {
            newSetId: measurementSet.id,
            removingCount: state.unsavedMeasurementSets.length,
            removingIds: state.unsavedMeasurementSets.map(s => s.id),
          })
          return {
            // Replace entire array with single new card
            unsavedMeasurementSets: [measurementSet],
            // Set as active
            activeMeasurementSet: measurementSet,
          }
        }),

      // Add measurement set
      addMeasurementSet: measurementSet =>
        set(state => ({
          // Insert at the beginning since sets are sorted by date DESC
          measurementSets: [measurementSet, ...state.measurementSets],
          // Auto-select the newly added set
          activeMeasurementSet: measurementSet,
        })),

      // Update existing measurement set (already saved in database)
      updateMeasurementSet: (id, data) =>
        set(state => ({
          measurementSets: state.measurementSets.map(s => (s.id === id ? { ...s, ...data } : s)),
          // Update active set if it's the one being updated
          activeMeasurementSet:
            state.activeMeasurementSet?.id === id
              ? { ...state.activeMeasurementSet, ...data }
              : state.activeMeasurementSet,
        })),

      // Remove measurement set
      removeMeasurementSet: id =>
        set(state => {
          const filtered = state.measurementSets.filter(s => s.id !== id)
          const wasActive = state.activeMeasurementSet?.id === id

          return {
            measurementSets: filtered,
            // If we deleted the active set, clear the active set (enter new measurement mode)
            activeMeasurementSet: wasActive ? null : state.activeMeasurementSet,
          }
        }),

      // Clear all measurement sets (on logout)
      // NOTE: We intentionally keep lastActiveMeasurementSetId so we can restore
      // the previously active card when the user logs back in
      clearMeasurementSets: () =>
        set(state => {
          console.log(
            '📦 clearMeasurementSets called, keeping lastActiveId:',
            state.lastActiveMeasurementSetId
          )
          return {
            measurementSets: [],
            unsavedMeasurementSets: [],
            activeMeasurementSet: null,
            // Keep lastActiveMeasurementSetId for restoration after login
            lastActiveMeasurementSetId: state.lastActiveMeasurementSetId,
          }
        }),

      // Get measurement set by ID (checks both saved and unsaved)
      getMeasurementSetById: id => {
        const state = get()
        // Check saved sets first
        const saved = state.measurementSets.find(s => s.id === id)
        if (saved) return saved
        // Check unsaved sets
        return state.unsavedMeasurementSets.find(s => s.id === id)
      },

      // Get measurement set by date
      getMeasurementSetByDate: date => {
        const state = get()
        return state.measurementSets.find(s => s.set_date === date)
      },
    }),
    {
      name: 'calculeat-measurement-set-storage',
      // Only persist active measurement set ID and date for quick restoration
      // Don't persist temp (unsaved) cards - they should not survive page refresh
      // Also persist lastActiveMeasurementSetId to restore after logout/login
      partialize: state => ({
        activeMeasurementSet:
          state.activeMeasurementSet && !state.activeMeasurementSet.id.startsWith('temp-')
            ? {
                id: state.activeMeasurementSet.id,
                set_date: state.activeMeasurementSet.set_date,
              }
            : null,
        lastActiveMeasurementSetId: state.lastActiveMeasurementSetId,
      }),
    }
  )
)
