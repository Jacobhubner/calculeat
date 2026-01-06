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

type MacroType = 'protein' | 'fat' | 'carbs' | ''
type UnitType = 'percent' | 'grams' | 'kcal' | 'g_per_kg' | 'g_per_kg_ffm' | ''

interface ConversionResult {
  percent: number
  grams: number
  kcal: number
  gPerKg: number
  gPerKgFFM?: number
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

  // Calculate Energy Goal results (användaren anger ett fast värde, visa vad det motsvarar i intervallet)
  const energyGoalResults = useMemo<ConversionResult | null>(() => {
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

    // Användaren har angett ett specifikt värde (t.ex. 50g protein)
    // Vi ska visa vad detta motsvarar i procent av kaloriintervallet
    const grams = gramsFromInput
    const kcal = grams * kcalPerGram

    // Beräkna procent av kaloriintervallet (medelvärde)
    const avgCalories = (profile.calories_min + profile.calories_max) / 2
    const percent = (kcal / avgCalories) * 100

    const gPerKg = grams / profile.weight_kg
    const gPerKgFFM = leanMass ? grams / leanMass : undefined

    return {
      percent,
      grams,
      kcal,
      gPerKg,
      gPerKgFFM,
    }
  }, [
    hasEnergyGoal,
    hasWeight,
    tdeeResults,
    profile,
    kcalPerGram,
    leanMass,
    gramsFromInput,
    macro,
    unit,
  ])

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
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Resultat (TDEE {profile.tdee ? Math.round(profile.tdee) : ''})
            </h3>
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
        {energyGoalResults && hasEnergyGoal && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Resultat (Kaloriintervall{' '}
              {profile.calories_min ? Math.round(profile.calories_min) : ''}-
              {profile.calories_max ? Math.round(profile.calories_max) : ''})
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-neutral-600">%: </span>
                <span className="font-semibold">{energyGoalResults.percent.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-neutral-600">gram: </span>
                <span className="font-semibold">{energyGoalResults.grams.toFixed(0)}g</span>
              </div>
              <div>
                <span className="text-neutral-600">kcal: </span>
                <span className="font-semibold">{energyGoalResults.kcal.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-neutral-600">g/kg kroppsvikt: </span>
                <span className="font-semibold">{energyGoalResults.gPerKg.toFixed(2)}</span>
              </div>
              {hasBodyFat && energyGoalResults.gPerKgFFM !== undefined && (
                <div className="col-span-2">
                  <span className="text-neutral-600">g/kg fettfri massa: </span>
                  <span className="font-semibold">{energyGoalResults.gPerKgFFM.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
