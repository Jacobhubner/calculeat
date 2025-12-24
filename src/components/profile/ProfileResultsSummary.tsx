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

  const tdee = profile.tdee
  const caloriesMin = profile.calories_min
  const caloriesMax = profile.calories_max
  const calorieGoal = profile.calorie_goal

  // Don't show if we don't have at least TDEE
  if (!tdee) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5 text-success-600" />
          Resultat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* BMR */}
        {bmr && (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-neutral-700">BMR/RMR</p>
                <p className="text-xs text-neutral-500">Basmetabolism</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900">{Math.round(bmr)} kcal</p>
          </div>
        )}

        {/* TDEE */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-neutral-700">TDEE</p>
              <p className="text-xs text-neutral-500">Totalt energibehov</p>
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
