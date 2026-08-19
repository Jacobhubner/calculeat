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

import { weeklyRateForCalories } from './weeklyRate'
// Re-export nedan gör namnen tillgängliga för anropare, men inte i den här
// filens egen scope — därför även en vanlig import.
import { DEFICIT_LEVELS, type DeficitLevelId } from '@/lib/utils/deficitLevels'

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
/**
 * Andel av viktnedgången som i praktiken är fettfri massa, för den övre
 * gränsen i tidsspannet.
 *
 * 0,15 är ett PRAGMATISKT VAL, inte ett studieresultat. Fallstudierna spretar
 * kraftigt och rapporterar sällan siffran på ett jämförbart sätt. Poängen är
 * inte att träffa rätt värde utan att visa att modellen är ett golv — och att
 * spannet pekar åt rätt håll. Vid en långsam takt hamnar man närmare 0,
 * vid en aggressiv närmare eller över 0,15.
 */
export const REALISTIC_LEAN_LOSS_FRACTION = 0.15

/**
 * Underskottsnivåerna bor i @/lib/utils/deficitLevels — de styr numera
 * profilens och periodens kalorimål, inte bara den här tidsräknaren, och en
 * tidsräknare är fel hemvist för något så centralt.
 *
 * Re-exporteras här för de anropare som redan importerar från contestPrep.
 */
export { DEFICIT_LEVELS, type DeficitLevelId } from '@/lib/utils/deficitLevels'

/**
 * Veckotakt i % kroppsvikt för en underskottsnivå.
 *
 * Returnerar ett SPANN, eftersom varje nivå är ett spann. Räknaren behöver
 * ett tal och använder mittvärdet — men UI:t visar hela spannet, så
 * användaren ser att det är en uppskattning och inte ett exakt löfte.
 */
export function ratePercentForDeficitLevel(params: {
  level: DeficitLevelId
  tdee: number
  weightKg: number
}): {
  percentMin: number
  percentMax: number
  percentMid: number
  kgMin: number
  kgMax: number
} | null {
  const { level, tdee, weightKg } = params
  if (!Number.isFinite(tdee) || tdee <= 0) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null

  const def = DEFICIT_LEVELS.find(d => d.id === level)
  if (!def) return null

  const rate = weeklyRateForCalories({
    tdee,
    caloriesMin: tdee * def.factorMin,
    caloriesMax: tdee * def.factorMax,
    weightKg,
  })

  /**
   * ORÖRDA TAL UT — avrundningen hör till presentationen.
   *
   * VARFÖR (fynd 2026-08-19): kg-värdena rundades tidigare med round2, alltså
   * Math.round(x*100)/100, medan Målsättning och Energimål formaterar med
   * toFixed(2). De två skiljer sig vid exakta halvor: 0,435 blir 0,44 med
   * round2 men 0,43 med toFixed, eftersom 0,435 lagras binärt som
   * 0,43499999999999999778 och alltså ligger strax under halvvägspunkten.
   *
   * Det gav synligt olika tal för samma användare: perioder visade
   * 0,29–0,44 där Målsättning visade 0,29–0,43 (TDEE 3190). Bara de nivåer
   * som råkar landa exakt på en halva drabbades, vilket gjorde felet
   * oregelbundet och svårt att se som ett mönster.
   *
   * Procenttalen behåller round2: de används för beräkning (percentMid går
   * in i estimatePrepDuration), inte för att jämföras mot en annan ytas
   * formatering.
   */
  return {
    percentMin: round2(rate.percentMin),
    percentMax: round2(rate.percentMax),
    percentMid: round2((rate.percentMin + rate.percentMax) / 2),
    kgMin: rate.kgMin,
    kgMax: rate.kgMax,
  }
}

/**
 * Nedre gräns för mål-kroppsfett, per kön.
 *
 * Under dessa nivåer är kroppsfettet essentiellt — det sitter i organ,
 * benmärg och centrala nervsystemet, inte som lagrad energi. Att sätta ett
 * mål där är inte "ambitiöst", det är fysiologiskt omöjligt.
 *
 * VARFÖR DET SPELAR ROLL HÄR: räknaren accepterade tidigare vilket målvärde
 * som helst och gav ett prydligt svar på 0 % kroppsfett. Placeholdern var
 * dessutom hårdkodad till 6, vilket för en kvinna ligger under essentiell
 * nivå — appen föreslog alltså något omöjligt till halva användarbasen.
 *
 * Siffrorna är vedertagna riktvärden inom kroppssammansättning (ACSM m.fl.),
 * inte hämtade ur de två prep-översikterna. Marginalen ovanför det rent
 * essentiella är medveten: tävlingsform ligger nära, men inte på, gränsen.
 */
export const MIN_TARGET_BODY_FAT = {
  male: 5,
  female: 12,
  /** Utan känt kön används den försiktigare gränsen. */
  unknown: 12,
} as const

/**
 * Föreslaget målvärde i inmatningsfältet, per kön. Motsvarar ungefärlig
 * tävlingsform — inte ett rekommenderat mål för den som bara vill gå ner.
 */
