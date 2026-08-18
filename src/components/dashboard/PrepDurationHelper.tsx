/**
 * Räknar ut hur lång en tävlingsförberedelse blir utifrån användarens
 * startpunkt, och erbjuder resultatet som faslängd.
 *
 * VARFÖR: litteraturen anger ingen optimal prep-längd. Den styr på takt och
 * startfettnivå (Helms 2014, Roberts 2020). Ett fast riktvärde ger samma svar
 * till den som är 12 % och den som är 22 % — fel för båda. Här härleds tiden
 * ur faktiska mätvärden i stället.
 *
 * Källorna visas i gränssnittet, inte bara i koden: siffrorna kommer från
 * narrativa översikter och fallstudier, och det ska användaren kunna se.
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
} from '@/lib/calculations/contestPrep'
import { cn } from '@/lib/utils'

interface Props {
  weightKg: number
  /** Uppmätt kroppsfettprocent. Utan den går räknaren inte att använda. */
  bodyFatPercentage?: number
  /** Anropas när användaren vill använda resultatet som faslängd. */
  onUseWeeks: (weeks: number) => void
}

export function PrepDurationHelper({ weightKg, bodyFatPercentage, onUseWeeks }: Props) {
  const { t } = useTranslation('dashboard')
  const [expanded, setExpanded] = useState(false)
  const [targetBf, setTargetBf] = useState('')
  const [rate, setRate] = useState(String(PREP_RATE_PERCENT.recommended))

  // Utan uppmätt kroppsfett finns ingen startpunkt att räkna från. Att gissa
  // vore att bygga ett svar på ett antagande användaren inte gjort.
  if (!bodyFatPercentage) {
    return (
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('phase.prep.needsBodyFat')}
      </p>
    )
  }

  const targetNum = parseFloat(targetBf.replace(',', '.'))
  const rateNum = parseFloat(rate.replace(',', '.'))

  const estimate = estimatePrepDuration({
    currentWeightKg: weightKg,
    currentBodyFatPct: bodyFatPercentage,
    targetBodyFatPct: targetNum,
    weeklyRatePercent: rateNum,
  })

  const rateClass = Number.isFinite(rateNum) ? classifyPrepRate(rateNum) : null

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
                placeholder="6"
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

          {/* Takten bedöms mot källornas gränser, inte mot en godtycklig skala */}
          {rateClass === 'acceptable' && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('phase.prep.rateAcceptable')}
            </p>
          )}
          {rateClass === 'aggressive' && (
            <p className="text-xs text-error-600 dark:text-error-400">
              {t('phase.prep.rateAggressive')}
            </p>
          )}

          {estimate ? (
            <div className="rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t('phase.prep.result', { weeks: estimate.weeks })}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                {t('phase.prep.resultDetail', {
                  fat: estimate.fatToLoseKg,
                  weight: estimate.projectedWeightKg,
                  perWeek: estimate.weeklyLossKg,
                })}
              </p>
              {estimate.outsideObservedRange && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('phase.prep.outsideRange', {
                    min: OBSERVED_PREP_WEEKS.min,
                    max: OBSERVED_PREP_WEEKS.max,
                  })}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUseWeeks(estimate.weeks)}
                className="mt-2 h-7 text-xs"
              >
                {t('phase.prep.useWeeks', { weeks: estimate.weeks })}
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
