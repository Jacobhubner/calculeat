/**
 * Fasberäkningar — förslag på kalorimål, proteinmål och kostläge per fas.
 *
 * Detta är den vägledning som saknas i MyFitnessPal/Lifesum/Yazio: där får
 * användaren själv räkna ut rätt nivå vid ett fasbyte. Funktionerna nedan
 * ger ett FÖRSLAG som användaren kan justera — inte ett låst värde.
 *
 * FOKUSSPÅR: samma fyra fastyper presenteras med olika namn och olika
 * makrokoppling beroende på användarens fokus. 'strength' talar gymspråk och
 * pekar mot atletlägena; 'health' talar allmänspråk och pekar mot NNR/
 * viktminskning. Skälet är att "cut" och "bulk" är obegripliga för den som
 * bara vill gå ner 8 kg, medan "viktminskning" känns underdimensionerat för
 * den som tävlingsförbereder.
 */

import type { DietPhaseType, DietPhase, PhaseFocus } from '@/lib/types'
import { applyMacroMode, type MacroModeId } from '@/lib/utils/macroModes'
import { multipliersForDeficitLevel, type DeficitLevelId } from '@/lib/utils/deficitLevels'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'
import { KCAL_PER_KG } from '@/lib/calculations/calibration-constants'

/** Underskott/överskott per fas, som andel av TDEE. */
const PHASE_CALORIE_FACTOR: Record<DietPhaseType, number> = {
  // Måttligt underskott: snabbare tapp ökar risken för muskelförlust.
  cut: 0.8,
  // Lean bulk: större överskott ger mestadels fett.
  bulk: 1.1,
  maintenance: 1.0,
  // Reverse startar nära cut-nivån och trappas upp mot maintenance.
  reverse: 0.85,
}

/**
 * Proteinintervall i g/kg per fas. Högre under cut (muskelbevarande i
 * underskott) och under reverse (kroppen är fortfarande i återhämtning).
 */
const PHASE_PROTEIN_G_PER_KG: Record<DietPhaseType, { min: number; recommended: number }> = {
  cut: { min: 1.8, recommended: 2.2 },
  bulk: { min: 1.6, recommended: 1.8 },
  maintenance: { min: 1.4, recommended: 1.6 },
  reverse: { min: 1.8, recommended: 2.0 },
}

