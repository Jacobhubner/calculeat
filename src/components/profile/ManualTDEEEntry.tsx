/**
 * ManualTDEEEntry - Formulär för manuell TDEE-inmatning
 * Använder startvikt från grundläggande information, endast TDEE och kroppsfettprocent (valfri)
 * Använder pending changes - sparas när disketten klickas
 *
 * BMR uppskattas med Mifflin-St Jeor från grunddatat (vikt/längd/ålder/kön)
 * så att BMR-beroende funktioner (TDEE-scenarier, Reversed Cunningham m.m.)
 * fungerar även utan att TDEE-kalkylatorn körts. Märks som uppskattad i
 * snapshot (estimated_bmr) — bmr_formula sätts INTE.
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Save } from 'lucide-react'
import { mifflinStJeor } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import type { Gender } from '@/lib/types'

interface ManualTDEEEntryProps {
  initialWeight?: number
  height?: number
  birthDate?: string
  gender?: Gender | ''
  tdee?: number
  bodyFatPercentage?: number
  showBodyFat?: boolean
  standalone?: boolean
  submitLabel?: string
  onTDEEChange: (data: {
    tdee: number
    bodyFat?: number
    bmr?: number
    baseline_bmr?: number
    weight_kg?: number
    tdee_source: string
    tdee_calculated_at: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot: any
    calorie_goal: string
    calories_min: number
    calories_max: number
    accumulated_at?: number
  }) => void
}

export default function ManualTDEEEntry({
  initialWeight,
  height,
  birthDate,
  gender,
  tdee: initialTdee,
  bodyFatPercentage: initialBodyFat,
  showBodyFat = true,
  standalone = true,
  submitLabel,
  onTDEEChange,
}: ManualTDEEEntryProps) {
  const [tdee, setTdee] = useState(initialTdee?.toString() || '')
  const [bodyFat, setBodyFat] = useState(initialBodyFat?.toString() || '')

  // Handle continue button click
  const handleContinue = () => {
    const tdeeNum = parseFloat(tdee)
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined

    // Validate TDEE
    if (isNaN(tdeeNum) || tdeeNum < 500 || tdeeNum > 10000) {
      alert('Vänligen ange ett giltigt TDEE-värde mellan 500 och 10000 kcal')
      return
    }

    // Validate body fat if provided
    if (bodyFat && (isNaN(bodyFatNum!) || bodyFatNum! < 0 || bodyFatNum! > 100)) {
      alert('Vänligen ange en giltig kroppsfettprocent mellan 0 och 100%')
      return
    }

    // Uppskatta BMR med Mifflin-St Jeor från grunddatat (om komplett)
    const age = birthDate ? calculateAge(birthDate) : null
    const estimatedBmr =
      initialWeight && height && age && (gender === 'male' || gender === 'female')
        ? mifflinStJeor({ weight: initialWeight, height, age, gender })
        : null

    // Trigger pending changes
    onTDEEChange({
      tdee: tdeeNum,
      bodyFat: bodyFatNum,
      ...(estimatedBmr ? { bmr: Math.round(estimatedBmr) } : {}),
      weight_kg: initialWeight,
      tdee_source: 'manual',
      tdee_calculated_at: new Date().toISOString(),
      tdee_calculation_snapshot: {
        weight_kg: initialWeight,
        calculated_tdee: tdeeNum,
        note: 'Manuellt angiven TDEE',
        ...(estimatedBmr
          ? {
              estimated_bmr: Math.round(estimatedBmr),
              estimated_bmr_formula: 'Mifflin-St Jeor equation',
            }
          : {}),
      },
      calorie_goal: 'Maintain weight',
      calories_min: tdeeNum * 0.97,
      calories_max: tdeeNum * 1.03,
    })
  }

  // Check if continue button should be enabled
  const tdeeNum = parseFloat(tdee)
  const canContinue = !isNaN(tdeeNum) && tdeeNum >= 500 && tdeeNum <= 10000

  const formContent = (
    <div className="space-y-4">
      {/* TDEE Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          TDEE (kcal/dag) <span className="text-red-600">*</span>
        </label>
        <input
          type="number"
          value={tdee}
          onChange={e => setTdee(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && canContinue) {
              handleContinue()
            }
          }}
          className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="2500"
          min="500"
          max="10000"
        />
      </div>

      {/* Body Fat Percentage (Optional) */}
      {showBodyFat && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Kroppsfettprocent (valfri)
          </label>
          <input
            type="number"
            value={bodyFat}
            onChange={e => setBodyFat(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && canContinue) {
                handleContinue()
              }
            }}
            className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="15"
            min="0"
            max="100"
            step="0.1"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Krävs för vissa BMR-formler om du vill beräkna TDEE senare
          </p>
        </div>
      )}

      {/* Submit Button */}
      {(standalone || canContinue) && (
        <div className="pt-2">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className={standalone ? 'w-full' : ''}
            size={standalone ? 'lg' : 'sm'}
          >
            {submitLabel ?? 'Fortsätt'}
            {standalone ? (
              <ArrowRight className="ml-2 h-4 w-4" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )

  if (!standalone) {
    return formContent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ange TDEE manuellt</CardTitle>
        <CardDescription>
          Ange ditt TDEE om du redan känner till det från en annan källa eller beräkning
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}
