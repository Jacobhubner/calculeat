/**
 * Tävlingsförberedelse — hur lång tid tar det, och till vilken takt?
 *
 * VARFÖR EN RÄKNARE OCH INTE ETT VECKOTAL: litteraturen anger ingen optimal
 * prep-längd. Den styr på TAKT (% kroppsvikt/vecka) och STARTFETTNIVÅ. Ett
 * fast riktvärde skulle ge samma svar till den som är 12 % och den som är
 * 22 % — vilket är fel för båda. Räknaren härleder tiden ur användarens
 * faktiska startpunkt, vilket är det litteraturen faktiskt stöder.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * KÄLLOR (granskade i fulltext 2026-08-18)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * [1] Helms ER, Aragon AA, Fitschen PJ. "Evidence-based recommendations for
 *     natural bodybuilding contest preparation: nutrition and supplementation."
 *     J Int Soc Sports Nutr 2014;11:20. PMC4033492.
 *     ARTIKELTYP: narrativ översikt (anges i metodavsnittet).
 *     - Takt: 0,5–1 % kroppsvikt/vecka "to maximize muscle retention".
 *       Författarnas rekommendation, grundad på Garthe 2011.
 *     - Startfett styr längden, ORDAGRANT: "those leaner dieting for shorter
 *       periods than those with higher body fat percentages". Författarnas
 *       rekommendation.
 *     - Räkneexempel: "a 70 kg athlete at 13% body fat would need to be no
 *       more than 6 kg to 7 kg over their contest weight". Författarnas egen
 *       beräkning.
 *     - "Competitive bodybuilders traditionally follow two to four month
 *       diets" — BESKRIVNING AV PRAXIS, inte en rekommendation. Skillnaden
 *       spelar roll: siffran säger vad folk gör, inte vad som fungerar.
 *
 * [2] Roberts BM, Helms ER, Trexler ET, Fitschen PJ. "Nutritional
 *     Recommendations for Physique Athletes."
 *     J Hum Kinet 2020;71:79-108. PMC7052702.
 *     ARTIKELTYP: narrativ översikt.
 *     - Takt: "slower rates of weight loss (≤0.5% of body mass per week) are
 *       generally preferable for attenuating unfavorable adaptations".
 *       STRÄNGARE än [1] — därför är 0,5 %/v förval här.
 *     - Chappell 2018 (tvärsnittsstudie): tävlande med höga placeringar låg
 *       på 0,46 %/vecka; de som inte placerade sig tappade över 0,5 %/vecka.
 *       Fall med 0,7 % och 1,0 % visade större muskelförluster.
 *     - Observerade prep-längder: "These studies have ranged from 14-32 weeks
 *       from the beginning of preparation to the first competition" — bygger
 *       på SJU FALLSTUDIER (Halliday 2016, Kistler 2014, Pardue 2017,
 *       Robinson 2015, Rohrig 2017, Rossow 2013, Tinsley 2019).
 *       OBSERVERAT SPANN, inte en testad rekommendation.
 *     - Post-contest: 1–2 månader till hållbar vikt, därefter 1–2 månader
 *       till off-season-fettnivå. Hormonell återhämtning 3–4 månader
 *       (ghrelin, T3/T4, insulin, kortisol); leptin och testosteron kan
 *       behöva 5–6 månader (fallstudier: Pardue 2017, Rossow 2013).
 *
 * [3] Garthe I et al. Int J Sport Nutr Exerc Metab 2011;21(2):97-104.
 *     doi: 10.1123/ijsnem.21.2.97. RCT, n=24 elitidrottare.
 *     0,7 %/vecka gav ÖKAD fettfri massa; 1,4 %/vecka gjorde inte det.
 *     ⚠️ Deltagarna var INTE tävlingsmagra. Det förklarar varför [2] är
 *     strängare: nära tävlingsform ökar risken för muskelförlust, så en takt
 *     som fungerade i Garthe kan vara för aggressiv i slutet av en prep.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * VAD SOM INTE ÄR BELAGT
 * ═══════════════════════════════════════════════════════════════════════
 * Ingen RCT har jämfört olika prep-LÄNGDER mot varandra. Allt om längd och
 * post-contest kommer från fallstudier och tvärsnittsdata — det beskriver
 * vad tävlande HAR GJORT, inte vad som är optimalt. Båda översikterna är
 * narrativa, inte systematiska.
 *
 * Konsekvens för UI: presentera resultatet som "så lång tid tar det med den
 * takt du valt", ALDRIG som "så länge bör du förbereda dig".
 */

/**
 * Rekommenderade veckotakter i % kroppsvikt/vecka.
 *
 * Förvalet 0,5 följer [2], som är nyare och specifikt riktad till
 * physique-atleter. [1] tillåter upp till 1,0 %, men [2] visar att de som
 * placerade sig låg på 0,46 % — och att 0,7–1,0 % gav större muskelförluster
 * hos tävlingsmagra.
 */
