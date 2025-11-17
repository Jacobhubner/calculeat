/**
 * MacroDistributionCard - Macro distribution settings component
 * Allows users to set min/max percentages for fat, carbs, and protein
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Slider } from './ui/slider'
import { useProfileStore } from '@/stores/profileStore'

interface MacroDistributionCardProps {
  tdee?: number
}

export default function MacroDistributionCard({ tdee }: MacroDistributionCardProps) {
  const activeProfile = useProfileStore(state => state.activeProfile)

  // Fat: 13-39%
  const [fatMin, setFatMin] = useState(activeProfile?.fat_min_percent ?? 20)
  const [fatMax, setFatMax] = useState(activeProfile?.fat_max_percent ?? 30)

  // Carb: 35-68%
  const [carbMin, setCarbMin] = useState(activeProfile?.carb_min_percent ?? 40)
  const [carbMax, setCarbMax] = useState(activeProfile?.carb_max_percent ?? 50)

  // Protein: 19-26%
  const [proteinMin, setProteinMin] = useState(activeProfile?.protein_min_percent ?? 20)
  const [proteinMax, setProteinMax] = useState(activeProfile?.protein_max_percent ?? 25)

  // Sync with active profile when it changes
  useEffect(() => {
    if (activeProfile) {
      setFatMin(activeProfile.fat_min_percent ?? 20)
      setFatMax(activeProfile.fat_max_percent ?? 30)
      setCarbMin(activeProfile.carb_min_percent ?? 40)
      setCarbMax(activeProfile.carb_max_percent ?? 50)
      setProteinMin(activeProfile.protein_min_percent ?? 20)
      setProteinMax(activeProfile.protein_max_percent ?? 25)
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
      <CardContent className="space-y-8">
        {/* Fat Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Fett</label>
            <div className="text-sm font-semibold text-accent-600">
              {fatMin}% - {fatMax}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateFatGrams(fatMin)}g - {calculateFatGrams(fatMax)}g)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Minimum</span>
                <span className="text-xs font-medium text-neutral-700">{fatMin}%</span>
              </div>
              <Slider
                value={[fatMin]}
                onValueChange={([value]) => setFatMin(Math.min(value, fatMax))}
                min={13}
                max={39}
                step={1}
                className="cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Maximum</span>
                <span className="text-xs font-medium text-neutral-700">{fatMax}%</span>
              </div>
              <Slider
                value={[fatMax]}
                onValueChange={([value]) => setFatMax(Math.max(value, fatMin))}
                min={13}
                max={39}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Carb Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Kolhydrater</label>
            <div className="text-sm font-semibold text-primary-600">
              {carbMin}% - {carbMax}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateGrams(carbMin)}g - {calculateGrams(carbMax)}g)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Minimum</span>
                <span className="text-xs font-medium text-neutral-700">{carbMin}%</span>
              </div>
              <Slider
                value={[carbMin]}
                onValueChange={([value]) => setCarbMin(Math.min(value, carbMax))}
                min={35}
                max={68}
                step={1}
                className="cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Maximum</span>
                <span className="text-xs font-medium text-neutral-700">{carbMax}%</span>
              </div>
              <Slider
                value={[carbMax]}
                onValueChange={([value]) => setCarbMax(Math.max(value, carbMin))}
                min={35}
                max={68}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Protein Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-700">Protein</label>
            <div className="text-sm font-semibold text-blue-600">
              {proteinMin}% - {proteinMax}%
              {tdee && (
                <span className="text-neutral-500 font-normal ml-2">
                  ({calculateGrams(proteinMin)}g - {calculateGrams(proteinMax)}g)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Minimum</span>
                <span className="text-xs font-medium text-neutral-700">{proteinMin}%</span>
              </div>
              <Slider
                value={[proteinMin]}
                onValueChange={([value]) => setProteinMin(Math.min(value, proteinMax))}
                min={19}
                max={26}
                step={1}
                className="cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">Maximum</span>
                <span className="text-xs font-medium text-neutral-700">{proteinMax}%</span>
              </div>
              <Slider
                value={[proteinMax]}
                onValueChange={([value]) => setProteinMax(Math.max(value, proteinMin))}
                min={19}
                max={26}
                step={1}
                className="cursor-pointer"
              />
            </div>
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
