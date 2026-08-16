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
 */

import { Zap, Scale, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import type { CalibrationAvailability } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CalibrationReadinessCardProps {
  availability: CalibrationAvailability
  /** Har användaren kalibrerat förut? Då behövs ingen introduktion. */
  hasCalibratedBefore: boolean
  className?: string
}

function RequirementRow({
  icon,
  label,
  hint,
  current,
  required,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  current: number
  required: number
}) {
  const done = current >= required
  const pct = required > 0 ? Math.min(100, (current / required) * 100) : 100

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
          {icon}
          {label}
        </span>
        <span
          className={cn(
            'text-xs tabular-nums font-medium',
            done ? 'text-green-600 dark:text-green-300' : 'text-neutral-500 dark:text-neutral-400'
          )}
        >
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
      {/* Visas bara för kravet som ligger efter — annars blir kortet en vägg av text */}
      {!done && hint && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{hint}</p>
      )}
    </div>
  )
}

export default function CalibrationReadinessCard({
  availability,
  hasCalibratedBefore,
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
            hint={t('calibrationReadiness.weighInsHint')}
            current={weighIns.current}
            required={weighIns.required}
          />
          <RequirementRow
            icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
            label={t('calibrationReadiness.logDays')}
            hint={t('calibrationReadiness.logDaysHint')}
            current={logDays.current}
            required={logDays.required}
          />
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