export const PREP_RATE_PERCENT = {
  /** Konservativ. Nära Chappell 2018:s 0,46 % hos placerade tävlande [2]. */
  min: 0.25,
  /** Förval — övre gränsen i [2]:s rekommendation (≤0,5 %/vecka). */
  recommended: 0.5,
  /** Övre gränsen i [1]. [2] avråder för tävlingsmagra. */
  max: 1.0,
} as const

/**
 * Observerat spann för prep-längd, från sju fallstudier [2].
 * Används ENBART för att sätta resultatet i sammanhang — aldrig som mål.
 */
export const OBSERVED_PREP_WEEKS = { min: 14, max: 32 } as const

/**
 * Under så här många kg fett att tappa räknas insatsen som en FINJUSTERING,
 * inte en tävlingsförberedelse.
 *
 * VARFÖR GRÄNSEN GÅR PÅ FETT OCH INTE VECKOR: varningarna nedan handlar om
 * risker som byggs upp över tid i ett underskott — muskelförlust och metabol
 * anpassning. De riskerna beror på hur mycket som ska tappas, inte på hur
 * många veckor kalkylatorn råkar landa på. Vid 1 kg finns ingen sådan risk
 * även om takten är hög, och jämförelsen med fallstudier som startade på
 * 15–20 % kroppsfett blir meningslös.
 *
 * 3 kg är ett pragmatiskt val, inte ett studieresultat. Det motsvarar
 * ungefär 3–4 procentenheter kroppsfett för en person på 80–90 kg — under
 * det är avståndet i samma storleksordning som mätosäkerheten i kaliper och
 * bioimpedans.
 */
export const MINOR_ADJUSTMENT_FAT_KG = 3

/**
 * Post-contest-faser i veckor [2]. Fallstudiedata, inte kontrollerade försök.
 */
export const POST_CONTEST_WEEKS = {
  /** Nå en hållbar vikt: 1–2 månader. */
  weightRestoration: { min: 4, max: 8 },
  /** Därefter tillbaka till off-season-fettnivå: 1–2 månader. */
  fatRestoration: { min: 4, max: 8 },
  /** Ghrelin, T3/T4, insulin, kortisol närmar sig utgångsläget: 3–4 mån. */
  hormonalPartial: { min: 12, max: 16 },
  /** Leptin och testosteron kan behöva 5–6 månader. */
  hormonalFull: { min: 20, max: 26 },
} as const

export interface PrepEstimateInput {
  /** Nuvarande kroppsvikt i kg */
  currentWeightKg: number
  /** Nuvarande kroppsfettprocent */
  currentBodyFatPct: number
  /** Mål-kroppsfettprocent (tävlingsform) */
  targetBodyFatPct: number
  /** Veckotakt i % kroppsvikt. Utelämnas → PREP_RATE_PERCENT.recommended */
  weeklyRatePercent?: number
}

export interface PrepEstimate {
  /**
   * Antal veckor vid valda takten, med en decimal.
   *
   * INTE avrundat uppåt. Vid korta insatser blev heltalsavrundning direkt
   * missvisande: 1,3 veckor visades som "2 veckor", och med den takten hamnar
   * man då UNDER målet. En decimal säger sanningen i båda ändarna av skalan.
   */
  weeks: number
  /** Fettmassa som behöver tappas, kg */
  fatToLoseKg: number
  /** Beräknad tävlingsvikt om all viktnedgång är fett */
  projectedWeightKg: number
  /** Tapp första veckan i kg vid valda takten */
  weeklyLossKg: number
  /** Takten som användes (efter klampning) */
  ratePercentUsed: number
  /**
   * true om resultatet ligger utanför det observerade spannet 14–32 v [2].
   * Inte ett fel — men värt att visa, eftersom det betyder att planen
   * skiljer sig från vad dokumenterade prep:ar faktiskt gjort.
   *
   * Sätts ALDRIG för finjusteringar (se isMinorAdjustment): en jämförelse
   * med fallstudier som startade på 15–20 % kroppsfett säger ingenting om
   * den som ska tappa ett kilo.
   */
  outsideObservedRange: boolean
  /**
   * true när det är mindre än MINOR_ADJUSTMENT_FAT_KG kg fett att tappa.
   *
   * Då gäller inte varningarna om takt och observerat spann — de handlar om
   * risker som byggs upp över tid i ett underskott. Vid små avstånd är
   * dessutom mätosäkerheten i kroppsfettmätningen i samma storleksordning
   * som avståndet självt, vilket är värt att säga till användaren.
   */
  isMinorAdjustment: boolean
}

/**
 * Hur lång tid tar en prep från nuvarande till mål-kroppsfettprocent?
 *
 * ANTAGANDE som är värt att vara tydlig om: uträkningen förutsätter att all
 * viktnedgång är fett och att den fettfria massan bevaras. Det är själva
 * POÄNGEN med en långsam takt [1][2], men det är ett bästa-fall-antagande —
 * i praktiken förloras vanligen något fettfri massa, vilket gör att den
 * verkliga tiden blir något kortare och slutfettprocenten något högre.
 *
 * Returnerar null när indata inte går att räkna på, i stället för att gissa.
 */