/**
 * Standardlängd i veckor per fas.
 *
 * HUVUDFYND (evidensgranskning 2026-08-15): INGEN granskad källa anger en
 * optimal faslängd i veckor. Litteraturen styr på HASTIGHET (% kroppsvikt
 * per vecka) och KROPPSFETTNIVÅ, inte på tid. Varje veckosiffra nedan är
 * därför en HÄRLEDNING, inte ett studieresultat.
 *
 * cut = 12 veckor (intervall 8–16). Bäst underbyggda fasen.
 * - Garthe I et al., Int J Sport Nutr Exerc Metab 2011;21(2):97-104
 *   (doi: 10.1123/ijsnem.21.2.97) — RCT, n=24. 0,7 %/vecka gav ÖKAD fettfri
 *   massa; 1,4 %/vecka gjorde inte det. Faktiska interventionslängder:
 *   8,5 ± 2,2 v (långsam) och 5,3 ± 0,9 v (snabb). Detta är det närmaste ett
 *   empiriskt veckospann som existerar — men det är interventionernas längd,
 *   inte en testad rekommendation.
 * - Helms ER et al., J Int Soc Sports Nutr 2014;11:20 (PMC4033492)
 *   — RÄTTAD 2026-08-18 efter fulltextläsning. Den tidigare formuleringen
 *   här ("dieter längre än 2–4 månader may be superior") slog samman två
 *   skilda påståenden i artikeln:
 *     a) "Competitive bodybuilders traditionally follow two to four month
 *        diets" — en BESKRIVNING AV PRAXIS, inte en rekommendation.
 *     b) att GRADVIS viktnedgång (0,5–1 %/v) kan vara överlägsen för att
 *        bevara fettfri massa — en rekommendation om TAKT, inte om längd.
 *   Artikeln rekommenderar alltså ingen faslängd. Den säger tvärtom att
 *   längden ska följa startfettnivån: "those leaner dieting for shorter
 *   periods than those with higher body fat percentages".
 *   Se src/lib/calculations/contestPrep.ts för full källgenomgång.
 * - Roberts BM et al., J Hum Kinet 2020;71:79-108 (PMC7052702) — nyare
 *   översikt. Dokumenterade prep-längder: 14–32 veckor, ur sju fallstudier.
 *   OBSERVERAT SPANN, inte en rekommendation. Rekommenderar ≤0,5 %/vecka,
 *   strängare än Helms.
 * - Diet breaks: EJ etablerat för denna målgrupp. MATADOR (Byrne 2018,
 *   doi: 10.1038/ijo.2017.206) fann stor fördel hos OBESA män, men ICECAP
 *   (Peos 2021, doi: 10.1249/MSS.0000000000002636, n=61 TRÄNADE) fann INGEN
 *   skillnad i fettmassa, fettfri massa eller viloenergiförbrukning.
 *
 * bulk = 12 veckor. SÄNKT FRÅN 16 (2026-08-20).
 * - Garthe I et al., Eur J Sport Sci 2013;13(3):295-303
 *   (doi: 10.1080/17461391.2011.643923, PMID 23679146) — randomiserad,
 *   n=39 elitidrottare, och interventionen var en 8–12 VECKORS
 *   viktuppgångsperiod. Detta är den enda empiriska bulklängd som
 *   existerar. Resultatet stärker dessutom takt-argumentet: gruppen med
 *   kostrådgivning gick upp 3,9 % mot 1,5 %, men fettmassan ökade 15 % mot
 *   3 % UTAN skillnad i fettfri massa. Mer överskott gav mer fett, inte mer
 *   muskler.
 * - Iraki J et al., Sports 2019;7(7):154 (doi: 10.3390/sports7070154,
 *   PMID 31247944) ger 0,25–0,5 %/vecka och 10–20 % över underhåll, men
 *   INGEN längdrekommendation. Vid den takten innebär 16 veckor upp till
 *   8 % viktuppgång innan användaren utvärderar något — för mycket att
 *   förvälja åt någon som just skapat konto.
 * - Helms ER et al., Sports Med Open 2023 (doi: 10.1186/s40798-023-00651-y)
 *   — RCT, n=17, 8 v: 5 % vs 15 % överskott gav LIKARTAD muskeltillväxt,
 *   medan större överskott starkt förutsade fettökning (R²=0,49). Studien är
 *   dock kort och underpowered.
 * - Den verkliga avslutssignalen är KROPPSFETTNIVÅ, inte tid: högre
 *   utgångsfettmassa ger sämre partitionering (Hall 2007,
 *   doi: 10.1017/S0007114507691946).
 *
 * reverse = 4 veckor. UPPDATERAD BEDÖMNING 2026-08-18: fyra veckor är i
 * underkant, men behålls tills vidare. Skälen:
 * - Chica-Latorre 2022 sa "The length of the recommended post-contest
 *   recovery phase is currently unclear." Det stämmer inte längre helt.
 * - Roberts BM et al. 2020 (PMC7052702) anger ett förlopp: 1–2 månader till
 *   en hållbar vikt, därefter 1–2 månader tillbaka till off-season-fettnivå.
 *   Alltså 8–16 veckor totalt, inte 4. Hormonell återhämtning tar längre:
 *   3–4 månader för ghrelin, T3/T4, insulin och kortisol; leptin och
 *   testosteron kan behöva 5–6 månader.
 * - MEN: det bygger på fallstudier (Pardue 2017, Rossow 2013), inte
 *   kontrollerade försök, och beskriver ÅTERHÄMTNING i stort — inte hur
 *   länge en strukturerad kaloriupptrappning bör pågå. Vår reverse-fas är
 *   det senare, ett snävare begrepp.
 * - Att höja till 8–16 veckor skulle innebära att appen rekommenderar en
 *   fyra gånger längre fas på fallstudiedata. Fasen är dessutom valfri och
 *   justerbar, så användaren kan förlänga den själv.
 * Konsekvens för UI: nämn Roberts-förloppet som sammanhang när användaren
 * planerar en reverse efter tävling. Se POST_CONTEST_WEEKS i contestPrep.ts.
 *
 * maintenance = 4 veckor. VAR NULL, alltså ett TOMT FÄLT (ändrat 2026-08-20).
 * - Peos JJ et al., Sports 2019;7(1):22 (doi: 10.3390/sports7010022,
 *   PMID 30654501) skriver ordagrant att omvändningen av kroppens
 *   kompensatoriska svar på ett underskott "may require at least 7–14 days
 *   in EB" [energibalans], och rekommenderar praktiskt att varva två veckors
 *   underskott med två veckor i balans.
 *   ⚠️ Siffran gäller ÖVERVIKTIGA VUXNA — författarna anger det själva. Att
 *   överföra den till tränade är osäkert: ICECAP (Peos 2021) visade att just
 *   den populationsskillnaden spelar roll för diet breaks.
 * - 4 veckor är dubbla det golvet och en naturlig månad. STEGET FRÅN
 *   "minst 7–14 dagar" TILL 4 VECKOR ÄR EN HÄRLEDNING, inte Peos
 *   rekommendation.
 * - Varför inte null: ett tomt fält tvingar en oerfaren användare att gissa,
 *   och utan planned_weeks får hen dessutom varken framstegsmätare eller
 *   "vecka 3 av 4" — premiumfunktioner som tyst uteblev just för underhåll.
 *   Aragon 2017 (doi: 10.1186/s12970-017-0174-y) ger fortfarande ingen
 *   längdrekommendation för någon fas.
 *
 * ⚠️ Påståendet "8–16 veckor för bulk" cirkulerar i sekundärkällor men kunde
 * INTE spåras till någon primärkälla. Använd det inte som stöd.
 *
 * Konsekvens för UI: presentera dessa som RIKTVÄRDEN att justera, aldrig som
 * evidensbaserade rekommendationer (se i18n-nyckeln phase.weeksNotice).
 */
const PHASE_DEFAULT_WEEKS: Record<DietPhaseType, number | null> = {
  cut: 12,
  bulk: 12,
  maintenance: 4,
  reverse: 4,
}

/**
 * Vilket kostläge som hör till varje fas, per fokusspår.
 *
 * Kopplingen gör att fasen (VAD gör jag, hur länge) och kostläget (HUR
 * fördelas maten) hänger ihop i stället för att konkurrera. Fasen sätter
 * aldrig makroprocenten själv — den pekar ut vilket läge som passar, och
 * användaren applicerar det.
 *
 * Styrkespåret pekar mot atletlägena eftersom de räknar protein mot
 * fettfri massa (onseason) respektive kroppsvikt med explicit fettmål
 * (offseason). Hälsospåret pekar mot NNR och viktminskning, som är
 * byggda för allmänheten.
 *
 * Reverse ärver utgångsfasens läge: en upptrappning är återgången FRÅN ett
 * underskott, och att byta makrofördelning samtidigt som kalorierna höjs
 * ändrar två variabler på en gång.
 */
