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
  RefreshCw,
  Info,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
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
  MIN_DAYS_BETWEEN_CALIBRATIONS,
  buildClusters,
  applyConvergenceSmoothing,
} from '@/lib/calculations/calibration'
import type { Profile, CalibrationResult, ProfileFormData } from '@/lib/types'
import { toast } from 'sonner'

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
  const [isOpen, setIsOpen] = useState(false)
  const [timePeriod, setTimePeriod] = useState<14 | 21 | 28>(21)
  const [calibrationApplied, setCalibrationApplied] = useState<number | null>(null)

  const { data: weightHistory } = useWeightHistory()
  const updateProfile = useUpdateProfile()
  const createCalibrationHistory = useCreateCalibrationHistory()
  const revertCalibration = useRevertCalibration()
  const { data: calibrationHistoryList } = useCalibrationHistory(profile.id)

  // Date range for calorie intake — null until user clicks "Uppdatera"
  const [now, setNow] = useState<Date | null>(null)
  const refreshNow = useCallback(() => setNow(new Date()), [])
  const startDate = useMemo(
    () => (now ? new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000) : null),
    [now, timePeriod]
  )

  const { data: actualIntake } = useActualCalorieIntake(
    profile.id,
    startDate ?? new Date(0),
    now ?? new Date(0)
  )

  const isFirstCalibration = !calibrationHistoryList || calibrationHistoryList.length === 0
  const lastCalibration = calibrationHistoryList?.[0]
  const canRevert = lastCalibration && !lastCalibration.is_reverted

  // The new-data guard should only block re-apply against the last *active* (non-reverted)
  // calibration. If that calibration was reverted, there is no active baseline to protect.
  const lastActiveCalibration = calibrationHistoryList?.find(c => !c.is_reverted) ?? null

  // Guard against applying the same dataset twice.
  // Allow apply if: new weight entries exist after last calibration,
  // OR new calorie logs exist after last calibration,
  // OR enough days have passed (MIN_DAYS_BETWEEN_CALIBRATIONS).
  const newDataGuard = useMemo(() => {
    if (!lastActiveCalibration || !now)
      return { allowed: true, daysRemaining: 0, newWeightCount: 0, newLogCount: 0 }
    if (calibrationApplied !== null)
      return { allowed: true, daysRemaining: 0, newWeightCount: 0, newLogCount: 0 }

    const lastCalAt = new Date(lastActiveCalibration.calibrated_at)
    const daysSince = (now.getTime() - lastCalAt.getTime()) / (1000 * 60 * 60 * 24)
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
  }, [lastActiveCalibration, calibrationApplied, now, weightHistory, actualIntake])
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

    // Apply convergence smoothing only if the clamp was NOT triggered.
    // If clamp already limited the adjustment, applying smoothing on top would
    // double-dampen the signal — use clampedTDEE directly in that case.
    const clampWasApplied = Math.abs(data.clampedTDEE - data.rawTDEE) > 0.5

    const convergence =
      !clampWasApplied && calibrationHistoryList && calibrationHistoryList.length > 0
        ? applyConvergenceSmoothing(
            data.clampedTDEE,
            calibrationHistoryList
              .filter(c => !c.is_reverted)
              .map(c => ({
                applied_tdee: c.applied_tdee,
                confidence_level: c.confidence_level,
                calibrated_at: c.calibrated_at,
                data_quality_index: c.data_quality_index,
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
                    <h3 className="font-semibold text-base mb-2">Vad är metabolisk kalibrering?</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Metabolisk kalibrering uppskattar ditt faktiska{' '}
                      <strong>Maintenance-TDEE</strong> (Total Daily Energy Expenditure) genom att
                      analysera hur din kroppsvikt förändras i relation till ditt verkliga
                      kaloriintag över tid.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Istället för att enbart använda uppskattningar från BMR-formler och
                      aktivitetsnivåer använder systemet din faktiska loggdata för att finjustera
                      ditt energibehov.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Kalibreringen analyserar bland annat:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>trendbaserad viktutveckling över tid</li>
                      <li>genomsnittligt kaloriintag under perioden</li>
                      <li>hur konsekvent du loggat din mat</li>
                      <li>hur regelbundet du vägt dig</li>
                      <li>hur stabil vikttrenden är</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Dagliga viktfluktuationer från exempelvis vätska, salt, glykogen eller
                      maginnehåll filtreras bort genom trendanalys och avvikelsehantering.
                    </p>
                  </section>

                  {/* Section 2 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">Hur beräkningen fungerar</h3>
                    <div className="space-y-2 text-neutral-700">
                      <p>Kalibreringen bygger på energibalansprincipen:</p>
                      <p className="text-neutral-600 italic ml-2">
                        Energi in − energi ut = förändring i kroppens energilager
                      </p>
                      <p>
                        Om kroppsvikten förändras över tid kan vi därför uppskatta hur stort ditt
                        faktiska energibehov är.
                      </p>
                      <p>I förenklad form används sambandet:</p>
                      <p className="font-medium text-primary-600 text-center py-1">
                        TDEE ≈ Genomsnittliga kalorier − (trendbaserad viktförändring × kcal per kg
                        / antal dagar)
                      </p>
                      <p>
                        Ett kilogram kroppsvikt motsvarar i genomsnitt ungefär{' '}
                        <strong>6 500–7 700 kcal</strong>, beroende på hur stor del av
                        viktförändringen som består av fett, glykogen och vätska.
                      </p>
                      <p>
                        Modellen använder ett dynamiskt värde inom detta spann beroende på hur
                        snabbt vikten förändras.
                      </p>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">Hur kaloriintaget beräknas</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Kalibreringen använder ditt loggade kaloriintag som primär datakälla. Om inte
                      alla dagar är loggade appliceras en svag korrektion mot ditt kalorimål — men
                      loggad data dominerar alltid.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Korrektionstrycket mot målet är proportionerligt mot andelen ologgade dagar,
                      multiplicerat med en fast faktor på 30 %. Loggat snitt dominerar alltid med
                      minst 70 %.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Ologgade dagar påverkar i första hand{' '}
                      <strong>datakvalitetspoängen (DQI)</strong>, inte kalorimedelvärdet. Det
                      innebär att ju fler dagar du loggar, desto mer exakt speglar uppskattningen
                      ditt faktiska intag — och desto högre justering tillåts.
                    </p>
                  </section>

                  {/* Section 4 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">Hur vikttrenden beräknas</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Istället för att jämföra två enskilda vägningar beräknar systemet en
                      trendlinje genom alla viktmätningar i perioden.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Detta görs med en statistisk metod (linjär regression) som:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>använder alla mätpunkter</li>
                      <li>minskar påverkan från enstaka extrema värden</li>
                      <li>ger ett stabilare estimat av den verkliga viktförändringen</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Systemet analyserar även:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>hur stark vikttrenden är</li>
                      <li>hur mycket vikten varierar runt trenden</li>
                      <li>hur konsekvent datapunkterna följer en riktning</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Om viktdata är mycket brusig eller inkonsekvent reduceras kalibreringens
                      tillförlitlighet.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Som extra kontroll jämförs regressionstrenden även med en glidande medeltrend.
                      Om dessa två skiljer sig kraftigt kan systemet varna för att viktförändringen
                      är oregelbunden.
                    </p>
                  </section>

                  {/* Section 5 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      Klusterbaserad start- och slutvikt
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Som komplement till regressionslinjen beräknar systemet även ett medelvärde av
                      viktmätningarna i periodens <strong>första tredjedel</strong> (startvikt) och{' '}
                      <strong>sista tredjedel</strong> (slutvikt).
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Dessa kluster används för att ge ett alternativt mått på viktförändringen och
                      för att bedöma hur många mätningar som finns i periodens ytterkanter — vilket
                      påverkar tillförlitlighetspoängen.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Den primära vikttrenden beräknas av en linjär regression (OLS) över alla
                      mätpunkter i perioden. Klustren är ett stabiliserande komplement, inte den
                      primära beräkningsmetoden.
                    </p>
                  </section>

                  {/* Section 6 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      Automatisk filtrering av avvikande mätningar
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Viktmätningar som avviker kraftigt från resten av datan kan filtreras bort
                      automatiskt.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Detta görs för att minska påverkan från exempelvis:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>felaktiga vägningar</li>
                      <li>extrem vätskeretention</li>
                      <li>ovanliga engångshändelser</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Filtrerade datapunkter påverkar inte vikttrenden.
                    </p>
                  </section>

                  {/* Section 7 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">
                      Datakvalitet (Data Quality Index)
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Alla kalibreringar får ett <strong>Data Quality Index (DQI)</strong> som
                      uppskattar hur tillförlitlig datan är.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Indexet påverkas bland annat av:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>hur många dagar du loggat mat</li>
                      <li>hur konsekvent kalorier registrerats</li>
                      <li>hur regelbundet du vägt dig</li>
                      <li>hur jämnt mätningarna är fördelade över perioden</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Högre datakvalitet innebär att systemet kan tillåta större TDEE-justeringar.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-1">
                      Vid låg datakvalitet begränsas justeringen automatiskt.
                    </p>
                  </section>

                  {/* Section 8 */}
                  <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-semibold text-base mb-2">
                      Begränsning av extrema justeringar
                    </h3>
                    <p className="text-neutral-700 mb-3">
                      För att undvika att modellen överreagerar på kortsiktiga förändringar används
                      flera stabiliseringsmekanismer.
                    </p>
                    <div className="space-y-4 text-neutral-700">
                      <div>
                        <p className="font-medium">Justeringsgränser (clamp)</p>
                        <p className="mt-1">
                          Kalibreringen begränsar hur mycket TDEE kan ändras i en enskild
                          uppdatering. Maximal justering beror på datakvaliteten och ligger normalt
                          mellan:
                        </p>
                        <p className="font-medium text-primary-600 text-center py-1">
                          ±75 kcal och ±200 kcal
                        </p>
                        <p className="mt-1">
                          Det är viktigt att förstå att denna gräns beräknas utifrån ditt{' '}
                          <strong>nuvarande TDEE-värde</strong>, inte från det nyberäknade värdet.
                          Om startvärdet ligger långt från verkligheten kan det därför krävas flera
                          kalibreringar för att gradvis nå rätt nivå.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Låg signal (mycket liten viktförändring)</p>
                        <p className="mt-1">
                          Om viktförändringen under perioden är mindre än cirka 0,25 % av
                          kroppsvikten betraktas signalen som mycket svag. I detta fall halveras den
                          maximala tillåtna justeringen.
                        </p>
                        <p className="mt-1">
                          Detta beror på att systemet inte kan avgöra om ditt TDEE redan är korrekt,
                          eller om verklig fettförändring maskeras av naturliga viktvariationer.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Gradvis konvergens</p>
                        <p className="mt-1">
                          När en ny TDEE-nivå föreslås närmar sig systemet denna nivå gradvis över
                          flera kalibreringar. Detta gör modellen mer stabil och minskar risken att
                          överreagera på kortsiktiga förändringar.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 9 */}
                  <section>
                    <h3 className="font-semibold text-base mb-2">Osäkerhet och tillförlitlighet</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Kalibreringen analyserar också hur stabil vikttrenden är.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Tillförlitligheten påverkas bland annat av:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
                      <li>hur många viktmätningar som finns</li>
                      <li>hur jämnt de är fördelade över perioden</li>
                      <li>hur konsekvent vikten följer en trend</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Om viktutvecklingen är mycket ojämn kan resultatet få lägre konfidens.
                    </p>
                  </section>

                  {/* Section 10 */}
                  <section>
                    <h3 className="font-semibold text-base mb-3">
                      När bör du använda metabolisk kalibrering?
                    </h3>
                    <p className="text-neutral-700 mb-2">
                      Kalibreringen fungerar bäst när du har samlat in tillräckligt med konsekvent
                      data.
                    </p>
                    <p className="text-neutral-700 font-medium mb-2">Bra förutsättningar:</p>
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

                  {/* Section 11 */}
                  <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-base mb-2">När bör kalibrering undvikas?</h3>
                    <p className="text-neutral-700 mb-2">
                      Kalibrering kan bli missvisande om datan inte representerar en stabil period.
                    </p>
                    <p className="text-neutral-700 font-medium mb-2">Undvik att kalibrera när:</p>
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

                  {/* Section 12 */}
                  <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-base mb-2">Viktigt att förstå</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      Metabolisk kalibrering är en långsiktig finjustering, inte en snabb
                      korrigering.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Kroppsvikt påverkas dagligen av många faktorer som inte är kopplade till
                      fettförändring. Därför är modellen medvetet konservativ och trendbaserad.
                    </p>
                    <p className="text-neutral-700 leading-relaxed mt-2">
                      Ju mer konsekvent du loggar mat och vikt, desto mer exakt kan systemet
                      uppskatta ditt verkliga energibehov.
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">Tidsperiod</label>
                <button
                  type="button"
                  onClick={refreshNow}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600 transition-colors"
                  title="Uppdatera till senaste data"
                >
                  <RefreshCw className="h-3 w-3" />
                  Uppdatera
                </button>
              </div>
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
                                    'vikttrenden är ojämn eller icke-linjär under perioden'
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
                                    <td className="pr-2 text-neutral-400">Matlogg (40%)</td>
                                    <td>{Math.round(data.dataQuality.factors.logScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Mätfrekvens (30%)</td>
                                    <td>{Math.round(data.dataQuality.factors.freqScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Tidskonsistens (15%)</td>
                                    <td>{Math.round(data.dataQuality.factors.timingScore)}/100</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-2 text-neutral-400">Klusterstorlek (15%)</td>
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
                  {data.warnings.map((warning, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 text-sm text-orange-800"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{warning.message}</p>
                        {warning.type === 'high_cv' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Hög variation minskar tillförlitligheten och kan begränsa hur stor
                            justering som tillåts.
                          </p>
                        )}
                        {warning.type === 'timing_inconsistency' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Vikt varierar naturligt under dygnet med upp till 1–2 kg. Ojämna
                            vägningsider gör det svårare att jämföra mätningar med varandra.
                          </p>
                        )}
                        {warning.type === 'target_calories_fallback' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Om du i verkligheten åt mer eller mindre än målet kan kalibreringen bli
                            felaktig — den kan inte se avvikelser som inte loggats.
                          </p>
                        )}
                        {warning.type === 'selective_logging' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Om du bara loggar &quot;bra&quot; dagar överskattas kaloriintaget inte
                            och kalibreringen kan föreslå ett för lågt TDEE.
                          </p>
                        )}
                        {warning.type === 'glycogen_event' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Glykogen och vätska kan orsaka viktförändringar på 1–3 kg på enstaka
                            dagar utan att det återspeglar faktisk fettförändring. Trendberäkningen
                            kompenserar men precision minskar.
                          </p>
                        )}
                        {warning.type === 'large_deficit' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Vid stort underskott anpassar kroppen sin ämnesomsättning nedåt, vilket
                            gör att beräknad TDEE kan underskatta ditt verkliga underhållsbehov.
                          </p>
                        )}
                        {warning.type === 'low_confidence' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Resultatet är användbart som riktlinje men bör bekräftas med en ny
                            kalibrering efter fler veckors data.
                          </p>
                        )}
                        {warning.type === 'large_adjustment' && (
                          <p className="text-xs text-orange-700 mt-1">
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
                              return reasons.length > 0 ? `Orsak: ${reasons.join(', ')}.` : ''
                            })()}
                          </p>
                        )}
                        {warning.type === 'low_signal' && (
                          <p className="text-xs text-orange-700 mt-1">
                            Förändringen ({Math.abs(data.weightChangeKg).toFixed(2)} kg) är under
                            gränsen ~{Math.round(data.endCluster.average * 0.0025 * 10) / 10} kg
                            (0,25% av din vikt). Antingen stämmer ditt TDEE redan, eller döljer
                            vätska/glykogen den verkliga trenden.
                          </p>
                        )}
                        {warning.type === 'outlier_removed' && data.filteredOutliers.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {data.filteredOutliers.map((o, j) => (
                              <li key={j} className="text-xs text-orange-700">
                                {o.recorded_at.toLocaleDateString('sv-SE', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                                {' — '}
                                {o.weight_kg.toFixed(1)} kg
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}

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

                  {/* Undo last calibration — always visible when available */}
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
