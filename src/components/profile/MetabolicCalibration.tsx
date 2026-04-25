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
  RefreshCw,
  Info,
  Trash2,
} from 'lucide-react'

import { startOfDay, endOfDay, subDays, addDays, isBefore, format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useState, useMemo, useCallback } from 'react'
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
  MIN_DAYS_BETWEEN_CALIBRATIONS,
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
        Kalibrerings­historik ({active.length})
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
                {i === 0 && <span className="ml-1 text-primary-600 font-medium">(senaste)</span>}
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
                      Ta bort
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-neutral-500 hover:text-neutral-700"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(c.id)}
                    className="text-neutral-300 hover:text-red-500 transition-colors"
                    aria-label="Ta bort"
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

  // Date range for calorie intake — null until user clicks "Uppdatera"
  const [periodEndDate, setPeriodEndDate] = useState<Date | null>(null)
  const refreshNow = useCallback(() => setPeriodEndDate(endOfDay(new Date())), [])

  // Stable "today" reference for disable logic — tied to periodEndDate so it
  // recalculates when the user navigates, but stays fixed within a render.
  const today = useMemo(() => startOfDay(new Date()), [periodEndDate])

  const startDate = useMemo(
    () => (periodEndDate ? startOfDay(subDays(periodEndDate, timePeriod)) : null),
    [periodEndDate, timePeriod]
  )
  // Alias kept for backward compatibility with useMemos below
  const now = periodEndDate

  const goBack = useCallback(() => {
    setPeriodEndDate(d => (d ? endOfDay(subDays(d, timePeriod)) : null))
  }, [timePeriod])

  const goForward = useCallback(() => {
    setPeriodEndDate(d => {
      if (!d) return null
      const next = endOfDay(addDays(d, timePeriod))
      return next > endOfDay(new Date()) ? endOfDay(new Date()) : next
    })
  }, [timePeriod])

  const isAtToday = periodEndDate ? !isBefore(startOfDay(periodEndDate), today) : true

  const { data: actualIntake } = useActualCalorieIntake(
    profile.id,
    startDate ?? new Date(0),
    now ?? new Date(0)
  )

  const isFirstCalibration = !calibrationHistoryList || calibrationHistoryList.length === 0
  const lastCalibration = calibrationHistoryList?.[0]
  const canRevert = useMemo(() => {
    if (!lastCalibration || lastCalibration.is_reverted) return false
    const calibratedAt = new Date(lastCalibration.calibrated_at)
    const daysSince = (new Date().getTime() - calibratedAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince < MIN_DAYS_BETWEEN_CALIBRATIONS
  }, [lastCalibration])

  // The new-data guard should only block re-apply against the last *active* (non-reverted)
  // calibration. If that calibration was reverted, there is no active baseline to protect.
  const lastActiveCalibration = calibrationHistoryList?.find(c => !c.is_reverted) ?? null

  // Days until the next recommended calibration (21 days after last applied)
  const daysUntilNextCalibration = useMemo(() => {
    if (!calibrationApplied) return null
    // calibrationApplied was just set — next recommended is 21 days from now
    return 21
  }, [calibrationApplied])

  // Guard against applying the same dataset twice.
  // Allow apply if: new weight entries exist after last calibration,
  // OR new calorie logs exist after last calibration,
  // OR enough days have passed (MIN_DAYS_BETWEEN_CALIBRATIONS).
  const newDataGuard = useMemo(() => {
    if (calibrationHistoryLoading)
      return { allowed: false, daysRemaining: 0, newWeightCount: 0, newLogCount: 0 }
    if (!lastActiveCalibration)
      return { allowed: true, daysRemaining: 0, newWeightCount: 0, newLogCount: 0 }

    const lastCalAt = new Date(lastActiveCalibration.calibrated_at)
    const referenceNow = now ?? new Date()
    const daysSince = (referenceNow.getTime() - lastCalAt.getTime()) / (1000 * 60 * 60 * 24)
    const daysRemaining = Math.max(0, Math.ceil(MIN_DAYS_BETWEEN_CALIBRATIONS - daysSince))

    const lastCalDateStr = lastCalAt.toISOString().split('T')[0]

    const newWeightCount = (weightHistory ?? []).filter(
      w => new Date(w.recorded_at) > lastCalAt
    ).length
    const newLogCount = (actualIntake?.dailyCalories ?? []).filter(
      d => d.date > lastCalDateStr && d.calories > 800
    ).length

    const allowed =
      daysSince >= MIN_DAYS_BETWEEN_CALIBRATIONS || newWeightCount > 0 || newLogCount > 0
    return { allowed, daysRemaining, newWeightCount, newLogCount }
  }, [calibrationHistoryLoading, lastActiveCalibration, now, weightHistory, actualIntake])
  const hasNewDataSinceCalibration = newDataGuard.allowed

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
      ? 'Hög tillförlitlighet'
      : data.confidence.level === 'standard'
        ? 'Medel tillförlitlighet'
        : 'Låg tillförlitlighet'
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
            Metabolisk Kalibrering
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
              title="Om metabolisk kalibrering"
              modalTitle="Guide: Metabolisk kalibrering"
              modalContent={
                <div className="space-y-6 text-sm">
                  {/* Section 1 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                      Vad är metabolisk kalibrering?
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Metabolisk kalibrering uppskattar ditt faktiska{' '}
                      <strong>underhålls-TDEE</strong> — hur många kalorier din kropp förbrukar för
                      att hålla vikten stabil — genom att analysera hur din kroppsvikt förändras i
                      relation till ditt faktiska kaloriintag över tid.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      <strong>Viktigt att förstå:</strong> Kalibreringen estimerar din faktiska
                      energiförbrukning, inte ditt kalorimål. Ditt kaloriintervall räknas sedan om
                      automatiskt utifrån ditt valda energimål (bibehåll vikt, gå ner, gå upp). Det
                      är alltså två separata steg.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Istället för att enbart använda uppskattningar från BMR-formler och
                      aktivitetsnivåer använder systemet verklig data från din loggning. Det gör att
                      kalibreringen kan fånga upp individuella skillnader som standardformler missar
                      — som NEAT-variation, termogenes och metabol adaptation.
                    </p>
                  </section>

                  {/* Section 2 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">Hur beräkningen fungerar</h3>
                    <div className="space-y-3 text-neutral-700">
                      <div>
                        <p>Kalibreringen bygger på energibalansprincipen:</p>
                        <p className="text-neutral-600 italic ml-2 mt-1">
                          Energi in − energi ut = förändring i kroppens energilager.
                        </p>
                      </div>
                      <p>
                        Om vikten förändras över tid kan vi uppskatta hur stort ditt faktiska
                        energibehov är. I förenklad form:
                      </p>
                      <p className="font-medium text-primary-600 text-center py-1">
                        TDEE ≈ Genomsnittliga kalorier − (viktförändring × kcal per kg / antal
                        dagar)
                      </p>
                      <p>
                        Ett kilogram kroppsvikt approximeras till ungefär{' '}
                        <strong>6 500–7 700 kcal</strong>. Modellen använder ett dynamiskt värde
                        inom detta spann baserat på förändringstakt — snabba förändringar innehåller
                        typiskt mer glykogen och vätska, långsamma mer fett — men det är en
                        modellbaserad approximation, inte en exakt vävnadsanalys.
                      </p>
                      <div>
                        <p className="font-medium">Hur start- och slutvikt bestäms</p>
                        <p className="mt-1">
                          Perioden delas in i en första och en sista tredjedel, och{' '}
                          <strong>medianen av alla mätningar</strong> i varje del används som robust
                          ankare för start- respektive slutvikt. Det är dessa klustermedianerna som
                          bestämmer viktnivåerna i beräkningen. Regressionen används sedan för
                          trendanalys, signal/brus-bedömning och diagnostik — men ändrar inte
                          start/slutnivåerna. Det innebär att enstaka extrema vägningar inte kan
                          snedvrida resultatet på samma sätt som om bara en mätning per ände hade
                          använts.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Hur kaloriintaget uppskattas</p>
                        <p className="mt-1">
                          Kalibreringen använder ditt loggade kaloriintag som primär datakälla. Om
                          inte alla dagar är loggade används en svag statistisk korrektion mot ditt
                          kalorimål — ju fler dagar som saknar logg, desto något större vikt får
                          kalorimålet i beräkningen. I praktiken dominerar loggad data nästan
                          alltid.
                        </p>
                        <p className="mt-1">
                          Systemet detekterar också om loggningen verkar selektiv — det vill säga om
                          du tenderar att bara logga dagar med lägre intag. Om det mönstret
                          identifieras minskas tilliten till loggdatan och korrektionen mot
                          kalorimålet anpassas. Det skyddar mot att kalibreringen föreslår ett för
                          lågt TDEE baserat på biased data.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">Hur vikttrenden beräknas</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Istället för att jämföra två enskilda vägningar beräknar systemet en
                      trendlinje (linjär regression) genom alla viktmätningar i perioden. Det ger
                      ett stabilare estimat av den verkliga viktförändringen och mäter dessutom hur
                      stark och konsekvent trenden är.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Som robusthetskontroll beräknas även en alternativ trend med{' '}
                      <strong>Theil–Sen-estimatorn</strong>, som tar medianen av alla möjliga
                      parvisa slopes mellan mätpunkterna. Den är mer okänslig för enstaka
                      extremvärden än linjär regression. Om de två metoderna visar tydligt olika
                      resultat kan systemet varna för att viktutvecklingen var oregelbunden under
                      perioden.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Som ytterligare diagnostik beräknas en exponentiellt utjämnad trend (EMA). Den
                      används inte som primär beräkningsmetod utan enbart för att detektera kraftigt
                      icke-linjär viktutveckling — t.ex. en refeed-period mitt i perioden.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Viktmätningar som avviker kraftigt från resten av datan filtreras automatiskt
                      bort innan trendberäkningen, för att minska påverkan från enstaka extrema
                      mätningar.
                    </p>
                  </section>

                  {/* Section 4 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      Hur datakvalitet påverkar resultatet
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Alla kalibreringar får ett <strong>Data Quality Index (DQI)</strong> som
                      bedömer hur pålitlig datan är. Det beräknas från tre faktorer:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-neutral-700">
                      <li>
                        <strong>Matloggskvalitet (45%)</strong> — andelen loggade dagar och hur
                        konsekvent kalorier registrerats
                      </li>
                      <li>
                        <strong>Vägningsfrekvens (35%)</strong> — hur regelbundet du vägt dig; 50%
                        av dagarna ger fullt utslag
                      </li>
                      <li>
                        <strong>Klusterstorlek (20%)</strong> — hur många mätningar som finns i
                        periodens start- och slutkluster
                      </li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      DQI styr direkt hur stor justering som tillåts: från ±75 kcal vid låg kvalitet
                      till ±200 kcal vid hög. Det innebär att bättre data inte bara ger ett mer
                      tillförlitligt resultat — det ger också möjlighet till snabbare konvergens mot
                      ditt faktiska TDEE.
                    </p>
                    <div className="mt-3 p-3 bg-neutral-100 rounded text-neutral-600 text-xs">
                      <p className="font-medium mb-1">Val av tidsperiod</p>
                      <p>
                        Du kan välja mellan 14, 21 och 28 dagar. Längre perioder ger mer data och
                        tillåter något större justeringar. Kortare perioder än 14 dagar används inte
                        — signal/brus-förhållandet blir då för svagt för att ge tillförlitliga
                        estimat, eftersom dagliga viktsvängningar kan vara lika stora som den
                        faktiska vikttrendförändringen.
                      </p>
                    </div>
                  </section>

                  {/* Section 5 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">
                      Begränsning av extrema justeringar
                    </h3>
                    <div className="space-y-3 text-neutral-700">
                      <div>
                        <p className="font-medium">Justeringsgränser (clamp)</p>
                        <p className="mt-1">
                          Kalibreringen begränsar hur mycket TDEE kan ändras i en enskild
                          uppdatering. Maximal justering beror på datakvaliteten och ligger normalt
                          mellan:
                        </p>
                        <p className="font-medium text-primary-600 text-center py-1">
                          ±75 kcal till ±200 kcal
                        </p>
                        <p>
                          TDEE sätts aldrig under 1 200 eller över 5 000 kcal oavsett vad
                          beräkningen visar — dessa är absoluta fysiologiska gränser. Clampen
                          förhindrar att tillfälliga viktförändringar ger orimliga TDEE-hopp.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Gradvis konvergens</p>
                        <p className="mt-1">
                          Om kalibreringen föreslår en ny TDEE-nivå och clampen <em>inte</em>{' '}
                          triggas, utjämnas resultatet mjukt mot de senaste 1–3 tidigare
                          kalibreringarna. Om alla tidigare kalibreringar pekar i samma riktning
                          följer systemet den trenden med minimal dämpning istället för att bromsa.
                          Triggas clampen används det begränsade värdet direkt utan ytterligare
                          utjämning.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Historikvägning</p>
                        <p className="mt-1">
                          Tidigare kalibreringar används som referenspunkt men inte hur gamla som
                          helst. Kalibreringar äldre än 90 dagar exkluderas om datakvaliteten var
                          låg, och äldre än 180 dagar om kvaliteten var hög. Det innebär att om du
                          inte kalibrerat på länge startar systemet i praktiken om med minimal
                          historikpåverkan.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 6 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      Osäkerhet och konfidensintervall
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Eftersom verklig viktdata innehåller variation beräknar modellen ett{' '}
                      <strong>90%-konfidensintervall</strong> för TDEE-uppskattningen. Det innebär
                      att om du upprepade samma kalibrering med liknande data, skulle det sanna
                      underhålls-TDEE hamna inom intervallet i 90% av fallen.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Intervallets bredd beräknas i tre lager:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>
                        <strong>Residualvarians (primär källa)</strong> — hur mycket vikten svänger
                        runt trendlinjen från regressionen; detta är grundosäkerheten som allt annat
                        byggs på
                      </li>
                      <li>
                        <strong>Kalorilogg-osäkerhet (breddningsfaktor)</strong> — uppskattad till
                        ±20% av snittkalorier, viktat mot antal loggade dagar; läggs till ovanpå
                        residualvariansen
                      </li>
                      <li>
                        <strong>Autokorrelation (breddningsfaktor)</strong> — dagliga vikter är inte
                        oberoende av varandra (en hög mätning idag påverkar troligtvis
                        morgondagens), vilket vidgar intervallet ytterligare med en
                        korrigeringsfaktor
                      </li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Om kroppsvikten är mycket stabil under perioden kan konfidensintervallet bli
                      relativt brett. Det beror på att dagliga viktvariationer från vätska, salt och
                      glykogen då kan vara lika stora som den faktiska trendförändringen — systemet
                      har helt enkelt svårt att skilja signal från brus. Det är ett ärligt svar på
                      datan, inte ett tecken på att kalibreringen är fel.
                    </p>
                  </section>

                  {/* Section 7 */}
                  <section>
                    <h3 className="font-semibold text-base mb-3">
                      När bör du använda metabolisk kalibrering?
                    </h3>
                    <p className="text-neutral-700 mb-2">
                      Kalibreringen fungerar bäst när du har samlat in tillräckligt med konsekvent
                      data.
                    </p>
                    <p className="text-neutral-700 font-medium mb-1">Bra förutsättningar:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-neutral-700">
                          Du har loggat ditt kaloriintag i minst <strong>2–3 veckor</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-neutral-700">
                          Du väger dig regelbundet (helst <strong>morgon före frukost</strong>)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-neutral-700">
                          Du har loggat <strong>majoriteten av dagarna</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-neutral-700">
                          Din vikt <strong>utvecklas inte som förväntat</strong>
                        </span>
                      </li>
                    </ul>
                  </section>

                  {/* Section 8 */}
                  <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-base mb-2">När bör kalibrering undvikas?</h3>
                    <p className="text-neutral-700 mb-2">
                      Kalibrering kan bli missvisande om datan inte representerar en stabil period.
                    </p>
                    <p className="text-neutral-700 font-medium mb-1">Undvik att kalibrera när:</p>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5 font-bold">×</span>
                        <span>
                          Du precis startat en ny diet <strong>(&lt; 2 veckor)</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5 font-bold">×</span>
                        <span>
                          Du nyligen <strong>ändrat träningsvolym kraftigt</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5 font-bold">×</span>
                        <span>
                          Du har loggat mat <strong>mycket oregelbundet</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5 font-bold">×</span>
                        <span>
                          Viktmätningar saknas under <strong>stora delar av perioden</strong>
                        </span>
                      </li>
                    </ul>
                  </section>

                  {/* Section 9 */}
                  <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-base mb-2">Viktigt att förstå</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Metabolisk kalibrering är en långsiktig finjustering, inte en snabb
                      korrigering.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Kroppsvikt påverkas dagligen av många faktorer som inte är kopplade till
                      fettförändring. Därför är modellen medvetet konservativ och trendbaserad. Den
                      kombinerar tre separata robusthetsmekanismer:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>
                        <strong>Klustrad start/slut-vikt</strong> — medianankare i periodens
                        ytterkanter skyddar mot enstaka extrema vägningar
                      </li>
                      <li>
                        <strong>Trendestimering över alla datapunkter</strong> — regression och
                        Theil–Sen-korscheck mäter trenden utan att förlita sig på två enskilda
                        mätningar
                      </li>
                      <li>
                        <strong>Datakvalitetsvägd justeringsbegränsning</strong> — DQI styr hur stor
                        justering som tillåts, vilket förhindrar överreaktion vid osäker data
                      </li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Det är just denna kombination som gör modellen mer stabil än system som enbart
                      jämför start- och slutvikt eller använder enkla rullande medelvärden.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Ju mer konsekvent du loggar mat och vikt över tid, desto mer exakt kan
                      systemet uppskatta ditt verkliga energibehov.
                    </p>
                  </section>
                </div>
              }
            />
          )}

          {/* If not yet refreshed, show a prompt instead of stale results */}
          {now === null && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-neutral-500">
                Klicka på Uppdatera för att hämta senaste data.
              </p>
              <button
                type="button"
                onClick={refreshNow}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Uppdatera
              </button>
            </div>
          )}

          {/* Time period selector */}
          {now !== null && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Tidsperiod</label>
              <Select
                value={timePeriod.toString()}
                onChange={e => setTimePeriod(Number(e.target.value) as 14 | 21 | 28)}
              >
                <option value="14" disabled={!periodAvailability[14]}>
                  14 dagar (2 veckor)
                  {!periodAvailability[14] ? ` — ${periodMeasurementCounts[14]}/4 vägningar` : ''}
                </option>
                <option value="21" disabled={!periodAvailability[21]}>
                  21 dagar (3 veckor)
                  {!periodAvailability[21] ? ` — ${periodMeasurementCounts[21]}/5 vägningar` : ''}
                </option>
                <option value="28" disabled={!periodAvailability[28]}>
                  28 dagar (4 veckor)
                  {!periodAvailability[28] ? ` — ${periodMeasurementCounts[28]}/6 vägningar` : ''}
                </option>
              </Select>

              {/* Period navigation */}
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
                  title="Föregående period"
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
                  title="Nästa period"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {!isAtToday && (
                  <button
                    type="button"
                    onClick={refreshNow}
                    className="ml-1 text-xs text-primary-600 hover:underline"
                  >
                    Idag
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
                        <p className="font-medium">Kaloridata: matlogg</p>
                        <p className="text-xs mt-0.5">
                          Du har loggat mat {actualIntake.daysWithData} av {actualIntake.totalDays}{' '}
                          dagar ({Math.round(actualIntake.completenessPercent)}%). Kalibreringen
                          använder ditt faktiska loggade intag.
                        </p>
                      </div>
                    </>
                  ) : data?.calorieSource === 'blended' ? (
                    <>
                      <Blend className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Kaloridata: matlogg + svag priorkorrektion</p>
                        <p className="text-xs mt-1">
                          Du har loggat mat {actualIntake.daysWithData} av {actualIntake.totalDays}{' '}
                          dagar ({Math.round(actualIntake.completenessPercent)}%).
                        </p>
                        {data.loggedCaloriesAvg != null && (
                          <p className="text-xs mt-0.5">
                            Loggat snitt:{' '}
                            <span className="font-medium">
                              {Math.round(data.loggedCaloriesAvg)} kcal/dag
                            </span>{' '}
                            ({actualIntake.daysWithData} dagar)
                          </p>
                        )}
                        <p className="text-xs mt-0.5">
                          Uppskattat snitt:{' '}
                          <span className="font-medium">
                            {Math.round(data.averageCalories)} kcal/dag
                          </span>{' '}
                          (inkl. svag korrektion för{' '}
                          {actualIntake.totalDays - actualIntake.daysWithData} ologgade dagar)
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Ologgade dagar sänker tillförlitligheten — se Datakvalitet nedan.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Kaloridata: målkalorier</p>
                        <p className="text-xs mt-0.5">
                          Du har inte loggat mat tillräckligt ({actualIntake.daysWithData}/
                          {actualIntake.totalDays} dagar). Systemet antar att du åt enligt ditt
                          kaloriintervall — om det inte stämmer blir kalibreringen missvisande.
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
                    Prova att navigera bakåt för att hitta en period med data.
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
                            ? `${data.confidence.startClusterSize}+${data.confidence.endClusterSize} mätningar i start/slutperiod.`
                            : (() => {
                                const reasons = data.confidence.degradeReasons
                                const parts: string[] = []
                                if (reasons.includes('low_cluster_size'))
                                  parts.push(
                                    `för få mätningar i start- eller slutperiod (${data.confidence.startClusterSize}+${data.confidence.endClusterSize})`
                                  )
                                if (reasons.includes('sparse_coverage'))
                                  parts.push('mätningarna är inte spridda över hela perioden')
                                if (reasons.includes('nonlinear_trend'))
                                  parts.push(
                                    'viktsignalen är svag i förhållande till daglig variation — längre period eller mer viktförändring behövs'
                                  )
                                return parts.length > 0
                                  ? `Begränsas av: ${parts.join(', ')}.`
                                  : `${data.confidence.startClusterSize}+${data.confidence.endClusterSize} mätningar i start/slutperiod.`
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
                            Datakvalitet: {data.dataQuality.label} ({data.dataQuality.score}/100)
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
                              <p className="font-medium">Hur poängen beräknas</p>
                              <table className="w-full text-xs">
                                <tbody>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Matlogg (45%)</td>
                                    <td>{Math.round(data.dataQuality.factors.logScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Mätfrekvens (35%)</td>
                                    <td>{Math.round(data.dataQuality.factors.freqScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Klusterstorlek (20%)</td>
                                    <td>{Math.round(data.dataQuality.factors.clusterScore)}/100</td>
                                  </tr>
                                </tbody>
                              </table>
                              <p className="text-neutral-400 pt-1 border-t border-neutral-200">
                                ≥80 Utmärkt · ≥60 Bra · ≥40 Tillräcklig · &lt;40 Begränsad
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
                            ? '1 varning'
                            : `${data.warnings.length} varningar`}
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
                                  {expandedWarnings.has(i) ? 'Dölj' : 'Varför?'}
                                </button>
                              </div>
                              {expandedWarnings.has(i) && warning.type === 'high_cv' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Hög dag-till-dag-variation i vikt beror vanligtvis på
                                    vätskefluktuationer (salt, kolhydrater, träning) snarare än
                                    faktisk fettvävnad. Det ökar residualvariansen i
                                    trendberäkningen, vilket direkt breddar konfidensintervallet för
                                    TDEE-estimatet. Varningen aktiveras när:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>Variationskoefficienten (CV) för vikten överstiger 2 %</li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Väg dig varje morgon före frukost under samma förhållanden
                                    — det är det enskilt effektivaste sättet att minska brus och få
                                    ett smalare konfidensintervall.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) &&
                                warning.type === 'target_calories_fallback' && (
                                  <div className="text-xs text-orange-700 mt-1 space-y-1">
                                    <p>
                                      Om du i verkligheten åt mer eller mindre än målet kan
                                      kalibreringen bli felaktig — den kan inte se avvikelser som
                                      inte loggats. Varningen aktiveras när:
                                    </p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                      <li>Inga måltider är loggade under perioden</li>
                                    </ul>
                                    <p className="text-orange-600 font-medium">
                                      Tips: Logga dina måltider under nästa period för ett mer
                                      tillförlitligt resultat.
                                    </p>
                                  </div>
                                )}
                              {expandedWarnings.has(i) && warning.type === 'selective_logging' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Om du bara loggar &quot;bra&quot; dagar överskattas
                                    kaloriintaget inte och kalibreringen kan föreslå ett för lågt
                                    TDEE. Just nu är:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>Loggat snitt &lt; 85 % av målkalorier</li>
                                    <li>Matsloggskomplettering &lt; 80 %</li>
                                    <li>Vikten minskat under perioden</li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Försök logga även de dagar du äter mer — precision kräver
                                    fullständig data.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'glycogen_event' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Glykogen och vätska kan orsaka viktförändringar på 1–3 kg på
                                    enstaka dagar utan att det återspeglar faktisk fettförändring.
                                    Trendberäkningen kompenserar men precision minskar. Varningen
                                    aktiveras när:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>
                                      En enskild daglig viktförändring överstiger 1,5 % av
                                      kroppsvikten
                                    </li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Kalibrering med längre period (21–28 dagar) jämnar ut
                                    tillfälliga svängningar bättre.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'nonlinear_trend' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Vikten har inte rört sig i en jämn riktning under perioden —
                                    troligen en refeed-period, diet break eller annan övergång.
                                    Varningen aktiveras när något av följande stämmer:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>
                                      Regressionstrenden och EMA visar tydligt olika total
                                      viktförändring
                                    </li>
                                    <li>
                                      Vikten gick i motsatta riktningar under periodens två halvor
                                      med minst 1 kg total svängning
                                    </li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Vänta tills vikten rört sig jämnt i en riktning i minst
                                    2–3 veckor innan du kalibrerar.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'large_deficit' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Vid stort underskott anpassar kroppen sin ämnesomsättning nedåt,
                                    vilket gör att beräknad TDEE kan underskatta ditt verkliga
                                    underhållsbehov. Varningen aktiveras när:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>Beräknat kaloriunderskott överstiger 25 % av TDEE</li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Resultatet är troligen en underskattning av ditt verkliga
                                    TDEE — ta det som ett golv snarare än ett exakt värde.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'low_confidence' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Resultatet är användbart som riktlinje men bör bekräftas med en
                                    ny kalibrering efter fler veckors data. Varningen aktiveras när
                                    något av följande stämmer:
                                  </p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    <li>Färre än 3 vägningar per vecka i snitt</li>
                                    <li>
                                      Mer än 70 % av mätningarna är från periodens första hälft
                                    </li>
                                  </ul>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Väg dig minst varannan dag och sprid mätningarna jämnt
                                    över perioden.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'large_adjustment' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Utan begränsning hade justeringen blivit{' '}
                                    {Math.round(data.rawTDEE - data.currentTDEE) >= 0 ? '+' : ''}
                                    {Math.round(data.rawTDEE - data.currentTDEE)} kcal (
                                    {Math.round(data.rawTDEE)} kcal).{' '}
                                    {(() => {
                                      const f = data.clampFactors
                                      const reasons: string[] = []
                                      if (f.dqiWasBindingCap)
                                        reasons.push('datakvalitetspoängen satte ett absolut tak')
                                      if (f.lowSignal) reasons.push('viktförändringen är för liten')
                                      if (f.lowConfidence) reasons.push('tillförlitligheten är låg')
                                      if (f.largeDeficit) reasons.push('stort kaloriunderskott')
                                      return reasons.length > 0
                                        ? `Orsak: ${reasons.join(', ')}.`
                                        : ''
                                    })()}
                                  </p>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Förbättra datakvaliteten (fler vägningar, fullständig
                                    loggning) för att tillåta större justeringar framöver.
                                  </p>
                                </div>
                              )}
                              {expandedWarnings.has(i) && warning.type === 'low_signal' && (
                                <div className="text-xs text-orange-700 mt-1 space-y-1">
                                  <p>
                                    Förändringen ({Math.abs(data.weightChangeKg).toFixed(2)} kg) är
                                    under gränsen ~
                                    {Math.round(data.endCluster.average * 0.0025 * 10) / 10} kg
                                    (0,25 % av din vikt). Antingen stämmer ditt TDEE redan, eller
                                    döljer vätska/glykogen den verkliga trenden. När
                                    viktförändringen är liten i förhållande till den dagliga
                                    variationen dominerar bruset över signalen — det breddar
                                    konfidensintervallet och gör TDEE-estimatet mindre
                                    tillförlitligt oavsett hur länge perioden är.
                                  </p>
                                  <p className="text-orange-600 font-medium">
                                    Tips: Om du aktivt försöker gå ner eller upp i vikt — vänta
                                    ytterligare 1–2 veckor tills trenden är tydligare.
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
                                      Tips: Extremvärden kan bero på felmätning eller ovanliga
                                      omständigheter — de påverkar inte beräkningen.
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
                          snitt av {data.startCluster.count} mätningar
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
                          snitt av {data.endCluster.count} mätningar
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
                          över {Math.round(data.actualDays)} dagar
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {data.calorieSource === 'food_log'
                          ? 'faktiskt intag'
                          : data.calorieSource === 'blended'
                            ? 'uppskattat intag'
                            : 'målkalorier'}
                        : {Math.round(data.averageCalories)} kcal/dag
                      </span>
                    </div>
                    {data.isStableMaintenance && (
                      <div className="border-t border-green-100 bg-green-50 px-3 py-2">
                        <p className="text-xs text-green-700">
                          Din vikt är stabil — ditt TDEE verkar stämma
                        </p>
                      </div>
                    )}
                  </div>

                  {/* TDEE comparison */}
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-neutral-200">
                      <div className="p-3">
                        <p className="text-xs text-neutral-500 mb-1">Nuvarande</p>
                        <p className="text-base font-bold text-neutral-700">
                          {Math.round(data.currentTDEE)}
                        </p>
                        <p className="text-xs text-neutral-400">kcal</p>
                      </div>
                      <div className="p-3 bg-primary-50">
                        <p className="text-xs text-neutral-500 mb-1">Kalibrerat</p>
                        <p className="text-base font-bold text-primary-600">
                          {Math.round(data.clampedTDEE)}
                        </p>
                        <p className="text-xs text-neutral-400">kcal</p>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-neutral-500 mb-1">Skillnad</p>
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
                          90% konfidensintervall
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
                        TDEE kalibrerat till {Math.round(calibrationApplied)} kcal
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Ditt kaloriintervall har uppdaterats
                      </p>
                      {daysUntilNextCalibration !== null && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Nästa rekommenderade kalibrering om {daysUntilNextCalibration} dagar
                        </p>
                      )}
                      {onClose && (
                        <Button variant="outline" size="sm" onClick={onClose} className="mt-3">
                          Stäng
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
                          ? 'Sparar...'
                          : 'Applicera kalibrerat TDEE'}
                      </Button>
                      {!hasNewDataSinceCalibration && (
                        <div className="text-xs text-neutral-500 space-y-1 rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                          <p className="font-medium text-neutral-600">
                            Ingen ny data sedan senaste kalibreringen
                          </p>
                          <p>
                            Kalibreringen baseras på vikt- och matloggdata. För att undvika att
                            samma dataset appliceras två gånger krävs minst ett av följande:
                          </p>
                          <ul className="mt-1 space-y-0.5 pl-3 list-disc">
                            <li>
                              <span
                                className={
                                  newDataGuard.newWeightCount > 0
                                    ? 'text-green-600 font-medium'
                                    : ''
                                }
                              >
                                {newDataGuard.newWeightCount > 0
                                  ? `${newDataGuard.newWeightCount} ny viktmätning${newDataGuard.newWeightCount > 1 ? 'ar' : ''} registrerad${newDataGuard.newWeightCount > 1 ? 'e' : ''} \u2713`
                                  : 'Minst 1 ny viktmätning efter kalibreringsdatumet'}
                              </span>
                            </li>
                            <li>
                              <span
                                className={
                                  newDataGuard.newLogCount > 0 ? 'text-green-600 font-medium' : ''
                                }
                              >
                                {newDataGuard.newLogCount > 0
                                  ? `${newDataGuard.newLogCount} ny matloggdag${newDataGuard.newLogCount > 1 ? 'ar' : ''} registrerad${newDataGuard.newLogCount > 1 ? 'e' : ''} \u2713`
                                  : 'Minst 1 ny matloggdag (över 800 kcal) efter kalibreringsdatumet'}
                              </span>
                            </li>
                            <li>
                              {newDataGuard.daysRemaining > 0
                                ? `${newDataGuard.daysRemaining} dag${newDataGuard.daysRemaining > 1 ? 'ar' : ''} kvar tills ${MIN_DAYS_BETWEEN_CALIBRATIONS}-dagarsgränsen uppnås`
                                : `${MIN_DAYS_BETWEEN_CALIBRATIONS} dagar sedan senaste kalibrering \u2713`}
                            </li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {/* Undo last calibration — only within 14-day window */}
                  {canRevert &&
                    (confirmRevert ? (
                      <div className="border border-neutral-200 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-neutral-700">
                          Återställer TDEE till {Math.round(lastCalibration.previous_tdee)} kcal. Är
                          du säker?
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
                            {revertCalibration.isPending ? 'Ångrar...' : 'Ja, ångra'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmRevert(false)}
                            className="flex-1"
                          >
                            Avbryt
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
                        {`Ångra senaste kalibrering (→ ${Math.round(lastCalibration.previous_tdee)} kcal)`}
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
                    Behöver minst {MIN_DATA_POINTS[timePeriod]} viktmätningar under {timePeriod}{' '}
                    dagar
                  </p>
                  <p className="mt-1">Logga fler viktmätningar för att aktivera kalibrering</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
