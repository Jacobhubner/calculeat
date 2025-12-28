/**
 * MetabolicCalibration - Kalibrera TDEE baserat på viktförändringar
 * Användare kan manuellt starta kalibrering med flexibel tidsperiod (7, 14, 21 dagar)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Scale, TrendingDown, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useWeightHistory, useUpdateProfile } from '@/hooks'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'
import MetabolicCalibrationGuide from './MetabolicCalibrationGuide'

interface MetabolicCalibrationProps {
  profile: Profile
}

export default function MetabolicCalibration({ profile }: MetabolicCalibrationProps) {
  const [timePeriod, setTimePeriod] = useState<7 | 14 | 21>(14)
  const { data: weightHistory } = useWeightHistory(profile.id)
  const updateProfile = useUpdateProfile()

  // Calculate weight change and actual TDEE
  const calibrationData = useMemo(() => {
    if (!weightHistory || weightHistory.length < 2) return null

    // Get weights from selected time period
    const now = new Date()
    const startDate = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000)

    const recentWeights = weightHistory
      .filter(w => new Date(w.recorded_at) >= startDate)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

    if (recentWeights.length < 2) return null

    const startWeight = recentWeights[0].weight_kg
    const endWeight = recentWeights[recentWeights.length - 1].weight_kg
    const weightChange = endWeight - startWeight
    const weightChangePercent = (weightChange / startWeight) * 100

    // Calculate calorie balance from weight change
    // 1 kg body weight ≈ 7700 kcal
    const totalCalorieBalance = weightChange * 7700
    const dailyCalorieBalance = totalCalorieBalance / timePeriod

    // Calculate actual TDEE
    // If user is on "maintain weight" but gained/lost weight:
    // actual_TDEE = average_calories - daily_balance
    //
    // Assume user has been eating at their target calories
    const targetCalories =
      profile.calories_min && profile.calories_max
        ? (profile.calories_min + profile.calories_max) / 2
        : profile.tdee || 2000

    const actualTDEE = targetCalories - dailyCalorieBalance

    // Safety check: limit adjustments to ±20% of current TDEE
    const currentTDEE = profile.tdee || 2000
    const maxTDEE = currentTDEE * 1.2
    const minTDEE = currentTDEE * 0.8
    const calibratedTDEE = Math.max(minTDEE, Math.min(maxTDEE, actualTDEE))
    const isLimited = Math.abs(calibratedTDEE - actualTDEE) > 0.5

    // Check for erratic fluctuations (>3% per week)
    const weeklyChangePercent = (weightChangePercent / timePeriod) * 7
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
      actualTDEE,
      calibratedTDEE,
      isLimited,
      isErratic,
      weeklyChangePercent,
      tdeeDifference,
      tdeeDifferencePercent,
      daysOfData: timePeriod,
      numDataPoints: recentWeights.length,
    }
  }, [weightHistory, timePeriod, profile])

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
          target_calories: (profile.calories_min! + profile.calories_max!) / 2,
        },
      },
    })

    toast.success(`TDEE kalibrerat! Nytt värde: ${Math.round(newTDEE)} kcal`)
  }

  // Don't show if user doesn't have TDEE set
  if (!profile.tdee) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary-500" />
            Metabolisk Kalibrering
          </CardTitle>
          <MetabolicCalibrationGuide />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info text */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-neutral-50 text-sm text-neutral-700">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-neutral-500" />
          <p>
            Kalibrera ditt TDEE baserat på faktiska viktförändringar. Välj tidsperiod och systemet
            beräknar ditt verkliga energibehov.
          </p>
        </div>

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
                  {calibrationData.numDataPoints} viktmätningar under {timePeriod} dagar
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
              <p className="text-xs text-neutral-500 mt-1">(Baserat på 1 kg ≈ 7700 kcal)</p>
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

            {/* Apply button */}
            <Button
              onClick={handleApplyCalibration}
              disabled={updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending ? 'Sparar...' : 'Applicera kalibrerat TDEE'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-neutral-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p>Behöver minst 2 viktmätningar under vald period</p>
            <p className="mt-1">Börja logga vikt för att aktivera kalibrering</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
