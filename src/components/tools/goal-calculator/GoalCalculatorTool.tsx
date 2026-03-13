import { useState, useMemo, useEffect, useRef } from 'react'
import { Info, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData'
import MissingDataCard from '../common/MissingDataCard'
import { useUpdateProfile, useActiveProfile } from '@/hooks'
import EmptyState from '@/components/EmptyState'
import {
  calculateGoal,
  calculateTimeline,
  getBodyFatCategory,
  calculateDailyCalorieAdjustment,
  calculateTargetBodyFatFromWeight,
  type GoalCalculationResult,
} from '@/lib/calculations/goalCalculations'
import { calculateBMI, getBMICategory, calculateIdealWeightRange } from '@/lib/calculations/helpers'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

export default function GoalCalculatorTool() {
  const navigate = useNavigate()
  const { profile } = useActiveProfile()
  const profileData = useProfileData([
    'weight_kg',
    'body_fat_percentage',
    'gender',
    'height_cm',
    'tdee',
  ])
  const missingFields = useMissingProfileData(['weight_kg', 'gender'])
  const updateProfileMutation = useUpdateProfile()

  // Local state
  const [targetBodyFat, setTargetBodyFat] = useState<number>(15)
  const [bodyFatInput, setBodyFatInput] = useState<string>('15')
  const [manualTargetWeight, setManualTargetWeight] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<'bodyFat' | 'weight'>('bodyFat')
  const [manualWeightChange, setManualWeightChange] = useState<{
    min: number
    max: number
  } | null>(null)

  // Beräkna targetWeight baserat på om användaren har angett ett manuellt värde
  const targetWeight = useMemo(() => {
    if (manualTargetWeight !== null) return manualTargetWeight
    // Om ingen body_fat_percentage, använd current weight som default
    if (profileData?.weight_kg && !profileData?.body_fat_percentage) {
      return profileData.weight_kg
    }
    return null
  }, [manualTargetWeight, profileData?.weight_kg, profileData?.body_fat_percentage])

  // Handlers för bidirektionell synkning
  const handleBodyFatChange = (value: number) => {
    if (!profileData?.weight_kg) return
    setTargetBodyFat(value)
    setBodyFatInput(String(value))
    setInputMode('bodyFat')
    setManualTargetWeight(null) // Nollställ manuell målvikt
  }

  const handleTargetWeightChange = (value: number | '') => {
    if (!profileData?.weight_kg) return
    setManualTargetWeight(value === '' ? null : value)
    setInputMode('weight')

    // Beräkna motsvarande kroppsfett% baserat på ny målvikt
    if (value !== '' && profileData?.weight_kg && profileData?.body_fat_percentage) {
      const calculatedBodyFat = calculateTargetBodyFatFromWeight(
        profileData.weight_kg,
        profileData.body_fat_percentage,
        value
      )
      setTargetBodyFat(calculatedBodyFat)
      setBodyFatInput(String(Math.round(calculatedBodyFat * 10) / 10))
    }
  }

  // Beräkna mål
  const goalResult = useMemo<GoalCalculationResult | null>(() => {
    if (!profileData?.weight_kg) return null

    // Om vi har kroppsfettprocent - använd avancerad beräkning
    if (profileData.body_fat_percentage) {
      // Om användaren har angett målvikt manuellt, använd den
      if (inputMode === 'weight' && targetWeight !== null) {
        const currentFatMass = profileData.weight_kg * (profileData.body_fat_percentage / 100)
        const currentLeanMass = profileData.weight_kg - currentFatMass
        const targetFatMass = targetWeight * (targetBodyFat / 100)

        return {
          currentLeanMass,
          currentFatMass,
          targetWeight,
          weightToChange: targetWeight - profileData.weight_kg,
          fatToChange: targetFatMass - currentFatMass,
        }
      }

      // Annars, beräkna från kroppsfett% (original logik)
      return calculateGoal(
        profileData.weight_kg,
        profileData.body_fat_percentage,
        targetBodyFat,
        true // Bibehåll fettfri massa
      )
    }

    // Ingen kroppsfettprocent - använd enkel viktbaserad beräkning
    const simpleTarget = targetWeight ?? profileData.weight_kg
    return {
      targetWeight: simpleTarget,
      weightToChange: simpleTarget - profileData.weight_kg,
    }
  }, [profileData, targetBodyFat, targetWeight, inputMode])

  // Beräkna automatiskt standardvärde för weeklyWeightChange baserat på TDEE och mål
  const defaultWeeklyWeightChange = useMemo<{ min: number; max: number }>(() => {
    if (!goalResult || !profileData?.tdee) {
      return { min: 0.5, max: 0.6 } // Fallback
    }

    const tdee = profileData.tdee
    const isWeightLoss = goalResult.weightToChange < 0
    const isWeightGain = goalResult.weightToChange > 0

    // Helper: Beräkna kg/vecka från procent av TDEE
    const calcKgPerWeek = (percentMin: number, percentMax: number) => {
      const caloriesMin = tdee * percentMin
      const caloriesMax = tdee * percentMax
      const kgMin = (caloriesMin * 7) / 7700
      const kgMax = (caloriesMax * 7) / 7700
      return { min: kgMin, max: kgMax }
    }

    // Sätt standardvärde baserat på mål
    if (isWeightLoss) {
      // Viktnedgång: Normalt (20-25%) som standard
      return calcKgPerWeek(0.2, 0.25)
    } else if (isWeightGain) {
      // Viktuppgång: Det enda alternativet (10-20%)
      return calcKgPerWeek(0.1, 0.2)
    }

    return { min: 0.5, max: 0.6 } // Fallback
  }, [goalResult, profileData])

  // Reset manualWeightChange när målet ändras (viktuppgång vs viktnedgång)
  const previousIsGainRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (!goalResult) return

    const currentIsGain = goalResult.weightToChange > 0

    // Om vi byter mellan viktuppgång och viktnedgång, återställ till standard
    if (previousIsGainRef.current !== null && currentIsGain !== previousIsGainRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManualWeightChange(null)
    }

    previousIsGainRef.current = currentIsGain
  }, [goalResult])

  // Använd manuellt värde om satt, annars använd beräknat standardvärde
  const weeklyWeightChange = manualWeightChange ?? defaultWeeklyWeightChange

  // Beräkna tidslinje (intervall baserat på min/max)
  const timeline = useMemo(() => {
    if (!goalResult) return null

    // Beräkna tidslinje för min-värdet (långsammast)
    const dailyCalorieAdjustmentMin = calculateDailyCalorieAdjustment(
      goalResult.weightToChange > 0 ? weeklyWeightChange.min : -weeklyWeightChange.min
    )
    const weeklyCalorieAdjustmentMin = dailyCalorieAdjustmentMin * 7
    const timelineMin = calculateTimeline(goalResult.weightToChange, weeklyCalorieAdjustmentMin)

    // Beräkna tidslinje för max-värdet (snabbast)
    const dailyCalorieAdjustmentMax = calculateDailyCalorieAdjustment(
      goalResult.weightToChange > 0 ? weeklyWeightChange.max : -weeklyWeightChange.max
    )
    const weeklyCalorieAdjustmentMax = dailyCalorieAdjustmentMax * 7
    const timelineMax = calculateTimeline(goalResult.weightToChange, weeklyCalorieAdjustmentMax)

    if (!timelineMin || !timelineMax) return null

    return {
      min: timelineMax, // Max hastighet ger kortaste tiden
      max: timelineMin, // Min hastighet ger längsta tiden
    }
  }, [goalResult, weeklyWeightChange])

  // Kroppsfett kategorier

  const currentCategory = useMemo(() => {
    if (!profileData?.body_fat_percentage || !profileData?.gender) return null
    return getBodyFatCategory(profileData.body_fat_percentage, profileData.gender)
  }, [profileData])

  const targetCategory = useMemo(() => {
    if (!profileData?.gender) return null
    return getBodyFatCategory(targetBodyFat, profileData.gender)
  }, [targetBodyFat, profileData])

  // BMI-beräkningar
  const bmiData = useMemo(() => {
    if (!profileData?.weight_kg || !profileData?.height_cm) {
      return null
    }

    const currentBMI = calculateBMI(profileData.weight_kg, profileData.height_cm)
    const currentBMICategory = getBMICategory(currentBMI)

    const idealWeightRange = calculateIdealWeightRange(profileData.height_cm)

    const targetBMI = goalResult
      ? calculateBMI(goalResult.targetWeight, profileData.height_cm)
      : null
    const targetBMICategory = targetBMI !== null ? getBMICategory(targetBMI) : null

    return {
      current: {
        bmi: currentBMI,
        category: currentBMICategory,
      },
      target:
        targetBMI !== null && targetBMICategory !== null
          ? { bmi: targetBMI, category: targetBMICategory }
          : null,
      idealRange: idealWeightRange,
    }
  }, [profileData, goalResult])

  const handleSaveMissingData = async (data: Partial<Profile>) => {
    if (!profile?.id) return
    try {
      await updateProfileMutation.mutateAsync({ profileId: profile.id, data })
      toast.success('Profil uppdaterad')
    } catch (error) {
      toast.error('Kunde inte uppdatera profil')
      throw error
    }
  }

  // Check if profile exists - show empty state if no profile
  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Ingen aktiv profil"
        description="Du måste ha en profil för att använda målkalkylatorn."
        action={{
          label: 'Gå till profil',
          onClick: () => navigate('/app/profile'),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Måluträknare</h2>
          <p className="text-neutral-600 mt-1 text-sm md:text-base">
            {profileData?.body_fat_percentage
              ? 'Beräkna din målvikt och tidslinje för att nå ditt kroppsfettmål'
              : 'Beräkna din målvikt och tidslinje'}
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 shrink-0">
          Mål & Planering
        </Badge>
      </div>

      {/* Saknad Data */}
      {missingFields.length > 0 && (
        <MissingDataCard
          missingFields={missingFields.map(field => ({
            key: field.key,
            label: field.label,
            type: field.key === 'gender' ? 'select' : 'number',
            options:
              field.key === 'gender'
                ? [
                    { value: 'male', label: 'Man' },
                    { value: 'female', label: 'Kvinna' },
                  ]
                : undefined,
          }))}
          onSave={handleSaveMissingData}
        />
      )}

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Om Måluträknaren</p>
              <p className="text-blue-700">
                {profileData?.body_fat_percentage
                  ? 'Denna kalkylator uppskattar din målvikt baserat på önskat kroppsfett % och bibehållen fettfri massa.'
                  : 'Denna kalkylator hjälper dig sätta viktmål och beräkna tidslinje. Lägg till kroppsfett % i profilen för mer detaljerade beräkningar.'}{' '}
                Tidslinjen är en uppskattning - faktiska resultat kan variera beroende på träning,
                kost och individuella faktorer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] min-w-0 overflow-hidden">
        {/* Vänster: Inställningar */}
        <div className="space-y-6 min-w-0 overflow-hidden">
          {/* Nuvarande Status */}
          {profileData?.weight_kg && (
            <Card>
              <CardHeader>
                <CardTitle>Din Nuvarande Status</CardTitle>
                <CardDescription>Utgångspunkt för beräkningar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <p className="text-sm text-neutral-600 mb-1">Vikt</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {profileData.weight_kg.toFixed(1)} kg
                    </p>
                  </div>
                  {/* Visa kroppsfett bara om det finns */}
                  {profileData.body_fat_percentage && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-600 mb-1">Kroppsfett</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {profileData.body_fat_percentage.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Visa bara om vi har kroppsfettprocent OCH goalResult med massa-data */}
                {profileData.body_fat_percentage && goalResult?.currentLeanMass !== undefined && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 mb-1">Fettfri massa</p>
                      <p className="text-xl font-bold text-green-900">
                        {goalResult.currentLeanMass.toFixed(1)} kg
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-700 mb-1">Fettmassa</p>
                      <p className="text-xl font-bold text-orange-900">
                        {goalResult.currentFatMass!.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                )}

                {/* Kategori - bara om vi har kroppsfettprocent */}
                {profileData.body_fat_percentage && currentCategory && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-600 mb-2">Kategori:</p>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <p className={`font-semibold ${currentCategory.color}`}>
                        {currentCategory.category}
                      </p>
                      <p className="text-sm text-neutral-600">{currentCategory.description}</p>
                    </div>
                  </div>
                )}

                {/* Warning om BMI saknas */}
                {!profileData?.height_cm && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ BMI-sektion visas när du lägger till din längd i profilen
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* BMI-Sektion */}
          {bmiData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">BMI (Body Mass Index)</CardTitle>
                <CardDescription className="text-xs">Viktindex enligt WHO-standard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Nuvarande och Mål BMI - Kompakt inline */}
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-neutral-600 shrink-0">Nuvarande:</span>
                    <span className="font-bold text-neutral-900">
                      {bmiData.current.bmi.toFixed(1)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        bmiData.current.category === 'undervikt'
                          ? 'bg-yellow-100 text-yellow-800'
                          : bmiData.current.category === 'normalvikt'
                            ? 'bg-green-100 text-green-800'
                            : bmiData.current.category === 'övervikt'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bmiData.current.category.charAt(0).toUpperCase() +
                        bmiData.current.category.slice(1)}
                    </Badge>
                  </div>
                  {bmiData.target && (
                    <>
                      <span className="text-neutral-400 hidden sm:inline">→</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-neutral-600 shrink-0">Mål:</span>
                        <span className="font-bold text-purple-900">
                          {bmiData.target.bmi.toFixed(1)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            bmiData.target.category === 'undervikt'
                              ? 'bg-yellow-100 text-yellow-800'
                              : bmiData.target.category === 'normalvikt'
                                ? 'bg-green-100 text-green-800'
                                : bmiData.target.category === 'övervikt'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bmiData.target.category.charAt(0).toUpperCase() +
                            bmiData.target.category.slice(1)}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* BMI-Tabell - Kompakt */}
                <div className="border border-neutral-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs min-w-[300px]">
                    <thead className="bg-neutral-100">
                      <tr>
                        <th className="px-3 py-1.5 text-left font-semibold">Kategori</th>
                        <th className="px-3 py-1.5 text-left font-semibold">BMI</th>
                        <th className="px-3 py-1.5 text-left font-semibold">Vikt (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className={`border-t ${
                          bmiData.current.category === 'undervikt'
                            ? 'bg-yellow-50 border-l-4 border-l-yellow-500'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-1.5">Undervikt</td>
                        <td className="px-3 py-1.5 text-neutral-600">&lt; 18.5</td>
                        <td className="px-3 py-1.5 text-neutral-600">
                          &lt; {Math.floor(18.5 * Math.pow((profileData?.height_cm ?? 0) / 100, 2))}
                        </td>
                      </tr>
                      <tr
                        className={`border-t ${
                          bmiData.current.category === 'normalvikt'
                            ? 'bg-green-50 border-l-4 border-l-green-500'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-1.5">Normalvikt</td>
                        <td className="px-3 py-1.5 text-neutral-600">18.5 - 24.9</td>
                        <td className="px-3 py-1.5 text-green-700 font-semibold">
                          {bmiData.idealRange.min} - {bmiData.idealRange.max}
                        </td>
                      </tr>
                      <tr
                        className={`border-t ${
                          bmiData.current.category === 'övervikt'
                            ? 'bg-orange-50 border-l-4 border-l-orange-500'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-1.5">Övervikt</td>
                        <td className="px-3 py-1.5 text-neutral-600">25 - 29.9</td>
                        <td className="px-3 py-1.5 text-neutral-600">
                          {bmiData.idealRange.max + 1} -{' '}
                          {Math.floor(30 * Math.pow((profileData?.height_cm ?? 0) / 100, 2)) - 1}
                        </td>
                      </tr>
                      <tr
                        className={`border-t ${
                          bmiData.current.category === 'fetma'
                            ? 'bg-red-50 border-l-4 border-l-red-500'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-1.5">Fetma</td>
                        <td className="px-3 py-1.5 text-neutral-600">&ge; 30</td>
                        <td className="px-3 py-1.5 text-neutral-600">
                          &ge; {Math.floor(30 * Math.pow((profileData?.height_cm ?? 0) / 100, 2))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* BMI Disclaimer - Kompakt */}
                <p className="text-[10px] text-neutral-500 italic">
                  OBS: BMI tar inte hänsyn till muskelmassa. Använd tillsammans med kroppsfett% för
                  bättre bedömning.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Målslider */}
          <Card>
            <CardHeader>
              <CardTitle>Ställ in ditt mål</CardTitle>
              <CardDescription>
                {profileData?.body_fat_percentage
                  ? 'Välj önskad målvikt eller kroppsfett %'
                  : 'Välj din målvikt'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mål Kroppsvikt Input - FLYTTA UPP FÖRST */}
              <div>
                <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                  <Label className="shrink-0">Mål Kroppsvikt</Label>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min={profileData?.weight_kg ? Math.floor(profileData.weight_kg * 0.7) : 40}
                      max={profileData?.weight_kg ? Math.ceil(profileData.weight_kg * 1.3) : 150}
                      step="0.1"
                      value={targetWeight ?? goalResult?.targetWeight.toFixed(1) ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        handleTargetWeightChange(val === '' ? '' : parseFloat(val))
                      }}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-neutral-600">kg</span>
                  </div>
                </div>
                <Slider
                  value={[targetWeight ?? goalResult?.targetWeight ?? 70]}
                  onValueChange={([value]) => handleTargetWeightChange(value)}
                  min={profileData?.weight_kg ? profileData.weight_kg * 0.7 : 40}
                  max={profileData?.weight_kg ? profileData.weight_kg * 1.3 : 150}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-2">
                  <span>-30%</span>
                  <span>Nuvarande</span>
                  <span>+30%</span>
                </div>
              </div>

              {/* Mål Kroppsfett % - BARA OM VI HAR KROPPSFETTPROCENT */}
              {profileData?.body_fat_percentage && (
                <div>
                  <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                    <Label className="shrink-0">Mål Kroppsfett %</Label>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="5"
                        max="35"
                        step="0.5"
                        value={bodyFatInput}
                        onChange={e => {
                          setBodyFatInput(e.target.value)
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) handleBodyFatChange(val)
                        }}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-neutral-600">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[targetBodyFat]}
                    onValueChange={([value]) => handleBodyFatChange(value)}
                    min={5}
                    max={35}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-2">
                    <span>5%</span>
                    <span>20%</span>
                    <span>35%</span>
                  </div>

                  {/* Info om synkning */}
                  <p className="text-xs text-neutral-500 mt-3 italic">
                    💡 Mål Kroppsfett% och Mål Kroppsvikt synkas automatiskt när du ändrar någon av
                    dem
                  </p>
                </div>
              )}

              {/* Målkategori - bara om vi har kroppsfettprocent */}
              {profileData?.body_fat_percentage && targetCategory && (
                <div className="pt-6 border-t border-neutral-200 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 mb-2">Målkategori:</p>
                  <p className={`font-semibold ${targetCategory.color}`}>
                    {targetCategory.category}
                  </p>
                  <p className="text-sm text-neutral-600">{targetCategory.description}</p>
                </div>
              )}

              {/* Veckovis viktförändring */}
              <div>
                <Label className="mb-4 block">Veckovis Viktförändring</Label>

                {/* Presets baserat på energimål */}
                {(() => {
                  if (!goalResult || !profileData?.tdee) {
                    return (
                      <p className="text-sm text-neutral-500 italic">
                        Välj ett energimål för att se tillgängliga alternativ
                      </p>
                    )
                  }

                  const tdee = profileData.tdee
                  const isWeightLoss = goalResult.weightToChange < 0
                  const isWeightGain = goalResult.weightToChange > 0

                  // Helper: Beräkna kg/vecka från procent av TDEE
                  const calcKgPerWeek = (percentMin: number, percentMax: number) => {
                    const caloriesMin = tdee * percentMin
                    const caloriesMax = tdee * percentMax
                    const kgMin = (caloriesMin * 7) / 7700
                    const kgMax = (caloriesMax * 7) / 7700
                    return { min: kgMin, max: kgMax }
                  }

                  // Definiera presets baserat på mål
                  let presets: Array<{
                    label: string
                    tooltip: string
                    kgPerWeek: { min: number; max: number }
                  }> = []

                  if (isWeightLoss) {
                    presets = [
                      {
                        label: 'Försiktigt (10-15%)',
                        tooltip: `${Math.round(tdee * 0.85)} - ${Math.round(tdee * 0.9)} kcal/dag`,
                        kgPerWeek: calcKgPerWeek(0.1, 0.15),
                      },
                      {
                        label: 'Normalt (20-25%)',
                        tooltip: `${Math.round(tdee * 0.75)} - ${Math.round(tdee * 0.8)} kcal/dag`,
                        kgPerWeek: calcKgPerWeek(0.2, 0.25),
                      },
                      {
                        label: 'Aggressivt (25-30%)',
                        tooltip: `${Math.round(tdee * 0.7)} - ${Math.round(tdee * 0.75)} kcal/dag`,
                        kgPerWeek: calcKgPerWeek(0.25, 0.3),
                      },
                    ]
                  } else if (isWeightGain) {
                    presets = [
                      {
                        label: 'Viktuppgång (10-20%)',
                        tooltip: `${Math.round(tdee * 1.1)} - ${Math.round(tdee * 1.2)} kcal/dag`,
                        kgPerWeek: calcKgPerWeek(0.1, 0.2),
                      },
                    ]
                  }

                  return presets.length > 0 ? (
                    <div>
                      <p className="text-xs text-neutral-600 mb-2">
                        {isWeightLoss
                          ? 'Viktnedgång - Välj tempo enligt Energimål:'
                          : 'Viktökning - Välj tempo enligt Energimål:'}
                      </p>
                      <div
                        className={`grid ${isWeightLoss ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'} gap-2`}
                      >
                        {presets.map((preset, idx) => {
                          const isActive =
                            weeklyWeightChange.min === preset.kgPerWeek.min &&
                            weeklyWeightChange.max === preset.kgPerWeek.max

                          return (
                            <Button
                              key={idx}
                              type="button"
                              variant={isActive ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => setManualWeightChange(preset.kgPerWeek)}
                              className="text-xs h-auto py-2 flex flex-col items-center"
                              title={preset.tooltip}
                            >
                              <span className="font-medium">{preset.label.split(' (')[0]}</span>
                              <span className="text-[10px] opacity-70 mt-1">
                                {preset.kgPerWeek.min.toFixed(1)}-{preset.kgPerWeek.max.toFixed(1)}{' '}
                                kg/v
                              </span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger: Resultat */}
        {goalResult && timeline && (
          <div className="space-y-6 min-w-0 overflow-hidden">
            {/* Målvikt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ditt Mål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-neutral-600 mb-2">Målvikt</p>
                  <p className="text-4xl font-bold text-purple-700">
                    {goalResult.targetWeight.toFixed(1)}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">kg</p>

                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex items-center justify-center gap-2">
                      {goalResult.weightToChange < 0 ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      )}
                      <span
                        className={`text-xl font-bold ${
                          goalResult.weightToChange < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {goalResult.weightToChange > 0 ? '+' : ''}
                        {goalResult.weightToChange.toFixed(1)} kg
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {goalResult.weightToChange < 0 ? 'att förlora' : 'att öka'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tidslinje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tidslinje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Vald tempo:</span>
                  <span className="text-lg font-semibold text-neutral-900">
                    {(() => {
                      // Determine which preset is active and display its name
                      if (!goalResult || !profileData?.tdee) {
                        return `${weeklyWeightChange.min.toFixed(1)}-${weeklyWeightChange.max.toFixed(1)} kg/vecka`
                      }

                      const tdee = profileData.tdee
                      const isWeightLoss = goalResult.weightToChange < 0
                      const isWeightGain = goalResult.weightToChange > 0

                      // Helper: Beräkna kg/vecka från procent av TDEE
                      const calcKgPerWeek = (percentMin: number, percentMax: number) => {
                        const caloriesMin = tdee * percentMin
                        const caloriesMax = tdee * percentMax
                        const kgMin = (caloriesMin * 7) / 7700
                        const kgMax = (caloriesMax * 7) / 7700
                        return { min: kgMin, max: kgMax }
                      }

                      let presetName = ''

                      if (isWeightLoss) {
                        const cautious = calcKgPerWeek(0.1, 0.15)
                        const normal = calcKgPerWeek(0.2, 0.25)
                        const aggressive = calcKgPerWeek(0.25, 0.3)

                        if (
                          Math.abs(weeklyWeightChange.min - cautious.min) < 0.01 &&
                          Math.abs(weeklyWeightChange.max - cautious.max) < 0.01
                        ) {
                          presetName = 'Försiktigt '
                        } else if (
                          Math.abs(weeklyWeightChange.min - normal.min) < 0.01 &&
                          Math.abs(weeklyWeightChange.max - normal.max) < 0.01
                        ) {
                          presetName = 'Normalt '
                        } else if (
                          Math.abs(weeklyWeightChange.min - aggressive.min) < 0.01 &&
                          Math.abs(weeklyWeightChange.max - aggressive.max) < 0.01
                        ) {
                          presetName = 'Aggressivt '
                        }
                      } else if (isWeightGain) {
                        const gain = calcKgPerWeek(0.1, 0.2)
                        if (
                          Math.abs(weeklyWeightChange.min - gain.min) < 0.01 &&
                          Math.abs(weeklyWeightChange.max - gain.max) < 0.01
                        ) {
                          presetName = 'Viktuppgång '
                        }
                      }

                      return `${presetName}${weeklyWeightChange.min.toFixed(1)}-${weeklyWeightChange.max.toFixed(1)} kg/vecka`
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Veckor:</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {timeline.min.weeksRequired} - {timeline.max.weeksRequired} veckor
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Månader:</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {timeline.min.monthsRequired} - {timeline.max.monthsRequired} månader
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-neutral-600 mb-1">Uppskattat slutdatum:</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {timeline.min.estimatedEndDate.toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' - '}
                    {timeline.max.estimatedEndDate.toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-neutral-500">
                    * Detta är en uppskattning baserad på bibehållen fettfri massa och valt
                    viktförändring-intervall. Faktiska resultat kan variera.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