const PHASE_MACRO_MODE: Record<PhaseFocus, Record<DietPhaseType, MacroModeId>> = {
  strength: {
    cut: 'onseason', // Deff-läge
    bulk: 'offseason', // Bulk-läge
    maintenance: 'active', // Aktiv-läge
    reverse: 'onseason', // behåller Deff-läget under upptrappningen
  },
  health: {
    cut: 'weightloss', // Viktminskningsläge
    bulk: 'nnr', // NNR-läge — se NNR_CALORIE_OVERRIDE nedan
    maintenance: 'nnr', // NNR-läge
    reverse: 'weightloss', // behåller Viktminskningsläget
  },
}

/**
 * NNR-läget är ett UNDERHÅLLSLÄGE: dess multiplikatorer är 0,97–1,03 (±3 %)
 * och dess calorieGoal är 'Maintain weight'. Det är rätt makrofördelning för
 * hälsospårets viktuppgång (balanserat, 10–20 E% protein) men fel
 * kaloririktning — utan override skulle "Viktuppgång" föreslå underhåll.
 *
 * Vi separerar därför de två: NNR bestämmer makrofördelningen, fasen
 * bestämmer kaloririktningen. Överskottet matchar Bulk-lägets 10–20 %, så
 * båda spåren ger samma energinivå för samma fas — bara olika makron.
 */
const NNR_CALORIE_OVERRIDE: Partial<Record<DietPhaseType, { min: number; max: number }>> = {
  bulk: { min: 1.1, max: 1.2 },
}

/**
 * Upptrappning efter avslutad viktnedgång ("reverse diet").
 *
 * EVIDENSSTYRKA: SVAG. Takten nedan är branschpraxis + extrapolering,
 * INTE en siffra som någon studie har testat och validerat.
 *
 * Vad evidensen faktiskt visar (verifierad mot fulltext 2026-08-15):
 * - Reverse dieting är INTE överlägset enklare alternativ. Enda RCT:n
 *   (n=49 styrketränade, 15 v) fann STÖRST viktökning i reverse-armen:
 *   REV 3,68±2,75 % vs direkt underhåll 2,73±3,14 % vs ad libitum
 *   1,30±2,3 % (p=0,053, ej signifikant). Författarnas slutsats: gradvis
 *   kaloriökning "may not be more effective at minimizing weight regain
 *   than less structured approaches".
 *   Rodriguez Da Silva V et al., J Int Soc Sports Nutr 2025;22(Suppl 2)
 *   (doi: 10.1080/15502783.2025.2550185)
 *   ⚠️ PUBLIKATIONSTYP OSÄKER: ligger i ett supplement, vilket ofta rymmer
 *   konferensmaterial snarare än fullständiga peer-reviewade artiklar.
 *   Två oberoende granskningar kom till olika slutsats. Behandla resultatet
 *   som preliminärt tills publikationstypen är fastställd.
 * - Avhopp var högst i reverse-armen: 45,2 % vs 30,4 % vs 23,8 %.
 * - Metabol adaptation är liten och varierar kraftigt mellan individer:
 *   −91,5 ± 110,4 kcal/dag efter 14,1 kg viktnedgång — SD större än
 *   medelvärdet, dvs. effekten är inte tillförlitligt närvarande hos en
 *   enskild individ. Martins C et al., Nutr Metab 2021;18:60
 *   (doi: 10.1186/s12986-021-00587-8)
 * - Inga evidensbaserade rekommendationer för upptrappningstakt existerar:
 *   "there is a gap regarding evidence-based recommendations to increase
 *   energy intake post-contest" — Chica-Latorre S et al.,
 *   J Int Soc Sports Nutr 2022 (doi: 10.1080/15502783.2022.2108333)
 *
 * EXTRAPOLERING (ej studerat): +100 kcal/vecka som standard, intervall
 * 50–150. FAST STEG valt framför procent: procent ger minst ökning till
 * den som sänkt intaget mest, vilket är motsatsen till önskvärt. Ingen
 * studie har jämfört olika takter — valet är pragmatiskt.
 *
 * Konsekvens för UI: upptrappning ska presenteras som "hjälp för den som
 * vill ha struktur", ALDRIG som "så här undviker du att gå upp i vikt".
 * Det senare stöds inte av datan.
 */
const REVERSE_WEEKLY_STEP_KCAL = 100
const REVERSE_WEEKLY_STEP_MIN = 50
const REVERSE_WEEKLY_STEP_MAX = 150

/** Kostlägets id för en fas i ett givet fokusspår. */
export function macroModeForPhase(phaseType: DietPhaseType, focus: PhaseFocus): MacroModeId {
  return PHASE_MACRO_MODE[focus][phaseType]
}

/**
 * Fastyper som kräver kroppsfettprocent för att kostläget ska gå att
 * applicera. onseason (Deff-läge) räknar protein mot fettfri massa och
 * returnerar null utan body_fat_percentage — då måste användaren mäta
 * först, annars blir fasen ett tomt löfte.
 */
export function phaseNeedsBodyFat(phaseType: DietPhaseType, focus: PhaseFocus): boolean {
  return macroModeForPhase(phaseType, focus) === 'onseason'
}

