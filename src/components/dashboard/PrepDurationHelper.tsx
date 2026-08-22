/**
 * Räknar ut hur lång en nedgångsperiod blir utifrån användarens startpunkt.
 *
 * FÖR ALLA SOM VILL GÅ NER, inte bara tävlande. Källorna kommer visserligen
 * från tävlingslitteratur, men det de handlar om — hur man bevarar muskler i
 * ett underskott — gäller lika mycket den som vill gå ner åtta kilo.
 *
 * VARFÖR EN RÄKNARE: litteraturen anger ingen optimal längd. Den styr på takt
 * och startfettnivå (Helms 2014, Roberts 2020). Ett fast riktvärde ger samma
 * svar till den som är 12 % och den som är 22 % — fel för båda.
 *
 * RESULTATET VISAS SOM SPANN. Modellen antar att all viktnedgång är fett,
 * vilket är ett bästa fall: förloras muskler måste mer vikt tappas för samma
 * fettprocent, alltså tar det längre tid. Ett enda tal hade sett exakt ut och
 * systematiskt underskattat.
 *
 * Källorna visas i gränssnittet, inte bara i koden.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { weeklyRateForCalories } from '@/lib/calculations/weeklyRate'
import { Calculator, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  estimatePrepDuration,
  estimateDurationToWeight,
  estimateDurationToGain,
  GAIN_RATE_PERCENT,
  classifyPrepRate,
  PREP_RATE_PERCENT,
  OBSERVED_PREP_WEEKS,
  SUGGESTED_TARGET_BODY_FAT,
  ratePercentForDeficitLevel,
  type DeficitLevelId,
} from '@/lib/calculations/contestPrep'
import { cn } from '@/lib/utils'
import type { PhaseFocus } from '@/lib/types'

interface Props {
  weightKg: number
  /** Behövs för att härleda veckotakten ur den valda underskottsnivån. */
  tdee: number
  /** Uppmätt kroppsfettprocent. Utan den går räknaren inte att använda. */
  bodyFatPercentage?: number
  /**
   * Kön från profilen. Styr nedre gräns för målfett och föreslaget värde —
   * 6 % är rimligt för män men under essentiell nivå för kvinnor.
   */
  gender?: 'male' | 'female'
  /**
   * Underskottsnivån ÄGS AV DIALOGEN, inte av räknaren. Den styr både
   * kalorimålet och veckotakten — hade räknaren haft ett eget val skulle
   * användaren kunna sätta ett djup i periodvalet och ett annat här, och de
   * två skulle säga emot varandra på samma skärm.
   */
  level: DeficitLevelId
  /**
   * Fokusspåret. Styr vilket MÅL räknaren frågar efter — inte om den
   * fungerar alls.
   *
   * Hälsospårets användare tänker i kilo ("jag vill ner till 87"),
   * styrkespårets i fettprocent ("jag vill till 8 %"). Att fråga efter fel
   * enhet tvingar användaren att räkna om i huvudet — och en tredjedel av
   * profilerna har mätt kroppsfett, så att bara gå på mätvärdet skulle
   * kasta in hälsoanvändare i procentläget godtyckligt.
   */
  focus: PhaseFocus
  /**
   * Anropas när användaren vill använda resultatet som faslängd.
   *
   * UTELÄMNAS FÖR GRATISANVÄNDARE: att räkna ut tiden är fritt, men att
   * spara den som faslängd är planering över tid (diet_phase_planning).
   * Knappen döljs då i stället för att visas trasig.
   */
  onUseWeeks?: (weeks: number) => void
  /**
   * Uppgång i stället för nedgång.
   *
   * Räknaren visades bara för cut, så "hur lång tid tar det" fanns inte
   * för den som vill gå upp — varken i hälsospåret (gå upp i vikt) eller i
   * styrkespåret (bygga muskler). Frågan är densamma, men takten är en
   * annan: Iraki 2019 ger 0,25–0,5 %/vecka för uppgång, och Garthe 2013
   * visar att snabbare mest ger fett.
   */
  direction?: 'loss' | 'gain'
  /**
   * Fasens kalorimål. Uppgångens takt härleds ur DEM, inte ur en fast
   * evidenssiffra — samma väg som nedgången och Målsättning tar, via
   * weeklyRateForCalories.
   *
   * Utan dem föll räknaren tillbaka på Iraki 2019:s nedre ände och visade
   * 0,20 kg/v där Målsättning visade 0,26–0,52 för samma mål.
   */
  caloriesMin?: number
  caloriesMax?: number
}

