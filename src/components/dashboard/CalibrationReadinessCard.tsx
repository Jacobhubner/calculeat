/**
 * Beredskapskort för metabolisk kalibrering.
 *
 * VARFÖR (2026-08-16): CalibrationPrompt döljer sig helt tills alla krav är
 * uppfyllda — rätt beslut, men konsekvensen var att den som INTE kvalificerar
 * får tystnad och aldrig får veta att funktionen finns, vad den kräver eller
 * hur nära hen är. Mätt på produktionsdata hade 4 av 6 användare noll
 * loggdagar och saknade helt väg framåt.
 *
 * Kortet visar de två kraven separat. En sammanslagen procentsiffra skulle
 * dölja tillståndet "gott om vägningar men noll loggdagar", vilket är precis
 * det som tidigare gav en kalibrering mot målkalorier i stället för mot
 * faktiskt intag.
 *
 * Designval: ETT nästa steg åt gången. Två parallella uppmaningar konkurrerar
 * med varandra och gör att ingen av dem känns angelägen.
 */

import { Zap, Scale, UtensilsCrossed, Check, CalendarRange } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import type { CalibrationAvailability } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CalibrationReadinessCardProps {
  availability: CalibrationAvailability
  /** Har användaren kalibrerat förut? Då behövs ingen introduktion. */
  hasCalibratedBefore: boolean
  /**
   * Loggade datum i perioden. Används för att upptäcka att bara vardagar
   * loggats — helger ligger i den här appens data +245 kcal över vardagar,
   * så ett skevt urval ger ett systematiskt fel i TDEE.
   */
  loggedDates?: string[]
  className?: string
}

function RequirementRow({
  icon,
  label,
  current,
  required,
  isFocus,
}: {
  icon: React.ReactNode
  label: string
  current: number
  required: number
  /** Det krav som ligger efter — lyfts fram, övriga tonas ner */
  isFocus: boolean
}) {
  const done = current >= required
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 100

  return (
    <div className={cn('flex flex-col gap-1', !isFocus && !done && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
          {icon}
          {label}
        </span>
        <span
          className={cn(
            'flex items-center gap-1 text-xs tabular-nums font-medium',
            done ? 'text-green-600 dark:text-green-300' : 'text-neutral-500 dark:text-neutral-400'
          )}
        >
          {done && <Check className="h-3 w-3" />}
          {current} / {required}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            done ? 'bg-green-500' : 'bg-amber-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Helgandel i ett representativt urval: 2 av 7 dagar. */
const EXPECTED_WEEKEND_SHARE = 2 / 7

export default function CalibrationReadinessCard({
  availability,
  hasCalibratedBefore,
  loggedDates,
  className,
}: CalibrationReadinessCardProps) {
  const { t } = useTranslation('dashboard')

  // Kortet är till för dem som ännu inte kan kalibrera. Kan de redan, tar
  // CalibrationPrompt över.
  if (availability.isAvailable) return null

  const { weighIns, logDays, daysRemaining } = availability.progress

  // Har man varken vägt sig eller loggat är kalibrering inte nästa steg —
  // då är det logga-mat som gäller, och dashboardens egna CTA:n säger redan
  // det. Ett nedräkningskort här skulle bara vara brus.
  if (weighIns.current === 0 && logDays.current === 0) return null

  const weighInsDone = weighIns.current >= weighIns.required
  const logDaysDone = logDays.current >= logDays.required

  // Ett nästa steg, inte två. Vägningarna först: utan dem finns ingen
  // mätperiod alls, och de tar längst tid att samla in.
  const focus: 'weighIns' | 'logDays' | 'weekend' | 'done' = !weighInsDone
    ? 'weighIns'
    : !logDaysDone
      ? 'logDays'
      : 'done'

  // Även när båda kraven är nästan uppfyllda kan urvalet vara skevt.
  const weekendCount = (loggedDates ?? []).filter(iso => {
    const day = new Date(`${iso}T12:00:00`).getDay()
    return day === 0 || day === 6
  }).length
  const hasWeekendGap =
    (loggedDates?.length ?? 0) >= 7 &&
    weekendCount / (loggedDates?.length ?? 1) < EXPECTED_WEEKEND_SHARE * 0.5

  const nextStepKey =
    focus === 'weighIns'
      ? 'nextWeighIn'
      : focus === 'logDays'
        ? 'nextLogDay'
        : hasWeekendGap
          ? 'nextWeekend'
          : 'nextAlmost'

  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-primary-50 dark:bg-primary-900/30 shrink-0">
            <Zap className="h-4 w-4 text-primary-600 dark:text-primary-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('calibrationReadiness.title')}
            </h4>
            {/* Belöningen först, kravet som vägen dit */}
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {daysRemaining > 0
                ? t('calibrationReadiness.countdown', { count: daysRemaining })
                : t('calibrationReadiness.almostThere')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <RequirementRow
            icon={<Scale className="h-3.5 w-3.5" />}
            label={t('calibrationReadiness.weighIns')}
            current={weighIns.current}
            required={weighIns.required}
            isFocus={focus === 'weighIns'}
          />
          <RequirementRow
            icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
            label={t('calibrationReadiness.logDays')}
            current={logDays.current}
            required={logDays.required}
            isFocus={focus === 'logDays'}
          />
        </div>

        {/* Ett konkret nästa steg — inte en lista med allt som gäller */}
        <div className="flex items-start gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
          {hasWeekendGap && focus !== 'weighIns' ? (
            <CalendarRange className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary-600 dark:text-primary-300" />
          )}
          <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t(`calibrationReadiness.${nextStepKey}`)}
          </p>
        </div>

        {!hasCalibratedBefore && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
            {t('calibrationReadiness.explainer')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