export interface PhaseSuggestion {
  /** Kalorimålets nedre gräns */
  targetCaloriesMin: number
  /** Kalorimålets övre gräns */
  targetCaloriesMax: number
  /** Mittpunkten — det som lagras som fasens target_calories */
  targetCalories: number
  /**
   * Proteinmålets nedre gräns. Enheten beror på `proteinBasis`: g/kg för
   * bodyweight och ffm, ENERGIPROCENT för energyPercent (NNR).
   */
  proteinMinGPerKg: number
  /** Proteinmålets övre gräns — samma enhet som ovan */
  proteinMaxGPerKg: number
  /**
   * Vad talet uttrycker: g/kg kroppsvikt, g/kg fettfri massa (Deff-läget),
   * eller energiprocent (NNR anger protein som 10–20 E%, inte g/kg).
   */
  proteinBasis: 'bodyweight' | 'ffm' | 'energyPercent'
  /** Proteinintervallet i gram — vad UI:t visar */
  proteinGramsMin: number
  proteinGramsMax: number
  plannedWeeks: number | null
  /** Reverse diet: kalorihöjning per vecka, annars null */
  weeklyCalorieStep: number | null
  /** Kostläget som hör till fasen i valt fokusspår */
  macroMode: MacroModeId
  /**
   * Kalorimålets avvikelse från TDEE i procent, som UI-etikett:
   * '±3 %', '+10–20 %', '−20–25 %'. Härleds från kostlägets multiplikatorer
   * så att den aldrig kan glida isär från de faktiska talen.
   *
   * null för reverse: målet höjs varje vecka och rör sig från underskott mot
   * underhåll, så en fast procentsats vore vilseledande.
   */
  calorieDeviationLabel: string | null
  /**
   * true när kostläget inte kunde beräknas för att kroppsfett saknas
   * (Deff-läget räknar protein mot fettfri massa). Kalorierna är då
   * fortfarande giltiga; proteinvärdena är fallback.
   */
  needsBodyFat: boolean
}

/**
 * Föreslår mål för en ny fas.
 *
 * KÄLLAN ÄR KOSTLÄGET, inte egna konstanter. Fasen pekar ut ett kostläge
 * (t.ex. Deff-läge för cut i styrkespåret), och kalori- och proteinmålen
 * härleds ur SAMMA funktioner som kostlägeskortet i profilen använder.
 * Annars visar fasdialogen ett tal och kostläget ett annat — vilket var
 * fallet innan: fasen sa 2 220 kcal / 2,2 g/kg medan Deff-läget ger
 * TDEE×0,75–0,80 och 2,3–3,1 g/kg FFM.
 *
 * Både kalorier och protein returneras som SPANN, konsekvent med hur resten
 * av appen hanterar mål (`calories_min`/`calories_max`). Mittpunkten lagras
 * som fasens `target_calories`.
 *
 * @param bodyFatPercentage Krävs för Deff-läget (protein mot fettfri massa).
 *        Saknas den sätts needsBodyFat och proteinvärdena blir en fallback.
 * @param currentCalories Nuvarande kalorimål; används av reverse för att
 *        trappa upp FRÅN där användaren faktiskt ligger, inte från en
 *        schablon. Utan detta blir upptrappningen ett hopp.
 * @param deficitLevel Underskottsdjup, ENDAST för cut. Utelämnad ger exakt
 *        samma tal som före att nivåvalet fanns.
 */
export function suggestPhaseTargets(
  phaseType: DietPhaseType,
  tdee: number,
  weightKg: number,
  focus: PhaseFocus = 'strength',
  currentCalories?: number,
  bodyFatPercentage?: number,
  deficitLevel?: DeficitLevelId
): PhaseSuggestion {
  const plannedWeeks = PHASE_DEFAULT_WEEKS[phaseType]
  const macroMode = macroModeForPhase(phaseType, focus)
  const fatFreeMass = bodyFatPercentage ? calculateLeanMass(weightKg, bodyFatPercentage) : undefined

  // Kostlägets kalorimultiplikatorer ger spannet. applyMacroMode kastar för
  // onseason utan FFM — då faller vi tillbaka på fasens egen faktor så att
  // dialogen fortfarande kan visa ett kalorimål.
  let mode: ReturnType<typeof applyMacroMode> | null = null
  try {
    mode = applyMacroMode(macroMode, {
      weight: weightKg,
      fatFreeMass,
      caloriesMin: tdee,
      caloriesMax: tdee,
    })
  } catch {
    mode = null
  }
  const needsBodyFat = mode === null

  if (phaseType === 'reverse') {
    // Upptrappning börjar per definition i ett UNDERSKOTT. Ligger nuvarande
    // mål på eller över TDEE (t.ex. mitt i en bulk) är det ingen meningsfull
    // startpunkt — då används fasens egen faktor i stället. Utan denna spärr
    // föreslog dialogen ett startvärde ÖVER TDEE, alltså en "upptrappning"
    // som redan låg förbi målet.
    const fallbackStart = Math.round(tdee * PHASE_CALORIE_FACTOR.reverse)
    const start = currentCalories && currentCalories < tdee ? currentCalories : fallbackStart
    const weeks = plannedWeeks ?? 4
    const gap = Math.max(0, tdee - start)

    // Jämn upptrappning mot TDEE, klampad till det intervall som är
    // praktiskt rimligt. Fast kcal-steg, inte procent — se docblocket ovan.
    const evenStep = weeks > 0 ? gap / weeks : REVERSE_WEEKLY_STEP_KCAL
    const step =
      Math.round(
        Math.min(Math.max(evenStep, REVERSE_WEEKLY_STEP_MIN), REVERSE_WEEKLY_STEP_MAX) / 10
      ) * 10

    return {
      ...calorieSpan(start * 0.97, start * 1.03),
      ...resolveProtein(macroMode, weightKg, fatFreeMass, phaseType, start),
      plannedWeeks: weeks,
      weeklyCalorieStep: step,
      macroMode,
      needsBodyFat,
      // Reverse har INGEN meningsfull procentsats: målet höjs varje vecka och
      // rör sig från underskott mot underhåll. En siffra skulle bara vara sann
      // vecka 1 och vilseledande därefter.
      calorieDeviationLabel: null,
    }
  }

  // Underskottsnivån vinner för cut. Den är användarens uttryckliga val av
  // DJUP, medan kostläget styr FÖRDELNINGEN — två oberoende axlar. Utan
  // nivå gäller kostlägets multiplikatorer precis som förr.
  //
  // Gäller bara cut: 'normal' motsvarar 0,75–0,80, alltså exakt vad Deff-
  // och NNR-lägets cut redan gav. Ingen befintlig användare får nya tal.
  const levelMultipliers =
    phaseType === 'cut' && deficitLevel ? multipliersForDeficitLevel(deficitLevel) : null

  // Kostlägets multiplikatorer om de finns, annars fasens egen faktor.
  // NNR är ett underhållsläge och måste överridas för viktuppgång — annars
  // föreslår "Viktuppgång" ±3 %, alltså inget överskott alls.
  const override = macroMode === 'nnr' ? NNR_CALORIE_OVERRIDE[phaseType] : undefined
  const minMult =
    levelMultipliers?.min ??
    override?.min ??
    mode?.calorieMinMultiplier ??
    PHASE_CALORIE_FACTOR[phaseType] * 0.97
  const maxMult =
    levelMultipliers?.max ??
    override?.max ??
    mode?.calorieMaxMultiplier ??
    PHASE_CALORIE_FACTOR[phaseType] * 1.03

  return {
    ...calorieSpan(tdee * minMult, tdee * maxMult),
    ...resolveProtein(
      macroMode,
      weightKg,
      fatFreeMass,
      phaseType,
      (tdee * minMult + tdee * maxMult) / 2
    ),
    plannedWeeks,
    weeklyCalorieStep: null,
    macroMode,
    needsBodyFat,
    calorieDeviationLabel: calorieDeviationLabel(minMult, maxMult),
  }
}

