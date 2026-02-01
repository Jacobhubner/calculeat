/**
 * MetabolicCalibration - Kalibrera TDEE baserat på viktförändringar
 * Användare kan manuellt starta kalibrering med flexibel tidsperiod (7, 14, 21 dagar)
 * Använder faktisk matloggdata när tillräckligt med data finns
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Scale,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Database,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  useWeightHistory,
  useUpdateProfile,
  useActualCalorieIntake,
  useCreateCalibrationHistory,
} from '@/hooks'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'
import MetabolicCalibrationGuide from './MetabolicCalibrationGuide'

interface MetabolicCalibrationProps {
  profile: Profile
  variant?: 'full' | 'compact'
  onClose?: () => void
}

export default function MetabolicCalibration({
  profile,
  variant = 'full',
  onClose,
}: MetabolicCalibrationProps) {
  const [timePeriod, setTimePeriod] = useState<7 | 14 | 21>(14)
  const [calibrationApplied, setCalibrationApplied] = useState<number | null>(null) // Stores the new TDEE value

  // Use user-based weight history (shared across all profiles)
  const { data: weightHistory } = useWeightHistory()
  const updateProfile = useUpdateProfile()
  const createCalibrationHistory = useCreateCalibrationHistory()

  // Calculate date range for actual calorie intake
  // Memoize now to prevent recalculation on every render
  const now = useMemo(() => new Date(), [])
  const startDate = useMemo(
    () => new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000),
    [now, timePeriod]
  )

  // Fetch actual calorie intake from food logs
  const { data: actualIntake } = useActualCalorieIntake(profile.id, startDate, now)

  // Determine if we should use actual food log data
  const useActualData = actualIntake && actualIntake.completenessPercent >= 70

  // Calculate weight change and actual TDEE
  const calibrationData = useMemo(() => {
    // Get weights from selected time period
    const recentWeights = (weightHistory || [])
      .filter(w => new Date(w.recorded_at) >= startDate)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

    let allWeights: Array<{ weight_kg: number; recorded_at: Date }> = []
    let usedOldestWeight = false

    // If we have 2+ weight entries within time period, use those directly
    // Otherwise, fall back to oldest weight in history as starting point
    if (recentWeights.length >= 2) {
      // Enough data within time period - use only recent weights
      recentWeights.forEach(w => {
        allWeights.push({
          weight_kg: w.weight_kg,
          recorded_at: new Date(w.recorded_at),
        })
      })
    } else {
      // Not enough recent data - try to use oldest weight from history as starting point
      const allHistorySorted = [...(weightHistory || [])].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      )

      if (allHistorySorted.length > 0) {
        const oldestWeight = allHistorySorted[0]
        const oldestDate = new Date(oldestWeight.recorded_at)
        const daysSinceOldest = Math.floor(
          (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Only include oldest weight if it's within reasonable timeframe
        if (daysSinceOldest <= timePeriod * 2) {
          allWeights.push({
            weight_kg: oldestWeight.weight_kg,
            recorded_at: oldestDate,
          })
          usedOldestWeight = true
        }
      }

      // Add any recent weights we do have
      recentWeights.forEach(w => {
        allWeights.push({
          weight_kg: w.weight_kg,
          recorded_at: new Date(w.recorded_at),
        })
      })
    }

    // Sort by date
    allWeights = allWeights.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())

    // Need at least 2 data points
    if (allWeights.length < 2) return null

    const startWeightEntry = allWeights[0]
    const endWeightEntry = allWeights[allWeights.length - 1]
    const startWeight = startWeightEntry.weight_kg
    const endWeight = endWeightEntry.weight_kg

    // Calculate actual days between measurements
    const actualDays = Math.max(
      1,
      Math.floor(
        (endWeightEntry.recorded_at.getTime() - startWeightEntry.recorded_at.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    )
    const weightChange = endWeight - startWeight
    const weightChangePercent = (weightChange / startWeight) * 100

    // Calculate calorie balance from weight change
    // 1 kg body weight ≈ 7700 kcal
    const totalCalorieBalance = weightChange * 7700
    const dailyCalorieBalance = totalCalorieBalance / actualDays

    // Calculate actual TDEE
    // If user is on "maintain weight" but gained/lost weight:
    // actual_TDEE = average_calories - daily_balance
    //
    // Use actual intake if available, otherwise use target calories
    const targetCalories =
      profile.calories_min && profile.calories_max
        ? (profile.calories_min + profile.calories_max) / 2
        : profile.tdee || 2000

    const averageCalories =
      useActualData && actualIntake?.averageCalories ? actualIntake.averageCalories : targetCalories

    const actualTDEE = averageCalories - dailyCalorieBalance

    // Safety check: limit adjustments to ±20% of current TDEE
    const currentTDEE = profile.tdee || 2000
    const maxTDEE = currentTDEE * 1.2
    const minTDEE = currentTDEE * 0.8
    const calibratedTDEE = Math.max(minTDEE, Math.min(maxTDEE, actualTDEE))
    const isLimited = Math.abs(calibratedTDEE - actualTDEE) > 0.5

    // Check for erratic fluctuations (>3% per week)
    const weeklyChangePercent =
      actualDays >= 7 ? (weightChangePercent / actualDays) * 7 : weightChangePercent
    const isErratic = Math.abs(weeklyChangePercent) > 3

    // Calculate difference from current TDEE
    const tdeeDifference = calibratedTDEE - currentTDEE
    const tdeeDifferencePercent = (tdeeDifference / currentTDEE) * 100

    return {
      startWeight,
      endWeight,
      weightChange,
      weightChangePercent,
      dailyCalorieBalance,
      targetCalories,
      averageCalories,
      actualTDEE,
      calibratedTDEE,
      isLimited,
      isErratic,
      weeklyChangePercent,
      tdeeDifference,
      tdeeDifferencePercent,
      daysOfData: actualDays,
      numDataPoints: allWeights.length,
      usedOldestWeight,
    }
  }, [weightHistory, timePeriod, profile, useActualData, actualIntake, startDate, now])

  // Calculate what's needed when calibration isn't available
  const emptyStateInfo = useMemo(() => {
    const recentWeights = (weightHistory || []).filter(w => new Date(w.recorded_at) >= startDate)
    const recentWeightsCount = recentWeights.length
    const totalWeightsCount = (weightHistory || []).length

    // Check if oldest weight in history can be used
    const allHistorySorted = [...(weightHistory || [])].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    const oldestWeight = allHistorySorted.length > 0 ? allHistorySorted[0] : null
    const hasUsableOldestWeight =
      oldestWeight &&
      Math.floor(
        (now.getTime() - new Date(oldestWeight.recorded_at).getTime()) / (1000 * 60 * 60 * 24)
      ) <=
        timePeriod * 2

    return {
      recentWeightsCount,
      totalWeightsCount,
      hasUsableOldestWeight,
      oldestWeight: oldestWeight?.weight_kg,
    }
  }, [weightHistory, startDate, timePeriod, now])

  const handleApplyCalibration = async () => {
    if (!calibrationData) return

    const newTDEE = calibrationData.calibratedTDEE

    // Recalculate calorie range based on current goal
    let caloriesMin = newTDEE * 0.97
    let caloriesMax = newTDEE * 1.03

    if (profile.calorie_goal === 'Weight loss') {
      // Apply deficit
      const deficitPercent =
        profile.deficit_level === '10-15%'
          ? 0.125
          : profile.deficit_level === '20-25%'
            ? 0.225
            : 0.275
      caloriesMin = newTDEE * (1 - deficitPercent - 0.025)
      caloriesMax = newTDEE * (1 - deficitPercent + 0.025)
    } else if (profile.calorie_goal === 'Weight gain') {
      caloriesMin = newTDEE * 1.1
      caloriesMax = newTDEE * 1.2
    }

    try {
      // Update profile with new TDEE
      await updateProfile.mutateAsync({
        profileId: profile.id,
        data: {
          tdee: newTDEE,
          calories_min: caloriesMin,
          calories_max: caloriesMax,
          tdee_source: 'metabolic_calibration',
          tdee_calculated_at: new Date().toISOString(),
          tdee_calculation_snapshot: {
            method: 'metabolic_calibration',
            time_period_days: timePeriod,
            weight_change_kg: calibrationData.weightChange,
            daily_calorie_balance: calibrationData.dailyCalorieBalance,
            previous_tdee: profile.tdee,
            calibrated_tdee: newTDEE,
            target_calories: calibrationData.targetCalories,
            used_food_log: useActualData || false,
            actual_calories_avg: useActualData ? actualIntake?.averageCalories : null,
          },
        },
      })

      // Save calibration history
      await createCalibrationHistory.mutateAsync({
        profile_id: profile.id,
        time_period_days: timePeriod,
        start_weight_kg: calibrationData.startWeight,
        end_weight_kg: calibrationData.endWeight,
        weight_change_kg: calibrationData.weightChange,
        target_calories: calibrationData.targetCalories,
        actual_calories_avg: useActualData ? (actualIntake?.averageCalories ?? null) : null,
        used_food_log: useActualData || false,
        days_with_log_data: actualIntake?.daysWithData || 0,
        previous_tdee: profile.tdee || 0,
        calculated_tdee: calibrationData.actualTDEE,
        applied_tdee: newTDEE,
        was_limited: calibrationData.isLimited,
      })

      setCalibrationApplied(newTDEE)
      toast.success(`TDEE kalibrerat! Nytt värde: ${Math.round(newTDEE)} kcal`)

      // Auto-close after a short delay if onClose is provided
      if (onClose) {
        setTimeout(() => onClose(), 1500)
      }
    } catch {
      toast.error('Kunde inte spara kalibrering')
    }
  }

  // Don't show if user doesn't have TDEE set
  if (!profile.tdee) return null

  const isCompact = variant === 'compact'

  return (
    <Card>
      <CardHeader className={isCompact ? 'pb-2' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${isCompact ? 'text-base' : ''}`}>
            <Scale className="h-5 w-5 text-primary-500" />
            Metabolisk Kalibrering
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isCompact && <MetabolicCalibrationGuide />}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Stäng
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${isCompact ? 'pt-0' : ''}`}>
        {/* Info text */}
        {!isCompact && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-neutral-50 text-sm text-neutral-700">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-neutral-500" />
            <p>
              Kalibrera ditt TDEE baserat på faktiska viktförändringar. Välj tidsperiod och systemet
              beräknar ditt verkliga energibehov.
            </p>
          </div>
        )}

        {/* Time period selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Tidsperiod</label>
          <Select
            value={timePeriod.toString()}
            onChange={e => setTimePeriod(Number(e.target.value) as 7 | 14 | 21)}
          >
            <option value="7">7 dagar (1 vecka)</option>
            <option value="14">14 dagar (2 veckor)</option>
            <option value="21">21 dagar (3 veckor)</option>
          </Select>
        </div>

        {/* Data source indicator */}
        {actualIntake && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              useActualData ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {useActualData ? (
              <>
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Använder faktiskt kaloriintag</p>
                  <p className="text-xs mt-0.5">
                    {actualIntake.daysWithData} av {actualIntake.totalDays} dagar har matloggdata (
                    {Math.round(actualIntake.completenessPercent)}%)
                  </p>
                </div>
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Använder målkalorier</p>
                  <p className="text-xs mt-0.5">
                    Logga mat för bättre precision ({actualIntake.daysWithData}/
                    {actualIntake.totalDays} dagar med data)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Calibration results */}
        {calibrationData ? (
          <div className="space-y-4 pt-2">
            {/* Warning for erratic fluctuations */}
            {calibrationData.isErratic && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 text-sm text-orange-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Stora viktfluktuationer ({calibrationData.weeklyChangePercent > 0 ? '+' : ''}
                  {calibrationData.weeklyChangePercent.toFixed(1)}% per vecka) kan påverka
                  noggrannheten. Vätskeretenering eller andra faktorer kan ge missvisande resultat.
                </p>
              </div>
            )}

            {/* Weight change */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-neutral-50">
              <div>
                <p className="text-xs text-neutral-500">Startvikt</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {calibrationData.startWeight.toFixed(1)} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Slutvikt</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {calibrationData.endWeight.toFixed(1)} kg
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-500">Viktförändring</p>
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    calibrationData.weightChange > 0
                      ? 'text-orange-600'
                      : calibrationData.weightChange < 0
                        ? 'text-blue-600'
                        : 'text-neutral-600'
                  }`}
                >
                  {calibrationData.weightChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : calibrationData.weightChange < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : null}
                  {calibrationData.weightChange > 0 ? '+' : ''}
                  {calibrationData.weightChange.toFixed(2)} kg (
                  {calibrationData.weightChange > 0 ? '+' : ''}
                  {calibrationData.weightChangePercent.toFixed(1)}%)
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-500">Datapunkter</p>
                <p className="text-sm font-medium text-neutral-700">
                  {calibrationData.numDataPoints} viktmätningar under {calibrationData.daysOfData}{' '}
                  dagar
                  {calibrationData.usedOldestWeight && (
                    <span className="text-xs text-neutral-500 ml-1">(inkl. äldsta vikt)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Calorie balance */}
            <div className="p-3 rounded-lg bg-neutral-50">
              <p className="text-xs text-neutral-500">Estimerad daglig kaloribalans</p>
              <p
                className={`text-sm font-semibold ${
                  calibrationData.dailyCalorieBalance > 0
                    ? 'text-orange-600'
                    : calibrationData.dailyCalorieBalance < 0
                      ? 'text-blue-600'
                      : 'text-neutral-600'
                }`}
              >
                {calibrationData.dailyCalorieBalance > 0 ? '+' : ''}
                {Math.round(calibrationData.dailyCalorieBalance)} kcal/dag
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Baserat på {useActualData ? 'faktiskt intag' : 'målkalorier'}:{' '}
                {Math.round(calibrationData.averageCalories)} kcal/dag
              </p>
            </div>

            {/* TDEE comparison */}
            <div className="space-y-3 p-4 rounded-lg bg-primary-50 border border-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600">Nuvarande TDEE</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {Math.round(profile.tdee)} kcal
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-600">Kalibrerat TDEE</p>
                  <p className="text-lg font-bold text-primary-600">
                    {Math.round(calibrationData.calibratedTDEE)} kcal
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-primary-200">
                <p className="text-xs text-neutral-600">Skillnad</p>
                <p
                  className={`text-sm font-semibold ${
                    calibrationData.tdeeDifference > 0
                      ? 'text-orange-600'
                      : calibrationData.tdeeDifference < 0
                        ? 'text-blue-600'
                        : 'text-neutral-600'
                  }`}
                >
                  {calibrationData.tdeeDifference > 0 ? '+' : ''}
                  {Math.round(calibrationData.tdeeDifference)} kcal (
                  {calibrationData.tdeeDifference > 0 ? '+' : ''}
                  {calibrationData.tdeeDifferencePercent.toFixed(1)}%)
                </p>
              </div>

              {/* Warning if limited */}
              {calibrationData.isLimited && (
                <div className="flex items-start gap-2 p-2 rounded bg-orange-50 text-xs text-orange-800">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p>Justerad till max ±20% av nuvarande TDEE för säkerhet</p>
                </div>
              )}
            </div>

            {/* Apply button or success state */}
            {calibrationApplied ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  TDEE kalibrerat till {Math.round(calibrationApplied)} kcal
                </p>
                <p className="text-xs text-green-600 mt-1">Ditt kaloriintervall har uppdaterats</p>
                {onClose && (
                  <Button variant="outline" size="sm" onClick={onClose} className="mt-3">
                    Stäng
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleApplyCalibration}
                disabled={updateProfile.isPending || createCalibrationHistory.isPending}
                className="w-full"
              >
                {updateProfile.isPending || createCalibrationHistory.isPending
                  ? 'Sparar...'
                  : 'Applicera kalibrerat TDEE'}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-neutral-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p>Behöver minst 2 viktmätningar för kalibrering</p>
            <p className="mt-1">
              {emptyStateInfo.recentWeightsCount === 0 && emptyStateInfo.hasUsableOldestWeight ? (
                <>
                  Din äldsta vikt ({emptyStateInfo.oldestWeight} kg) används som första punkt.
                  <br />
                  Logga en ny vikt för att kalibrera.
                </>
              ) : emptyStateInfo.recentWeightsCount === 1 ? (
                <>
                  Du har 1 viktmätning inom perioden.
                  <br />
                  Logga ytterligare en vikt för att kalibrera.
                </>
              ) : emptyStateInfo.totalWeightsCount === 0 ? (
                <>Börja logga vikt för att aktivera kalibrering</>
              ) : (
                <>Logga fler viktmätningar för att aktivera kalibrering</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
