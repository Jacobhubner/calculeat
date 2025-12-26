/**
 * MetabolicInfo - Visa metabolisk information inklusive Adaptive Thermogenesis
 * Visas i sidopanelen under ProfileResultsSummary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Flame, Info, TrendingDown, TrendingUp } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import { calculateATPercent } from '@/lib/calculations/adaptiveThermogenesis'

interface MetabolicInfoProps {
  profile: Profile | null
}

export default function MetabolicInfo({ profile }: MetabolicInfoProps) {
  if (!profile) return null

  // Only show if we have baseline_bmr (AT is enabled)
  if (!profile.baseline_bmr) return null

  // Check if TDEE was manually entered
  const isTdeeManual = profile.tdee_source === 'manual'

  // Calculate current expected BMR (based on current weight/age/gender)
  let bmrExpected: number | null = null
  if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
    const age = calculateAge(profile.birth_date)
    bmrExpected = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
  }

  const baselineBMR = profile.baseline_bmr
  const accumulatedAT = profile.accumulated_at || 0
  const atPercent = calculateATPercent(accumulatedAT, baselineBMR)

  // Calculate effective BMR
  const bmrEffective = bmrExpected ? bmrExpected + accumulatedAT : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Metabolisk Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Baseline BMR */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium text-neutral-700">Baseline BMR</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Fast referenspunkt för AT
                {isTdeeManual && (
                  <span className="block mt-0.5 text-neutral-400">Baserat på Mifflin-St Jeor</span>
                )}
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold text-neutral-900">{Math.round(baselineBMR)} kcal</p>
        </div>

        {/* Current BMR (expected) */}
        {bmrExpected && (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">Aktuell BMR (beräknad)</p>
              <p className="text-xs text-neutral-500">Baserat på nuvarande vikt</p>
            </div>
            <p className="text-sm font-semibold text-neutral-900">{Math.round(bmrExpected)} kcal</p>
          </div>
        )}

        {/* AT Impact */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium text-neutral-700">Metabolisk anpassning (AT)</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Energianpassning utöver viktförändring
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p
              className={`text-sm font-semibold flex items-center gap-1 ${
                accumulatedAT < 0 ? 'text-blue-600' : accumulatedAT > 0 ? 'text-orange-600' : 'text-neutral-600'
              }`}
            >
              {accumulatedAT < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : accumulatedAT > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : null}
              {accumulatedAT > 0 ? '+' : ''}
              {Math.round(accumulatedAT)} kcal/dag
            </p>
            <p className="text-xs text-neutral-500">({atPercent > 0 ? '+' : ''}{atPercent.toFixed(1)}%)</p>
          </div>
        </div>

        {/* Interpretation text */}
        {accumulatedAT !== 0 && (
          <div className={`p-2 rounded-lg text-xs ${accumulatedAT < 0 ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'}`}>
            {accumulatedAT < 0
              ? 'Din metabolism har sänkts för att spara energi vid kaloriunderskott'
              : 'Din metabolism har ökat vid kaloriöverskott'}
          </div>
        )}

        {/* Effective BMR */}
        {bmrEffective && (
          <>
            <Separator />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-700">Effektiv BMR</p>
                <p className="text-xs text-neutral-500">BMR med AT-anpassning</p>
              </div>
              <p className="text-sm font-bold text-primary-600">{Math.round(bmrEffective)} kcal</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
