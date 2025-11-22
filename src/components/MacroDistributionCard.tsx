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
  onMacroChange?: (macros: {
    fatMin: number
    fatMax: number
    carbMin: number
    carbMax: number
    proteinMin: number
    proteinMax: number
  }) => void
}

export default function MacroDistributionCard({ tdee, onMacroChange }: MacroDistributionCardProps) {
  const activeProfile = useProfileStore(state => state.activeProfile)

  // NNR 2023 defaults - Fat: 25-40%, Carb: 45-60%, Protein: 10-20%
  const [fatRange, setFatRange] = useState<[number, number]>([
    activeProfile?.fat_min_percent ?? 25,
    activeProfile?.fat_max_percent ?? 40,
  ])

  const [carbRange, setCarbRange] = useState<[number, number]>([
    activeProfile?.carb_min_percent ?? 45,
    activeProfile?.carb_max_percent ?? 60,
  ])

  const [proteinRange, setProteinRange] = useState<[number, number]>([
    activeProfile?.protein_min_percent ?? 10,
    activeProfile?.protein_max_percent ?? 20,
  ])

  // Sync with active profile when it changes
  useEffect(() => {
    if (activeProfile) {
      setFatRange([activeProfile.fat_min_percent ?? 25, activeProfile.fat_max_percent ?? 40])
      setCarbRange([activeProfile.carb_min_percent ?? 45, activeProfile.carb_max_percent ?? 60])
      setProteinRange([
        activeProfile.protein_min_percent ?? 10,
        activeProfile.protein_max_percent ?? 20,
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id])

  // Notify parent component when macro ranges change
  useEffect(() => {
    if (onMacroChange) {
      onMacroChange({
        fatMin: fatRange[0],
        fatMax: fatRange[1],
        carbMin: carbRange[0],
        carbMax: carbRange[1],
        proteinMin: proteinRange[0],
        proteinMax: proteinRange[1],
      })
    }
  }, [fatRange, carbRange, proteinRange, onMacroChange])

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

  // Calculate total percentage (using midpoints of ranges)
  const fatMid = (fatRange[0] + fatRange[1]) / 2
  const carbMid = (carbRange[0] + carbRange[1]) / 2
  const proteinMid = (proteinRange[0] + proteinRange[1]) / 2
  const totalPercentage = Math.round(fatMid + carbMid + proteinMid)

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
            <RangeSlider value={fatRange} onValueChange={setFatRange} min={0} max={100} step={1} />
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
              min={0}
              max={100}
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
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>

        {/* Total percentage indicator */}
        <div
          className={`p-3 rounded-lg border-2 ${
            totalPercentage === 100
              ? 'bg-green-50 border-green-300'
              : totalPercentage < 95 || totalPercentage > 105
                ? 'bg-red-50 border-red-300'
                : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              Total (genomsnitt av intervaller):
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-bold ${
                  totalPercentage === 100
                    ? 'text-green-700'
                    : totalPercentage < 95 || totalPercentage > 105
                      ? 'text-red-700'
                      : 'text-yellow-700'
                }`}
              >
                {totalPercentage}%
              </span>
              <span className="text-xl">
                {totalPercentage === 100
                  ? '✓'
                  : totalPercentage < 95 || totalPercentage > 105
                    ? '⚠️'
                    : '~'}
              </span>
            </div>
          </div>
          {totalPercentage !== 100 && (
            <p className="text-xs mt-2 text-neutral-600">
              {totalPercentage < 95 || totalPercentage > 105
                ? 'Rekommenderat: Justera intervallen så genomsnittet närmar sig 100%.'
                : 'Nära 100% - justera gärna för optimal fördelning.'}
            </p>
          )}
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-neutral-700 leading-relaxed">
            💡 <strong>Tips:</strong> Standardvärdena följer NNR 2023-rekommendationerna (Fett:
            25-40%, Kolhydrater: 45-60%, Protein: 10-20%). Du kan justera dessa fritt mellan 0-100%
            för varje makronutrient.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