export const SUGGESTED_TARGET_BODY_FAT = {
  male: 7,
  female: 14,
  unknown: 12,
} as const

/**
 * Under så här stor andel av kroppsvikten räknas insatsen som en
 * FINJUSTERING i stället för en riktig nedgångsperiod.
 *
 * RELATIV, inte absolut. Tidigare låg gränsen på fasta 3 kg, vilket slog
 * olika: för en person på 50 kg motsvarade det 6 procentenheter kroppsfett
 * — en verklig period avfärdades då som finjustering och ALLA taktvarningar
 * tystades, just där de behövdes mest. För någon på 120 kg motsvarade samma
 * 3 kg bara 2,5 procentenheter.
 *
 * 3,5 % av kroppsvikten motsvarar ungefär de 3 kg som gällde för en person
 * på 85 kg, alltså samma nivå i mitten av spannet men rättvist i kanterna.
 */
export const MINOR_ADJUSTMENT_WEIGHT_FRACTION = 0.035

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
  /**
   * Kön, för att kunna avvisa mål under essentiell fettnivå. Utelämnas →
   * den försiktigare (kvinnliga) gränsen används, så ett okänt kön aldrig
   * släpper igenom ett omöjligt mål.
   */
  gender?: 'male' | 'female'
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
  /**
   * Övre gräns i tidsspannet: tiden om en del av viktnedgången är fettfri
   * massa (REALISTIC_LEAN_LOSS_FRACTION). weeks är golvet, detta är det
   * realistiska utfallet — se docblocket på estimatePrepDuration.
   */
  weeksRealistic: number
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
  /**
   * Målnivån ligger under essentiellt kroppsfett för det angivna könet.
   * Beräkningen görs ändå — men UI:t måste visa detta som en varning, inte
   * som ett uppnåeligt mål.
   */
  belowEssentialFat: boolean
  /** Gränsen som gällde, för att kunna visa den i varningen. */
  essentialFatLimit: number
}

/**
 * Hur lång tid tar en prep från nuvarande till mål-kroppsfettprocent?
 *
 * ANTAGANDE: uträkningen förutsätter att all viktnedgång är fett och att den
 * fettfria massan bevaras. Det är själva POÄNGEN med en långsam takt [1][2],
 * men det är ett bästa fall.
 *
 * ⚠️ RÄTTAT 2026-08-18: här stod tidigare att FFM-förlust gör "den verkliga
 * tiden något KORTARE". Det är fel åt fel håll. Förloras fettfri massa måste
 * MER total vikt tappas för att nå samma fettprocent — alltså tar det LÄNGRE
 * tid. Modellen är därför en GOLVSKATTNING, inte en punktskattning.
 *
 * Algebran: med FFM-andel f av viktnedgången L gäller
 *   L = (t·w − fett₀) / (t − 1 + f)   där t = målfett/100
 * Vid f = 0 faller den tillbaka på grundfallet exakt.
 *
 * Konsekvens: weeks är undre gränsen, weeksRealistic den övre. Skillnaden är
 * storleksordningen 12–30 % — tillräckligt för att någon som planerar 27
 * veckor i själva verket behöver 31, och tvingas höja takten i slutet där
 * risken för muskelförlust är störst [2].
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

  // Kontrollen görs på det EXAKTA värdet, inte det avrundade. Tidigare
  // rundades 0,04 veckor till 0 och funktionen returnerade null — användaren
  // fick då läsa att målet måste vara lägre än nuvarande nivå, trots att det
  // var det. Ett litet men giltigt avstånd ska ge ett litet svar.
  if (!Number.isFinite(weeksExact) || weeksExact <= 0) return null

  // Realistiskt utfall: en del av viktnedgången är fettfri massa, vilket
  // kräver MER total nedgång och därmed längre tid. Se docblocket ovan.
  const t = targetBodyFatPct / 100
  const f = REALISTIC_LEAN_LOSS_FRACTION
  const currentFatKg = currentWeightKg * (currentBodyFatPct / 100)
  const realisticLossKg = (t * currentWeightKg - currentFatKg) / (t - 1 + f)
  const realisticEndWeight = currentWeightKg - realisticLossKg
  const weeksRealisticExact =
    realisticEndWeight > 0
      ? Math.log(realisticEndWeight / currentWeightKg) / Math.log(1 - r)
      : weeksExact

  const isMinorAdjustment = fatToLoseKg < currentWeightKg * MINOR_ADJUSTMENT_WEIGHT_FRACTION

  const limit = input.gender === 'male' ? MIN_TARGET_BODY_FAT.male : MIN_TARGET_BODY_FAT.female

  return {
    weeks: round1(weeksExact),
    weeksRealistic: round1(Math.max(weeksRealisticExact, weeksExact)),
    fatToLoseKg: round1(fatToLoseKg),
    projectedWeightKg: round1(projectedWeightKg),
    weeklyLossKg: round1(currentWeightKg * r),
    ratePercentUsed,
    // Jämförelsen med fallstudiernas 14–32 veckor gäller bara riktiga
    // nedgångsperioder, inte finjusteringar.
    outsideObservedRange:
      !isMinorAdjustment &&
      (weeksExact < OBSERVED_PREP_WEEKS.min || weeksExact > OBSERVED_PREP_WEEKS.max),
    isMinorAdjustment,
    belowEssentialFat: targetBodyFatPct < limit,
    essentialFatLimit: limit,
  }
}

/**
 * Samma tidsberäkning, men med MÅLVIKT i stället för målfettprocent.
 *
 * VARFÖR: kroppsfettprocent behövs inte för att räkna ut tiden — den
 * behövs bara för att översätta ett fettprocentmål till en målvikt. Den som
 * redan vet vilken vikt hen siktar på har besvarat den frågan själv.
 *
 * Hälsospårets användare har sällan mätt kroppsfett, och för dem är vikten
 * dessutom det mål de faktiskt tänker i. Att kräva en kaliper för att få
 * veta hur lång tid åtta kilo tar vore ett hinder utan syfte.
 *
 * VAD SOM INTE GÅR ATT SÄGA UTAN KROPPSFETT:
 *  - weeksRealistic (spannets övre gräns) bygger på nuvarande fettmassa i
 *    kg för att uppskatta hur mycket fettfri massa som följer med.
 *  - belowEssentialFat kräver en fettprocent att jämföra mot.
 * Därför returneras ett ENDA tal här, inte ett spann. Det är ärligare än
 * att räkna fram ett spann ur ett antagande om kroppssammansättning som
 * användaren inte lämnat.
 */
