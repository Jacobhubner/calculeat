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
import { Calculator, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  estimatePrepDuration,
  classifyPrepRate,
  PREP_RATE_PERCENT,
  OBSERVED_PREP_WEEKS,
  SUGGESTED_TARGET_BODY_FAT,
  ratePercentForDeficitLevel,
  type DeficitLevelId,
} from '@/lib/calculations/contestPrep'
import { cn } from '@/lib/utils'

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
  /** Anropas när användaren vill använda resultatet som faslängd. */
  onUseWeeks: (weeks: number) => void
}

export function PrepDurationHelper({
  weightKg,
  tdee,
  bodyFatPercentage,
  gender,
  level,
  onUseWeeks,
}: Props) {
  const { t } = useTranslation('dashboard')
  const [expanded, setExpanded] = useState(false)
  const [targetBf, setTargetBf] = useState('')

  // Utan uppmätt kroppsfett finns ingen startpunkt att räkna från. I praktiken
  // når man aldrig hit — PhasePickerDialog ersätter hela vyn innan dess (se
  // needsBodyFatFirst) och hänvisar till kroppssammansättning. Vakten står
  // kvar för att komponenten ska vara säker om den monteras någon annanstans.
  if (!bodyFatPercentage) return null

  const targetNum = parseFloat(targetBf.replace(',', '.'))

  // Takten härleds ur nivån och TDEE — inte ur en schablon. Mittvärdet
  // används för uträkningen; spannet visas för användaren.
  const levelRate = ratePercentForDeficitLevel({ level, tdee, weightKg })
  const rateNum = levelRate?.percentMid ?? PREP_RATE_PERCENT.recommended

  const estimate = estimatePrepDuration({
    currentWeightKg: weightKg,
    currentBodyFatPct: bodyFatPercentage,
    targetBodyFatPct: targetNum,
    weeklyRatePercent: rateNum,
    gender,
  })

  // Klassificera den takt som FAKTISKT användes, inte råinmatningen. Skriver
  // användaren 8 klampar modulen till 5 — då vore det vilseledande att varna
  // för ett tal som inte ligger bakom veckosiffran.
  const rateClass = estimate ? classifyPrepRate(estimate.ratePercentUsed) : null
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
          {t('phase.prep.title')}
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
            {t('phase.prep.intro', { current: bodyFatPercentage })}
          </p>

          {/* Målfält och takt sida vid sida: två korta uppgifter som hör
              ihop och tillsammans bestämmer svaret. Staplade tog de dubbelt
              så mycket höjd utan att bli tydligare. */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[7rem] flex-1 space-y-1">
              <Label htmlFor="prep-target" className="text-xs">
                {t('phase.prep.targetLabel')}
              </Label>
              <Input
                id="prep-target"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={targetBf}
                onChange={e => setTargetBf(e.target.value)}
                placeholder={String(suggestedTarget)}
                className="h-8 text-sm"
              />
            </div>
            {/* Nivån väljs i periodvalet ovan — här visas bara vad den
                innebär i takt, utan ett andra reglage för samma sak. */}
            {levelRate && (
              <div className="min-w-[8rem] flex-1 space-y-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t(`phase.deficitLevel.${level}`)}
                </p>
                <p className="text-sm font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
                  {levelRate.kgMin}–{levelRate.kgMax}{' '}
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
          {estimate?.belowEssentialFat && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.belowEssential', { limit: estimate.essentialFatLimit })}
            </p>
          )}
          {!estimate?.isMinorAdjustment && rateClass === 'acceptable' && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('phase.prep.rateAcceptable')}
            </p>
          )}
          {!estimate?.isMinorAdjustment && rateClass === 'aggressive' && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.rateAggressive')}
            </p>
          )}

          {estimate ? (
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
                    ['statFat', `${estimate.fatToLoseKg} kg`],
                    ['statWeight', `${estimate.projectedWeightKg} kg`],
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
                {estimate.weeksRealistic > estimate.weeks && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {t('phase.prep.rangeExplanation')}
                  </p>
                )}
                {estimate.outsideObservedRange && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('phase.prep.outsideRange', {
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
                {/* Faslängden lagras i hela veckor, så knappen rundar upp, och
                  den använder spannets ÖVRE gräns. Att planera för golvet vore
                  att planera för ett bästa fall som sällan inträffar — och för
                  kort tid tvingar fram en högre takt i slutet, där risken för
                  muskelförlust är störst. */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onUseWeeks(Math.ceil(estimate.weeksRealistic))}
                  className="mt-1 h-7 text-xs"
                >
                  {t('phase.prep.useWeeks', { weeks: Math.ceil(estimate.weeksRealistic) })}
                </Button>
              </div>
            </div>
          ) : (
            targetBf !== '' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('phase.prep.noResult')}
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
