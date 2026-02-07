import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NutrientStatus } from '@/lib/calculations/dailySummary'
import { getStatusBadgeConfig } from '@/lib/calculations/dailySummary'

interface ColorBalanceCardProps {
  greenCalories: number
  yellowCalories: number
  orangeCalories: number
  greenStatus: NutrientStatus
  yellowStatus: NutrientStatus
  orangeStatus: NutrientStatus
  colorTargets: {
    green: number
    yellow: number
    orange: number
  }
  caloriesMin: number
  caloriesMax: number
  showCard?: boolean
  size?: 'sm' | 'md' // sm = compact for embedding, md = default
  className?: string
}

/**
 * Card showing color category balance (Green/Yellow/Orange)
 * Based on energy density classification
 */
export function ColorBalanceCard({
  greenCalories,
  yellowCalories,
  orangeCalories,
  greenStatus,
  yellowStatus,
  orangeStatus,
  colorTargets,
  caloriesMin,
  caloriesMax,
  showCard = true,
  size = 'md',
  className,
}: ColorBalanceCardProps) {
  const isCompact = size === 'sm'

  const content = (
    <div className={cn(isCompact ? 'space-y-1' : 'space-y-3', className)}>
      {/* Header */}
      <h3 className="text-sm font-medium text-neutral-700">Kaloritäthet</h3>

      {/* Color rows */}
      <div className={isCompact ? 'space-y-1' : 'space-y-2'}>
        <ColorRow
          color="green"
          label="Grön"
          calories={greenCalories}
          status={greenStatus}
          targetPercent={colorTargets.green}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
          compact={isCompact}
        />
        <ColorRow
          color="yellow"
          label="Gul"
          calories={yellowCalories}
          status={yellowStatus}
          targetPercent={colorTargets.yellow}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
          compact={isCompact}
        />
        <ColorRow
          color="orange"
          label="Orange"
          calories={orangeCalories}
          status={orangeStatus}
          targetPercent={colorTargets.orange}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
          compact={isCompact}
        />
      </div>
    </div>
  )

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-lg">🎨</span>
            Kaloritäthet
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}

interface ColorRowProps {
  color: 'green' | 'yellow' | 'orange'
  label: string
  calories: number
  status: NutrientStatus
  targetPercent: number
  caloriesMin: number
  caloriesMax: number
  compact?: boolean
}

function ColorRow({
  color,
  label,
  calories,
  status,
  targetPercent,
  caloriesMin,
  caloriesMax,
  compact = false,
}: ColorRowProps) {
  const statusConfig = getStatusBadgeConfig(status)

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      dot: 'bg-green-500',
      text: 'text-green-700',
      lightText: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      text: 'text-yellow-700',
      lightText: 'text-yellow-600',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      text: 'text-orange-700',
      lightText: 'text-orange-600',
    },
  }

  const classes = colorClasses[color]

  if (compact) {
    // Ultra-compact single-line layout
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', classes.dot)} />
        <span className={cn('font-medium min-w-[45px]', classes.text)}>{label}</span>
        <span className={cn('font-semibold', classes.text)}>{calories}</span>
        <span className="text-neutral-400">/</span>
        <span className="text-neutral-500">
          {Math.round(caloriesMin * targetPercent)}-{Math.round(caloriesMax * targetPercent)}
        </span>
        <span className={cn('ml-auto font-medium', statusConfig.colorClass)}>
          {status.displayText}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border p-2',
        classes.bg,
        classes.border
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('rounded-full w-3 h-3', classes.dot)} />
        <span className={cn('font-medium text-sm', classes.text)}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('font-semibold text-sm', classes.text)}>{calories} kcal</span>
        <span className={cn('text-xs', classes.lightText)}>
          {Math.round(caloriesMin * targetPercent)}-{Math.round(caloriesMax * targetPercent)}
        </span>
        <span className={cn('font-medium text-sm', statusConfig.colorClass)}>
          {status.displayText}
        </span>
      </div>
    </div>
  )
}

interface ColorBalanceCompactProps {
  greenCalories: number
  yellowCalories: number
  orangeCalories: number
  className?: string
}

/**
 * Compact version showing just the three color values
 */
export function ColorBalanceCompact({
  greenCalories,
  yellowCalories,
  orangeCalories,
  className,
}: ColorBalanceCompactProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex-1 text-center p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-700">{greenCalories}</div>
        <div className="text-xs text-green-600">Grön</div>
      </div>
      <div className="flex-1 text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-700">{yellowCalories}</div>
        <div className="text-xs text-yellow-600">Gul</div>
      </div>
      <div className="flex-1 text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-2xl font-bold text-orange-700">{orangeCalories}</div>
        <div className="text-xs text-orange-600">Orange</div>
      </div>
    </div>
  )
}

interface ColorBalanceBarProps {
  greenCalories: number
  yellowCalories: number
  orangeCalories: number
  className?: string
}

/**
 * Horizontal stacked bar showing color distribution
 */
export function ColorBalanceBar({
  greenCalories,
  yellowCalories,
  orangeCalories,
  className,
}: ColorBalanceBarProps) {
  const total = greenCalories + yellowCalories + orangeCalories

  if (total === 0) {
    return (
      <div className={cn('h-4 bg-neutral-100 rounded-full', className)}>
        <div className="h-full flex items-center justify-center text-xs text-neutral-400">
          Ingen data
        </div>
      </div>
    )
  }

  const greenPercent = (greenCalories / total) * 100
  const yellowPercent = (yellowCalories / total) * 100
  const orangePercent = (orangeCalories / total) * 100

  return (
    <div className={cn('h-4 flex rounded-full overflow-hidden', className)}>
      {greenPercent > 0 && (
        <div
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${greenPercent}%` }}
          title={`Grön: ${greenCalories} kcal (${Math.round(greenPercent)}%)`}
        />
      )}
      {yellowPercent > 0 && (
        <div
          className="bg-yellow-500 transition-all duration-300"
          style={{ width: `${yellowPercent}%` }}
          title={`Gul: ${yellowCalories} kcal (${Math.round(yellowPercent)}%)`}
        />
      )}
      {orangePercent > 0 && (
        <div
          className="bg-orange-500 transition-all duration-300"
          style={{ width: `${orangePercent}%` }}
          title={`Orange: ${orangeCalories} kcal (${Math.round(orangePercent)}%)`}
        />
      )}
    </div>
  )
}
