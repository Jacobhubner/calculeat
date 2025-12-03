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

  // All user measurement sets (saved in database)
  measurementSets: MeasurementSet[]
  setMeasurementSets: (sets: MeasurementSet[]) => void

  // Unsaved measurement sets (local only, not yet in database)
  unsavedMeasurementSets: MeasurementSet[]
  addUnsavedMeasurementSet: (measurementSet: MeasurementSet) => void
  removeUnsavedMeasurementSet: (tempId: string) => void
  updateUnsavedMeasurementSet: (tempId: string, data: Partial<MeasurementSet>) => void

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
      measurementSets: [],
      unsavedMeasurementSets: [],

      // Set active measurement set
      setActiveMeasurementSet: measurementSet => set({ activeMeasurementSet: measurementSet }),

      // Set all measurement sets
      setMeasurementSets: sets =>
        set(state => ({
          measurementSets: sets,
          // If we have an active set, try to update it from the new list
          // Otherwise keep it as null (new measurement mode)
          activeMeasurementSet: state.activeMeasurementSet
            ? sets.find(s => s.id === state.activeMeasurementSet?.id) || state.activeMeasurementSet
            : null,
        })),

      // Add unsaved measurement set (local only, not in database yet)
      addUnsavedMeasurementSet: measurementSet =>
        set(state => ({
          unsavedMeasurementSets: [measurementSet, ...state.unsavedMeasurementSets],
          // Auto-select the newly added unsaved set
          activeMeasurementSet: measurementSet,
        })),

      // Remove unsaved measurement set (after saving to database)
      removeUnsavedMeasurementSet: tempId =>
        set(state => ({
          unsavedMeasurementSets: state.unsavedMeasurementSets.filter(s => s.id !== tempId),
        })),

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
      clearMeasurementSets: () =>
        set({
          measurementSets: [],
          unsavedMeasurementSets: [],
          activeMeasurementSet: null,
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
      partialize: state => ({
        activeMeasurementSet: state.activeMeasurementSet
          ? {
              id: state.activeMeasurementSet.id,
              set_date: state.activeMeasurementSet.set_date,
            }
          : null,
      }),
    }
  )
)
