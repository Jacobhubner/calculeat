/**
 * Metabolic Calibration — Clock
 *
 * En enda definition av "nu" för hela kalibreringen.
 *
 * VARFÖR: grinden (useCalibrationAvailability) läste `Date.now()` medan
 * modalen (MetabolicCalibration) läste `endOfDay(new Date())`. Fönstret
 * [nu − periodDays, nu] låg därmed upp till 16 timmar isär mellan de två —
 * kl 08:00 en morgon räckte det för att kortet skulle säga "redo" om data
 * som modalen sedan räknade som otillräcklig. Samma vägningar, samma
 * sekund, två svar.
 *
 * Dygnsslutet, inte tidpunkten: vägningar sparas vid lokal midnatt
 * (`recorded_at: new Date(datum + 'T00:00:00')` i WeightTracker), alltså
 * som DAGAR. Ett fönster med timupplösning låtsas om en precision datan
 * inte har, och gör utfallet beroende av när på dygnet användaren råkar
 * öppna appen.
 */

import { endOfDay } from 'date-fns'

/**
 * Mätperiodens slut för en kalibrering som körs nu.
 *
 * Använd den här överallt där ett kalibreringsfönster ska räknas — aldrig
 * `new Date()` eller `Date.now()` direkt.
 */
export function calibrationNow(from: Date = new Date()): Date {
  return endOfDay(from)
}
