/**
 * Metabolic Calibration — Eligibility
 *
 * En enda definition av "går den här perioden att kalibrera på".
 *
 * VARFÖR: samma kedja — räkna vägningar, bygg kluster, validera — låg
 * utskriven på tre ställen (grinden, periodväljaren och bestPeriod-loopen).
 * Varje kopia hade sin egen uppsättning kontroller, och varje gång en regel
 * lades till i motorn glömdes minst en av dem. Det gav i tur och ordning:
 * klusterstorlek som saknades i väljaren, takt och CV som saknades i
 * grinden, och en väljare som erbjöd perioder motorn nekade.
 *
 * Funktionen här ÄGER frågan. Anropare frågar, de svarar inte själva.
 */

import type { WeightHistory } from '@/lib/types'
import {
  MIN_DATA_POINTS,
  MIN_CLUSTER_SEPARATION_DAYS,
  TDEE_FLOOR,
  TDEE_CEILING,
} from './calibration-constants'
import { daysBetween, meanDate, getEffectiveKcalPerKg } from './calibration-helpers'
import { calculateWeightTrendOLS } from './calibration-trend'
import { getCalorieEstimate } from './calibration-quality'
import { buildClusters, type ClusterBuildResult } from './calibration-clustering'
import { validateWeightData } from './calibration-core'

export interface PeriodEligibility {
  eligible: boolean
  /** Vägningarna som ligger i fönstret — färre än MIN_DATA_POINTS stoppar direkt. */
  weightsInPeriod: WeightHistory[]
  /** Klustren, när de gick att bilda. Återanvänds av anroparen. */
  clusters: ClusterBuildResult | null
  /**
   * Motorns eget besked när perioden inte håller, annars null.
   *
   * Meddelandet återanvänds ordagrant i UI:t — en parafras här skulle bli
   * ännu en kopia att hålla i synk med.
   */
  reason: string | null
}

/**
 * Kan kalibrering köras på den här perioden, med den här historiken?
 *
 * Svarar med samma regler som runCalibration, eftersom den anropar samma
 * validateWeightData.
 *
 * TDEE-golvet och -taket ingår INTE här — de beror på loggat intag, som
 * den här funktionen inte tar emot. Anropare som har intaget prövar dem
 * med projectRawTDEE och checkProjectedTDEE.
 */
export function checkPeriodEligibility(
  weightHistory: WeightHistory[],
  period: 14 | 21 | 28,
  now: Date
): PeriodEligibility {
  const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
  const weightsInPeriod = weightHistory.filter(w => new Date(w.recorded_at) >= cutoff)

  if (weightsInPeriod.length < MIN_DATA_POINTS[period]) {
    return {
      eligible: false,
      weightsInPeriod,
      clusters: null,
      reason: `Behöver minst ${MIN_DATA_POINTS[period]} viktmätningar under ${period} dagar (har ${weightsInPeriod.length})`,
    }
  }

  /**
   * Hela historiken in, inte det filtrerade urvalet.
   *
   * buildClusters klipper själv mot fönstret, och grinden skickade förut
   * weightHistory medan den räknade på weightsInPeriod — två olika urval i
   * samma beslut. Här är det ett.
   */
  const clusters = buildClusters(weightHistory, period, now)
  if (!clusters) {
    return {
      eligible: false,
      weightsInPeriod,
      clusters: null,
      reason: 'Inte tillräckligt med viktdata i vald period för att skapa start- och slutvikt.',
    }
  }

  const validationError = validateWeightData(
    clusters.allMeasurements,
    clusters.startCluster,
    clusters.endCluster,
    period
  )

  return {
    eligible: validationError === null,
    weightsInPeriod,
    clusters,
    reason: validationError?.message ?? null,
  }
}

/**
 * Vad kalibreringen skulle landa på, innan klämmor och kvalitetsindex.
 *
 * Returnerar null när underlaget saknas — utan loggat intag finns inget att
 * projicera, och då säger golvet ingenting.
 *
 * VARFÖR: TDEE-golvet och -taket avvisade underlag EFTER knapptrycket, och
 * jag antog länge att det var oundvikligt eftersom rawTDEE "kommer ur hela
 * pipelinen". Det stämmer inte. rawTDEE är averageCalories minus den dagliga
 * energibalansen, och båda går att räkna fram ur samma kluster och samma
 * loggdata som grinden redan har. Klämmorna påverkar clampedTDEE, inte
 * rawTDEE — och det är rawTDEE golvet prövar.
 */
export function projectRawTDEE(
  clusters: ClusterBuildResult,
  periodDays: 14 | 21 | 28,
  loggedCaloriesAvg: number | null,
  targetCalories: number,
  daysWithLogData: number
): number | null {
  if (loggedCaloriesAvg === null || daysWithLogData <= 0) return null

  const { startCluster, endCluster, allMeasurements } = clusters

  // Samma trendval som runCalibration: OLS när den går att beräkna, annars
  // klustermedianerna.
  const ols = calculateWeightTrendOLS(allMeasurements)
  const weightChangeKg = ols
    ? ols.trendEnd - ols.trendStart
    : endCluster.average - startCluster.average
  const actualDays = ols
    ? Math.max(MIN_CLUSTER_SEPARATION_DAYS, ols.lastX)
    : Math.max(
        MIN_CLUSTER_SEPARATION_DAYS,
        daysBetween(meanDate(startCluster.dates), meanDate(endCluster.dates))
      )

  const { averageCalories } = getCalorieEstimate(
    loggedCaloriesAvg,
    targetCalories,
    daysWithLogData,
    periodDays
  )

  const startWeight = ols ? ols.trendStart : startCluster.average
  const weeklyChangePct = (weightChangeKg / startWeight) * 100 * (7 / actualDays)
  const dailyCalorieBalance = (weightChangeKg * getEffectiveKcalPerKg(weeklyChangePct)) / actualDays

  return averageCalories - dailyCalorieBalance
}

/**
 * Ligger den projicerade siffran utanför de fysiologiska gränserna?
 *
 * Samma besked som runCalibration ger, så grinden och motorn säger samma sak.
 */
export function checkProjectedTDEE(projected: number | null): string | null {
  if (projected === null) return null
  if (projected < TDEE_FLOOR) {
    return `Kalibrerat TDEE (${Math.round(projected)} kcal) är under rekommenderad minimigräns (${TDEE_FLOOR} kcal). Kontrollera din matloggning.`
  }
  if (projected > TDEE_CEILING) {
    return `Kalibrerat TDEE (${Math.round(projected)} kcal) är orealistiskt högt. Kontrollera viktdata och matloggning.`
  }
  return null
}

/**
 * Längsta period som håller, eller null.
 *
 * Längst först: en längre mätperiod ger säkrare siffra (±62 kcal/dag vid 28
 * dagar mot ±177 vid 14, se calibration-quality.ts).
 */
export function findBestPeriod(
  weightHistory: WeightHistory[],
  now: Date
): { period: 14 | 21 | 28; result: PeriodEligibility } | null {
  for (const period of [28, 21, 14] as const) {
    const result = checkPeriodEligibility(weightHistory, period, now)
    if (result.eligible) return { period, result }
  }
  return null
}
