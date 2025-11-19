/**
 * MacroDistributionCard - Macro distribution settings component
 * Allows users to set min/max percentages for fat, carbs, and protein
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { RangeSlider } from './ui/RangeSlider'
import { useProfileStore } from '@/stores/profileStore'

interface MacroDistributionCardProps {
  tdee?: number
}

export default function MacroDistributionCard({ tdee }: MacroDistributionCardProps) {
  const activeProfile = useProfileStore(state => state.activeProfile)

  // Fat: 13-39%
  const [fatRange, setFatRange] = useState<[number, number]>([
    activeProfile?.fat_min_percent ?? 20,
    activeProfile?.fat_max_percent ?? 30,
  ])

  // Carb: 35-68%
  const [carbRange, setCarbRange] = useState<[number, number]>([
    activeProfile?.carb_min_percent ?? 40,
    activeProfile?.carb_max_percent ?? 50,
  ])

  // Protein: 19-26%
  const [proteinRange, setProteinRange] = useState<[number, number]>([
    activeProfile?.protein_min_percent ?? 20,
    activeProfile?.protein_max_percent ?? 25,
  ])

  // Sync with active profile when it changes
  useEffect(() => {
    if (activeProfile) {
      setFatRange([activeProfile.fat_min_percent ?? 20, activeProfile.fat_max_percent ?? 30])
      setCarbRange([activeProfile.carb_min_percent ?? 40, activeProfile.carb_max_percent ?? 50])
      setProteinRange([
        activeProfile.protein_min_percent ?? 20,
        activeProfile.protein_max_percent ?? 25,
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id])

  // Calculate grams from percentages
  const calculateGrams = (percentage: number) => {
    if (!tdee) return null
    // Calories per gram: Fat = 9, Carb = 4, Protein = 4
    return Math.round((tdee * (percentage / 100)) / 4) // Using 4 as default for carbs/protein
  }

  const calculateFatGrams = (percentage: number) => {
    if (!tdee) return null
    return Math.round((tdee * (percentage / 100)) / 9)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Makrofördelning
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Ange önskat spann för varje makronutrient. Systemet kommer använda dessa värden för att
          beräkna dina måltider.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fat Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Fett</label>
            <div className="text-sm font-semibold text-accent-600">
              {fatRange[0]}% - {fatRange[1]}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateFatGrams(fatRange[0])}g - {calculateFatGrams(fatRange[1])}g)
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <RangeSlider value={fatRange} onValueChange={setFatRange} min={13} max={39} step={1} />
          </div>
        </div>

        {/* Carb Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Kolhydrater</label>
            <div className="text-sm font-semibold text-primary-600">
              {carbRange[0]}% - {carbRange[1]}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateGrams(carbRange[0])}g - {calculateGrams(carbRange[1])}g)
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <RangeSlider
              value={carbRange}
              onValueChange={setCarbRange}
              min={35}
              max={68}
              step={1}
            />
          </div>
        </div>

        {/* Protein Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Protein</label>
            <div className="text-sm font-semibold text-blue-600">
              {proteinRange[0]}% - {proteinRange[1]}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateGrams(proteinRange[0])}g - {calculateGrams(proteinRange[1])}g)
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <RangeSlider
              value={proteinRange}
              onValueChange={setProteinRange}
              min={19}
              max={26}
              step={1}
            />
          </div>
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-neutral-700 leading-relaxed">
            💡 <strong>Tips:</strong> Dessa procentandelar används för att beräkna dina
            makrofördelningar. De behöver inte summera till 100% - du väljer önskade spann för varje
            makro oberoende.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