export function PrepDurationHelper({
  weightKg,
  tdee,
  bodyFatPercentage,
  gender,
  level,
  focus,
  onUseWeeks,
  direction = 'loss',
  caloriesMin,
  caloriesMax,
}: Props) {
  const { t } = useTranslation('dashboard')
  const [expanded, setExpanded] = useState(false)
  const [targetBf, setTargetBf] = useState('')

  /**
   * VILKEN ENHET MÅLET ANGES I — styrs av spåret, inte av vilka mätvärden
   * som råkar finnas.
   *
   * Hälsospåret frågar efter MÅLVIKT. Det är så användaren tänker ("jag
   * vill ner till 87"), och tidsmodellen behöver ändå bara vikt: en
   * kroppsfettprocent används enbart för att översätta ett procentmål till
   * en målvikt, vilket den som anger vikten direkt redan gjort.
   *
   * Styrkespåret frågar efter MÅLFETTPROCENT. Där är kroppsfett alltid
   * uppmätt — PhasePickerDialog ersätter hela vyn med en uppmaning att mäta
   * innan man kommer hit (needsBodyFatFirst), så spåret går inte att välja
   * utan mätvärde. Ingen fallback behövs därför.
   *
   * Mätvärdet påverkar inte VAD som frågas, bara hur mycket som kan sägas om
   * svaret: med kroppsfett går spannets övre gräns att räkna fram, utan det
   * blir svaret ett enda tal.
   */
  /**
   * Uppgång anges ALLTID i kilo, även i styrkespåret.
   *
   * Målfettprocent är fel fråga när man bygger: den som lägger på sig
   * muskler räknar i kilo, och ett procentmål uppåt vore dessutom
   * tvetydigt (mer fett? mindre? oförändrat vid högre vikt?).
   */
  const isGain = direction === 'gain'
  const useWeightMode = isGain || focus === 'health'

  // Kolumnen är numeric(5,2), så värdet kan ha två decimaler (23.13). En
  // decimal räcker gott för en mätning med flera procentenheters osäkerhet.
  const bodyFatDisplay =
    bodyFatPercentage != null ? Math.round(bodyFatPercentage * 10) / 10 : undefined

  const targetNum = parseFloat(targetBf.replace(',', '.'))

  // Takten härleds ur nivån och TDEE — inte ur en schablon. Mittvärdet
  // används för uträkningen; spannet visas för användaren.
  const levelRate = ratePercentForDeficitLevel({ level, tdee, weightKg })
  const rateNum = levelRate?.percentMid ?? PREP_RATE_PERCENT.recommended

  // Villkoras på LÄGET, inte bara på mätvärdet. I hälsospåret är inmatningen
  // kilo — skickades den som targetBodyFatPct skulle ett lågt tal (t.ex. 20)
  // tolkas som en giltig fettprocent och ge svar på en fråga användaren inte
  // ställt.
  const bfEstimate =
    !useWeightMode && bodyFatPercentage
      ? estimatePrepDuration({
          currentWeightKg: weightKg,
          currentBodyFatPct: bodyFatPercentage,
          targetBodyFatPct: targetNum,
          weeklyRatePercent: rateNum,
          gender,
        })
      : null

  /**
   * Uppgångens takt kommer INTE från underskottsnivån.
   *
   * Nivåerna beskriver hur djupt ett underskott är; de har ingen
   * motsvarighet uppåt. Iraki 2019:s förval används i stället, och det är
   * medvetet spannets nedre ände — Garthe 2013 visade att dubbla takten gav
   * fem gånger så mycket fettökning utan mer fettfri massa.
   */
  const gainRate =
    isGain && caloriesMin != null && caloriesMax != null && tdee > 0
      ? weeklyRateForCalories({ tdee, caloriesMin, caloriesMax, weightKg })
      : null

  /**
   * Den snabbaste takt kalorimålet medger, när den överstiger Iraki 2019:s
   * tak — annars null.
   *
   * kgMin är den MEST negativa (tdee − calories), alltså det största
   * överskottet och den snabbaste uppgången.
   */
  const gainAboveRecommended =
    gainRate && Math.abs(gainRate.percentMin) > GAIN_RATE_PERCENT.max
      ? Math.round(Math.abs(gainRate.percentMin) * 100) / 100
      : null

  const gainEstimate = isGain
    ? estimateDurationToGain({
        currentWeightKg: weightKg,
        targetWeightKg: targetNum,
        // Mittvärdet räknar tiden; spannet visas för användaren — samma
        // uppdelning som nedgången gör med levelRate.
        /**
         * ABSOLUTBELOPP: weeklyRateForCalories räknar tdee − calories, så
         * ett ÖVERSKOTT ger negativa tal. Utan Math.abs avvisade
         * clampGainRate dem och föll tillbaka på förvalet — vilket var
         * precis den inkonsekvens den här ändringen ska ta bort.
         */
        weeklyRatePercent: gainRate
          ? Math.abs(gainRate.percentMin + gainRate.percentMax) / 2
          : undefined,
      })
    : null

  const weightEstimate =
    !isGain && useWeightMode
      ? estimateDurationToWeight({
          currentWeightKg: weightKg,
          targetWeightKg: targetNum,
          weeklyRatePercent: rateNum,
          currentBodyFatPct: bodyFatPercentage,
        })
      : null

  /** Det som är gemensamt för båda lägena, så resten av vyn bara har ETT objekt. */
  const estimate = gainEstimate
    ? {
        weeks: gainEstimate.weeks,
        weeksRealistic: gainEstimate.weeks,
        weeklyLossKg: gainEstimate.weeklyGainKg,
        ratePercentUsed: gainEstimate.ratePercentUsed,
        // Nedgångens observerade prep-spann (14–32 v) gäller inte uppgång.
        outsideObservedRange: false,
        isMinorAdjustment: gainEstimate.isMinorAdjustment,
        lossKg: gainEstimate.weightToGainKg,
        endWeightKg: Math.round(targetNum * 10) / 10,
        belowEssentialFat: false,
        belowLeanMass: false,
        leanMassKg: null as number | null,
        essentialFatLimit: null as number | null,
      }
    : bfEstimate
      ? {
          weeks: bfEstimate.weeks,
          weeksRealistic: bfEstimate.weeksRealistic,
          weeklyLossKg: bfEstimate.weeklyLossKg,
          ratePercentUsed: bfEstimate.ratePercentUsed,
          outsideObservedRange: bfEstimate.outsideObservedRange,
          isMinorAdjustment: bfEstimate.isMinorAdjustment,
          lossKg: bfEstimate.fatToLoseKg,
          endWeightKg: bfEstimate.projectedWeightKg,
          belowEssentialFat: bfEstimate.belowEssentialFat,
          belowLeanMass: false,
          leanMassKg: null as number | null,
          essentialFatLimit: bfEstimate.essentialFatLimit,
        }
      : weightEstimate
        ? {
            weeks: weightEstimate.weeks,
            // Spannet finns bara när kroppsfettet är uppmätt; annars är
            // weeksRealistic === weeks och UI:t visar ett enda tal.
            weeksRealistic: weightEstimate.weeksRealistic,
            weeklyLossKg: weightEstimate.weeklyLossKg,
            ratePercentUsed: weightEstimate.ratePercentUsed,
            outsideObservedRange: weightEstimate.outsideObservedRange,
            isMinorAdjustment: weightEstimate.isMinorAdjustment,
            lossKg: weightEstimate.weightToLoseKg,
            // Avrundas som fettprocentlägets projectedWeightKg, annars visas
            // "87.456 kg" när användaren skrivit så.
            endWeightKg: Math.round(targetNum * 10) / 10,
            belowEssentialFat: false,
            belowLeanMass: weightEstimate.belowLeanMass,
            leanMassKg: weightEstimate.leanMassKg,
            essentialFatLimit: 0,
          }
        : null

  // Klassificera den takt som FAKTISKT användes, inte råinmatningen. Skriver
  // användaren 8 klampar modulen till 5 — då vore det vilseledande att varna
  // för ett tal som inte ligger bakom veckosiffran.
  const rateClass = estimate ? classifyPrepRate(estimate.ratePercentUsed) : null

  /**
   * Målet är fysiologiskt omöjligt — under fettfri massa, eller under den
   * essentiella fettnivån.
   *
   * Beräkningsmodulen returnerar medvetet ett svar ändå, för att UI:t ska
   * kunna FÖRKLARA varför målet inte går att nå i stället för att bara visa
   * ingenting. Men då måste UI:t också ta hand om flaggan: annars stod
   * "Den går inte att nå" direkt ovanför "Beräknad tid: 61 veckor" i
   * skärmens största siffra, med en aktiv knapp för att spara den tiden
   * som faslängd.
   */
  const unreachable = !!estimate && (estimate.belowLeanMass || estimate.belowEssentialFat)
  const suggestedTarget =
    gender === 'male' ? SUGGESTED_TARGET_BODY_FAT.male : SUGGESTED_TARGET_BODY_FAT.female

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-200">
          <Calculator className="h-3.5 w-3.5" />
          {isGain ? t('phase.prep.titleGain') : t('phase.prep.title')}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-neutral-400 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {isGain
              ? t('phase.prep.introGain', { current: weightKg })
              : useWeightMode
                ? t('phase.prep.introWeight', { current: weightKg })
                : t('phase.prep.intro', { current: bodyFatDisplay })}
          </p>

          {/* Målfält och takt sida vid sida: två korta uppgifter som hör
              ihop och tillsammans bestämmer svaret. Staplade tog de dubbelt
              så mycket höjd utan att bli tydligare. */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[7rem] flex-1 space-y-1">
              <Label htmlFor="prep-target" className="text-xs">
                {isGain
                  ? t('phase.prep.targetGainLabel')
                  : useWeightMode
                    ? t('phase.prep.targetWeightLabel')
                    : t('phase.prep.targetLabel')}
              </Label>
              <Input
                id="prep-target"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={targetBf}
                onChange={e => setTargetBf(e.target.value)}
                placeholder={String(
                  isGain
                    ? Math.round(weightKg * 1.05)
                    : useWeightMode
                      ? Math.round(weightKg * 0.92)
                      : suggestedTarget
                )}
                className="h-8 text-sm"
              />
            </div>
            {/* Uppgången har ingen underskottsnivå att visa — nivåerna
                beskriver hur DJUPT ett underskott är och saknar
                motsvarighet uppåt. I stället visas Iraki 2019:s takt. */}
            {isGain && gainRate && (
              <div className="min-w-[8rem] flex-1 space-y-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('phase.prep.gainRateLabel')}
                </p>
                {/* Spannet, inte ett enda tal — samma format som nedgångens
                    levelRate, och samma siffror som Målsättning visar. */}
                <p className="text-sm font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
                  {Math.abs(gainRate.kgMax).toFixed(2)}–{Math.abs(gainRate.kgMin).toFixed(2)}{' '}
                  <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
                    kg/v
                  </span>
                </p>
              </div>
            )}
            {/* Nivån väljs i periodvalet ovan — här visas bara vad den
                innebär i takt, utan ett andra reglage för samma sak. */}
            {!isGain && levelRate && (
              <div className="min-w-[8rem] flex-1 space-y-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t(`phase.deficitLevel.${level}`)}
                </p>
                <p className="text-sm font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
                  {levelRate.kgMin.toFixed(2)}–{levelRate.kgMax.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
                    kg/v
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Takten bedöms mot källornas gränser, inte mot en godtycklig skala.
              Men varningarna handlar om risker som byggs upp över tid i ett
              underskott — muskelförlust och metabol anpassning. Vid en
              finjustering på ett par kilo finns ingen sådan risk, och en
              varning där vore falskt larm som urholkar de riktiga. */}
          {/* Motsvarigheten till belowEssentialFat i viktläget: en målvikt
              under fettfri massa förutsätter att muskler och organ
              försvinner. Utan den varnade räknaren inte alls för 95 → 20 kg. */}
          {estimate?.belowLeanMass && estimate.leanMassKg != null && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.belowLeanMass', { lean: estimate.leanMassKg })}
            </p>
          )}
          {estimate?.belowEssentialFat && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.belowEssential', { limit: estimate.essentialFatLimit })}
            </p>
          )}
          {!unreachable && !estimate?.isMinorAdjustment && rateClass === 'acceptable' && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('phase.prep.rateAcceptable')}
            </p>
          )}
          {!unreachable && !estimate?.isMinorAdjustment && rateClass === 'aggressive' && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.rateAggressive')}
            </p>
          )}

          {estimate && !unreachable ? (
            <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
              {/* Veckotalet är svaret användaren kom hit för — det ska synas
                  som en siffra, inte som en mening i löptext. */}
              <div className="bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('phase.prep.resultLabel')}
                </p>
                <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {estimate.weeksRealistic > estimate.weeks
                    ? t('phase.prep.resultRange', {
                        from: estimate.weeks,
                        to: estimate.weeksRealistic,
                      })
                    : t('phase.prep.result', { weeks: estimate.weeks })}
                </p>
              </div>

              {/* Tre nyckeltal i rutnät i stället för en punktseparerad
                  mening. Samma mönster som kalibreringens före/efter-ruta. */}
              <dl className="grid grid-cols-3 divide-x divide-neutral-200 border-t border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
                {(
                  [
                    [
                      // Riktningen styr ordet: 'Att tappa 11,6 kg' stod kvar
                      // vid en uppgång.
                      isGain ? 'statWeightToGain' : useWeightMode ? 'statWeightToLose' : 'statFat',
                      `${estimate.lossKg} kg`,
                    ],
                    [
                      useWeightMode ? 'statTargetWeight' : 'statWeight',
                      `${estimate.endWeightKg} kg`,
                    ],
                    ['statFirstWeek', `${estimate.weeklyLossKg} kg`],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="px-2.5 py-2">
                    <dt className="text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                      {t(`phase.prep.${key}`)}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-1.5 px-3 py-2.5">
                {/* Uppgångens tre budskap, i den ordning de behövs:
                    varför takten är låg, vad som avgör om det blir muskler,
                    och varför en längre period är bättre än en kort. */}
                {isGain && (
                  <>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {t('phase.prep.gainRateNote')}
                    </p>
                    {/* Kalorimålets övre del kan ligga över litteraturens
                        tak — 10–20 % överskott ger 0,29–0,59 %/v för en
                        88-kilos kropp, medan Iraki 2019 stannar vid 0,5.
                        Notisen ovan beskrev förut förvalet 0,25 % som om
                        det vore den takt som faktiskt användes. */}
                    {gainAboveRecommended != null && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {t('phase.prep.gainRateAboveMax', {
                          percent: gainAboveRecommended,
                        })}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {t('phase.prep.gainStrengthTraining')}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('phase.prep.gainLowerRangeNote')}
                    </p>
                  </>
                )}
                {estimate.weeksRealistic > estimate.weeks && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {t('phase.prep.rangeExplanation')}
                  </p>
                )}
                {estimate.outsideObservedRange && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {/* Villkoret triggar åt BÅDA håll (kortare än min ELLER
                        längre än max), men texten beskrev bara det längre
                        fallet — ett svar på 10 veckor fick läsa "Längre än
                        14–32 veckor". */}
                    {estimate.weeks < OBSERVED_PREP_WEEKS.min
                      ? t('phase.prep.outsideRangeShort', {
                          min: OBSERVED_PREP_WEEKS.min,
                          max: OBSERVED_PREP_WEEKS.max,
                        })
                      : t('phase.prep.outsideRange', {
                          min: OBSERVED_PREP_WEEKS.min,
                          max: OBSERVED_PREP_WEEKS.max,
                        })}
                  </p>
                )}
                {/* Vid små avstånd är mätosäkerheten i kroppsfettmätningen i
                  samma storleksordning som avståndet. Svaret blir då mer
                  precist än ingångsvärdet — det ska användaren veta. */}
                {estimate.isMinorAdjustment && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('phase.prep.minorAdjustment')}
                  </p>
                )}
                {/* Faslängden lagras i hela veckor, så knappen rundar upp.
                    I fettprocentläget används spannets ÖVRE gräns: att planera
                    för golvet vore att planera för ett bästa fall som sällan
                    inträffar, och för kort tid tvingar fram en högre takt i
                    slutet där risken för muskelförlust är störst.
                    I viktläget finns inget spann (weeksRealistic === weeks),
                    så knappen använder samma tal som visas. */}
                {onUseWeeks && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUseWeeks(Math.ceil(estimate.weeksRealistic))}
                    className="mt-1 h-7 text-xs"
                  >
                    {t('phase.prep.useWeeks', { weeks: Math.ceil(estimate.weeksRealistic) })}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            targetBf !== '' &&
            !unreachable && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {useWeightMode ? t('phase.prep.noResultWeight') : t('phase.prep.noResult')}
              </p>
            )
          )}

          {/* Källorna hör hemma i gränssnittet, men de är fem rader småtext
              som konkurrerade med svaret om uppmärksamheten. Hopfällda är de
              fortfarande ett klick bort — inte gömda, bara nedprioriterade
              mot det användaren kom hit för. */}
          <details className="border-t border-neutral-200 pt-2 dark:border-neutral-700">
            <summary className="cursor-pointer list-none text-[11px] font-medium text-neutral-600 marker:content-none hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100">
              {t('phase.prep.sourcesTitle')}
            </summary>
            <ul className="mt-1.5 space-y-1">
              <li className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                {t('phase.prep.source1')}
              </li>
              <li className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                {t('phase.prep.source2')}
              </li>
            </ul>
            <p className="mt-1.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
              {t('phase.prep.caveat')}
            </p>
          </details>
        </div>
      )}
    </div>
  )
}
