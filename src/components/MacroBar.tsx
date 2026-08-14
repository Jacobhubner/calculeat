import { Card } from './ui/card'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { MACRO_COLORS } from '@/lib/constants/macroColors'

interface MacroData {
  grams: number
  gramsMin?: number
  gramsMax?: number
  calories: number
  percentage: number
}

interface MacroBarProps {
  protein: MacroData
  carbs: MacroData
  fat: MacroData
  className?: string
}

export default function MacroBar({ protein, carbs, fat, className }: MacroBarProps) {
  const { t } = useTranslation('history')
  const dataMap = { fat, carbs, protein }

  const MACROS = [
    {
      key: 'fat' as const,
      name: t('macros.fat'),
      hex: MACRO_COLORS.fat,
      hexLight: '#fef9c3',
      hexRange: '#fde68a',
    },
    {
      key: 'carbs' as const,
      name: t('macros.carbs'),
      hex: MACRO_COLORS.carbs,
      hexLight: '#ffedd5',
      hexRange: '#fed7aa',
    },
    {
      key: 'protein' as const,
      name: t('macros.protein'),
      hex: MACRO_COLORS.protein,
      hexLight: '#ffe4e6',
      hexRange: '#fecdd3',
    },
  ]

  // Total percentage for the stacked bar (use sum of percentages)
  const totalPct = MACROS.reduce((sum, m) => sum + dataMap[m.key].percentage, 0) || 100

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4 dark:text-neutral-100">
        {t('macros.distribution')}
      </h3>

      {/* Stacked bar: two layers per macro — min (solid) + extra-to-max (light) */}
      <div className="mb-6">
        <div className="flex h-6 rounded-full overflow-hidden gap-px bg-neutral-100 dark:bg-neutral-800">
          {MACROS.map(m => {
            const data = dataMap[m.key]
            const pct = (data.percentage / totalPct) * 100
            const hasRange =
              data.gramsMin != null && data.gramsMax != null && data.gramsMax > data.gramsMin
            // Split segment: min portion vs extra-to-max portion
            const minPct = hasRange ? (data.gramsMin! / data.gramsMax!) * 100 : 100

            return (
              <div
                key={m.key}
                className="relative overflow-hidden transition-all duration-500"
                style={{ width: `${pct}%` }}
              >
                {/* Base: light (range) */}
                <div className="absolute inset-0" style={{ backgroundColor: m.hexRange }} />
                {/* Solid: min portion */}
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ backgroundColor: m.hex, width: `${minPct}%` }}
                />
              </div>
            )
          })}
        </div>
        {/* Min/max labels under bar */}
        <div className="flex mt-1">
          {MACROS.map(m => {
            const data = dataMap[m.key]
            const pct = (data.percentage / totalPct) * 100
            const hasRange = data.gramsMin != null && data.gramsMax != null
            return (
              <div key={m.key} className="text-center overflow-hidden" style={{ width: `${pct}%` }}>
                {hasRange && (
                  <span className="text-[9px] text-neutral-400 whitespace-nowrap dark:text-neutral-500">
                    {data.gramsMin}–{data.gramsMax}g
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Macro detail cards */}
      <div className="grid grid-cols-3 gap-3">
        {MACROS.map(m => {
          const data = dataMap[m.key]
          const hasRange = data.gramsMin != null && data.gramsMax != null
          return (
            <div
              key={m.key}
              className="rounded-xl border border-transparent p-3 text-center"
              style={{ backgroundColor: m.hexLight }}
            >
              <p className="text-xl font-bold" style={{ color: m.hex }}>
                {data.grams}g
              </p>
              {hasRange && (
                <p className="text-[10px] text-neutral-500 leading-tight dark:text-neutral-400">
                  {data.gramsMin}–{data.gramsMax}g
                </p>
              )}
              <p className="text-xs font-medium text-neutral-700 mt-1 dark:text-neutral-200">
                {m.name}
              </p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {data.percentage}%
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
