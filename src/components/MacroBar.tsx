import { Card } from './ui/card'
import { cn } from '@/lib/utils'

interface MacroData {
  grams: number
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
  const macros = [
    {
      name: 'Fett',
      data: fat,
      color: 'bg-success-500',
      lightColor: 'bg-success-100',
    },
    {
      name: 'Kolhydrater',
      data: carbs,
      color: 'bg-accent-500',
      lightColor: 'bg-accent-100',
    },
    {
      name: 'Protein',
      data: protein,
      color: 'bg-primary-500',
      lightColor: 'bg-primary-100',
    },
  ]

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Makrofördelning</h3>

      {/* Stacked Bar */}
      <div className="mb-6">
        <div className="flex h-8 rounded-full overflow-hidden">
          {macros.map(macro => (
            <div
              key={macro.name}
              className={cn('transition-all duration-500', macro.color)}
              style={{ width: `${macro.data.percentage}%` }}
            />
          ))}
        </div>
      </div>

      {/* Macro Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {macros.map(macro => (
          <div key={macro.name} className="text-center">
            <div className={cn('inline-block rounded-lg px-3 py-2 mb-2', macro.lightColor)}>
              <p className="text-2xl font-bold text-neutral-900">{macro.data.grams}g</p>
            </div>
            <p className="text-xs font-medium text-neutral-900 mb-1">{macro.name}</p>
            <p className="text-xs text-neutral-500">
              {macro.data.calories} kcal • {macro.data.percentage}%
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {macros.map(macro => (
          <div key={macro.name} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', macro.color)} />
            <span className="text-xs text-neutral-600">{macro.name}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
