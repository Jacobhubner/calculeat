import { useMemo } from 'react'
import type { UserProfile } from '@/lib/types'

export type TDEEStatus = 'current' | 'outdated' | 'stale' | 'manual' | 'missing'

export interface TDEEStatusInfo {
  status: TDEEStatus
  label: string
  color: 'green' | 'yellow' | 'orange' | 'blue' | 'gray'
  message: string
  shouldUpdate: boolean
  daysOld?: number
  weightChanged?: boolean
  weightDiff?: number
}

/**
 * Hook to determine TDEE status based on calculation metadata
 * Returns status, label, color, and whether user should update TDEE
 */
export function useTDEEStatus(profile: UserProfile | null | undefined): TDEEStatusInfo {
  return useMemo(() => {
    // No profile or no TDEE
    if (!profile || !profile.tdee) {
      return {
        status: 'missing',
        label: 'Saknas',
        color: 'gray',
        message: 'Du har inte beräknat ditt TDEE ännu.',
        shouldUpdate: true,
      }
    }

    // Manual TDEE - always show as manual
    if (profile.tdee_source === 'manual') {
      return {
        status: 'manual',
        label: 'Manuell',
        color: 'blue',
        message: 'TDEE angivet manuellt.',
        shouldUpdate: false,
      }
    }

    // Check if we have calculation metadata
    const calculatedAt = profile.tdee_calculated_at
    const snapshot = profile.tdee_calculation_snapshot

    // Legacy TDEE without metadata
    if (!calculatedAt || !snapshot) {
      return {
        status: 'stale',
        label: 'Gammal',
        color: 'orange',
        message: 'TDEE beräknad innan metadata-tracking infördes. Rekommenderar omberäkning.',
        shouldUpdate: true,
      }
    }

    // Calculate days since calculation
    const calculatedDate = new Date(calculatedAt)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - calculatedDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check weight change
    const weightAtCalculation = snapshot.weight_kg || 0
    const currentWeight = profile.weight_kg || 0
    const weightDiff = Math.abs(currentWeight - weightAtCalculation)
    const weightChanged = weightDiff > 2 // More than 2kg change

    // Determine status based on age and weight change
    if (weightChanged) {
      return {
        status: 'outdated',
        label: 'Föråldrad',
        color: 'orange',
        message: `Din vikt har ändrats med ${weightDiff.toFixed(1)} kg sedan TDEE beräknades. Uppdatera för bästa resultat.`,
        shouldUpdate: true,
        daysOld: daysDiff,
        weightChanged: true,
        weightDiff,
      }
    }

    if (daysDiff > 30) {
      return {
        status: 'stale',
        label: 'Kan uppdateras',
        color: 'yellow',
        message: `TDEE beräknad för ${daysDiff} dagar sedan. Överväg att uppdatera.`,
        shouldUpdate: false,
        daysOld: daysDiff,
      }
    }

    if (daysDiff > 7) {
      return {
        status: 'current',
        label: 'Aktuell',
        color: 'green',
        message: `TDEE beräknad för ${daysDiff} dagar sedan.`,
        shouldUpdate: false,
        daysOld: daysDiff,
      }
    }

    // Recent calculation (< 7 days)
    return {
      status: 'current',
      label: 'Aktuell',
      color: 'green',
      message: daysDiff === 0
        ? 'TDEE beräknad idag.'
        : `TDEE beräknad för ${daysDiff} ${daysDiff === 1 ? 'dag' : 'dagar'} sedan.`,
      shouldUpdate: false,
      daysOld: daysDiff,
    }
  }, [profile])
}