/**
 * Proteinintervall hämtat från kostläget så att fas och kostläge visar
 * samma siffror. Deff-läget (onseason) räknar mot fettfri massa; övriga mot
 * kroppsvikt. Utan FFM faller onseason tillbaka på fasens kroppsviktsvärden.
 */
function resolveProtein(
  macroMode: MacroModeId,
  weightKg: number,
  fatFreeMass: number | undefined,
  phaseType: DietPhaseType,
  /** Kalorispannets mitt — behövs för lägen som anger protein i energiprocent */
  centerCalories: number
): Pick<
  PhaseSuggestion,
  'proteinMinGPerKg' | 'proteinMaxGPerKg' | 'proteinBasis' | 'proteinGramsMin' | 'proteinGramsMax'
> {
  const spec = MODE_PROTEIN[macroMode]

  if (spec.basis === 'energyPercent') {
    // NNR: 10–20 E% av kalorierna, 4 kcal per gram protein
    return {
      proteinMinGPerKg: spec.min,
      proteinMaxGPerKg: spec.max,
      proteinBasis: 'energyPercent',
      proteinGramsMin: Math.round((centerCalories * (spec.min / 100)) / 4),
      proteinGramsMax: Math.round((centerCalories * (spec.max / 100)) / 4),
    }
  }

  if (spec.basis === 'ffm') {
    if (!fatFreeMass) {
      // Fallback: fasens kroppsviktsbaserade intervall tills kroppsfett mätts
      const fb = PHASE_PROTEIN_G_PER_KG[phaseType]
      return {
        proteinMinGPerKg: fb.min,
        proteinMaxGPerKg: fb.recommended,
        proteinBasis: 'bodyweight',
        proteinGramsMin: Math.round(fb.min * weightKg),
        proteinGramsMax: Math.round(fb.recommended * weightKg),
      }
    }
    return {
      proteinMinGPerKg: spec.min,
      proteinMaxGPerKg: spec.max,
      proteinBasis: 'ffm',
      proteinGramsMin: Math.round(spec.min * fatFreeMass),
      proteinGramsMax: Math.round(spec.max * fatFreeMass),
    }
  }

  return {
    proteinMinGPerKg: spec.min,
    proteinMaxGPerKg: spec.max,
    proteinBasis: 'bodyweight',
    proteinGramsMin: Math.round(spec.min * weightKg),
    proteinGramsMax: Math.round(spec.max * weightKg),
  }
}

/**
 * Proteinintervall per kostläge — speglar exakt vad funktionerna i
 * `macroModes.ts` räknar med, så att fasdialogen och kostlägeskortet aldrig
 * visar olika siffror. Ändras ett intervall där måste det ändras här.
 *
 * NNR anger protein i ENERGIPROCENT (10–20 E%), inte g/kg — det är så
 * `nnrMode()` räknar och så kostlägeskortet visar det. Att översätta till
 * g/kg vore en påhittad omräkning som skulle avvika från profilen.
 */
const MODE_PROTEIN: Record<
  MacroModeId,
  { min: number; max: number; basis: 'bodyweight' | 'ffm' | 'energyPercent' }
> = {
  nnr: { min: 10, max: 20, basis: 'energyPercent' },
  weightloss: { min: 1.2, max: 1.6, basis: 'bodyweight' },
  active: { min: 1.6, max: 2.0, basis: 'bodyweight' },
  offseason: { min: 1.6, max: 2.2, basis: 'bodyweight' },
  onseason: { min: 2.3, max: 3.1, basis: 'ffm' },
}

/**
 * Kalorimålets avvikelse från TDEE som läsbar etikett.
 *
 * Härleds ur multiplikatorerna i stället för att hårdkodas per läge — då kan
 * etiketten aldrig säga något annat än vad kalorierna faktiskt räknas på.
 *   0,97–1,03 → '±3 %'   1,10–1,20 → '+10–20 %'   0,75–0,80 → '−20–25 %'
 *
 * Minustecknet är U+2212 (matematiskt minus), inte bindestreck, och
 * intervalltecknet är en tankstreck — samma typografi som resten av appen.
 */
