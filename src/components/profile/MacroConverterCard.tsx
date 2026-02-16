/**
 * MacroConverterCard - Konvertera mellan olika makroenheter
 * Fristående kalkylator som visar resultat baserat på TDEE och energimål
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Flame, Target } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface MacroConverterCardProps {
  profile: Profile | null
}

type MacroType = 'protein' | 'fat' | 'carbs' | ''
type UnitType = 'percent' | 'grams' | 'kcal' | 'g_per_kg' | 'g_per_kg_ffm' | ''

interface ConversionResult {
  percent: number
  grams: number
  kcal: number
  gPerKg: number
  gPerKgFFM?: number
}

interface EnergyGoalResult {
  percent: number | { min: number; max: number }
  grams: number | { min: number; max: number }
  kcal: number | { min: number; max: number }
  gPerKg: number | { min: number; max: number }
  gPerKgFFM?: number | { min: number; max: number }
}

export default function MacroConverterCard({ profile }: MacroConverterCardProps) {
  const [value, setValue] = useState<string>('')
  const [macro, setMacro] = useState<MacroType>('')
  const [unit, setUnit] = useState<UnitType>('')

  // Check if we have required data
  const hasTDEE = !!profile?.tdee
  const hasWeight = !!profile?.weight_kg
  const hasBodyFat = !!profile?.body_fat_percentage
  const hasEnergyGoal = !!profile?.calories_min && !!profile?.calories_max

  // Calculate lean body mass if body fat is available
  const leanMass = useMemo(() => {
    if (!hasWeight || !hasBodyFat || !profile?.weight_kg || !profile?.body_fat_percentage) {
      return undefined
    }
    return profile.weight_kg * (1 - profile.body_fat_percentage / 100)
  }, [hasWeight, hasBodyFat, profile?.weight_kg, profile?.body_fat_percentage])

  // Get calories per gram for selected macro
  const kcalPerGram = useMemo(() => {
    if (!macro) return 4
    return macro === 'fat' ? 9 : 4 // protein and carbs = 4, fat = 9
  }, [macro])

  // Parse numeric value
  const numericValue = useMemo(() => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }, [value])

  // Convert input value to grams (base unit for all conversions)
  const gramsFromInput = useMemo(() => {
    if (!hasTDEE || !hasWeight || !profile?.tdee || !profile?.weight_kg || numericValue === 0)
      return 0

    switch (unit) {
      case 'percent':
        return (profile.tdee * (numericValue / 100)) / kcalPerGram
      case 'grams':
        return numericValue
      case 'kcal':
        return numericValue / kcalPerGram
      case 'g_per_kg':
        return numericValue * profile.weight_kg
      case 'g_per_kg_ffm':
        if (!leanMass) return 0
        return numericValue * leanMass
      default:
        return 0
    }
  }, [numericValue, unit, hasTDEE, hasWeight, profile, leanMass, kcalPerGram])

  // Calculate TDEE results
  const tdeeResults = useMemo<ConversionResult | null>(() => {
    if (
      !hasTDEE ||
      !hasWeight ||
      !profile?.tdee ||
      !profile?.weight_kg ||
      gramsFromInput === 0 ||
      !macro ||
      !unit
    )
      return null

    const grams = gramsFromInput
    const kcal = grams * kcalPerGram
    const percent = (kcal / profile.tdee) * 100
    const gPerKg = grams / profile.weight_kg
    const gPerKgFFM = leanMass ? grams / leanMass : undefined

    return {
      percent,
      grams,
      kcal,
      gPerKg,
      gPerKgFFM,
    }
  }, [hasTDEE, hasWeight, profile, gramsFromInput, kcalPerGram, leanMass, macro, unit])

  // Calculate Energy Goal results with proper interval logic
  const energyGoalResults = useMemo<EnergyGoalResult | null>(() => {
    if (
      !hasEnergyGoal ||
      !hasWeight ||
      !tdeeResults ||
      !profile?.calories_min ||
      !profile?.calories_max ||
      !profile?.weight_kg ||
      !macro ||
      !unit
    )
      return null

    const grams = gramsFromInput
    const kcal = grams * kcalPerGram

    if (unit === 'percent') {
      // When user enters %, calculate intervals for all other units
      const kcalMin = profile.calories_min * (numericValue / 100)
      const kcalMax = profile.calories_max * (numericValue / 100)
      const gramsMin = kcalMin / kcalPerGram
      const gramsMax = kcalMax / kcalPerGram
      const gPerKgMin = gramsMin / profile.weight_kg
      const gPerKgMax = gramsMax / profile.weight_kg

      return {
        percent: numericValue, // Same as input
        grams: { min: gramsMin, max: gramsMax },
        kcal: { min: kcalMin, max: kcalMax },
        gPerKg: { min: gPerKgMin, max: gPerKgMax },
        gPerKgFFM: leanMass ? { min: gramsMin / leanMass, max: gramsMax / leanMass } : undefined,
      }
    } else {
      // When user enters fixed value, show same value
      // BUT % should show interval since same kcal is different % of min vs max
      const percentMin = (kcal / profile.calories_max) * 100 // Lower % = higher calories
      const percentMax = (kcal / profile.calories_min) * 100 // Higher % = lower calories

      return {
        percent: { min: percentMin, max: percentMax }, // % as interval
        grams, // Fixed value
        kcal, // Fixed value
        gPerKg: grams / profile.weight_kg, // Fixed value
        gPerKgFFM: leanMass ? grams / leanMass : undefined, // Fixed value
      }
    }
  }, [
    hasEnergyGoal,
    hasWeight,
    tdeeResults,
    profile,
    unit,
    numericValue,
    gramsFromInput,
    kcalPerGram,
    leanMass,
    macro,
  ])

  // Show error messages if required data is missing
  if (!hasTDEE) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Omvandling av makrovärden</CardTitle>
          <CardDescription>Konvertera mellan olika makroenheter</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            Du måste ange TDEE i din profil först för att använda denna kalkylator.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasWeight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Omvandling av makrovärden</CardTitle>
          <CardDescription>Konvertera mellan olika makroenheter</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            Du måste ange kroppsvikt i din profil först för att använda denna kalkylator.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omvandling av makrovärden</CardTitle>
        <CardDescription>Konvertera mellan olika makroenheter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section - Ordning: Makro, Värde, Enhet */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="macro">Makro</Label>
            <Select id="macro" value={macro} onChange={e => setMacro(e.target.value as MacroType)}>
              <option value="">Välj makro...</option>
              <option value="protein">Protein</option>
              <option value="fat">Fett</option>
              <option value="carbs">Kolhydrater</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Värde</Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Ange värde..."
              min={0}
              step="any"
            />
          </div>
          <div>
            <Label htmlFor="unit">Enhet</Label>
            <Select id="unit" value={unit} onChange={e => setUnit(e.target.value as UnitType)}>
              <option value="">Välj enhet...</option>
              <option value="percent">%</option>
              <option value="grams">gram</option>
              <option value="kcal">kcal</option>
              <option value="g_per_kg">g/kg kroppsvikt</option>
              {hasBodyFat && <option value="g_per_kg_ffm">g/kg fettfri massa</option>}
            </Select>
          </div>
        </div>

        {/* Warning for high percentage */}
        {unit === 'percent' && numericValue > 100 && (
          <div className="text-xs text-amber-600 flex items-start gap-1">
            <span>ℹ️</span>
            <span>OBS: Summan av alla makron ska vara 100%</span>
          </div>
        )}

        {/* TDEE Results */}
        {tdeeResults && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-neutral-800">
                TDEE ({profile.tdee ? Math.round(profile.tdee) : ''} kcal)
              </h3>
            </div>

            <div
              className={`grid gap-3 ${hasBodyFat && tdeeResults.gPerKgFFM !== undefined ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}
            >
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-neutral-600 mb-1">Procent</p>
                <p className="text-lg font-bold text-orange-700">
                  {tdeeResults.percent.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-neutral-600 mb-1">Gram</p>
                <p className="text-lg font-bold text-orange-700">{tdeeResults.grams.toFixed(0)}g</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-neutral-600 mb-1">Kalorier</p>
                <p className="text-lg font-bold text-orange-700">
                  {tdeeResults.kcal.toFixed(0)} kcal
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-neutral-600 mb-1">Per kg</p>
                <p className="text-lg font-bold text-orange-700">{tdeeResults.gPerKg.toFixed(2)}</p>
                <p className="text-xs text-neutral-500">g/kg</p>
              </div>
              {hasBodyFat && tdeeResults.gPerKgFFM !== undefined && (
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-neutral-600 mb-1">Per kg FFM</p>
                  <p className="text-lg font-bold text-orange-700">
                    {tdeeResults.gPerKgFFM.toFixed(2)}
                  </p>
                  <p className="text-xs text-neutral-500">g/kg FFM</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Energy Goal Results */}
        {energyGoalResults && hasEnergyGoal && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent-500" />
              <h3 className="text-sm font-semibold text-neutral-800">
                Kaloriintervall ({profile.calories_min ? Math.round(profile.calories_min) : ''}-
                {profile.calories_max ? Math.round(profile.calories_max) : ''} kcal)
              </h3>
            </div>

            <div
              className={`grid gap-3 ${hasBodyFat && energyGoalResults.gPerKgFFM !== undefined ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}
            >
              <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-xs text-neutral-600 mb-1">Procent</p>
                <p className="text-lg font-bold text-primary-700">
                  {typeof energyGoalResults.percent === 'number'
                    ? `${energyGoalResults.percent.toFixed(1)}%`
                    : `${energyGoalResults.percent.min.toFixed(1)}-${energyGoalResults.percent.max.toFixed(1)}%`}
                </p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-xs text-neutral-600 mb-1">Gram</p>
                <p className="text-lg font-bold text-primary-700">
                  {typeof energyGoalResults.grams === 'number'
                    ? `${energyGoalResults.grams.toFixed(0)}g`
                    : `${energyGoalResults.grams.min.toFixed(0)}-${energyGoalResults.grams.max.toFixed(0)}g`}
                </p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-xs text-neutral-600 mb-1">Kalorier</p>
                <p className="text-lg font-bold text-primary-700">
                  {typeof energyGoalResults.kcal === 'number'
                    ? `${energyGoalResults.kcal.toFixed(0)} kcal`
                    : `${energyGoalResults.kcal.min.toFixed(0)}-${energyGoalResults.kcal.max.toFixed(0)} kcal`}
                </p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-xs text-neutral-600 mb-1">Per kg</p>
                <p className="text-lg font-bold text-primary-700">
                  {typeof energyGoalResults.gPerKg === 'number'
                    ? energyGoalResults.gPerKg.toFixed(2)
                    : `${energyGoalResults.gPerKg.min.toFixed(2)}-${energyGoalResults.gPerKg.max.toFixed(2)}`}
                </p>
                <p className="text-xs text-neutral-500">g/kg</p>
              </div>
              {hasBodyFat && energyGoalResults.gPerKgFFM !== undefined && (
                <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-xs text-neutral-600 mb-1">Per kg FFM</p>
                  <p className="text-lg font-bold text-primary-700">
                    {typeof energyGoalResults.gPerKgFFM === 'number'
                      ? energyGoalResults.gPerKgFFM.toFixed(2)
                      : `${energyGoalResults.gPerKgFFM.min.toFixed(2)}-${energyGoalResults.gPerKgFFM.max.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-neutral-500">g/kg FFM</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
