import { useMemo, useState } from 'react'
import type {
  WeightHistory,
  CalibrationHistory,
  CalibrationAvailability,
  Profile,
} from '@/lib/types'
import {
  MIN_DATA_POINTS,
  MIN_CLUSTER_SIZE,
  MIN_NEW_WEIGHTS_AFTER_CALIBRATION,
  MIN_LOG_DAYS_FOR_CALIBRATION,
  MIN_LOG_COVERAGE_OF_PERIOD,
  buildClusters,
} from '@/lib/calculations/calibration'
import { useEntitlements, isUnlimited } from '@/hooks/useEntitlements'

/**
 * Fallback om entitlements-svaret saknar de nya nycklarna (äldre RPC-version).
 * Skarpa värden kommer från get_plan_limits(), se docs/PREMIUM_SPEC.md.
 */
const DEFAULT_FREE_CALIBRATION_GRACE = 2
const DEFAULT_FREE_CALIBRATION_INTERVAL_DAYS = 180

/**
 * Determine if TDEE calibration is available and recommended.
 *
 * Uses the same thresholds and cluster logic as the actual calibration
 * calculation to avoid any mismatch between gate and execution.
 */
export function useCalibrationAvailability(
  profile: Profile | null | undefined,
  weightHistory: WeightHistory[] | undefined,
  lastCalibration: CalibrationHistory | null | undefined,
  /**
   * Loggade dagar i den period som utvärderas. Kalibreringen kräver dem
   * (se MIN_LOG_DAYS_FOR_CALIBRATION) — utan dem kalibreras TDEE mot målet
   * i stället för mot faktiskt intag. Utelämnas den antas 0, vilket gör att
   * kalibrering inte erbjuds; anropare som har siffran ska skicka in den.
   */
  logDaysInPeriod?: number
): CalibrationAvailability {
  const { limits } = useEntitlements()
  const graceCount = limits.free_calibration_grace ?? DEFAULT_FREE_CALIBRATION_GRACE
  const intervalDays = limits.calibration_interval_days ?? DEFAULT_FREE_CALIBRATION_INTERVAL_DAYS
  /** premium/founder har grace = -1 (obegränsat) och passerar utan gräns */
  const planLimited = !isUnlimited(graceCount)

  // Klockan läses en gång vid mount i stället för under varje rendering.
  // Utan det blir resultatet instabilt när komponenten råkar rendera om, och
  // react-hooks/purity flaggar anropet.
  const [mountedAt] = useState(() => Date.now())

  return useMemo(() => {
    const logDays = logDaysInPeriod ?? 0

    /**
     * Framsteg mot båda kraven. Räknas mot 14-dagarsperioden — den kortaste
     * vägen till en kalibrering, så nedräkningen visar det närmaste målet
     * i stället för det mest avlägsna.
     */
    /**
     * Räknas FRÅN senaste kalibreringen när den är nyare än 14 dagar.
     *
     * Fönstret var fast, så vägningar som redan förbrukats av en tidigare
     * kalibrering räknades igen: dagen efter en kalibrering visade kortet
     * "8 av 4 vägningar ✓" trots att inga nya fanns. Samma fel som
     * loggdagarna hade, i raden bredvid.
     */
    const fourteenDaysAgo = new Date(mountedAt - 14 * 24 * 60 * 60 * 1000)
    const lastCalibratedAt = lastCalibration?.calibrated_at
      ? new Date(lastCalibration.calibrated_at)
      : null
    const progressWindowStart =
      lastCalibratedAt && lastCalibratedAt > fourteenDaysAgo ? lastCalibratedAt : fourteenDaysAgo

    /**
     * Vilka perioder håller redan, och vilken jobbar användaren mot?
     *
     * Loopen nedan testade förut samma sak men kastade mellanresultaten —
     * bara den längsta träffen behölls. Beredskapskortet behöver hela
     * stegen för att kunna visa att det finns mer att hämta: en längre
     * mätperiod ger säkrare resultat (±177 kcal/dag vid 14 dagar mot ±62
     * vid 28, se calibration-quality.ts).
     */
    const PERIODS: Array<14 | 21 | 28> = [14, 21, 28]
    const reachedPeriods: Array<14 | 21 | 28> = []
    for (const period of PERIODS) {
      const cutoff = new Date(mountedAt - period * 24 * 60 * 60 * 1000)
      const inPeriod = (weightHistory ?? []).filter(w => new Date(w.recorded_at) >= cutoff)
      if (inPeriod.length < MIN_DATA_POINTS[period]) continue
      const clusters = buildClusters(weightHistory ?? [], period, new Date(mountedAt))
      if (!clusters) continue
      const minCluster = MIN_CLUSTER_SIZE[period]
      if (clusters.startCluster.count < minCluster || clusters.endCluster.count < minCluster)
        continue
      reachedPeriods.push(period)
    }

    /**
     * Aktiv period = nästa nivå att sträcka sig mot, eller den högsta när
     * allt är uppnått. Kraven i kortet mäts mot DEN, så barerna följer med
     * uppåt i stället för att fastna på 14-dagarskraven.
     */
    const activePeriod: 14 | 21 | 28 =
      reachedPeriods.length === 0
        ? 14
        : reachedPeriods.length === PERIODS.length
          ? 28
          : PERIODS[reachedPeriods.length]

    const weighInsNeeded = MIN_DATA_POINTS[activePeriod]

    /**
     * Fönstret följer den aktiva perioden.
     *
     * weighInsNow räknades först alltid över 14 dagar medan kravet togs från
     * activePeriod. Var den 28 jämfördes 14 dagars vägningar mot 28 dagars
     * krav, och kortet visade för få trots att underlaget räckte.
     */
    const activeCutoff = new Date(mountedAt - activePeriod * 24 * 60 * 60 * 1000)
    const activeWindowStart =
      lastCalibratedAt && lastCalibratedAt > activeCutoff ? lastCalibratedAt : activeCutoff
    const weighInsInActivePeriod = weightHistory
      ? weightHistory.filter(w => new Date(w.recorded_at) >= activeWindowStart).length
      : 0

    /**
     * När blir nästa vägning meningsfull?
     *
     * Klusterkravet går inte att uppfylla genom att väga sig igen i dag —
     * mätningarna måste hamna i olika ändar av fönstret, som delas i
     * tredjedelar. Ligger allt i slutet får den äldsta mätningen först
     * driva in i startzonen, och det tar tid.
     *
     * Det här är en NEDRÄKNING och kan bara minska. daysRemaining var ett
     * ANTAL som presenterades som dagar, och kunde dessutom gå bakåt.
     */
    const zoneDays = activePeriod / 3
    const oldestInWindow = (weightHistory ?? [])
      .filter(w => new Date(w.recorded_at) >= progressWindowStart)
      .map(w => new Date(w.recorded_at).getTime())
      .sort((a, b) => a - b)[0]
    const daysSinceOldest =
      oldestInWindow != null ? (mountedAt - oldestInWindow) / (24 * 60 * 60 * 1000) : 0
    const daysUntilNextWeighInUseful = Math.max(0, Math.ceil(zoneDays - daysSinceOldest))

    /**
     * Täckningskravet kontrollerades bara i calibration-core, alltså EFTER
     * knapptrycket. Kortet kunde därför säga "redo" om något som sedan
     * nekades. Uppskattas här mot den aktiva perioden.
     */
    const coverageOk =
      logDays >= Math.ceil(activePeriod * MIN_LOG_COVERAGE_OF_PERIOD) ||
      logDays >= MIN_LOG_DAYS_FOR_CALIBRATION * 2

    const blocking: CalibrationAvailability['progress']['blocking'] =
      weighInsInActivePeriod < weighInsNeeded
        ? 'weighInCount'
        : reachedPeriods.length === 0
          ? 'clusterGap'
          : logDays < MIN_LOG_DAYS_FOR_CALIBRATION
            ? 'logDays'
            : !coverageOk
              ? 'logCoverage'
              : 'none'

    const buildProgress = (): CalibrationAvailability['progress'] => ({
      weighIns: { current: weighInsInActivePeriod, required: weighInsNeeded },
      logDays: { current: logDays, required: MIN_LOG_DAYS_FOR_CALIBRATION },
      // Kvar för bakåtkompatibilitet, se @deprecated i types.ts.
      daysRemaining: Math.max(
        Math.max(0, weighInsNeeded - weighInsInActivePeriod),
        Math.max(0, MIN_LOG_DAYS_FOR_CALIBRATION - logDays)
      ),
      activePeriod,
      reachedPeriods,
      blocking,
      daysUntilNextWeighInUseful: blocking === 'clusterGap' ? daysUntilNextWeighInUseful : null,
    })

    const unavailable: CalibrationAvailability = {
      isAvailable: false,
      isRecommended: false,
      reason: 'Otillräckligt med data',
      minDataPoints: MIN_DATA_POINTS[14],
      currentDataPoints: 0,
      daysSinceLastCalibration: null,
      daysUntilNextRecommended: null,
      weightTrend: 'insufficient_data',
      suggestedTimePeriod: 21,
      confidencePreview: 'unknown',
      progress: buildProgress(),
    }

    if (!profile || !weightHistory) {
      return unavailable
    }

    if (!profile.tdee) {
      return {
        ...unavailable,
        reason: 'TDEE måste vara satt för att kalibrera',
      }
    }

    // Samma klocka som framstegsberäkningen ovan — annars kan de två svara
    // mot olika tidpunkter i samma rendering.
    const now = new Date(mountedAt)
    const periods: Array<14 | 21 | 28> = [28, 21, 14]

    // Find the best available period (longest first)
    let bestPeriod: 14 | 21 | 28 | null = null
    let bestClusterResult: ReturnType<typeof buildClusters> = null
    let bestWeightsInPeriod: WeightHistory[] = []

    for (const period of periods) {
      const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
      const weightsInPeriod = weightHistory.filter(w => new Date(w.recorded_at) >= cutoff)

      if (weightsInPeriod.length < MIN_DATA_POINTS[period]) continue

      const clusters = buildClusters(weightHistory, period, now)
      if (!clusters) continue

      // Check minimum cluster sizes
      const minCluster = MIN_CLUSTER_SIZE[period]
      if (clusters.startCluster.count < minCluster || clusters.endCluster.count < minCluster)
        continue

      bestPeriod = period
      bestClusterResult = clusters
      bestWeightsInPeriod = weightsInPeriod
      break
    }

    if (!bestPeriod || !bestClusterResult) {
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason: `Behöver minst ${MIN_DATA_POINTS[14]} viktmätningar under 14 dagar`,
      }
    }

    // Matloggning krävs lika mycket som vägningar. Utan den kalibreras TDEE
    // mot målet i stället för mot faktiskt intag — samma grind som
    // runCalibration, så knappen aldrig leder till ett felmeddelande.
    if (logDays < MIN_LOG_DAYS_FOR_CALIBRATION) {
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason: `Behöver minst ${MIN_LOG_DAYS_FOR_CALIBRATION} loggade dagar för att jämföra intaget med viktförändringen (har ${logDays})`,
      }
    }

    // Calculate days since last calibration
    let daysSinceLastCalibration: number | null = null
    if (lastCalibration) {
      daysSinceLastCalibration = Math.floor(
        (now.getTime() - new Date(lastCalibration.calibrated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // Plan-gräns: gratisnivån får två fria kalibreringar, därefter 1×/6 mån.
    // De två fria finns för att användaren ska hinna uppleva loopen
    // (kalibrera → se TDEE justeras) innan intervallet börjar gälla.
    // premium/founder är obegränsat och passerar rakt igenom.
    if (planLimited && daysSinceLastCalibration !== null) {
      const usedCalibrations = profile.lifetime_calibration_count ?? 0
      const withinGrace = usedCalibrations < graceCount

      if (!withinGrace && daysSinceLastCalibration < intervalDays) {
        const daysLeft = intervalDays - daysSinceLastCalibration
        const months = Math.round(intervalDays / 30)
        return {
          ...unavailable,
          currentDataPoints: weightHistory.length,
          daysSinceLastCalibration,
          daysUntilNextRecommended: daysLeft,
          reason: `Nästa kalibrering om ${daysLeft} dagar — gratisnivån kalibrerar 1 gång var ${months}:e månad`,
        }
      }
    }

    // Analyze weight trend using sorted weights in the best period
    const sortedWeights = [...bestWeightsInPeriod].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    let weightTrend: CalibrationAvailability['weightTrend'] = 'stable'

    if (sortedWeights.length >= 2) {
      const firstWeight = sortedWeights[0].weight_kg
      const lastWeight = sortedWeights[sortedWeights.length - 1].weight_kg
      const changePercent = ((lastWeight - firstWeight) / firstWeight) * 100
      const daysDiff =
        (new Date(sortedWeights[sortedWeights.length - 1].recorded_at).getTime() -
          new Date(sortedWeights[0].recorded_at).getTime()) /
        (1000 * 60 * 60 * 24)
      const weeklyChangePercent = daysDiff > 0 ? (changePercent / daysDiff) * 7 : 0

      // CV-based erratic detection
      const weights = sortedWeights.map(w => w.weight_kg)
      const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
      const variance =
        weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length
      const coefficientOfVariation = (Math.sqrt(variance) / avgWeight) * 100

      if (coefficientOfVariation > 3) {
        weightTrend = 'erratic'
      } else if (weeklyChangePercent < -0.5) {
        weightTrend = 'losing'
      } else if (weeklyChangePercent > 0.5) {
        weightTrend = 'gaining'
      } else {
        weightTrend = 'stable'
      }
    }

    // Confidence preview
    let confidencePreview: CalibrationAvailability['confidencePreview'] = 'unknown'
    if (bestClusterResult) {
      const sc = bestClusterResult.startCluster.count
      const ec = bestClusterResult.endCluster.count
      if (sc >= 3 && ec >= 3) confidencePreview = 'high'
      else if (sc >= 2 || ec >= 2) confidencePreview = 'standard'
      else confidencePreview = 'low'
    }

    // B+ availability: no period overlap + at least MIN_NEW_WEIGHTS_AFTER_CALIBRATION new weights
    /**
     * Dagar innan en NY kalibrering rekommenderas.
     *
     * SÄNKT FRÅN 21 (2026-08-21). Fjorton dagar är samma golv som
     * kalibreringen själv accepterar, och att vänta längre än nödvändigt
     * håller kvar användaren på ett formelskattat TDEE i onödan —
     * särskilt den nya användaren, som har mest att vinna på att komma
     * ifrån gissningen fort.
     *
     * Kvaliteten skyddas i stället av confidencePreview: kalibrering
     * rekommenderas bara vid "high", alltså minst tre vägningar i vardera
     * änden. Tiden ensam säger inget om underlaget.
     */
    const RECOMMENDED_MIN_DAYS = 14
    let isRecommended = false
    let reason = ''

    if (!lastCalibration) {
      // Samma krav som vid omkalibrering: tunt underlag ger ett osäkert
      // svar, och det första svaret är det som formar förtroendet.
      if (confidencePreview === 'high') {
        isRecommended = true
        reason = 'Första kalibrering rekommenderas'
      } else {
        reason = 'Väg dig några gånger till — fler mätningar ger ett säkrare resultat'
      }
    } else {
      const lastEndDate = new Date(lastCalibration.calibrated_at)
      lastEndDate.setHours(0, 0, 0, 0)

      const newWeightsAfterLast = (weightHistory ?? []).filter(
        w => new Date(w.recorded_at) > lastEndDate
      ).length
      const hasEnoughNewWeights = newWeightsAfterLast >= MIN_NEW_WEIGHTS_AFTER_CALIBRATION

      if (!hasEnoughNewWeights) {
        /**
         * OTILLGÄNGLIG, inte bara "inte rekommenderad".
         *
         * Kortet satte tidigare bara en reason här och lämnade
         * isAvailable: true. Följden blev att det stod "0 av 3 nya
         * viktmätningar sedan senaste kalibreringen" med en aktiv
         * Kalibrera-knapp bredvid — två motsägande besked i samma ruta.
         *
         * Kravet är verkligt: MIN_NEW_WEIGHTS_AFTER_CALIBRATION beskrivs i
         * calibration-constants som minimum "before re-applying". Utan nya
         * mätningar körs kalibreringen på samma underlag som förra gången
         * och kan inte ge något nytt svar.
         */
        return {
          ...unavailable,
          currentDataPoints: bestWeightsInPeriod.length,
          daysSinceLastCalibration,
          weightTrend,
          suggestedTimePeriod: bestPeriod,
          reason: `${newWeightsAfterLast} av ${MIN_NEW_WEIGHTS_AFTER_CALIBRATION} nya viktmätningar sedan senaste kalibreringen`,
          progress: {
            ...unavailable.progress,
            weighIns: {
              current: newWeightsAfterLast,
              required: MIN_NEW_WEIGHTS_AFTER_CALIBRATION,
            },
          },
        }
      } else if (
        daysSinceLastCalibration !== null &&
        daysSinceLastCalibration >= RECOMMENDED_MIN_DAYS
      ) {
        /**
         * REKOMMENDERAS BARA VID HÖG TILLFÖRLITLIGHET (2026-08-21).
         *
         * Att uppmana till kalibrering på tunt underlag ger ett svar som
         * ser lika auktoritativt ut som ett välgrundat, men bygger på
         * ett par vägningar. Vid low/standard förblir funktionen
         * TILLGÄNGLIG — den som vill får köra — men appen ber inte om det.
         */
        if (confidencePreview !== 'high') {
          reason = 'Väg dig några gånger till — fler mätningar ger ett säkrare resultat'
        } else if (weightTrend === 'losing' || weightTrend === 'gaining') {
          isRecommended = true
          reason = `Vikten har ${weightTrend === 'losing' ? 'minskat' : 'ökat'} sedan senaste kalibreringen`
        } else if (weightTrend === 'stable' && daysSinceLastCalibration >= 28) {
          isRecommended = true
          reason = 'Dags att verifiera att TDEE fortfarande stämmer'
        } else {
          reason = 'Kalibrering tillgänglig vid behov'
        }
      } else {
        reason = 'Kalibrering tillgänglig vid behov'
      }
    }

    if (weightTrend === 'erratic') {
      reason = 'Oregelbunden viktdata — väg dig på morgonen före frukost för bäst resultat'
      isRecommended = false
    }

    const daysUntilNextRecommended = isRecommended
      ? 0
      : daysSinceLastCalibration !== null
        ? Math.max(0, RECOMMENDED_MIN_DAYS - daysSinceLastCalibration)
        : null

    return {
      isAvailable: true,
      isRecommended,
      reason,
      minDataPoints: MIN_DATA_POINTS[bestPeriod],
      currentDataPoints: bestWeightsInPeriod.length,
      daysSinceLastCalibration,
      daysUntilNextRecommended,
      weightTrend,
      suggestedTimePeriod: bestPeriod,
      confidencePreview,
      progress: buildProgress(),
    }
  }, [
    profile,
    weightHistory,
    lastCalibration,
    planLimited,
    graceCount,
    intervalDays,
    logDaysInPeriod,
    mountedAt,
  ])
}
