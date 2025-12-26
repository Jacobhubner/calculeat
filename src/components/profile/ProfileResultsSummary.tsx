/**
 * ProfileResultsSummary - Visa BMR, TDEE och kaloriintervall för aktiv profil
 * Visas under profilkortet i sidopanelen
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Flame, Target } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'

interface ProfileResultsSummaryProps {
  profile: Profile | null
}

export default function ProfileResultsSummary({ profile }: ProfileResultsSummaryProps) {
  if (!profile) return null

  // Calculate BMR using Mifflin-St Jeor if we have basic info
  let bmr: number | null = null
  if (profile.initial_weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
    const age = calculateAge(profile.birth_date)
    bmr = calculateBMR(profile.initial_weight_kg, profile.height_cm, age, profile.gender)
  }

  // Calculate current BMR (based on current weight)
  let currentBMR: number | null = null
  if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
    const age = calculateAge(profile.birth_date)
    currentBMR = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
  }

  const baseTdee = profile.tdee
  const calorieGoal = profile.calorie_goal

  // Calculate effective TDEE if AT is enabled
  let tdee = baseTdee
  let isAdjustedForAT = false

  if (profile.baseline_bmr && currentBMR && baseTdee) {
    // Calculate PAL factor from original TDEE and baseline BMR
    const palFactor = baseTdee / profile.baseline_bmr

    // Calculate effective BMR (current BMR + AT)
    const accumulatedAT = profile.accumulated_at || 0
    const effectiveBMR = currentBMR + accumulatedAT

    // Calculate effective TDEE using PAL factor
    tdee = effectiveBMR * palFactor
    isAdjustedForAT = accumulatedAT !== 0
  }

  // Use calories_min/max from profile (includes pending changes via mergedProfile)
  // Fallback to maintenance range for legacy profiles without these values
  const caloriesMin = profile.calories_min ?? (tdee ? tdee * 0.97 : undefined)
  const caloriesMax = profile.calories_max ?? (tdee ? tdee * 1.03 : undefined)

  // Check if TDEE was manually entered (shows Mifflin text under BMR)
  const isTdeeManual = profile.tdee_source === 'manual'

  // Don't show if we don't have at least TDEE
  if (!baseTdee) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5 text-success-600" />
          Resultat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* TDEE */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-neutral-700">TDEE</p>
              <p className="text-xs text-neutral-500">
                Totalt energibehov
                {isAdjustedForAT && (
                  <span className="block mt-0.5 text-neutral-400">Justerat för AT</span>
                )}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-neutral-900">{Math.round(tdee)} kcal</p>
        </div>

        {/* Calorie Range */}
        {caloriesMin && caloriesMax && (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent-500" />
              <div>
                <p className="text-sm font-medium text-neutral-700">Kaloriintervall</p>
                {calorieGoal && (
                  <p className="text-xs text-neutral-500">
                    {calorieGoal === 'Maintain weight'
                      ? 'Bibehåll vikt'
                      : calorieGoal === 'Weight loss'
                        ? 'Viktminskning'
                        : calorieGoal === 'Weight gain'
                          ? 'Viktökning'
                          : calorieGoal}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {Math.round(caloriesMin)}–{Math.round(caloriesMax)} kcal
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
