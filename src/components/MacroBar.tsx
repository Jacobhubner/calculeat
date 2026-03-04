import { Card } from './ui/card'
import { cn } from '@/lib/utils'

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

const MACROS = [
  {
    key: 'fat' as const,
    name: 'Fett',
    color: 'bg-sky-500',
    lightColor: 'bg-sky-100',
    textColor: 'text-sky-700',
    rangeColor: 'bg-sky-200',
  },
  {
    key: 'carbs' as const,
    name: 'Kolhydrater',
    color: 'bg-accent-500',
    lightColor: 'bg-accent-100',
    textColor: 'text-accent-700',
    rangeColor: 'bg-accent-200',
  },
  {
    key: 'protein' as const,
    name: 'Protein',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-100',
    textColor: 'text-primary-700',
    rangeColor: 'bg-primary-200',
  },
]

export default function MacroBar({ protein, carbs, fat, className }: MacroBarProps) {
  const dataMap = { fat, carbs, protein }

  // Total percentage for the stacked bar (use sum of percentages)
  const totalPct = MACROS.reduce((sum, m) => sum + dataMap[m.key].percentage, 0) || 100

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Makrofördelning</h3>

      {/* Stacked bar: two layers per macro — min (solid) + extra-to-max (light) */}
      <div className="mb-6">
        <div className="flex h-6 rounded-full overflow-hidden gap-px bg-neutral-100">
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
                <div className={cn('absolute inset-0', m.rangeColor)} />
                {/* Solid: min portion */}
                <div
                  className={cn('absolute inset-y-0 left-0', m.color)}
                  style={{ width: `${minPct}%` }}
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
                  <span className="text-[9px] text-neutral-400 whitespace-nowrap">
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
              className={cn(
                'rounded-xl border p-3 text-center',
                m.lightColor,
                'border-transparent'
              )}
            >
              <p className={cn('text-xl font-bold', m.textColor)}>{data.grams}g</p>
              {hasRange && (
                <p className="text-[10px] text-neutral-500 leading-tight">
                  {data.gramsMin}–{data.gramsMax}g
                </p>
              )}
              <p className="text-xs font-medium text-neutral-700 mt-1">{m.name}</p>
              <p className="text-[10px] text-neutral-400">{data.percentage}%</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
