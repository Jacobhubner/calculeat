/**
 * Väljare för underskottsdjup — de tre nivåerna som styr hur djupt
 * kaloriunderskottet är under en nedgångsperiod.
 *
 * VARFÖR EN DELAD KOMPONENT: nivån väljs på två ställen — när perioden
 * startas (PhasePickerDialog) och när den justeras mitt i
 * (DeficitLevelDialog). Två kopior av samma lista skulle förr eller senare
 * visa olika takt eller olika etiketter för samma nivå, vilket är precis den
 * sortens tysta motsägelse som nivåvalet infördes för att få bort.
 *
 * Takten härleds ur TDEE med ratePercentForDeficitLevel — samma funktion som
 * Energimål använder — så talen här kan inte glida isär från profilens.
 */

import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { DEFICIT_LEVELS, type DeficitLevelId } from '@/lib/utils/deficitLevels'
import { ratePercentForDeficitLevel } from '@/lib/calculations/contestPrep'

interface Props {
  value: DeficitLevelId
  onChange: (level: DeficitLevelId) => void
  /** Behövs för att räkna om nivån till kg/vecka. */
  tdee: number
  weightKg: number
  /** Dölj rubriken när anroparen redan satt en egen. */
  hideLabel?: boolean
}

export function DeficitLevelPicker({ value, onChange, tdee, weightKg, hideLabel }: Props) {
  const { t } = useTranslation('dashboard')

  return (
    <div className="space-y-1.5">
      {!hideLabel && <Label className="text-xs">{t('phase.deficitLevel.label')}</Label>}
      <div className="grid gap-1.5">
        {DEFICIT_LEVELS.map(level => {
          const isSelected = value === level.id
          const rate = ratePercentForDeficitLevel({ level: level.id, tdee, weightKg })
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                isSelected
                  ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/25'
                  : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
              )}
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                {t(`phase.deficitLevel.${level.id}`)}
                <span className="ml-1.5 font-normal text-neutral-500 dark:text-neutral-400">
                  −{level.label}
                </span>
              </span>
              {rate && (
                <span className="shrink-0 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  {rate.kgMin}–{rate.kgMax} kg/v
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
