/**
 * MacroConverterCard - Konvertera mellan olika makroenheter
 * Fristående kalkylator som visar resultat baserat på TDEE och energimål
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Profile } from '@/lib/types'

interface MacroConverterCardProps {
  profile: Profile | null
}

type MacroType = 'protein' | 'fat' | 'carbs'
type UnitType = 'percent' | 'grams' | 'kcal' | 'g_per_kg' | 'g_per_kg_ffm'

interface ConversionResult {
  percent: number
  grams: number
  kcal: number
  gPerKg: number
  gPerKgFFM?: number
}

interface EnergyGoalResult {
  percent: number
  gramsMin: number
  gramsMax: number
  kcalMin: number
  kcalMax: number
  gPerKgMin: number
  gPerKgMax: number
  gPerKgFFMMin?: number
  gPerKgFFMMax?: number
}

export default function MacroConverterCard({ profile }: MacroConverterCardProps) {
  const [value, setValue] = useState<number>(0)
  const [macro, setMacro] = useState<MacroType>('protein')
  const [unit, setUnit] = useState<UnitType>('percent')

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
    return macro === 'fat' ? 9 : 4 // protein and carbs = 4, fat = 9
  }, [macro])

  // Convert input value to grams (base unit for all conversions)
  const gramsFromInput = useMemo(() => {
    if (!hasTDEE || !hasWeight || !profile?.tdee || !profile?.weight_kg) return 0

    switch (unit) {
      case 'percent':
        return (profile.tdee * (value / 100)) / kcalPerGram
      case 'grams':
        return value
      case 'kcal':
        return value / kcalPerGram
      case 'g_per_kg':
        return value * profile.weight_kg
      case 'g_per_kg_ffm':
        if (!leanMass) return 0
        return value * leanMass
      default:
        return 0
    }
  }, [value, unit, hasTDEE, hasWeight, profile, leanMass, kcalPerGram])

  // Calculate TDEE results
  const tdeeResults = useMemo<ConversionResult | null>(() => {
    if (!hasTDEE || !hasWeight || !profile?.tdee || !profile?.weight_kg) return null

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
  }, [hasTDEE, hasWeight, profile, gramsFromInput, kcalPerGram, leanMass])

  // Calculate Energy Goal results
  const energyGoalResults = useMemo<EnergyGoalResult | null>(() => {
    if (
      !hasEnergyGoal ||
      !hasWeight ||
      !tdeeResults ||
      !profile?.calories_min ||
      !profile?.calories_max ||
      !profile?.weight_kg
    )
      return null

    const percent = tdeeResults.percent

    // Apply percentage to energy goal interval
    const kcalMin = profile.calories_min * (percent / 100)
    const kcalMax = profile.calories_max * (percent / 100)
    const gramsMin = kcalMin / kcalPerGram
    const gramsMax = kcalMax / kcalPerGram
    const gPerKgMin = gramsMin / profile.weight_kg
    const gPerKgMax = gramsMax / profile.weight_kg
    const gPerKgFFMMin = leanMass ? gramsMin / leanMass : undefined
    const gPerKgFFMMax = leanMass ? gramsMax / leanMass : undefined

    return {
      percent,
      gramsMin,
      gramsMax,
      kcalMin,
      kcalMax,
      gPerKgMin,
      gPerKgMax,
      gPerKgFFMMin,
      gPerKgFFMMax,
    }
  }, [hasEnergyGoal, hasWeight, tdeeResults, profile, kcalPerGram, leanMass])

  // Show error messages if required data is missing
  if (!hasTDEE) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Makro-konverterare</CardTitle>
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
          <CardTitle>Makro-konverterare</CardTitle>
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
        <CardTitle>Makro-konverterare</CardTitle>
        <CardDescription>Konvertera mellan olika makroenheter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="value">Värde</Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              min={0}
              step="any"
            />
          </div>
          <div>
            <Label htmlFor="macro">Makro</Label>
            <Select id="macro" value={macro} onChange={e => setMacro(e.target.value as MacroType)}>
              <option value="protein">Protein</option>
              <option value="fat">Fett</option>
              <option value="carbs">Kolhydrater</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="unit">Enhet</Label>
            <Select id="unit" value={unit} onChange={e => setUnit(e.target.value as UnitType)}>
              <option value="percent">%</option>
              <option value="grams">gram</option>
              <option value="kcal">kcal</option>
              <option value="g_per_kg">g/kg kroppsvikt</option>
              {hasBodyFat && <option value="g_per_kg_ffm">g/kg fettfri massa</option>}
            </Select>
          </div>
        </div>

        {/* Warning for high percentage */}
        {unit === 'percent' && value > 100 && (
          <div className="text-xs text-amber-600 flex items-start gap-1">
            <span>ℹ️</span>
            <span>OBS: Summan av alla makron ska vara 100%</span>
          </div>
        )}

        {/* TDEE Results */}
        {tdeeResults && value > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Resultat (TDEE)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-neutral-600">%: </span>
                <span className="font-semibold">{tdeeResults.percent.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-neutral-600">gram: </span>
                <span className="font-semibold">{tdeeResults.grams.toFixed(0)}g</span>
              </div>
              <div>
                <span className="text-neutral-600">kcal: </span>
                <span className="font-semibold">{tdeeResults.kcal.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-neutral-600">g/kg kroppsvikt: </span>
                <span className="font-semibold">{tdeeResults.gPerKg.toFixed(2)}</span>
              </div>
              {hasBodyFat && tdeeResults.gPerKgFFM !== undefined && (
                <div className="col-span-2">
                  <span className="text-neutral-600">g/kg fettfri massa: </span>
                  <span className="font-semibold">{tdeeResults.gPerKgFFM.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Energy Goal Results */}
        {energyGoalResults && value > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Resultat (Energimål)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <span className="text-neutral-600">%: </span>
                <span className="font-semibold">{energyGoalResults.percent.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-neutral-600">gram: </span>
                <span className="font-semibold">
                  {energyGoalResults.gramsMin.toFixed(0)}-{energyGoalResults.gramsMax.toFixed(0)}g
                </span>
              </div>
              <div>
                <span className="text-neutral-600">kcal: </span>
                <span className="font-semibold">
                  {energyGoalResults.kcalMin.toFixed(0)}-{energyGoalResults.kcalMax.toFixed(0)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-600">g/kg kroppsvikt: </span>
                <span className="font-semibold">
                  {energyGoalResults.gPerKgMin.toFixed(2)}-{energyGoalResults.gPerKgMax.toFixed(2)}
                </span>
              </div>
              {hasBodyFat &&
                energyGoalResults.gPerKgFFMMin !== undefined &&
                energyGoalResults.gPerKgFFMMax !== undefined && (
                  <div className="col-span-2">
                    <span className="text-neutral-600">g/kg fettfri massa: </span>
                    <span className="font-semibold">
                      {energyGoalResults.gPerKgFFMMin.toFixed(2)}-
                      {energyGoalResults.gPerKgFFMMax.toFixed(2)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