export function estimateDurationToWeight(input: {
  currentWeightKg: number
  targetWeightKg: number
  /** % av kroppsvikt per vecka. Klampas mot litteraturens gränser. */
  weeklyRatePercent?: number
  /**
   * Uppmätt kroppsfettprocent, om den finns. Behövs INTE för tiden — bara
   * för att kunna räkna fram spannets övre gräns, som antar att en del av
   * nedgången är fettfri massa. Utan den blir weeksRealistic === weeks.
   */
  currentBodyFatPct?: number
}): {
  weeks: number
  /** Övre gräns när en del av nedgången är fettfri massa. === weeks utan kroppsfett. */
  weeksRealistic: number
  weightToLoseKg: number
  weeklyLossKg: number
  ratePercentUsed: number
  outsideObservedRange: boolean
  isMinorAdjustment: boolean
} | null {
  const { currentWeightKg, targetWeightKg } = input

  if (!Number.isFinite(currentWeightKg) || currentWeightKg <= 0) return null
  if (!Number.isFinite(targetWeightKg) || targetWeightKg <= 0) return null
  // Målet måste ligga under nuvarande vikt — annars är det ingen nedgång.
  if (targetWeightKg >= currentWeightKg) return null

  const ratePercentUsed = clampRate(input.weeklyRatePercent ?? PREP_RATE_PERCENT.recommended)
  const r = ratePercentUsed / 100

  // Samma exponentialmodell som estimatePrepDuration: takten är en andel av
  // kroppsvikten, och vikten sjunker under resans gång.
  const weeksExact = Math.log(targetWeightKg / currentWeightKg) / Math.log(1 - r)
  if (!Number.isFinite(weeksExact) || weeksExact <= 0) return null

  const weightToLoseKg = currentWeightKg - targetWeightKg
  const isMinorAdjustment = weightToLoseKg < currentWeightKg * MINOR_ADJUSTMENT_WEIGHT_FRACTION

  /**
   * Spannets övre gräns, när kroppsfettet råkar vara uppmätt.
   *
   * Förloras fettfri massa måste MER totalvikt bort för att nå samma
   * fettnivå — men här är målet en VIKT, inte en fettnivå, så vikten nås
   * lika snabbt. Det som tar längre tid är att nå samma KROPPS-
   * SAMMANSÄTTNING vid den vikten. Övre gränsen svarar därför på frågan:
   * hur lång tid tar det att tappa lika mycket FETT som målvikten
   * motsvarar, om 15 % av nedgången är fettfri massa?
   */
  const bf = input.currentBodyFatPct
  let weeksRealisticExact = weeksExact
  if (bf != null && Number.isFinite(bf) && bf > 0 && bf < 100) {
    const fatShare = 1 - REALISTIC_LEAN_LOSS_FRACTION
    // Samma fettmängd bort, men bara fatShare av varje tappat kilo är fett.
    const totalLossNeeded = weightToLoseKg / fatShare
    const adjustedEnd = currentWeightKg - totalLossNeeded
    if (adjustedEnd > 0) {
      weeksRealisticExact = Math.log(adjustedEnd / currentWeightKg) / Math.log(1 - r)
    }
  }

  return {
    weeks: round1(weeksExact),
    weeksRealistic: round1(Math.max(weeksRealisticExact, weeksExact)),
    weightToLoseKg: round1(weightToLoseKg),
    weeklyLossKg: round1(currentWeightKg * r),
    ratePercentUsed,
    outsideObservedRange:
      !isMinorAdjustment &&
      (weeksExact < OBSERVED_PREP_WEEKS.min || weeksExact > OBSERVED_PREP_WEEKS.max),
    isMinorAdjustment,
  }
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
