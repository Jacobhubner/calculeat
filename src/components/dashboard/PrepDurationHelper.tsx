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
} from '@/lib/calculations/contestPrep'
import { cn } from '@/lib/utils'

interface Props {
  weightKg: number
  /** Uppmätt kroppsfettprocent. Utan den går räknaren inte att använda. */
  bodyFatPercentage?: number
  /**
   * Kön från profilen. Styr nedre gräns för målfett och föreslaget värde —
   * 6 % är rimligt för män men under essentiell nivå för kvinnor.
   */
  gender?: 'male' | 'female'
  /** Anropas när användaren vill använda resultatet som faslängd. */
  onUseWeeks: (weeks: number) => void
}

export function PrepDurationHelper({ weightKg, bodyFatPercentage, gender, onUseWeeks }: Props) {
  const { t } = useTranslation('dashboard')
  const [expanded, setExpanded] = useState(false)
  const [targetBf, setTargetBf] = useState('')
  const [rate, setRate] = useState(String(PREP_RATE_PERCENT.recommended))

  // Utan uppmätt kroppsfett finns ingen startpunkt att räkna från. I praktiken
  // når man aldrig hit — PhasePickerDialog ersätter hela vyn innan dess (se
  // needsBodyFatFirst) och hänvisar till kroppssammansättning. Vakten står
  // kvar för att komponenten ska vara säker om den monteras någon annanstans.
  if (!bodyFatPercentage) return null

  const targetNum = parseFloat(targetBf.replace(',', '.'))
  const rateNum = parseFloat(rate.replace(',', '.'))

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
  const rateWasClamped =
    estimate != null && Number.isFinite(rateNum) && rateNum !== estimate.ratePercentUsed

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label htmlFor="prep-rate" className="text-xs">
                {t('phase.prep.rateLabel')}
              </Label>
              <Input
                id="prep-rate"
                type="number"
                inputMode="decimal"
                step="0.05"
                value={rate}
                onChange={e => setRate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
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
          {rateWasClamped && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('phase.prep.rateClamped', { rate: estimate!.ratePercentUsed })}
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
            <div className="rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {estimate.weeksRealistic > estimate.weeks
                  ? t('phase.prep.resultRange', {
                      from: estimate.weeks,
                      to: estimate.weeksRealistic,
                    })
                  : t('phase.prep.result', { weeks: estimate.weeks })}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                {t('phase.prep.resultDetail', {
                  fat: estimate.fatToLoseKg,
                  weight: estimate.projectedWeightKg,
                  perWeek: estimate.weeklyLossKg,
                })}
              </p>
              {estimate.weeksRealistic > estimate.weeks && (
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {t('phase.prep.rangeExplanation')}
                </p>
              )}
              {estimate.outsideObservedRange && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
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
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
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
                className="mt-2 h-7 text-xs"
              >
                {t('phase.prep.useWeeks', { weeks: Math.ceil(estimate.weeksRealistic) })}
              </Button>
            </div>
          ) : (
            targetBf !== '' && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('phase.prep.noResult')}
              </p>
            )
          )}

          {/* Källorna hör hemma i gränssnittet. Siffrorna kommer från
              narrativa översikter och fallstudier — inte från RCT:er som
              testat olika prep-längder mot varandra. Det ska framgå. */}
          <div className="border-t border-neutral-200 pt-2 dark:border-neutral-700">
            <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
              {t('phase.prep.sourcesTitle')}
            </p>
            <ul className="mt-1 space-y-1">
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
          </div>
        </div>
      )}
    </div>
  )
}
