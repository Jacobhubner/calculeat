/**
 * Metabolic Calibration — Internal Helpers
 *
 * Pure utility functions shared across calibration modules.
 * Not re-exported from the barrel — internal use only.
 */

import { KCAL_PER_KG } from './calibration-constants'

export function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stddev(values: number[]): number {
  const avg = mean(values)
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

export function meanDate(dates: Date[]): Date {
  const avg = dates.reduce((s, d) => s + d.getTime(), 0) / dates.length
  return new Date(avg)
}

/**
 * Energitäthet för viktförändring — hur många kcal en kilo motsvarar.
 *
 * KÄLLGRANSKNING 2026-08-16 (primärkällor lästa i fulltext):
 *
 * NEDGÅNG. Utgångsvärdet 7700 kcal/kg är tumregeln 3500 kcal/pund, dvs.
 * 32,2 MJ/kg. Hall KD, Int J Obes 2008;32(3):573-576
 * (doi: 10.1038/sj.ijo.0803720) visar att den bygger på ett antagande om
 * ren fettvävnad (87 % fett) och att fettfri massa i praktiken förloras
 * samtidigt. Halls modellparametrar: fettmassa 39,5 MJ/kg (9441 kcal/kg),
 * fettfri massa 7,6 MJ/kg (1816 kcal/kg).
 *
 * VIKTIGT: Hall modellerar variation med UTGÅNGSFETTMASSA, inte med
 * hastighet. Hans slutsats är att tumregeln stämmer hyfsat vid >30 kg
 * kroppsfett men ÖVERSKATTAR för smalare personer — vid 20 kg utgångsfett
 * blir det 24,7 MJ/kg (5903 kcal/kg). Rampen nedan modellerar hastighet och
 * har alltså inte Hall som stöd; den bygger på att snabb nedgång innehåller
 * mer glykogen och vatten. Detta är en RIMLIG men EJ VALIDERAD extrapolering.
 *
 * UPPGÅNG. Tidigare värde 6800 kcal/kg saknade helt källa. Bray GA &
 * Bouchard C, Obes Rev 2020;21(9):e13040 (doi: 10.1111/obr.13040) — en
 * systematisk översikt av >300 studier — rapporterar över 19
 * överutfodringsgrupper en snittuppgång på 4,12 kg varav 2,51 kg fett
 * (61 %). Med deras egna energivärden (fett 9300, fettfri massa
 * 1020 kcal/kg) blir energitätheten 6064 kcal/kg.
 *
 * Andelen fettfri massa faller med längden på överutfodringen, vilket ger
 * lägre energitäthet vid kortare/snabbare uppgång (samma riktning som
 * förlustsidan): 9 dagar 45 % FFM (~5570 kcal/kg), 21 dagar 50 %
 * (~5160 kcal/kg), 42 dagar 39 % (~6070), 100 dagar 33 % (~6570).
 * Referenser i Bray-översikten: Ravussin, Welle, Forbes 1986, Diaz,
 * Bouchard.
 *
 * Uppgångssidan rampar därför 6600 → 5600 i stället för 7700 → 6800.
 *
 * OBS om Forbes 1986 (doi: 10.1079/BJN19860068): den ofta citerade siffran
 * 8,05 kcal/g är ÖVERSKOTTSENERGI per gram uppgång, inte lagrad energi —
 * den inkluderar termogenes och ökad förbrukning. Att använda den här vore
 * dubbelräkning, eftersom TDEE-termen redan står för förbrukningen.
 *
 * Interpolationen är linjär åt båda håll för att undvika tröskeleffekter.
 */
export function getEffectiveKcalPerKg(weeklyChangePct: number): number {
  if (weeklyChangePct < 0) {
    // Loss side: linear from 7700 at -0.25%/week to 6500 at -1.5%/week
    const t = Math.max(0, Math.min(1, (weeklyChangePct + 1.5) / 1.25))
    return Math.round(6500 + t * 1200)
  }
  if (weeklyChangePct > 0) {
    // Uppgångssidan: 6600 vid långsam uppgång → 5600 vid snabb, rampat
    // mellan +0,25 och +1,0 %/vecka.
    //
    // Nivån kommer från Bray & Bouchard 2020 (se docblocket): 19
    // överutfodringsgrupper ger 6064 kcal/kg i snitt, och andelen fettfri
    // massa — som har låg energitäthet — är HÖGRE vid kortare/snabbare
    // uppgång. Spannet 6600–5600 lägger snittet i mitten.
    //
    // Uppgång är alltså inte symmetrisk med nedgång: en kilo upp innehåller
    // mer fettfri massa och vatten än en kilo ned, och kostar därför färre
    // kalorier per kilo.
    //
    // Under +0,25 %/vecka rampas från 7700 (stabil vikt, blandad vävnad) ned
    // till 6600. Utan den övergången skulle funktionen hoppa 1100 kcal/kg vid
    // nollpunkten — samma sorts tröskel som tidigare fanns vid +0,5 %/vecka.
    if (weeklyChangePct < 0.25) {
      const t = weeklyChangePct / 0.25
      return Math.round(7700 - t * 1100)
    }
    const t = Math.max(0, Math.min(1, (weeklyChangePct - 0.25) / 0.75))
    return Math.round(6600 - t * 1000)
  }
  return KCAL_PER_KG
}
