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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
} from 'lucide-react'

import { startOfDay, endOfDay, subDays, addDays, isBefore, format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useWeightHistory,
  useUpdateProfile,
  useActualCalorieIntake,
  useCreateCalibrationHistory,
  useCalibrationHistory,
  useRevertCalibration,
  useDeleteCalibrationHistory,
} from '@/hooks'
import {
  runCalibration,
  MIN_DATA_POINTS,
  MIN_NEW_WEIGHTS_AFTER_CALIBRATION,
  buildClusters,
} from '@/lib/calculations/calibration'
import type { Profile, CalibrationResult, ProfileFormData } from '@/lib/types'
import { toast } from 'sonner'

interface MetabolicCalibrationProps {
  profile: Profile
  variant?: 'full' | 'compact'
  onClose?: () => void
  onRevert?: () => void
}

function CalibrationHistoryList({
  history,
  profileId,
}: {
  history: import('@/lib/types').CalibrationHistory[]
  profileId: string
}) {
  const { t } = useTranslation('tools')
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const deleteCalibration = useDeleteCalibrationHistory()
  const active = history.filter(c => !c.is_reverted)
  if (active.length === 0) return null
  return (
    <div className="border-t border-neutral-100 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 w-full"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        {t('metabolicCalibration.historyTitle', { count: active.length })}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {active.map((c, i) => (
            <div key={c.id} className="flex justify-between items-center text-xs text-neutral-600">
              <span className="text-neutral-400">
                {new Date(c.calibrated_at).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {i === 0 && (
                  <span className="ml-1 text-primary-600 font-medium">
                    {t('metabolicCalibration.historyLatest')}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {Math.round(c.previous_tdee)} → {Math.round(c.applied_tdee)} kcal
                </span>
                {confirmId === c.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        deleteCalibration.mutate({ id: c.id, profileId })
                        setConfirmId(null)
                      }}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      {t('metabolicCalibration.historyDelete')}
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-neutral-500 hover:text-neutral-700"
                    >
                      {t('metabolicCalibration.historyCancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(c.id)}
                    className="text-neutral-300 hover:text-red-500 transition-colors"
                    aria-label={t('metabolicCalibration.historyDelete')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MetabolicCalibration({
  profile,
  variant = 'full',
  onClose,
  onRevert,
}: MetabolicCalibrationProps) {
  const { t } = useTranslation('tools')
  const [isOpen, setIsOpen] = useState(false)
  const [warningSectionOpen, setWarningSectionOpen] = useState(false)
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(new Set())
  const toggleWarning = (i: number) =>
    setExpandedWarnings(prev => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  const [timePeriod, setTimePeriod] = useState<14 | 21 | 28>(21)
  const [calibrationApplied, setCalibrationApplied] = useState<number | null>(null)
  const [confirmRevert, setConfirmRevert] = useState(false)

  const { data: weightHistory } = useWeightHistory()
  const updateProfile = useUpdateProfile()
  const createCalibrationHistory = useCreateCalibrationHistory()
  const revertCalibration = useRevertCalibration()
  const { data: calibrationHistoryList, isLoading: calibrationHistoryLoading } =
    useCalibrationHistory(profile.id)

  const [periodEndDate, setPeriodEndDate] = useState<Date>(() => endOfDay(new Date()))
  const refreshNow = useCallback(() => setPeriodEndDate(endOfDay(new Date())), [])

  // Stable "today" reference — recalculates when the user navigates periods.
  const today = useMemo(() => startOfDay(new Date()), [periodEndDate])

  const startDate = useMemo(
    () => startOfDay(subDays(periodEndDate, timePeriod)),
    [periodEndDate, timePeriod]
  )
  // Alias kept for backward compatibility with useMemos below
  const now = periodEndDate

  const goBack = useCallback(() => {
    setPeriodEndDate(d => endOfDay(subDays(d, timePeriod)))
  }, [timePeriod])

  const goForward = useCallback(() => {
    setPeriodEndDate(d => {
      const next = endOfDay(addDays(d, timePeriod))
      return next > endOfDay(new Date()) ? endOfDay(new Date()) : next
    })
  }, [timePeriod])

  const isAtToday = !isBefore(startOfDay(periodEndDate), today)

  const { data: actualIntake } = useActualCalorieIntake(profile.id, startDate, now)

  const isFirstCalibration = !calibrationHistoryList || calibrationHistoryList.length === 0

  // The new-data guard should only block re-apply against the last *active* (non-reverted)
  // calibration. If that calibration was reverted, there is no active baseline to protect.
  const lastActiveCalibration = calibrationHistoryList?.find(c => !c.is_reverted) ?? null

  const canRevert = useMemo(() => {
    if (!lastActiveCalibration) return false
    return profile.tdee_source === 'metabolic_calibration'
  }, [lastActiveCalibration, profile.tdee_source])

  // B+ availability guard:
  // 1. Selected period must not overlap last calibration's period (selectedStart > lastEndDate)
  // 2. At least MIN_NEW_WEIGHTS_AFTER_CALIBRATION new weight entries after lastEndDate
  const availabilityGuard = useMemo(() => {
    if (calibrationHistoryLoading)
      return { allowed: false, overlaps: false, newWeightCount: 0, nextAvailableDate: null }
    if (!lastActiveCalibration)
      return { allowed: true, overlaps: false, newWeightCount: 0, nextAvailableDate: null }

    // Last calibration's end date = calibrated_at date (period ends when calibration is applied)
    const lastEndDate = startOfDay(new Date(lastActiveCalibration.calibrated_at))
    // Last calibration's start date = end - time_period_days
    const lastStartDate = subDays(lastEndDate, lastActiveCalibration.time_period_days)

    // Selected period: startDate is calculated from periodEndDate and timePeriod
    const selectedStart = startDate ? startOfDay(startDate) : null

    // Overlap check: selected period overlaps if selectedStart <= lastEndDate
    const overlaps = selectedStart ? !isBefore(lastEndDate, selectedStart) : false

    // New weight measurements strictly after the last calibration's end date
    const newWeightCount = (weightHistory ?? []).filter(
      w => startOfDay(new Date(w.recorded_at)) > lastEndDate
    ).length
    const hasEnoughNewWeights = newWeightCount >= MIN_NEW_WEIGHTS_AFTER_CALIBRATION

    const allowed = !overlaps && hasEnoughNewWeights

    // Next available date: the later of (lastEndDate + 1 day) as period start requirement
    // and the date when we expect the 3rd new weight (unknown, so just show lastEndDate + 1)
    const nextAvailableDate = addDays(lastEndDate, 1)

    return { allowed, overlaps, newWeightCount, nextAvailableDate, lastStartDate, lastEndDate }
  }, [calibrationHistoryLoading, lastActiveCalibration, startDate, weightHistory])
  const hasNewDataSinceCalibration = availabilityGuard.allowed

  // Check which periods are available (for disabling dropdown options)
  const periodAvailability = useMemo(() => {
    const result: Record<14 | 21 | 28, boolean> = { 14: false, 21: false, 28: false }
    if (!weightHistory || !now) return result
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

  const periodMeasurementCounts = useMemo(() => {
    const result: Record<14 | 21 | 28, number> = { 14: 0, 21: 0, 28: 0 }
    if (!weightHistory || !now) return result
    for (const period of [14, 21, 28] as const) {
      const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
      result[period] = weightHistory.filter(w => new Date(w.recorded_at) >= cutoff).length
    }
    return result
  }, [weightHistory, now])

  // Run calibration
  const calibrationResult = useMemo((): CalibrationResult | string | null => {
    if (!weightHistory || weightHistory.length < 2 || !now) return null

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

    const newTDEE = data.clampedTDEE
    const smoothedTdee = null

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
        } as Partial<ProfileFormData>,
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
        is_reverted: false,
      })

      setCalibrationApplied(newTDEE)
      toast.success(t('metabolicCalibration.toastSuccess', { kcal: Math.round(newTDEE) }))

      if (onClose) {
        setTimeout(() => onClose(), 1500)
      }
    } catch {
      toast.error(t('metabolicCalibration.toastError'))
    }
  }

  const handleRevertCalibration = async () => {
    if (!lastActiveCalibration) return

    try {
      await revertCalibration.mutateAsync({
        calibrationId: lastActiveCalibration.id,
        profileId: profile.id,
        previousTdee: lastActiveCalibration.previous_tdee,
      })
      onRevert?.()
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
      ? t('metabolicCalibration.confidence.high')
      : data.confidence.level === 'standard'
        ? t('metabolicCalibration.confidence.standard')
        : t('metabolicCalibration.confidence.low')
    : ''

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <CardTitle className="flex items-center gap-2 text-lg leading-snug">
            <Scale className="h-5 w-5 flex-shrink-0 text-primary-500" />
            {t('metabolicCalibration.title')}
          </CardTitle>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className={`space-y-4 ${isCompact ? 'pt-0' : 'pt-0'}`}>
          {/* Info card */}
          {!isCompact && (
            <InfoCardWithModal
              title={t('metabolicCalibration.infoCardTitle')}
              modalTitle={t('metabolicCalibration.infoModalTitle')}
              modalContent={
                <div className="space-y-6 text-sm">
                  {/* Section 1 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                      {t('metabolicCalibration.infoModal.section1Title')}
                    </h3>
                    <p
                      className="text-neutral-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: t('metabolicCalibration.infoModal.section1p1'),
                      }}
                    />
                    <p
                      className="text-neutral-700 leading-relaxed mt-2"
                      dangerouslySetInnerHTML={{
                        __html: t('metabolicCalibration.infoModal.section1p2'),
                      }}
                    />
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section1p3')}
                    </p>
                  </section>

                  {/* Section 2 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section2Title')}
                    </h3>
                    <div className="space-y-3 text-neutral-700">
                      <div>
                        <p>{t('metabolicCalibration.infoModal.section2intro')}</p>
                        <p className="text-neutral-600 italic ml-2 mt-1">
                          {t('metabolicCalibration.infoModal.section2principle')}
                        </p>
                      </div>
                      <p>{t('metabolicCalibration.infoModal.section2detail')}</p>
                      <p className="font-medium text-primary-600 text-center py-1">
                        {t('metabolicCalibration.infoModal.section2formula')}
                      </p>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: t('metabolicCalibration.infoModal.section2kcal'),
                        }}
                      />
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.infoModal.section2clusterTitle')}
                        </p>
                        <p
                          className="mt-1"
                          dangerouslySetInnerHTML={{
                            __html: t('metabolicCalibration.infoModal.section2cluster'),
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.infoModal.section2calorieTitle')}
                        </p>
                        <p className="mt-1">
                          {t('metabolicCalibration.infoModal.section2calorie')}
                        </p>
                        <p className="mt-1">
                          {t('metabolicCalibration.infoModal.section2selective')}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section3Title')}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      {t('metabolicCalibration.infoModal.section3p1')}
                    </p>
                    <p
                      className="text-neutral-700 leading-relaxed mt-2"
                      dangerouslySetInnerHTML={{
                        __html: t('metabolicCalibration.infoModal.section3p2'),
                      }}
                    />
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section3p3')}
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section3p4')}
                    </p>
                  </section>

                  {/* Section 4 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section4Title')}
                    </h3>
                    <p
                      className="text-neutral-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: t('metabolicCalibration.infoModal.section4p1'),
                      }}
                    />
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-neutral-700">
                      {(
                        t('metabolicCalibration.infoModal.section4bullets', {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                      ))}
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section4p2')}
                    </p>
                    <div className="mt-3 p-3 bg-neutral-100 rounded text-neutral-600 text-xs">
                      <p className="font-medium mb-1">
                        {t('metabolicCalibration.infoModal.section4tipTitle')}
                      </p>
                      <p>{t('metabolicCalibration.infoModal.section4tip')}</p>
                    </div>
                  </section>

                  {/* Section 5 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section5Title')}
                    </h3>
                    <div className="space-y-3 text-neutral-700">
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.infoModal.section5clampTitle')}
                        </p>
                        <p className="mt-1">{t('metabolicCalibration.infoModal.section5p1')}</p>
                        <p className="font-medium text-primary-600 text-center py-1">
                          {t('metabolicCalibration.infoModal.section5range')}
                        </p>
                        <p>{t('metabolicCalibration.infoModal.section5p2')}</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.infoModal.section5smoothTitle')}
                        </p>
                        <p
                          className="mt-1"
                          dangerouslySetInnerHTML={{
                            __html: t('metabolicCalibration.infoModal.section5p3'),
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.infoModal.section5historyTitle')}
                        </p>
                        <p className="mt-1">{t('metabolicCalibration.infoModal.section5p4')}</p>
                      </div>
                    </div>
                  </section>

                  {/* Section 6 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section6Title')}
                    </h3>
                    <p
                      className="text-neutral-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: t('metabolicCalibration.infoModal.section6p1'),
                      }}
                    />
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section6p2')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      {(
                        t('metabolicCalibration.infoModal.section6bullets', {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                      ))}
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section6p3')}
                    </p>
                  </section>

                  {/* Section 7 */}
                  <section>
                    <h3 className="font-semibold text-base mb-3">
                      {t('metabolicCalibration.infoModal.section7Title')}
                    </h3>
                    <p className="text-neutral-700 mb-2">
                      {t('metabolicCalibration.infoModal.section7p1')}
                    </p>
                    <p className="text-neutral-700 font-medium mb-1">
                      {t('metabolicCalibration.infoModal.section7goodTitle')}
                    </p>
                    <ul className="space-y-2">
                      {(
                        t('metabolicCalibration.infoModal.section7good', {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span
                            className="text-neutral-700"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Section 8 */}
                  <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section8Title')}
                    </h3>
                    <p className="text-neutral-700 mb-2">
                      {t('metabolicCalibration.infoModal.section8p1')}
                    </p>
                    <p className="text-neutral-700 font-medium mb-1">
                      {t('metabolicCalibration.infoModal.section8badTitle')}
                    </p>
                    <ul className="space-y-2 text-neutral-700">
                      {(
                        t('metabolicCalibration.infoModal.section8bad', {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5 font-bold">×</span>
                          <span dangerouslySetInnerHTML={{ __html: item }} />
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Section 9 */}
                  <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-base mb-2">
                      {t('metabolicCalibration.infoModal.section9Title')}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      {t('metabolicCalibration.infoModal.section9p1')}
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section9p2')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      {(
                        t('metabolicCalibration.infoModal.section9bullets', {
                          returnObjects: true,
                        }) as string[]
                      ).map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                      ))}
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section9p3')}
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      {t('metabolicCalibration.infoModal.section9p4')}
                    </p>
                  </section>
                </div>
              }
            />
          )}

          {/* Time period selector */}
          {now !== null && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                {t('metabolicCalibration.timePeriodLabel')}
              </label>
              <Select
                value={timePeriod.toString()}
                onChange={e => setTimePeriod(Number(e.target.value) as 14 | 21 | 28)}
              >
                <option value="14" disabled={!periodAvailability[14]}>
                  {!periodAvailability[14]
                    ? t('metabolicCalibration.periodOptionInsufficient_14', {
                        count: periodMeasurementCounts[14],
                      })
                    : t('metabolicCalibration.periodOptions.14')}
                </option>
                <option value="21" disabled={!periodAvailability[21]}>
                  {!periodAvailability[21]
                    ? t('metabolicCalibration.periodOptionInsufficient_21', {
                        count: periodMeasurementCounts[21],
                      })
                    : t('metabolicCalibration.periodOptions.21')}
                </option>
                <option value="28" disabled={!periodAvailability[28]}>
                  {!periodAvailability[28]
                    ? t('metabolicCalibration.periodOptionInsufficient_28', {
                        count: periodMeasurementCounts[28],
                      })
                    : t('metabolicCalibration.periodOptions.28')}
                </option>
              </Select>

              {/* Period navigation */}
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="flex-1 text-center text-xs text-neutral-500">
                  {startDate && periodEndDate
                    ? `${format(startDate, 'd MMM', { locale: sv })} – ${format(periodEndDate, 'd MMM', { locale: sv })}`
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={goForward}
                  disabled={isAtToday}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {!isAtToday && (
                  <button
                    type="button"
                    onClick={refreshNow}
                    className="ml-1 text-xs text-primary-600 hover:underline"
                  >
                    {t('metabolicCalibration.today')}
                  </button>
                )}
              </div>
            </div>
          )}

          {now !== null && (
            <>
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
                        <p className="font-medium">
                          {t('metabolicCalibration.calorieSource.foodLog.label')}
                        </p>
                        <p className="text-xs mt-0.5">
                          {t('metabolicCalibration.calorieSource.foodLog.desc', {
                            logged: actualIntake.daysWithData,
                            total: actualIntake.totalDays,
                            pct: Math.round(actualIntake.completenessPercent),
                          })}
                        </p>
                      </div>
                    </>
                  ) : data?.calorieSource === 'blended' ? (
                    <>
                      <Blend className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.calorieSource.blended.label')}
                        </p>
                        <p className="text-xs mt-1">
                          {t('metabolicCalibration.calorieSource.foodLog.desc', {
                            logged: actualIntake.daysWithData,
                            total: actualIntake.totalDays,
                            pct: Math.round(actualIntake.completenessPercent),
                          })}
                        </p>
                        {data.loggedCaloriesAvg != null && (
                          <p className="text-xs mt-0.5">
                            {t('metabolicCalibration.calorieSource.blended.loggedAvg', {
                              kcal: Math.round(data.loggedCaloriesAvg),
                              days: actualIntake.daysWithData,
                            })}
                          </p>
                        )}
                        <p className="text-xs mt-0.5">
                          {t('metabolicCalibration.calorieSource.blended.estimatedAvg', {
                            kcal: Math.round(data.averageCalories),
                            unlogged: actualIntake.totalDays - actualIntake.daysWithData,
                          })}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {t('metabolicCalibration.calorieSource.blended.tip')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {t('metabolicCalibration.calorieSource.targetCalories.label')}
                        </p>
                        <p className="text-xs mt-0.5">
                          {t('metabolicCalibration.calorieSource.targetCalories.desc', {
                            logged: actualIntake.daysWithData,
                            total: actualIntake.totalDays,
                          })}
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
                  <p className="text-xs text-neutral-400 mt-2">
                    {t('metabolicCalibration.errorFallback')}
                  </p>
                </div>
              )}

              {/* Results */}
              {data && (
                <div className="space-y-4 pt-2">
                  {/* Confidence + Data Quality */}
                  <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                    <div className="flex items-start gap-3 p-3">
                      <ConfidenceIcon
                        className={`h-4 w-4 flex-shrink-0 mt-0.5 ${confidenceColor}`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${confidenceColor}`}>
                          {confidenceLabel}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {data.confidence.level === 'high'
                            ? t('metabolicCalibration.confidence.highDesc', {
                                start: data.confidence.startClusterSize,
                                end: data.confidence.endClusterSize,
                              })
                            : (() => {
                                const reasons = data.confidence.degradeReasons
                                const parts: string[] = []
                                if (reasons.includes('low_cluster_size'))
                                  parts.push(
                                    t('metabolicCalibration.confidence.reasons.low_cluster_size', {
                                      start: data.confidence.startClusterSize,
                                      end: data.confidence.endClusterSize,
                                    })
                                  )
                                if (reasons.includes('sparse_coverage'))
                                  parts.push(
                                    t('metabolicCalibration.confidence.reasons.sparse_coverage')
                                  )
                                if (reasons.includes('nonlinear_trend'))
                                  parts.push(
                                    t('metabolicCalibration.confidence.reasons.nonlinear_trend')
                                  )
                                return parts.length > 0
                                  ? `${t('metabolicCalibration.confidence.degradedPrefix')}${parts.join(', ')}.`
                                  : t('metabolicCalibration.confidence.highDesc', {
                                      start: data.confidence.startClusterSize,
                                      end: data.confidence.endClusterSize,
                                    })
                              })()}
                        </p>
                      </div>
                    </div>
                    {data.dataQuality && (
                      <div className="flex items-start gap-3 p-3">
                        <BarChart3 className="h-4 w-4 flex-shrink-0 mt-0.5 text-neutral-400" />
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-sm font-medium ${
                              data.dataQuality.score >= 80
                                ? 'text-green-600'
                                : data.dataQuality.score >= 60
                                  ? 'text-blue-600'
                                  : data.dataQuality.score >= 40
                                    ? 'text-yellow-600'
                                    : 'text-orange-600'
                            }`}
                          >
                            {t('metabolicCalibration.dataQuality.label')}: {data.dataQuality.label}{' '}
                            ({data.dataQuality.score}/100)
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-neutral-400 hover:text-neutral-600"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-xs text-xs space-y-2 p-3"
                            >
                              <p className="font-medium">
                                {t('metabolicCalibration.dataQuality.tooltipTitle')}
                              </p>
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">
                                      {t('metabolicCalibration.dataQuality.foodLog')}
                                    </td>
                                    <td>{Math.round(data.dataQuality.factors.logScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">
                                      {t('metabolicCalibration.dataQuality.measFreq')}
                                    </td>
                                    <td>{Math.round(data.dataQuality.factors.freqScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">
                                      {t('metabolicCalibration.dataQuality.clusterSize')}
                                    </td>
                                    <td>{Math.round(data.dataQuality.factors.clusterScore)}/100</td>
                                  </tr>
                                </tbody>
                              </table>
                              <p className="text-neutral-400 pt-1 border-t border-neutral-200">
                                {t('metabolicCalibration.dataQuality.legend')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {data.warnings.length > 0 && (
                    <div className="rounded-lg bg-orange-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setWarningSectionOpen(e => !e)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-800 hover:bg-orange-100 transition-colors"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left font-medium">
                          {data.warnings.length === 1
                            ? t('metabolicCalibration.warnings.singular')
                            : t('metabolicCalibration.warnings.plural', {
                                count: data.warnings.length,
                              })}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${warningSectionOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {warningSectionOpen && (
                        <div className="border-t border-orange-200 divide-y divide-orange-200">
                          {data.warnings.map((warning, i) => (
                            <div key={i} className="px-3 py-2.5 text-sm text-orange-800">
                              <div className="flex items-start justify-between gap-2">
                                <p className="flex-1">{warning.message}</p>
                                <button
                                  type="button"
                                  onClick={() => toggleWarning(i)}
                                  className="flex-shrink-0 text-xs text-orange-600 hover:text-orange-800 underline underline-offset-2 mt-0.5"
                                >
                                  {expandedWarnings.has(i)
                                    ? t('metabolicCalibration.warnings.hide')
                                    : t('metabolicCalibration.warnings.showWhy')}
                                </button>
                              </div>
                              {expandedWarnings.has(i) && warning.type === 'high_cv' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>{t('metabolicCalibration.warnings.types.high_cv.desc')}</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t('metabolicCalibration.warnings.types.high_cv.bullets', {
                                        returnObjects: true,
                                      }) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.high_cv.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) &&
                                warning.type === 'target_calories_fallback' && (
                                  <div className="text-xs text-orange-700 mt-1 space-y-1">
                                    <p>
                                      {t(
                                        'metabolicCalibration.warnings.types.target_calories_fallback.desc'
                                      )}
                                    </p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                      {(
                                        t(
                                          'metabolicCalibration.warnings.types.target_calories_fallback.bullets',
                                          { returnObjects: true }
                                        ) as string[]
                                      ).map((b, j) => (
                                        <li key={j}>{b}</li>
                                      ))}
                                    </ul>
                                    <p className="text-orange-600 font-medium">
                                      {t(
                                        'metabolicCalibration.warnings.types.target_calories_fallback.tip'
                                      )}
                                    </p>
                                  </div>
                                )}
                              {expandedWarnings.has(i) && warning.type === 'selective_logging' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t(
                                      'metabolicCalibration.warnings.types.selective_logging.desc'
                                    )}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t(
                                        'metabolicCalibration.warnings.types.selective_logging.bullets',
                                        { returnObjects: true }
                                      ) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.selective_logging.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'glycogen_event' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t('metabolicCalibration.warnings.types.glycogen_event.desc')}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t(
                                        'metabolicCalibration.warnings.types.glycogen_event.bullets',
                                        { returnObjects: true }
                                      ) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.glycogen_event.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'nonlinear_trend' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t('metabolicCalibration.warnings.types.nonlinear_trend.desc')}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t(
                                        'metabolicCalibration.warnings.types.nonlinear_trend.bullets',
                                        { returnObjects: true }
                                      ) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.nonlinear_trend.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'large_deficit' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t('metabolicCalibration.warnings.types.large_deficit.desc')}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t(
                                        'metabolicCalibration.warnings.types.large_deficit.bullets',
                                        { returnObjects: true }
                                      ) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.large_deficit.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'low_confidence' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t('metabolicCalibration.warnings.types.low_confidence.desc')}
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {(
                                      t(
                                        'metabolicCalibration.warnings.types.low_confidence.bullets',
                                        { returnObjects: true }
                                      ) as string[]
                                    ).map((b, j) => (
                                      <li key={j}>{b}</li>
                                    ))}
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.low_confidence.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'large_adjustment' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {(() => {
                                      const diff = Math.round(data.rawTDEE - data.currentTDEE)
                                      const diffStr = `${diff >= 0 ? '+' : ''}${diff}`
                                      const f = data.clampFactors
                                      const reasonParts: string[] = []
                                      if (f.dqiWasBindingCap)
                                        reasonParts.push(
                                          t(
                                            'metabolicCalibration.warnings.types.large_adjustment.reasons.dqiWasBindingCap'
                                          )
                                        )
                                      if (f.lowSignal)
                                        reasonParts.push(
                                          t(
                                            'metabolicCalibration.warnings.types.large_adjustment.reasons.lowSignal'
                                          )
                                        )
                                      if (f.lowConfidence)
                                        reasonParts.push(
                                          t(
                                            'metabolicCalibration.warnings.types.large_adjustment.reasons.lowConfidence'
                                          )
                                        )
                                      if (f.largeDeficit)
                                        reasonParts.push(
                                          t(
                                            'metabolicCalibration.warnings.types.large_adjustment.reasons.largeDeficit'
                                          )
                                        )
                                      return t(
                                        'metabolicCalibration.warnings.types.large_adjustment.desc',
                                        {
                                          diff: diffStr,
                                          raw: Math.round(data.rawTDEE),
                                          reasons: reasonParts.join(', '),
                                        }
                                      )
                                    })()}
                                  </p>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.large_adjustment.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'low_signal' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    {t('metabolicCalibration.warnings.types.low_signal.desc', {
                                      change: Math.abs(data.weightChangeKg).toFixed(2),
                                      threshold:
                                        Math.round(data.endCluster.average * 0.0025 * 10) / 10,
                                    })}
                                  </p>
                                  <p className="text-orange-600 font-medium">
                                    {t('metabolicCalibration.warnings.types.low_signal.tip')}
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) &&
                                warning.type === 'outlier_removed' &&
                                data.filteredOutliers.length > 0 && (
                                  <div className="text-xs text-orange-700 mt-1 space-y-1">
                                    <ul className="space-y-0.5">
                                      {data.filteredOutliers.map((o, j) => (
                                        <li key={j}>
                                          {o.recorded_at.toLocaleDateString('sv-SE', {
                                            day: 'numeric',
                                            month: 'short',
                                          })}
                                          {' — '}
                                          {o.weight_kg.toFixed(1)} kg
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="text-orange-600 font-medium">
                                      {t('metabolicCalibration.warnings.types.outlier_removed.tip')}
                                    </p>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cluster details + weight change */}
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-neutral-200">
                      <div className="p-3">
                        {data.startCluster.dates.length > 0 && (
                          <p className="text-xs text-neutral-400 mb-0.5">
                            {data.startCluster.dates[0].toLocaleDateString('sv-SE', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {' – '}
                            {data.startCluster.dates[
                              data.startCluster.dates.length - 1
                            ].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                        <p className="text-base font-bold text-neutral-900">
                          {data.startCluster.average.toFixed(1)} kg
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {t('metabolicCalibration.clusterAvg', { count: data.startCluster.count })}
                        </p>
                      </div>
                      <div className="p-3">
                        {data.endCluster.dates.length > 0 && (
                          <p className="text-xs text-neutral-400 mb-0.5">
                            {data.endCluster.dates[0].toLocaleDateString('sv-SE', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {' – '}
                            {data.endCluster.dates[
                              data.endCluster.dates.length - 1
                            ].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                        <p className="text-base font-bold text-neutral-900">
                          {data.endCluster.average.toFixed(1)} kg
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {t('metabolicCalibration.clusterAvg', { count: data.endCluster.count })}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-neutral-200 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {data.weightChangeKg > 0 ? (
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        ) : data.weightChangeKg < 0 ? (
                          <TrendingDown className="h-4 w-4 text-blue-500" />
                        ) : null}
                        <span
                          className={`text-sm font-semibold ${
                            data.weightChangeKg > 0
                              ? 'text-orange-600'
                              : data.weightChangeKg < 0
                                ? 'text-blue-600'
                                : 'text-neutral-600'
                          }`}
                        >
                          {data.weightChangeKg > 0 ? '+' : ''}
                          {data.weightChangeKg.toFixed(2)} kg
                        </span>
                        <span className="text-xs text-neutral-400">
                          {t('metabolicCalibration.overDays', {
                            days: Math.round(data.actualDays),
                          })}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {data.calorieSource === 'food_log'
                          ? t('metabolicCalibration.calorieSourceLabel.food_log')
                          : data.calorieSource === 'blended'
                            ? t('metabolicCalibration.calorieSourceLabel.blended')
                            : t('metabolicCalibration.calorieSourceLabel.target_calories')}
                        : {Math.round(data.averageCalories)} kcal/dag
                      </span>
                    </div>
                    {data.isStableMaintenance && (
                      <div className="border-t border-green-100 bg-green-50 px-3 py-2">
                        <p className="text-xs text-green-700">
                          {t('metabolicCalibration.stableMaintenance')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* TDEE comparison */}
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-neutral-200">
                      <div className="p-3">
                        <p className="text-xs text-neutral-500 mb-1">
                          {t('metabolicCalibration.tdeeComparison.current')}
                        </p>
                        <p className="text-base font-bold text-neutral-700">
                          {Math.round(data.currentTDEE)}
                        </p>
                        <p className="text-xs text-neutral-400">kcal</p>
                      </div>
                      <div className="p-3 bg-primary-50">
                        <p className="text-xs text-neutral-500 mb-1">
                          {t('metabolicCalibration.tdeeComparison.calibrated')}
                        </p>
                        <p className="text-base font-bold text-primary-600">
                          {Math.round(data.clampedTDEE)}
                        </p>
                        <p className="text-xs text-neutral-400">kcal</p>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-neutral-500 mb-1">
                          {t('metabolicCalibration.tdeeComparison.difference')}
                        </p>
                        <p
                          className={`text-base font-bold ${
                            data.adjustmentPercent > 0
                              ? 'text-orange-600'
                              : data.adjustmentPercent < 0
                                ? 'text-blue-600'
                                : 'text-neutral-600'
                          }`}
                        >
                          {data.adjustmentPercent > 0 ? '+' : ''}
                          {Math.round(data.clampedTDEE - data.currentTDEE)}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {data.adjustmentPercent > 0 ? '+' : ''}
                          {data.adjustmentPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {data.tdeeLower90 && data.tdeeUpper90 && (
                      <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Info className="h-3.5 w-3.5 flex-shrink-0" />
                          {t('metabolicCalibration.tdeeComparison.confidenceInterval')}
                        </span>
                        <span className="text-xs font-medium text-neutral-700">
                          {Math.round(data.tdeeLower90)}–{Math.round(data.tdeeUpper90)} kcal
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Apply button or success state */}
                  {calibrationApplied ? (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">
                        {t('metabolicCalibration.successTitle', {
                          kcal: Math.round(calibrationApplied),
                        })}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {t('metabolicCalibration.successDesc')}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {t('metabolicCalibration.nextCalibration', {
                          date: format(addDays(new Date(), timePeriod), 'd MMM yyyy', {
                            locale: sv,
                          }),
                        })}
                      </p>
                      {onClose && (
                        <Button variant="outline" size="sm" onClick={onClose} className="mt-3">
                          {t('metabolicCalibration.closeButton')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={handleApplyCalibration}
                        disabled={
                          updateProfile.isPending ||
                          createCalibrationHistory.isPending ||
                          !hasNewDataSinceCalibration
                        }
                        className="w-full"
                      >
                        {updateProfile.isPending || createCalibrationHistory.isPending
                          ? t('metabolicCalibration.saving')
                          : t('metabolicCalibration.applyButton')}
                      </Button>
                      {!hasNewDataSinceCalibration && lastActiveCalibration && (
                        <div className="text-xs space-y-2 rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                          {availabilityGuard.overlaps && (
                            <div>
                              <p className="font-medium text-neutral-600">
                                {t('metabolicCalibration.guardOverlap.title')}
                              </p>
                              <p className="mt-1 text-neutral-500">
                                <span className="font-medium text-neutral-700">
                                  {availabilityGuard.nextAvailableDate
                                    ? t('metabolicCalibration.guardOverlap.nextDate', {
                                        date: format(
                                          addDays(
                                            availabilityGuard.nextAvailableDate,
                                            timePeriod - 1
                                          ),
                                          'd MMM yyyy',
                                          { locale: sv }
                                        ),
                                      })
                                    : '—'}
                                </span>
                              </p>
                            </div>
                          )}
                          {!availabilityGuard.overlaps && (
                            <div>
                              <p className="font-medium text-neutral-600">
                                {t('metabolicCalibration.guardNewWeights.title', {
                                  count: availabilityGuard.newWeightCount,
                                  required: MIN_NEW_WEIGHTS_AFTER_CALIBRATION,
                                })}
                              </p>
                              <p className="mt-1 text-neutral-500">
                                <span className="font-medium text-neutral-700">
                                  {availabilityGuard.nextAvailableDate
                                    ? t('metabolicCalibration.guardNewWeights.nextDate', {
                                        date: format(
                                          addDays(
                                            availabilityGuard.nextAvailableDate,
                                            timePeriod - 1
                                          ),
                                          'd MMM yyyy',
                                          { locale: sv }
                                        ),
                                      })
                                    : '—'}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Undo last calibration — only within 14-day window */}
                  {canRevert &&
                    (confirmRevert ? (
                      <div className="border border-neutral-200 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-neutral-700">
                          {t('metabolicCalibration.revertConfirm', {
                            kcal: Math.round(lastActiveCalibration!.previous_tdee),
                          })}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleRevertCalibration()
                              setConfirmRevert(false)
                            }}
                            disabled={revertCalibration.isPending}
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {revertCalibration.isPending
                              ? t('metabolicCalibration.revertingLabel')
                              : t('metabolicCalibration.revertYes')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmRevert(false)}
                            className="flex-1"
                          >
                            {t('metabolicCalibration.revertCancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmRevert(true)}
                        className="w-full text-neutral-600"
                      >
                        <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                        {t('metabolicCalibration.revertButton', {
                          kcal: Math.round(lastActiveCalibration!.previous_tdee),
                        })}
                      </Button>
                    ))}

                  {/* Calibration history */}
                  {calibrationHistoryList && calibrationHistoryList.length > 0 && (
                    <CalibrationHistoryList
                      history={calibrationHistoryList}
                      profileId={profile.id}
                    />
                  )}
                </div>
              )}

              {/* No data state (not error, just null) */}
              {!data && !isError && (
                <div className="text-center py-6 text-sm text-neutral-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                  <p>
                    {t('metabolicCalibration.noDataState.line1', {
                      min: MIN_DATA_POINTS[timePeriod],
                      days: timePeriod,
                    })}
                  </p>
                  <p className="mt-1">{t('metabolicCalibration.noDataState.line2')}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
