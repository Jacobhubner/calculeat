/**
 * ManualTDEEEntry - Formulär för manuell TDEE-inmatning
 * Använder startvikt från grundläggande information, endast TDEE och kroppsfettprocent (valfri)
 * Använder pending changes - sparas när disketten klickas
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface ManualTDEEEntryProps {
  initialWeight?: number
  tdee?: number
  bodyFatPercentage?: number
  onTDEEChange: (data: {
    tdee: number
    bodyFat?: number
    weight_kg?: number
    tdee_source: string
    tdee_calculated_at: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot: any
    calorie_goal: string
    calories_min: number
    calories_max: number
  }) => void
}

export default function ManualTDEEEntry({
  initialWeight,
  tdee: initialTdee,
  bodyFatPercentage: initialBodyFat,
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

    // Trigger pending changes
    onTDEEChange({
      tdee: tdeeNum,
      bodyFat: bodyFatNum,
      weight_kg: initialWeight,
      tdee_source: 'manual',
      tdee_calculated_at: new Date().toISOString(),
      tdee_calculation_snapshot: {
        weight_kg: initialWeight,
        calculated_tdee: tdeeNum,
        note: 'Manuellt angiven TDEE',
      },
      calorie_goal: 'Maintain weight',
      calories_min: tdeeNum * 0.97,
      calories_max: tdeeNum * 1.03,
    })
  }

  // Check if continue button should be enabled
  const tdeeNum = parseFloat(tdee)
  const canContinue = !isNaN(tdeeNum) && tdeeNum >= 500 && tdeeNum <= 10000

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ange TDEE manuellt</CardTitle>
        <CardDescription>
          Ange ditt TDEE om du redan känner till det från en annan källa eller beräkning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Show initial weight from basic info */}
          {initialWeight && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Startvikt:</strong> {initialWeight} kg (från Grundläggande information)
              </p>
            </div>
          )}

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

          {/* Continue Button */}
          <div className="pt-2">
            <Button onClick={handleContinue} disabled={!canContinue} className="w-full" size="lg">
              Fortsätt
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
