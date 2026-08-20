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
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  hint,
}: {
  icon: React.ReactNode
  label: string
  current: number
  required: number
  /** Det krav som ligger efter — lyfts fram, övriga tonas ner */
  isFocus: boolean
  /**
   * Villkor som talet inte rymmer.
   *
   * "0 / 4" läses som fyra vägningar, punkt — och fyra dagar i rad
   * uppfyller siffran utan att ge en enda giltig kalibrering, eftersom
   * de hamnar i samma ände av perioden.
   */
  hint?: string
}) {
  const done = current >= required
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 100

  return (
    <div className={cn('flex flex-col gap-1', !isFocus && !done && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
          <span className="flex items-center gap-1.5">
            {icon}
            {label}
          </span>
          {hint && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{hint}</span>
          )}
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
/**
 * Stegen i mätperiodstrappan.
 *
 * Bara 14 och 28 har en precisionssiffra: ±177 respektive ±62 kcal/dag
 * står i calibration-quality.ts. Något motsvarande tal för 21 dagar finns
 * inte beräknat, och ska därför inte gissas fram.
 */
const LADDER_STEPS: ReadonlyArray<{ days: 14 | 21 | 28; kcal: number | null }> = [
  { days: 14, kcal: 177 },
  { days: 21, kcal: null },
  { days: 28, kcal: 62 },
]

const EXPECTED_WEEKEND_SHARE = 2 / 7

export default function CalibrationReadinessCard({
  availability,
  hasCalibratedBefore,
  loggedDates,
  className,
}: CalibrationReadinessCardProps) {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  // Kortet är till för dem som ännu inte kan kalibrera. Kan de redan, tar
  // CalibrationPrompt över.
  if (availability.isAvailable) return null

  const { weighIns, logDays, activePeriod, reachedPeriods, blocking, daysUntilNextWeighInUseful } =
    availability.progress

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

  /**
   * Direkt efter en kalibrering räknas NYA vägningar, inte alla.
   *
   * Utan ordet "nya" tror den som har fyrtio vägningar i historiken att
   * appen tappat bort hennes data när det står 0 / 3.
   */
  const isFreshAfterCalibration = hasCalibratedBefore && weighIns.current === 0

  // Även när båda kraven är nästan uppfyllda kan urvalet vara skevt.
  const weekendCount = (loggedDates ?? []).filter(iso => {
    const day = new Date(`${iso}T12:00:00`).getDay()
    return day === 0 || day === 6
  }).length
  const hasWeekendGap =
    (loggedDates?.length ?? 0) >= 7 &&
    weekendCount / (loggedDates?.length ?? 1) < EXPECTED_WEEKEND_SHARE * 0.5

  /**
   * Nästa steg styrs av vad som FAKTISKT blockerar, inte av vilken bar som
   * är minst fylld. Klustringen syns aldrig som ett eget krav — den skulle
   * bli en progressbar som går BAKÅT av sig själv, eftersom fönstret
   * glider framåt varje dygn. Som nedräkning har den inte det problemet.
   */
  const nextStepKey =
    blocking === 'clusterGap'
      ? daysUntilNextWeighInUseful && daysUntilNextWeighInUseful > 0
        ? 'nextWeighAgainIn'
        : 'nextWeighAgainToday'
      : blocking === 'logCoverage'
        ? 'nextLogCoverage'
        : focus === 'weighIns'
          ? 'nextWeighIn'
          : focus === 'logDays'
            ? 'nextLogDay'
            : hasWeekendGap
              ? 'nextWeekend'
              : reachedPeriods.length > 0 && reachedPeriods.length < 3
                ? 'nextUpgradePeriod'
                : 'nextAlmost'

  const statusKey = isFreshAfterCalibration
    ? 'statusFresh'
    : blocking === 'clusterGap'
      ? 'statusClusterGap'
      : blocking === 'logDays'
        ? 'statusNeedLogDays'
        : blocking === 'logCoverage'
          ? 'statusNeedCoverage'
          : 'statusCollecting'

  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-primary-50 dark:bg-primary-900/30 shrink-0">
            <Zap className="h-4 w-4 text-primary-600 dark:text-primary-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isFreshAfterCalibration
                ? t('calibrationReadiness.titleAfterCalibration')
                : t('calibrationReadiness.title')}
            </h4>
            {/*
              Tillståndet, inte en nedräkning. Den gamla countdown-texten
              byggde på daysRemaining = max(saknade vägningar, saknade
              loggdagar) — ett ANTAL som visades som DAGAR. Tre vägningar
              back blev "om 3 dagar", vilket dessutom är omöjligt när
              vägningarna måste spridas över perioden.
            */}
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {t(`calibrationReadiness.${statusKey}`)}
            </p>
          </div>
        </div>

        {/*
          Precisionen sitter UNDER sin egen punkt, inte vid kortets kanter.
          Först låg ±177 längst till vänster och ±62 längst till höger,
          vilket fick dem att se ut som fotnoter till kortet i stället för
          etiketter till 14 respektive 28 dagar.

          Rubriken säger numera VARFÖR stegen finns. "Mätperiod" beskrev
          vad raden innehöll men inte vad användaren skulle göra med den.
        */}
        <div>
          <p className="mb-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
            {t('calibrationReadiness.ladderLabel')}
          </p>
          <div className="flex items-start">
            {LADDER_STEPS.map((step, i) => {
              const reached = reachedPeriods.includes(step.days)
              const isNext = step.days === activePeriod && !reached
              return (
                <div key={step.days} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-center">
                    {/* Linjen till vänster om punkten, utom först */}
                    <div
                      className={cn(
                        'h-px flex-1',
                        i === 0
                          ? 'bg-transparent'
                          : reached
                            ? 'bg-primary-400 dark:bg-primary-600'
                            : 'bg-neutral-200 dark:bg-neutral-800'
                      )}
                    />
                    <div
                      className={cn(
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        reached
                          ? 'bg-primary-600 dark:bg-primary-400'
                          : isNext
                            ? 'border-2 border-primary-500 bg-white dark:border-primary-400 dark:bg-neutral-850'
                            : 'bg-neutral-300 dark:bg-neutral-700'
                      )}
                    />
                    <div
                      className={cn(
                        'h-px flex-1',
                        i === LADDER_STEPS.length - 1
                          ? 'bg-transparent'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      reached || isNext
                        ? 'font-medium text-neutral-700 dark:text-neutral-200'
                        : 'text-neutral-400 dark:text-neutral-500'
                    )}
                  >
                    {t('calibrationReadiness.ladderDays', { count: step.days })}
                  </span>
                  {/* Bara de två belagda talen (calibration-quality.ts).
                      21-steget får ingen siffra — den finns inte i koden
                      och ska därför inte påstås. */}
                  {step.kcal != null && (
                    <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                      {t('calibrationReadiness.ladderPrecision', { kcal: step.kcal })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
            {reachedPeriods.length > 0
              ? t('calibrationReadiness.ladderReachedNote', {
                  days: reachedPeriods[reachedPeriods.length - 1],
                })
              : t('calibrationReadiness.ladderNoneNote')}
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <RequirementRow
            icon={<Scale className="h-3.5 w-3.5" />}
            label={
              isFreshAfterCalibration
                ? t('calibrationReadiness.weighInsNew')
                : t('calibrationReadiness.weighIns')
            }
            current={weighIns.current}
            required={weighIns.required}
            isFocus={focus === 'weighIns'}
            hint={t('calibrationReadiness.weighInsHint')}
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
            {t(`calibrationReadiness.${nextStepKey}`, {
              count: daysUntilNextWeighInUseful ?? 0,
            })}
          </p>
        </div>

        {/* Genväg till vägningen. Nästa steg var tidigare en uppmaning utan
            väg framåt — den som ville följa den fick själv leta reda på
            viktspårningen i profilen. Visas bara när det är just vägningar
            som saknas. */}
        {(focus === 'weighIns' || (blocking === 'clusterGap' && !daysUntilNextWeighInUseful)) && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-full text-xs"
            onClick={() => navigate('/app/profile?weight=open')}
          >
            {t('calibrationReadiness.logWeightCta')}
          </Button>
        )}

        {!hasCalibratedBefore && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
            {t('calibrationReadiness.explainer')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
