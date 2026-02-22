/**
 * ProfileResultsSummary - Visa BMR, TDEE och kaloriintervall för aktiv profil
 * Visas i sidopanelen på profilsidan
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Flame, Target } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { calculateBMRWithFormula } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'

interface ProfileResultsSummaryProps {
  profile: Profile | null
}

export default function ProfileResultsSummary({ profile }: ProfileResultsSummaryProps) {
  if (!profile) return null

  // Calculate BMR using stored formula (or default to Mifflin-St Jeor)
  const bmrFormula = profile.bmr_formula || 'Mifflin-St Jeor equation'
  let bmr: number | null = null

  // Convert formula name to Swedish short form
  const getFormulaDisplayName = (formula: string): string => {
    const formulaMap: Record<string, string> = {
      'Mifflin-St Jeor equation': 'Mifflin-St Jeor',
      'Cunningham equation': 'Cunningham',
      'Oxford/Henry equation': 'Oxford/Henry',
      'Schofield equation': 'Schofield',
      'Revised Harris-Benedict equation': 'Harris-Benedict',
      'Original Harris-Benedict equation': 'Harris-Benedict (1919)',
      'MacroFactor standard equation': 'MacroFactor',
      'MacroFactor FFM equation': 'MacroFactor FFM',
      'MacroFactor athlete equation': 'MacroFactor Athlete',
      'Fitness Stuff Podcast equation': 'Fitness Stuff Podcast',
    }
    return formulaMap[formula] || formula
  }

  // Get BMR/RMR label based on formula type
  const getMetabolicRateLabel = (formula: string): string => {
    const typeMap: Record<string, string> = {
      'Mifflin-St Jeor equation': 'RMR',
      'Cunningham equation': 'RMR',
      'Oxford/Henry equation': 'BMR',
      'Schofield equation': 'BMR',
      'Revised Harris-Benedict equation': 'BMR',
      'Original Harris-Benedict equation': 'BMR',
      'MacroFactor standard equation': 'BMR/RMR',
      'MacroFactor FFM equation': 'RMR',
      'MacroFactor athlete equation': 'RMR',
      'Fitness Stuff Podcast equation': 'RMR',
    }
    return typeMap[formula] || 'BMR/RMR'
  }

  if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
    const age = calculateAge(profile.birth_date)
    const bmrParams = {
      weight: profile.weight_kg,
      height: profile.height_cm,
      age,
      gender: profile.gender,
      bodyFatPercentage: profile.body_fat_percentage,
    }
    bmr = calculateBMRWithFormula(bmrFormula, bmrParams)
  }

  const tdee = profile.tdee
  const calorieGoal = profile.calorie_goal

  // Use calories_min/max from profile (includes pending changes via mergedProfile)
  // Fallback to maintenance range for legacy profiles without these values
  const caloriesMin = profile.calories_min ?? (tdee ? tdee * 0.97 : undefined)
  const caloriesMax = profile.calories_max ?? (tdee ? tdee * 1.03 : undefined)

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
        {/* BMR/RMR */}
        {bmr && (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  {getMetabolicRateLabel(bmrFormula)}
                </p>
                <p className="text-xs text-neutral-500">Basalmetabolism</p>
                <p className="text-xs text-neutral-400">{getFormulaDisplayName(bmrFormula)}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
              {Math.round(bmr)} kcal
            </p>
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
