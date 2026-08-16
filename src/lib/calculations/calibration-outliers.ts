/**
 * Metabolic Calibration — Outlier Detection
 */

export interface OutlierResult {
  cleaned: Array<{ weight_kg: number; recorded_at: Date }>
  outliers: Array<{ weight_kg: number; recorded_at: Date }>
}

/**
 * Outlier-detektion på RESIDUALER mot vikttrenden, inte på råa vikter.
 *
 * VARFÖR (2026-08-16): tidigare tillämpades Tukeys 1,5×IQR direkt på
 * viktvärdena. Det fungerar bara om vikten är stabil. Vid en pågående
 * viktförändring — alltså exakt när kalibrering är aktuell — sprids vikterna
 * ut av själva trenden, IQR blir brett, och filtret slutar fånga något.
 *
 * Uppmätt: vid 0,05 kg/dag krävdes en avvikelse på +0,90 kg över startvikten
 * för att flaggas; vid 0,10 kg/dag krävdes +1,80 kg. Normal dagsvariation är
 * 0,5–2 kg, så filtret var i praktiken blint hos den som faktiskt gick ner i
 * vikt. Ju snabbare förändring, desto blindare — tvärtemot vad som behövs.
 *
 * Värre: felet slog hårdast där det kostar mest. OLS ger ändpunkterna störst
 * hävstång, så en enda brusig sista vägning drog hela trenden. I ett testfall
 * ändrades uppmätt viktförändring från −1,40 till −0,90 kg, vilket motsvarar
 * 137 kcal fel i TDEE.
 *
 * Lösningen är att mäta avvikelse mot den linjära trenden i stället för mot
 * viktnivån. En vägning som ligger 1 kg över trendlinjen är avvikande oavsett
 * om den totala nedgången är 0,5 eller 5 kg.
 *
 * Robust skalestimat: MAD (median absolute deviation) i stället för
 * standardavvikelse, eftersom SD i sig dras upp av de avvikare den ska hitta.
 * Faktorn 1,4826 gör MAD jämförbar med SD för normalfördelad data, och
 * tröskeln 3,5 är den vedertagna nivån för modifierad Z-score
 * (Iglewicz & Hoaglin).
 */
export function detectWeightOutliers(
  measurements: Array<{ weight_kg: number; recorded_at: Date }>
): OutlierResult {
  // Under 5 punkter finns inte underlag för både en trend och ett
  // spridningsmått — då är risken större att kasta bort riktig data.
  if (measurements.length < 5) {
    return { cleaned: measurements, outliers: [] }
  }

  const sorted = [...measurements].sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())
  const t0 = sorted[0].recorded_at.getTime()
  const xs = sorted.map(m => (m.recorded_at.getTime() - t0) / 86400000)
  const ys = sorted.map(m => m.weight_kg)

  const med = (arr: number[]): number => {
    const s = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
  }

  // Trenden beräknas med Theil-Sen (median av alla parvisa lutningar), INTE
  // med minstakvadrat.
  //
  // Skälet är maskering: minstakvadrat drar linjen mot avvikaren, som därmed
  // döljer sig själv. I testfallet gav en spike på 0,8 kg bara 0,61 kg
  // residual mot OLS-linjen — under tröskeln — medan Theil-Sen ger full
  // 0,8 kg eftersom medianlutningen är opåverkad av enstaka punkter.
  // Effekten är störst just vid ändpunkterna, där hävstången är som störst
  // och felet kostar mest.
  const slopes: number[] = []
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[j] !== xs[i]) {
        slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]))
      }
    }
  }

  // Alla mätningar samma dag: ingen trend att mäta mot, låt datan passera.
  if (slopes.length === 0) {
    return { cleaned: measurements, outliers: [] }
  }

  const slope = med(slopes)
  const intercept = med(ys.map((y, i) => y - slope * xs[i]))

  const residuals = ys.map((y, i) => y - (intercept + slope * xs[i]))

  const medianResidual = med(residuals)
  const mad = med(residuals.map(r => Math.abs(r - medianResidual)))

  // Golv för spridningsmåttet.
  //
  // Ligger många mätningar nära trendlinjen blir MAD mycket liten, och då
  // framstår varje normal dagsvariation som extrem. Kroppsvikt svänger
  // 0,5–2 kg per dygn av vätska, glykogen och tarminnehåll, så ett brus på
  // ±0,15 kg kring trenden är fullt normalt och ska aldrig flaggas.
  //
  // Utan golvet flaggades fyra punkter med 0,25–0,3 kg avvikelse som
  // avvikare, vilket hade kastat bort riktig data.
  const MIN_MAD_KG = 0.15
  const scale = Math.max(mad, MIN_MAD_KG)

  const cleaned: typeof measurements = []
  const outliers: typeof measurements = []

  sorted.forEach((m, i) => {
    const modifiedZ = (0.6745 * (residuals[i] - medianResidual)) / scale
    if (Math.abs(modifiedZ) > 3.5) {
      outliers.push(m)
    } else {
      cleaned.push(m)
    }
  })

  return { cleaned, outliers }
}