function calorieDeviationLabel(minMult: number, maxMult: number): string {
  const loPct = Math.round((minMult - 1) * 100)
  const hiPct = Math.round((maxMult - 1) * 100)

  // Symmetriskt kring TDEE (t.ex. NNR/Aktiv: −3 % till +3 %)
  if (loPct === -hiPct) return `±${hiPct} %`

  // Underskott: visa som positivt tal efter minus, störst först är
  // förvirrande — 0,75/0,80 ger −25/−20, alltså "−20–25 %"
  if (hiPct <= 0) return `−${Math.abs(hiPct)}–${Math.abs(loPct)} %`

  // Överskott
  return `+${loPct}–${hiPct} %`
}

/** Avrundar ett kalorispann till hela tiotal och härleder mittpunkten. */
function calorieSpan(
  min: number,
  max: number
): {
  targetCalories: number
  targetCaloriesMin: number
  targetCaloriesMax: number
} {
  // INGEN avrundning till tiotal. Energimål-tabellen och kostlägeskortet
  // visar exakta tal (t.ex. 2078–2216 kcal vid TDEE 2770), och ett fasmål
  // som säger 2080–2220 ser ut att vara ett annat mål än kostlägets.
  // Mittpunkten räknas på de oavrundade gränserna.
  return {
    targetCalories: Math.round((min + max) / 2),
    targetCaloriesMin: Math.round(min),
    targetCaloriesMax: Math.round(max),
  }
}

/**
 * Kalorimål för en pågående reverse diet, givet hur många veckor som gått.
 * Returnerar startnivån för icke-reverse-faser (de har statiskt mål).
 */
export function currentPhaseCalories(phase: DietPhase, tdee?: number): number | null {
  if (phase.target_calories == null) return null
  if (phase.phase_type !== 'reverse' || !phase.weekly_calorie_step) {
    return phase.target_calories
  }

  const weeksElapsed = weeksSince(phase.started_at)
  const raised = phase.target_calories + weeksElapsed * phase.weekly_calorie_step

  // Reverse diet trappar upp MOT TDEE — aldrig förbi det.
  const ceiling = tdee ?? Number.POSITIVE_INFINITY
  return Math.min(raised, ceiling)
}

/** Hela antalet veckor sedan ett ISO-datum (aldrig negativt). */
export function weeksSince(isoDate: string): number {
  const start = new Date(isoDate + 'T00:00:00')
  const diffMs = Date.now() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)))
}

/** Andel av planerad längd som passerat, 0–1. null om fasen saknar planerad längd. */
export function phaseProgress(phase: DietPhase): number | null {
  if (!phase.planned_weeks) return null
  return Math.min(1, weeksSince(phase.started_at) / phase.planned_weeks)
}

export interface PhaseTracking {
  /** Faktisk viktförändring sedan periodstart, kg (negativ = nedgång) */
  actualChangeKg: number
  /** Förväntad förändring vid nuvarande tidpunkt, kg */
  expectedChangeKg: number
  /** Faktisk takt, kg/vecka */
  actualPerWeek: number
  /** Förväntad takt, kg/vecka */
  expectedPerWeek: number
  /** Dagar sedan periodstart */
  daysElapsed: number
  /**
   * Hur det går. 'on_track' inom ±40 % av förväntad takt, annars 'ahead'
   * (går fortare än planerat) eller 'behind'. 'too_early' innan det finns
   * underlag att uttala sig om.
   */
  status: 'on_track' | 'ahead' | 'behind' | 'too_early'
  /**
   * true när nivån ändrades för mindre än tio dagar sedan. Då är statusen
   * 'too_early' av ett annat skäl än vanligt, och UI:t säger det — annars
   * ser en period som pågått i tolv veckor plötsligt ut att sakna underlag
   * utan förklaring.
   */
  levelChangedRecently?: boolean
  /**
   * true när nivån ändrats någon gång under perioden, även för länge sedan.
   * Statusen är då giltig igen, men jämförelsen väger två olika takter —
   * det ska framgå i stället för att döljas.
   */
  levelChangedDuringPhase?: boolean
}

/**
 * Hur går perioden? Jämför uppmätt viktförändring med den takt periodens
 * kaloriunderskott/överskott implicerar.
 *
 * VARFÖR: periodkortet visade bara MÅLET (kalorier, vecka, protein) men aldrig
 * UTFALLET. En period utan uppföljning är bara ett kalorital — det är
 * återkopplingen som gör den till en plan.
 *
 * Kräver minst 10 dagar och två vägningar. Under det domineras vikten av
 * vätske- och glykogensvängningar (0,5–2 kg), och en tidig avläsning skulle
 * säga "du ligger efter" åt någon som gör allting rätt.
 */
