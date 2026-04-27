/**
 * MacroDistributionCard - Macro distribution settings component
 * Allows users to set min/max percentages for fat, carbs, and protein
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ChevronDown, PieChart } from 'lucide-react'
import { RangeSlider } from './ui/RangeSlider'
import { useTranslation } from 'react-i18next'

interface MacroDistributionCardProps {
  caloriesMin?: number
  caloriesMax?: number
  fatMinPercent?: number
  fatMaxPercent?: number
  carbMinPercent?: number
  carbMaxPercent?: number
  proteinMinPercent?: number
  proteinMaxPercent?: number
  onMacroChange?: (macros: {
    fatMin: number
    fatMax: number
    carbMin: number
    carbMax: number
    proteinMin: number
    proteinMax: number
  }) => void
}

export default function MacroDistributionCard({
  caloriesMin,
  caloriesMax,
  fatMinPercent,
  fatMaxPercent,
  carbMinPercent,
  carbMaxPercent,
  proteinMinPercent,
  proteinMaxPercent,
  onMacroChange,
}: MacroDistributionCardProps) {
  const { t } = useTranslation('profile')
  const [isOpen, setIsOpen] = useState(false)
  // NNR 2023 defaults - Fat: 25-40%, Carb: 45-60%, Protein: 10-20%
  const [fatRange, setFatRange] = useState<[number, number]>([
    fatMinPercent ?? 25,
    fatMaxPercent ?? 40,
  ])

  const [carbRange, setCarbRange] = useState<[number, number]>([
    carbMinPercent ?? 45,
    carbMaxPercent ?? 60,
  ])

  const [proteinRange, setProteinRange] = useState<[number, number]>([
    proteinMinPercent ?? 10,
    proteinMaxPercent ?? 20,
  ])

  const userHasInteracted = useRef(false)

  // Sync with props when they change (includes pending changes)
  useEffect(() => {
    userHasInteracted.current = false
    setFatRange([fatMinPercent ?? 25, fatMaxPercent ?? 40])
    setCarbRange([carbMinPercent ?? 45, carbMaxPercent ?? 60])
    setProteinRange([proteinMinPercent ?? 10, proteinMaxPercent ?? 20])
  }, [
    fatMinPercent,
    fatMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
  ])

  // Notify parent component when macro ranges change (only after user interaction)
  useEffect(() => {
    if (onMacroChange && userHasInteracted.current) {
      onMacroChange({
        fatMin: fatRange[0],
        fatMax: fatRange[1],
        carbMin: carbRange[0],
        carbMax: carbRange[1],
        proteinMin: proteinRange[0],
        proteinMax: proteinRange[1],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatRange, carbRange, proteinRange])

  // Calculate grams from percentages - matching Google Sheets formula
  // Formula: calories * percent / 100 / kcal_per_gram
  const calculateMinGrams = (percentage: number, kcalPerGram: number) => {
    if (!caloriesMin) return null
    return Math.round((caloriesMin * percentage) / 100 / kcalPerGram)
  }

  const calculateMaxGrams = (percentage: number, kcalPerGram: number) => {
    if (!caloriesMax) return null
    return Math.round((caloriesMax * percentage) / 100 / kcalPerGram)
  }

  // Calculate total percentage (using midpoints of ranges)
  // ALWAYS use slider values (live) for immediate feedback
  const fatMid = (fatRange[0] + fatRange[1]) / 2
  const carbMid = (carbRange[0] + carbRange[1]) / 2
  const proteinMid = (proteinRange[0] + proteinRange[1]) / 2
  const totalPercentage = Math.round(fatMid + carbMid + proteinMid)

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-lg leading-snug">
              <PieChart className="h-5 w-5 text-primary-600" />
              {t('macroDistribution.title')}
            </CardTitle>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6 pt-0">
          {/* Fat Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">
                {t('macroDistribution.fat')}
              </label>
              <div className="text-sm font-semibold" style={{ color: '#f5c518' }}>
                {fatRange[0].toFixed(0)}% - {fatRange[1].toFixed(0)}%
                {caloriesMin && caloriesMax && (
                  <span className="text-neutral-500 font-normal ml-2 text-xs">
                    ({calculateMinGrams(fatRange[0], 9)}g - {calculateMaxGrams(fatRange[1], 9)}g)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <RangeSlider
                value={fatRange}
                onValueChange={v => {
                  userHasInteracted.current = true
                  setFatRange(v)
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Carb Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">
                {t('macroDistribution.carbs')}
              </label>
              <div className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                {carbRange[0].toFixed(0)}% - {carbRange[1].toFixed(0)}%
                {caloriesMin && caloriesMax && (
                  <span className="text-neutral-500 font-normal ml-2 text-xs">
                    ({calculateMinGrams(carbRange[0], 4)}g - {calculateMaxGrams(carbRange[1], 4)}g)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <RangeSlider
                value={carbRange}
                onValueChange={v => {
                  userHasInteracted.current = true
                  setCarbRange(v)
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Protein Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">
                {t('macroDistribution.protein')}
              </label>
              <div className="text-sm font-semibold" style={{ color: '#f43f5e' }}>
                {proteinRange[0].toFixed(0)}% - {proteinRange[1].toFixed(0)}%
                {caloriesMin && caloriesMax && (
                  <span className="text-neutral-500 font-normal ml-2 text-xs">
                    ({calculateMinGrams(proteinRange[0], 4)}g -{' '}
                    {calculateMaxGrams(proteinRange[1], 4)}g)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <RangeSlider
                value={proteinRange}
                onValueChange={v => {
                  userHasInteracted.current = true
                  setProteinRange(v)
                }}
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
                {t('macroDistribution.total')}
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
                  ? t('macroDistribution.tooLow')
                  : t('macroDistribution.nearHundred')}
              </p>
            )}
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-neutral-700 leading-relaxed">
              💡 <strong>Tips:</strong> {t('macroDistribution.tip')}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