export function estimatePrepDuration(input: PrepEstimateInput): PrepEstimate | null {
  const { currentWeightKg, currentBodyFatPct, targetBodyFatPct } = input

  if (!Number.isFinite(currentWeightKg) || currentWeightKg <= 0) return null
  if (!Number.isFinite(currentBodyFatPct) || !Number.isFinite(targetBodyFatPct)) return null
  if (currentBodyFatPct <= 0 || currentBodyFatPct >= 100) return null
  if (targetBodyFatPct < 0 || targetBodyFatPct >= 100) return null
  // Redan i eller under målform — ingen prep att räkna på.
  if (targetBodyFatPct >= currentBodyFatPct) return null

  const ratePercentUsed = clampRate(input.weeklyRatePercent ?? PREP_RATE_PERCENT.recommended)

  // Fettfri massa antas bevarad, så tävlingsvikten följer ur den:
  //   leanKg = vikt × (1 − fett%)
  //   målvikt = leanKg / (1 − målfett%)
  const leanKg = currentWeightKg * (1 - currentBodyFatPct / 100)
  const projectedWeightKg = leanKg / (1 - targetBodyFatPct / 100)
  const fatToLoseKg = currentWeightKg - projectedWeightKg

  if (fatToLoseKg <= 0) return null

  // Takten är % av kroppsvikten, och vikten sjunker under prepen. Ett fast
  // veckotapp räknat på startvikten skulle därför underskatta tiden. Löses
  // analytiskt: målvikt = startvikt × (1 − r)^v  ⇒  v = ln(kvot) / ln(1 − r).
  const r = ratePercentUsed / 100
  const weeksExact = Math.log(projectedWeightKg / currentWeightKg) / Math.log(1 - r)
  // En decimal, ingen avrundning uppåt — se doc på weeks ovan.
  const weeks = round1(weeksExact)

  if (!Number.isFinite(weeks) || weeks <= 0) return null

  const isMinorAdjustment = fatToLoseKg < MINOR_ADJUSTMENT_FAT_KG

  return {
    weeks,
    fatToLoseKg: round1(fatToLoseKg),
    projectedWeightKg: round1(projectedWeightKg),
    weeklyLossKg: round1(currentWeightKg * r),
    ratePercentUsed,
    // Jämförelsen med fallstudiernas 14–32 veckor gäller bara riktiga
    // förberedelser, inte finjusteringar.
    outsideObservedRange:
      !isMinorAdjustment && (weeks < OBSERVED_PREP_WEEKS.min || weeks > OBSERVED_PREP_WEEKS.max),
    isMinorAdjustment,
  }
}

/**
 * Omvänd fråga: vilken takt krävs för att nå målet på ett givet antal veckor?
 *
 * Behövs för den som har ett tävlingsdatum och vill veta om planen är rimlig.
 * Returnerar takten i % kroppsvikt/vecka, eller null om indata inte håller.
 * Klampas INTE — poängen är att kunna visa att en takt är för aggressiv.
 */
export function requiredRateForWeeks(
  input: Omit<PrepEstimateInput, 'weeklyRatePercent'>,
  weeks: number
): number | null {
  const { currentWeightKg, currentBodyFatPct, targetBodyFatPct } = input

  if (!Number.isFinite(weeks) || weeks <= 0) return null
  if (!Number.isFinite(currentWeightKg) || currentWeightKg <= 0) return null
  if (currentBodyFatPct <= 0 || currentBodyFatPct >= 100) return null
  if (targetBodyFatPct < 0 || targetBodyFatPct >= 100) return null
  if (targetBodyFatPct >= currentBodyFatPct) return null

  const leanKg = currentWeightKg * (1 - currentBodyFatPct / 100)
  const targetWeightKg = leanKg / (1 - targetBodyFatPct / 100)

  // targetWeight = currentWeight × (1 − r)^weeks  ⇒  r = 1 − kvot^(1/weeks)
  const ratio = targetWeightKg / currentWeightKg
  const rate = (1 - Math.pow(ratio, 1 / weeks)) * 100

  return Number.isFinite(rate) && rate > 0 ? round2(rate) : null
}

/**
 * Är takten inom vad litteraturen stöder?
 *
 * 'recommended' = ≤0,5 %/v, vilket [2] förordar för physique-atleter.
 * 'acceptable'  = upp till 1,0 %/v, övre gränsen i [1]. [2] avråder för
 *                 tävlingsmagra, så detta är inte ett fritt val.
 * 'aggressive'  = över 1,0 %/v. Ingen källa stöder det; Garthe [3] visade
 *                 att 1,4 %/v inte ökade fettfri massa.
 */
export function classifyPrepRate(ratePercent: number): 'recommended' | 'acceptable' | 'aggressive' {
  if (ratePercent <= PREP_RATE_PERCENT.recommended) return 'recommended'
  if (ratePercent <= PREP_RATE_PERCENT.max) return 'acceptable'
  return 'aggressive'
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return PREP_RATE_PERCENT.recommended
  // Nedre gräns 0,05 %/v: lägre takter ger absurda tidsspann utan att vara
  // meningsfulla. Övre gräns 5 %/v så formeln inte får (1 − r) ≤ 0.
  return Math.min(Math.max(rate, 0.05), 5)
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
