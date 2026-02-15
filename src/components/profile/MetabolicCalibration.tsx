/**
 * MetabolicCalibration - Kalibrera TDEE baserat på viktförändringar
 *
 * Använder kluster-medelvärde (tredjedelsindelning) för robust start-/slutvikt.
 * Adaptiv säkerhetsgräns baserad på datakvalitet och konfidens.
 * Tidsperioder: 14, 21 eller 28 dagar (7 dagar borttagen — för lågt signal/brus).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InfoCardWithModal from '@/components/InfoCardWithModal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Scale,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Database,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Undo2,
  BarChart3,
  Blend,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  useWeightHistory,
  useUpdateProfile,
  useActualCalorieIntake,
  useCreateCalibrationHistory,
  useCalibrationHistory,
  useRevertCalibration,
} from '@/hooks'
import {
  runCalibration,
  MIN_DATA_POINTS,
  buildClusters,
  applyConvergenceSmoothing,
} from '@/lib/calculations/calibration'
import type { Profile, CalibrationResult } from '@/lib/types'
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
  const [timePeriod, setTimePeriod] = useState<14 | 21 | 28>(21)
  const [calibrationApplied, setCalibrationApplied] = useState<number | null>(null)

  const { data: weightHistory } = useWeightHistory()
  const updateProfile = useUpdateProfile()
  const createCalibrationHistory = useCreateCalibrationHistory()
  const revertCalibration = useRevertCalibration()
  const { data: calibrationHistoryList } = useCalibrationHistory(profile.id)

  // Date range for calorie intake
  const now = useMemo(() => new Date(), [])
  const startDate = useMemo(
    () => new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000),
    [now, timePeriod]
  )

  const { data: actualIntake } = useActualCalorieIntake(profile.id, startDate, now)

  const isFirstCalibration = !calibrationHistoryList || calibrationHistoryList.length === 0
  const lastCalibration = calibrationHistoryList?.[0]
  const canRevert = lastCalibration && !lastCalibration.is_reverted && !calibrationApplied

  // Check which periods are available (for disabling dropdown options)
  const periodAvailability = useMemo(() => {
    const result: Record<14 | 21 | 28, boolean> = { 14: false, 21: false, 28: false }
    if (!weightHistory) return result
    for (const period of [14, 21, 28] as const) {
      const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
      const count = weightHistory.filter(w => new Date(w.recorded_at) >= cutoff).length
      if (count >= MIN_DATA_POINTS[period]) {
        const clusters = buildClusters(weightHistory, period, now)
        result[period] = clusters !== null
      }
    }
    return result
  }, [weightHistory, now])

  // Run calibration
  const calibrationResult = useMemo((): CalibrationResult | string | null => {
    if (!weightHistory || weightHistory.length < 2) return null

    const targetCalories =
      profile.calories_min && profile.calories_max
        ? (profile.calories_min + profile.calories_max) / 2
        : profile.tdee || 2000

    // Calculate deficit percent for safeguard
    const currentTDEE = profile.tdee || 2000
    const deficitPercent =
      currentTDEE > 0 ? ((currentTDEE - targetCalories) / currentTDEE) * 100 : undefined

    return runCalibration({
      weightHistory,
      periodDays: timePeriod,
      currentTDEE,
      targetCalories,
      actualCaloriesAvg: actualIntake?.averageCalories ?? null,
      foodLogCompleteness: actualIntake?.completenessPercent ?? 0,
      daysWithLogData: actualIntake?.daysWithData ?? 0,
      isFirstCalibration,
      deficitPercent: deficitPercent && deficitPercent > 0 ? deficitPercent : undefined,
      now,
    })
  }, [weightHistory, timePeriod, profile, actualIntake, isFirstCalibration, now])

  const isError = typeof calibrationResult === 'string'
  const data =
    typeof calibrationResult === 'object' && calibrationResult !== null ? calibrationResult : null

  const handleApplyCalibration = async () => {
    if (!data) return

    // Apply convergence smoothing if there's calibration history
    const convergence =
      calibrationHistoryList && calibrationHistoryList.length > 0
        ? applyConvergenceSmoothing(
            data.clampedTDEE,
            calibrationHistoryList
              .filter(c => !c.is_reverted)
              .map(c => ({
                applied_tdee: c.applied_tdee,
                confidence_level: c.confidence_level,
              }))
          )
        : null

    const newTDEE = convergence ? convergence.smoothedTDEE : data.clampedTDEE
    const smoothedTdee = convergence ? convergence.smoothedTDEE : null

    // Recalculate calorie range based on goal
    let caloriesMin = newTDEE * 0.97
    let caloriesMax = newTDEE * 1.03

    if (profile.calorie_goal === 'Weight loss') {
      const deficitPct =
        profile.deficit_level === '10-15%'
          ? 0.125
          : profile.deficit_level === '20-25%'
            ? 0.225
            : 0.275
      caloriesMin = newTDEE * (1 - deficitPct - 0.025)
      caloriesMax = newTDEE * (1 - deficitPct + 0.025)
    } else if (profile.calorie_goal === 'Weight gain') {
      caloriesMin = newTDEE * 1.1
      caloriesMax = newTDEE * 1.2
    }

    try {
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
            weight_change_kg: data.weightChangeKg,
            daily_calorie_balance: (data.weightChangeKg * 7700) / data.actualDays,
            previous_tdee: profile.tdee,
            calibrated_tdee: newTDEE,
            target_calories: data.averageCalories,
            used_food_log: data.calorieSource !== 'target_calories',
            actual_calories_avg:
              data.calorieSource !== 'target_calories' ? data.averageCalories : null,
          },
        },
      })

      await createCalibrationHistory.mutateAsync({
        profile_id: profile.id,
        time_period_days: timePeriod,
        start_weight_kg: data.startCluster.average,
        end_weight_kg: data.endCluster.average,
        weight_change_kg: data.weightChangeKg,
        target_calories: data.averageCalories,
        actual_calories_avg: data.calorieSource !== 'target_calories' ? data.averageCalories : null,
        used_food_log: data.calorieSource !== 'target_calories',
        days_with_log_data: actualIntake?.daysWithData || 0,
        previous_tdee: profile.tdee || 0,
        calculated_tdee: data.rawTDEE,
        smoothed_tdee: smoothedTdee,
        applied_tdee: newTDEE,
        was_limited: data.wasLimited,
        start_cluster_size: data.startCluster.count,
        end_cluster_size: data.endCluster.count,
        confidence_level: data.confidence.level,
        calorie_source: data.calorieSource,
        max_allowed_adjustment_percent: data.maxAllowedAdjustmentPercent,
        coefficient_of_variation: data.coefficientOfVariation,
        warnings: data.warnings.map(w => w.type),
        food_log_weight: data.foodLogWeight,
        data_quality_index: data.dataQuality.score,
      })

      setCalibrationApplied(newTDEE)
      toast.success(`TDEE kalibrerat! Nytt värde: ${Math.round(newTDEE)} kcal`)

      if (onClose) {
        setTimeout(() => onClose(), 1500)
      }
    } catch {
      toast.error('Kunde inte spara kalibrering')
    }
  }

  const handleRevertCalibration = async () => {
    if (!lastCalibration) return

    try {
      await revertCalibration.mutateAsync({
        calibrationId: lastCalibration.id,
        profileId: profile.id,
        previousTdee: lastCalibration.previous_tdee,
      })
    } catch {
      // Error handled in hook
    }
  }

  if (!profile.tdee) return null

  const isCompact = variant === 'compact'

  const ConfidenceIcon = data
    ? data.confidence.level === 'high'
      ? ShieldCheck
      : data.confidence.level === 'standard'
        ? Shield
        : ShieldAlert
    : Shield

  const confidenceColor = data
    ? data.confidence.level === 'high'
      ? 'text-green-600'
      : data.confidence.level === 'standard'
        ? 'text-yellow-600'
        : 'text-orange-600'
    : 'text-neutral-400'

  const confidenceLabel = data
    ? data.confidence.level === 'high'
      ? 'Hög tillförlitlighet'
      : data.confidence.level === 'standard'
        ? 'Medel tillförlitlighet'
        : 'Låg tillförlitlighet'
    : ''

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
          <InfoCardWithModal
            title="Om metabolisk kalibrering"
            modalTitle="Metabolisk kalibrering"
            modalContent={
              <div className="space-y-4 text-neutral-700">
                <p>
                  Kalibrera ditt TDEE baserat på faktiska viktförändringar. Systemet
                  medelvärdesberäknar start- och slutvikt för att dämpa dagliga fluktuationer.
                </p>
                <p>
                  Välj en tidsperiod (14, 21 eller 28 dagar) och systemet analyserar dina vägningar
                  för att beräkna din faktiska energiförbrukning. Längre perioder ger mer
                  tillförlitliga resultat.
                </p>
              </div>
            }
          />
        )}

        {/* Time period selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Tidsperiod</label>
          <Select
            value={timePeriod.toString()}
            onChange={e => setTimePeriod(Number(e.target.value) as 14 | 21 | 28)}
          >
            <option value="14" disabled={!periodAvailability[14]}>
              14 dagar (2 veckor){!periodAvailability[14] ? ' — otillräcklig data' : ''}
            </option>
            <option value="21" disabled={!periodAvailability[21]}>
              21 dagar (3 veckor){!periodAvailability[21] ? ' — otillräcklig data' : ''}
            </option>
            <option value="28" disabled={!periodAvailability[28]}>
              28 dagar (4 veckor){!periodAvailability[28] ? ' — otillräcklig data' : ''}
            </option>
          </Select>
        </div>

        {/* Data source indicator (continuous blending) */}
        {actualIntake && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              data?.calorieSource === 'food_log'
                ? 'bg-green-50 text-green-800'
                : data?.calorieSource === 'blended'
                  ? 'bg-blue-50 text-blue-800'
                  : 'bg-amber-50 text-amber-800'
            }`}
          >
            {data?.calorieSource === 'food_log' ? (
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
            ) : data?.calorieSource === 'blended' ? (
              <>
                <Blend className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Blandar matlogg + målkalorier</p>
                  <p className="text-xs mt-0.5">
                    {actualIntake.daysWithData} av {actualIntake.totalDays} dagar med data (
                    {Math.round(actualIntake.completenessPercent)}%) — matlogg viktas{' '}
                    {Math.round((data.foodLogWeight ?? 0) * 100)}%
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
                    {actualIntake.totalDays} dagar med data). Om du äter mer/mindre än målet blir
                    kalibreringen missvisande.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-6 text-sm text-neutral-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p>{calibrationResult}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-4 pt-2">
            {/* Confidence + Data Quality badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ConfidenceIcon className={`h-4 w-4 ${confidenceColor}`} />
                <span className={`text-sm font-medium ${confidenceColor}`}>{confidenceLabel}</span>
              </div>
              {data.dataQuality && (
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-neutral-500" />
                  <span
                    className={`text-xs font-medium ${
                      data.dataQuality.score >= 80
                        ? 'text-green-600'
                        : data.dataQuality.score >= 60
                          ? 'text-blue-600'
                          : data.dataQuality.score >= 40
                            ? 'text-yellow-600'
                            : 'text-orange-600'
                    }`}
                  >
                    {data.dataQuality.label} ({data.dataQuality.score}/100)
                  </span>
                </div>
              )}
            </div>

            {/* Warnings */}
            {data.warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 text-sm text-orange-800"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{warning.message}</p>
              </div>
            ))}

            {/* Cluster details */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-neutral-50">
              <div>
                <p className="text-xs text-neutral-500">
                  Startkluster ({data.startCluster.count} mätningar)
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {data.startCluster.average.toFixed(1)} kg
                </p>
                <p className="text-xs text-neutral-400">
                  {data.startCluster.weights.map(w => w.toFixed(1)).join(', ')} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">
                  Slutkluster ({data.endCluster.count} mätningar)
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {data.endCluster.average.toFixed(1)} kg
                </p>
                <p className="text-xs text-neutral-400">
                  {data.endCluster.weights.map(w => w.toFixed(1)).join(', ')} kg
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-neutral-500">Viktförändring</p>
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    data.weightChangeKg > 0
                      ? 'text-orange-600'
                      : data.weightChangeKg < 0
                        ? 'text-blue-600'
                        : 'text-neutral-600'
                  }`}
                >
                  {data.weightChangeKg > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : data.weightChangeKg < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : null}
                  {data.weightChangeKg > 0 ? '+' : ''}
                  {data.weightChangeKg.toFixed(2)} kg över {Math.round(data.actualDays)} dagar
                </p>
                {data.isStableMaintenance && (
                  <p className="text-xs text-green-600 mt-1">
                    Din vikt är stabil — ditt TDEE verkar stämma
                  </p>
                )}
              </div>
            </div>

            {/* Calorie balance */}
            <div className="p-3 rounded-lg bg-neutral-50">
              <p className="text-xs text-neutral-500">Estimerad daglig kaloribalans</p>
              <p
                className={`text-sm font-semibold ${
                  data.weightChangeKg > 0
                    ? 'text-orange-600'
                    : data.weightChangeKg < 0
                      ? 'text-blue-600'
                      : 'text-neutral-600'
                }`}
              >
                {data.weightChangeKg > 0 ? '+' : ''}
                {Math.round((data.weightChangeKg * 7700) / data.actualDays)} kcal/dag
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Baserat på{' '}
                {data.calorieSource === 'food_log'
                  ? 'faktiskt intag'
                  : data.calorieSource === 'blended'
                    ? 'blandat intag'
                    : 'målkalorier'}
                : {Math.round(data.averageCalories)} kcal/dag
              </p>
            </div>

            {/* TDEE comparison */}
            <div className="space-y-3 p-4 rounded-lg bg-primary-50 border border-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-600">Nuvarande TDEE</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {Math.round(data.currentTDEE)} kcal
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-600">Kalibrerat TDEE</p>
                  <p className="text-lg font-bold text-primary-600">
                    {Math.round(data.clampedTDEE)} kcal
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-primary-200">
                <p className="text-xs text-neutral-600">Skillnad</p>
                <p
                  className={`text-sm font-semibold ${
                    data.adjustmentPercent > 0
                      ? 'text-orange-600'
                      : data.adjustmentPercent < 0
                        ? 'text-blue-600'
                        : 'text-neutral-600'
                  }`}
                >
                  {data.adjustmentPercent > 0 ? '+' : ''}
                  {Math.round(data.clampedTDEE - data.currentTDEE)} kcal (
                  {data.adjustmentPercent > 0 ? '+' : ''}
                  {data.adjustmentPercent.toFixed(1)}%)
                </p>
              </div>
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
              <div className="space-y-2">
                <Button
                  onClick={handleApplyCalibration}
                  disabled={updateProfile.isPending || createCalibrationHistory.isPending}
                  className="w-full"
                >
                  {updateProfile.isPending || createCalibrationHistory.isPending
                    ? 'Sparar...'
                    : 'Applicera kalibrerat TDEE'}
                </Button>

                {/* Undo last calibration */}
                {canRevert && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevertCalibration}
                    disabled={revertCalibration.isPending}
                    className="w-full text-neutral-600"
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                    {revertCalibration.isPending
                      ? 'Ångrar...'
                      : `Ångra senaste kalibrering (→ ${Math.round(lastCalibration.previous_tdee)} kcal)`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* No data state (not error, just null) */}
        {!data && !isError && (
          <div className="text-center py-6 text-sm text-neutral-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p>
              Behöver minst {MIN_DATA_POINTS[timePeriod]} viktmätningar under {timePeriod} dagar
            </p>
            <p className="mt-1">Logga fler viktmätningar för att aktivera kalibrering</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