export function phaseTracking(
  phase: DietPhase,
  weights: Array<{ weight_kg: number; recorded_at: string }>,
  tdee?: number
): PhaseTracking | null {
  const startMs = new Date(phase.started_at + 'T00:00:00').getTime()
  const inPhase = weights
    .filter(w => new Date(w.recorded_at).getTime() >= startMs)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

  if (inPhase.length < 2) return null

  const first = inPhase[0]
  const last = inPhase[inPhase.length - 1]
  const daysElapsed = Math.round(
    (new Date(last.recorded_at).getTime() - new Date(first.recorded_at).getTime()) / 86400000
  )

  // Startvikten från perioden är mer tillförlitlig än första vägningen efter
  // start, om den finns — den sattes vid periodstart.
  const startWeight = phase.start_weight_kg ?? first.weight_kg
  const actualChangeKg = last.weight_kg - startWeight
  const actualPerWeek = daysElapsed > 0 ? (actualChangeKg / daysElapsed) * 7 : 0

  // Förväntad takt ur periodens energibalans
  const calories = currentPhaseCalories(phase, tdee)
  const expectedPerWeek = calories != null && tdee ? ((calories - tdee) * 7) / KCAL_PER_KG : 0
  const expectedChangeKg = (expectedPerWeek / 7) * daysElapsed

  /**
   * Dagar sedan underskottsdjupet ändrades, eller null om det aldrig ändrats.
   *
   * VARFÖR SAMMA TIODAGARSREGEL SOM VID PERIODSTART: efter ett nivåbyte
   * gäller den nya takten bara framåt, men expectedChangeKg räknas som
   * nuvarande takt gånger HELA den gångna tiden. Direkt efter bytet är
   * jämförelsen därför som mest missvisande — och det är dessutom precis då
   * vätske- och glykogensvängningar dominerar viktkurvan, samma skäl som
   * motiverar väntetiden vid periodstart.
   *
   * MÄTT: ett byte till försiktigt flyttar kvoten till 1,80 för någon som
   * följt sitt mål exakt, alltså förbi 1,4-gränsen för "ligger före". Utan
   * den här spärren får en följsam användare ett felaktigt besked som ser ut
   * att handla om hens beteende.
   */
  const daysSinceLevelChange = phase.deficit_level_changed_at
    ? Math.round(
        (new Date(last.recorded_at).getTime() -
          new Date(phase.deficit_level_changed_at + 'T00:00:00').getTime()) /
          86400000
      )
    : null

  const levelChangedRecently = daysSinceLevelChange != null && daysSinceLevelChange < 10
  const levelChangedDuringPhase = daysSinceLevelChange != null

  if (daysElapsed < 10 || levelChangedRecently) {
    return {
      actualChangeKg,
      expectedChangeKg,
      actualPerWeek,
      expectedPerWeek,
      daysElapsed,
      status: 'too_early',
      levelChangedRecently,
      levelChangedDuringPhase,
    }
  }

  // Underhållsperiod: ingen riktning att jämföra mot, håll det enkelt och
  // bedöm mot stabilitet i stället.
  if (Math.abs(expectedPerWeek) < 0.05) {
    const stable = Math.abs(actualPerWeek) < 0.25
    return {
      actualChangeKg,
      expectedChangeKg,
      actualPerWeek,
      expectedPerWeek,
      daysElapsed,
      status: stable ? 'on_track' : actualPerWeek > 0 ? 'ahead' : 'behind',
      levelChangedDuringPhase,
    }
  }

  // ±40 % tolerans: smalare än så och normalt vätskebrus skulle få en
  // följsam användare att se ut att misslyckas.
  const ratio = actualPerWeek / expectedPerWeek
  const status: PhaseTracking['status'] =
    ratio > 1.4 ? 'ahead' : ratio < 0.6 ? 'behind' : 'on_track'

  return {
    actualChangeKg,
    expectedChangeKg,
    actualPerWeek,
    expectedPerWeek,
    daysElapsed,
    status,
    levelChangedDuringPhase,
  }
}

/**
 * Vilken fas som är ett rimligt nästa steg. Det här är vägledningen som
 * saknas i konkurrenternas appar vid ett fasbyte.
 *
 * cut → reverse (trappa upp kontrollerat istället för att hoppa till
 * maintenance), reverse → maintenance, bulk → cut, maintenance → valfritt.
 */
/**
 * Vilket calorie_goal en periodtyp motsvarar.
 *
 * Speglar databastriggern sync_calorie_goal_from_phase exakt — ändras
 * mappningen där måste den ändras här. Används för att upptäcka när ett mål
 * som sätts någon annanstans (Målsättning, profilsidan) krockar med den
 * pågående perioden.
 */
export function calorieGoalForPhase(phaseType: DietPhaseType): string {
  switch (phaseType) {
    case 'cut':
      return 'Weight loss'
    case 'bulk':
      return 'Weight gain'
    case 'maintenance':
    case 'reverse':
      // Upptrappning går MOT underhåll — kalorimålet styrs av periodens
      // target_calories, inte av ett procentuellt underskott.
      return 'Maintain weight'
  }
}

/**
 * Periodtypen som motsvarar profilens riktning (`calorie_goal`).
 *
 * Appen frågar redan om riktning när användaren fyller i grunduppgifterna
 * — innan TDEE finns och en period alls är möjlig. Utan den här kopplingen
 * ställs samma fråga två gånger med olika ord: "Vad är ditt mål?" i profilen
 * och "Vad vill du göra nu?" i perioddialogen. Genom att förvälja perioden
 * blir steg två en BEKRÄFTELSE i stället för en upprepad fråga.
 *
 * Omvänd riktning mot calorieGoalForPhase. 'reverse' härleds aldrig här —
 * upptrappning väljs inte spontant, den föreslås efter en avslutad nedgång.
 */
export function phaseTypeForCalorieGoal(
  calorieGoal: string | null | undefined
): DietPhaseType | undefined {
  switch (calorieGoal) {
    case 'Weight loss':
      return 'cut'
    case 'Weight gain':
      return 'bulk'
    case 'Maintain weight':
      return 'maintenance'
    default:
      // 'Custom TDEE' eller inget mål satt — låt dialogen använda sitt eget
      // standardval i stället för att gissa.
      return undefined
  }
}

