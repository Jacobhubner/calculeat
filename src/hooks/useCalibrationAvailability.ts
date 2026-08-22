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
  calibrationNow,
  validateWeightData,
  findBestPeriod,
  checkPeriodEligibility,
  calculateWeightTrendOLS,
  CV_BLOCK_THRESHOLD,
} from '@/lib/calculations/calibration'
import { useEntitlements, isUnlimited } from '@/hooks/useEntitlements'

/**
 * Fallback om entitlements-svaret saknar de nya nycklarna (äldre RPC-version).
 * Skarpa värden kommer från get_plan_limits(), se docs/PREMIUM_SPEC.md.
 */
const DEFAULT_FREE_CALIBRATION_GRACE = 2
const DEFAULT_FREE_CALIBRATION_INTERVAL_DAYS = 180

/**
 * Hur långt fram nedräkningen tittar. Behövs bara ett tak — bortom en
 * period har fönstret glidit helt och läget ser annorlunda ut ändå.
 */
const MAX_LOOKAHEAD_DAYS = 30

/**
 * Antal dagar tills klusterkravet KAN uppfyllas, eller null om ingen
 * vägning framåt hjälper inom överskådlig tid.
 *
 * Simulerar regeln dag för dag i stället för att räkna på den. Zonerna
 * flyttar sig varje dygn och mätningar faller ur fönstret i andra änden,
 * så en sluten formel blir fel så fort mer än ett fall ska täckas — vilket
 * var precis vad den gamla gjorde.
 *
 * Antagandet är att användaren väger sig samma dag som svaret pekar ut.
 * Håller klustret redan i dag returneras 0.
 */