/**
 * true när ett nytt calorie_goal motsäger den aktiva perioden.
 *
 * Triggern går bara ÅT ETT HÅLL (diet_phases → profiles), så en skrivning
 * till profiles kan annars lämna perioden orörd: dashboarden visar
 * "Bygga muskler, vecka 3" medan profilen räknar viktnedgång. Det påverkar
 * inte bara etiketten — MetabolicCalibration och revert_calibration_v2
 * läser calorie_goal för att räkna om kalorimål.
 *
 * 'Custom TDEE' räknas aldrig som en krock: det betyder "eget värde", inte
 * en riktning som kan motsäga något.
 */
export function goalConflictsWithPhase(
  newGoal: string | null | undefined,
  phase: Pick<DietPhase, 'phase_type' | 'ended_at'> | null | undefined
): boolean {
  if (!phase || phase.ended_at !== null) return false
  if (!newGoal || newGoal === 'Custom TDEE') return false
  return newGoal !== calorieGoalForPhase(phase.phase_type)
}

export function suggestedNextPhase(current: DietPhaseType): DietPhaseType | null {
  switch (current) {
    case 'cut':
      return 'reverse'
    case 'reverse':
      return 'maintenance'
    case 'bulk':
      return 'cut'
    case 'maintenance':
      return null
  }
}

/**
 * Hur många kilos viktförändring som får passera innan kalorimålet bör
 * räknas om.
 *
 * TDEE följer vikten: för en 88-kilos man med PAL 1,55 rör sig underhållet
 * ~15,5 kcal per kilo. Tre kilo ger alltså ~46 kcal, knappt 2 % av TDEE —
 * ungefär den punkt där avvikelsen börjar synas i viktkurvan snarare än
 * drunkna i dygnsvariationen.
 *
 * Lägre tröskel vore falskt larm, högre skulle låta felet växa till något
 * som märks som utebliven progress.
 */
export const PHASE_RECALC_WEIGHT_DELTA_KG = 3

export interface PhaseCalorieDrift {
  /** Viktförändring sedan periodstart, kg (tecken bevarat). */
  weightChangeKg: number
  /** Uppskattat underhåll vid startvikten. */
  tdeeAtStart: number
  /** Uppskattat underhåll vid nuvarande vikt. */
  tdeeNow: number
  /** Hur mycket underhållet flyttat sig, kcal (tecken bevarat). */
  driftKcal: number
  /** Har tröskeln passerats? */
  needsRecalc: boolean
  /** Målet som gällde vid start, för jämförelse i UI. */
  targetCalories: number
  /**
   * Målet omräknat mot nuvarande vikt — samma andel över eller under
   * underhåll som vid start.
   *
   * VARFÖR ANDELEN OCH INTE KCAL-DIFFERENSEN: fasen valdes som "10–20 % över
   * underhåll", inte som "+300 kcal". Behåller man kcal-beloppet krymper
   * överskottet i procent medan vikten stiger, och uppgången bromsar in av
   * skäl användaren inte kan se.
   */
  adjustedCalories: number
}

/**
 * Har kalorimålet hunnit bli inaktuellt?
 *
 * VARFÖR: target_calories sparas EN gång vid periodstart och följer aldrig
 * vikten. Under en längre period driver underhållet iväg åt det håll fasen
 * går, och målet blir successivt mindre av vad det utgav sig för att vara.
 *
 * MÄTT för 88,4 → 100 kg vid +10 %: håller användaren kvar vid startens
 * 3169 kcal tar uppgången 70 veckor i stället för 43, eftersom överskottet
 * krympt från 288 till drygt 100 kcal på vägen. Räknarens veckotal
 * förutsätter omräkning; utan den stämmer de inte.
 *
 * Returnerar null när underlaget saknas — utan TDEE och kalorimål finns
 * ingenting att jämföra.
 */
export function phaseCalorieDrift(params: {
  phase: DietPhase
  currentWeightKg: number
  /** Underhåll vid NUVARANDE vikt, som appen räknar det. */
  currentTdee: number
}): PhaseCalorieDrift | null {
  const { phase, currentWeightKg, currentTdee } = params

  const startWeight = phase.start_weight_kg
  const targetCalories = phase.target_calories
  if (startWeight == null || targetCalories == null) return null
  if (!Number.isFinite(currentWeightKg) || currentWeightKg <= 0) return null
  if (!Number.isFinite(currentTdee) || currentTdee <= 0) return null
  if (startWeight <= 0) return null

  const weightChangeKg = currentWeightKg - startWeight

  /**
   * Underhållet vid START skattas ur nuvarande TDEE och viktkvoten.
   *
   * Bara den viktberoende delen av BMR skalar — resten beror på längd,
   * ålder och kön. Kvoten currentWeightKg/startWeight överskattar därför
   * skillnaden något, men åt det försiktiga hållet: den gör att tröskeln
   * nås aningen tidigare, inte senare.
   */
  const tdeeNow = currentTdee
  const tdeeAtStart = currentTdee * (startWeight / currentWeightKg)
  const driftKcal = tdeeNow - tdeeAtStart

  /**
   * Samma ANDEL över/under underhåll som vid start, mot dagens underhåll.
   * tdeeAtStart kan inte vara noll här — currentTdee och startWeight är
   * båda kontrollerade som positiva ovan.
   */
  const factor = targetCalories / tdeeAtStart
  const adjustedCalories = Math.round(tdeeNow * factor)

  return {
    weightChangeKg: Math.round(weightChangeKg * 10) / 10,
    tdeeAtStart: Math.round(tdeeAtStart),
    tdeeNow: Math.round(tdeeNow),
    driftKcal: Math.round(driftKcal),
    needsRecalc: Math.abs(weightChangeKg) >= PHASE_RECALC_WEIGHT_DELTA_KG,
    targetCalories,
    adjustedCalories,
  }
}