function daysUntilClusterPossible(
  weightHistory: WeightHistory[],
  period: 14 | 21 | 28,
  fromMs: number
): number | null {
  const minCluster = MIN_CLUSTER_SIZE[period]
  const template = weightHistory[0] ?? ({} as WeightHistory)
  const DAY_MS = 24 * 60 * 60 * 1000

  for (let offset = 0; offset <= MAX_LOOKAHEAD_DAYS; offset++) {
    const then = new Date(fromMs + offset * DAY_MS)

    /**
     * Användaren antas väga sig från och med den dagen och framåt, inte
     * en enda gång. Slutklustret kräver minCluster mätningar och en ensam
     * vägning kan därför aldrig fylla det — simulerar man bara en blir
     * svaret "ingen vägning hjälper" även när en vecka av vägningar löser
     * det galant.
     */
    const hypothetical: WeightHistory[] = Array.from({ length: minCluster }, (_, i) => ({
      ...template,
      id: `__hypothetical_${i}__`,
      recorded_at: new Date(then.getTime() - i * DAY_MS).toISOString(),
    }))

    const clusters = buildClusters([...weightHistory, ...hypothetical], period, then)
    if (
      clusters &&
      clusters.startCluster.count >= minCluster &&
      clusters.endCluster.count >= minCluster
    ) {
      return offset
    }
  }

  return null
}

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

  /**
   * Klockan läses en gång vid mount i stället för under varje rendering.
   * Utan det blir resultatet instabilt när komponenten råkar rendera om, och
   * react-hooks/purity flaggar anropet.
   *
   * calibrationNow, inte Date.now: modalen räknar mot dygnsslutet, och med
   * en råtidpunkt här låg de två fönstren upp till 16 timmar isär. Kortet
   * kunde då säga "redo" om data som modalen räknade som otillräcklig.
   */
  const [mountedAt] = useState(() => calibrationNow().getTime())

  return useMemo(() => {
    const logDays = logDaysInPeriod ?? 0

    /**
     * Vägningar som redan förbrukats av en tidigare kalibrering ska inte
     * räknas igen — dagen efter en kalibrering visade kortet annars
     * "8 av 4 vägningar ✓" trots att inga nya fanns. Varje fönster nedan
     * klipps därför vid kalibreringsdatumet när det är nyare.
     */
    const lastCalibratedAt = lastCalibration?.calibrated_at
      ? new Date(lastCalibration.calibrated_at)
      : null

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
      /**
       * Fönstret startar vid kalibreringen när den är nyare än perioden.
       *
       * Loopen räknade förut ALLA vägningar i fönstret. Dagen efter en
       * kalibrering tände därför alla tre stegen — samtidigt som raden
       * under sa "Nya vägningar 0 / 6". Samma kort, två sanningar. Och
       * eftersom trappan trodde att 28 dagar var uppnått blev
       * activePeriod 28, vilket är varför kravet sa 6 i stället för 4.
       */
      const windowStart = lastCalibratedAt && lastCalibratedAt > cutoff ? lastCalibratedAt : cutoff
      const inPeriod = (weightHistory ?? []).filter(w => new Date(w.recorded_at) >= windowStart)
      if (inPeriod.length < MIN_DATA_POINTS[period]) continue
      const clusters = buildClusters(inPeriod, period, new Date(mountedAt))
      if (!clusters) continue
      const minCluster = MIN_CLUSTER_SIZE[period]
      if (clusters.startCluster.count < minCluster || clusters.endCluster.count < minCluster)
        continue
      reachedPeriods.push(period)
      /**
       * MEDVETET bara klusterkontroll här, inte full validering.
       *
       * Trappan svarar på "har du samlat underlag nog", inte "går det att
       * kalibrera just nu". Mätt skiljer de sig i hälften av fallen, och
       * ALLA skillnader är taktspärren: vikten rör sig snabbare än 1,5 %
       * per vecka, ofta vätske­vikt som passerar på några dagar.
       *
       * Att släcka ett steg då vore fel besked — vägningarna finns kvar och
       * försvinner inte för att vikten rörde sig. Om kalibrering faktiskt
       * är blockerad säger raden under, som utgår från isAvailable.
       */
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
     * Var i perioden vägningarna faktiskt ligger.
     *
     * Räknas med buildClusters, alltså exakt den funktion grinden och
     * runCalibration använder — en egen tredjedelsuträkning här skulle
     * kunna glida isär från regeln den beskriver.
     */
    const spreadClusters = buildClusters(
      (weightHistory ?? []).filter(w => new Date(w.recorded_at) >= activeWindowStart),
      activePeriod,
      new Date(mountedAt)
    )
    const weighInSpread = {
      early: spreadClusters?.startCluster.count ?? 0,
      late: spreadClusters?.endCluster.count ?? 0,
    }

    /**
     * När blir nästa vägning meningsfull?
     *
     * Klusterkravet går inte att uppfylla genom att väga sig igen i dag —
     * mätningarna måste hamna i olika ändar av fönstret, som delas i
     * tredjedelar. Ligger allt i slutet får de äldsta mätningarna först
     * driva in i startzonen, och det tar tid.
     *
     * Räknas fram genom att SIMULERA regeln dag för dag, inte genom en
     * formel. Den gamla formeln (zoneDays − daysSinceOldest) mätte när
     * äldsta mätningen lämnar SLUTzonen, inte när den når STARTzonen, och
     * gav 0 i lägen där ingen vägning alls hjälper — kortet sa "väg dig i
     * dag", ingenting hände, och samma text kom tillbaka nästa dag.
     *
     * Det här är en NEDRÄKNING och kan bara minska. daysRemaining var ett
     * ANTAL som presenterades som dagar, och kunde dessutom gå bakåt.
     */
    const daysUntilNextWeighInUseful = daysUntilClusterPossible(
      weightHistory ?? [],
      activePeriod,
      mountedAt
    )

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
      weighInSpread,
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
      clusterOutlook:
        blocking !== 'clusterGap'
          ? 'notBlocking'
          : daysUntilNextWeighInUseful === null
            ? 'windowExpiring'
            : daysUntilNextWeighInUseful === 0
              ? 'weighToday'
              : 'weighLater',
      hardBlock: 'none',
      hardBlockDaysLeft: null,
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
        progress: { ...unavailable.progress, hardBlock: 'missingTdee' },
      }
    }

    // Samma klocka som framstegsberäkningen ovan — annars kan de två svara
    // mot olika tidpunkter i samma rendering.
    const now = new Date(mountedAt)

    // Find the best available period (longest first)
    let bestPeriod: 14 | 21 | 28 | null = null
    let bestClusterResult: ReturnType<typeof buildClusters> = null
    let bestWeightsInPeriod: WeightHistory[] = []

    /**
     * findBestPeriod äger frågan — loopen härmade den förut, med sin egen
     * uppsättning kontroller. Varje ny regel i motorn glömdes då i minst
     * en kopia; se calibration-eligibility.ts.
     */
    const best = findBestPeriod(weightHistory, now)
    if (best) {
      bestPeriod = best.period
      bestClusterResult = best.result.clusters
      bestWeightsInPeriod = best.result.weightsInPeriod
    }

    if (!bestPeriod || !bestClusterResult) {
      /**
       * Motorns eget besked, inte ett generellt "för få vägningar".
       *
       * 14-dagarsperioden är den användaren står närmast, så dess orsak är
       * den handlingsbara. Utan det här föll takt- och CV-spärrar tillbaka
       * på antalsmeddelandet och sa "Behöver minst 4 viktmätningar" till
       * någon som redan hade sex.
       */
      const narmast = checkPeriodEligibility(weightHistory, 14, now)
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason:
          narmast.reason ?? `Behöver minst ${MIN_DATA_POINTS[14]} viktmätningar under 14 dagar`,
      }
    }

    /**
     * Kör motorns egen validering i stället för att härma den.
     *
     * Takt- och CV-grinderna fanns bara i runCalibration, så kortet kunde
     * säga "redo" om data som nekades efter klicket. Mätt på ett svep över
     * brusiga och snabba viktkurvor föll 14 av 25 redo-lägen — 56 %, med
     * takten som dominerande orsak.
     *
     * validateWeightData tar samma kluster som runCalibration sedan bygger,
     * alltså exakt samma indata. Att anropa den är det enda sättet att
     * garantera att grinden och motorn inte glider isär igen.
     */
    const validationError = validateWeightData(
      bestClusterResult.allMeasurements,
      bestClusterResult.startCluster,
      bestClusterResult.endCluster,
      bestPeriod
    )
    if (validationError) {
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason: validationError.message,
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
          progress: {
            ...unavailable.progress,
            hardBlock: 'planInterval',
            hardBlockDaysLeft: daysLeft,
          },
        }
      }
    }

    // Analyze weight trend using sorted weights in the best period
    const sortedWeights = [...bestWeightsInPeriod].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    let weightTrend: CalibrationAvailability['weightTrend'] = 'stable'

    if (sortedWeights.length >= 2) {
      /**
       * OLS över alla mätningar, inte första mot sista.
       *
       * Ändpunktsmetoden lät en enda brusig vägning definiera trenden:
       * mätt kallade den en platt kurva "losing" i 9 fall av 48, alltid åt
       * det hållet. Motorn regresserar över hela serien
       * (calculateWeightTrendOLS), och trendetiketten användaren ser bör
       * komma från samma metod som siffran hon sedan får.
       */
      const startWeight = sortedWeights[0].weight_kg
      const olsTrend = calculateWeightTrendOLS(
        sortedWeights.map(w => ({
          weight_kg: w.weight_kg,
          recorded_at: new Date(w.recorded_at),
        }))
      )

      let weeklyChangePercent: number
      if (olsTrend) {
        weeklyChangePercent = ((olsTrend.slopeKgPerDay * 7) / startWeight) * 100
      } else {
        // Under tre mätningar går OLS inte att beräkna — då är ändpunkterna
        // allt som finns.
        const lastWeight = sortedWeights[sortedWeights.length - 1].weight_kg
        const changePercent = ((lastWeight - startWeight) / startWeight) * 100
        const daysDiff =
          (new Date(sortedWeights[sortedWeights.length - 1].recorded_at).getTime() -
            new Date(sortedWeights[0].recorded_at).getTime()) /
          (1000 * 60 * 60 * 24)
        weeklyChangePercent = daysDiff > 0 ? (changePercent / daysDiff) * 7 : 0
      }

      // CV-based erratic detection
      const weights = sortedWeights.map(w => w.weight_kg)
      const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
      const variance =
        weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length
      const coefficientOfVariation = (Math.sqrt(variance) / avgWeight) * 100

      // Konstanten, inte en lös trea: tröskeln ska följa med om den ändras.
      if (coefficientOfVariation > CV_BLOCK_THRESHOLD) {
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

    /**
     * Kvar som skärpning, inte som spärr.
     *
     * CV över blockeringströskeln fångas numera av validateWeightData långt
     * tidigare, med motorns eget felmeddelande. Det här greppet gäller de
     * fall där trenden ser ryckig ut utan att nå den tröskeln — då är
     * kalibrering fortfarande TILLGÄNGLIG, appen ber bara inte om den.
     */
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
