import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
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
  className,
}: ColorBalanceCardProps) {
  const content = (
    <div className={cn('space-y-3', className)}>
      {/* Header with info tooltip */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-neutral-700">Färgbalans</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-neutral-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">Färgkategorier</p>
              <p className="text-xs text-neutral-300 mb-2">
                Livsmedel kategoriseras efter energitäthet (kalorier per gram):
              </p>
              <ul className="text-xs space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Grön: Låg energitäthet ({'<'}1 kcal/g)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Gul: Medel energitäthet (1-2.4 kcal/g)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Orange: Hög energitäthet ({'>'}2.4 kcal/g)</span>
                </li>
              </ul>
              <p className="text-xs text-neutral-400 mt-2">
                Mål: {Math.round(colorTargets.green * 100)}% grön,{' '}
                {Math.round(colorTargets.yellow * 100)}% gul,{' '}
                {Math.round(colorTargets.orange * 100)}% orange
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Color rows */}
      <div className="space-y-2">
        <ColorRow
          color="green"
          label="Grön"
          calories={greenCalories}
          status={greenStatus}
          targetPercent={colorTargets.green}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
        />
        <ColorRow
          color="yellow"
          label="Gul"
          calories={yellowCalories}
          status={yellowStatus}
          targetPercent={colorTargets.yellow}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
        />
        <ColorRow
          color="orange"
          label="Orange"
          calories={orangeCalories}
          status={orangeStatus}
          targetPercent={colorTargets.orange}
          caloriesMin={caloriesMin}
          caloriesMax={caloriesMax}
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
            Färgbalans
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
}

function ColorRow({
  color,
  label,
  calories,
  status,
  targetPercent,
  caloriesMin: _caloriesMin,
  caloriesMax: _caloriesMax,
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

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded-lg border',
        classes.bg,
        classes.border
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-3 h-3 rounded-full', classes.dot)} />
        <span className={cn('font-medium', classes.text)}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-sm font-semibold', classes.text)}>{calories} kcal</span>
        <span className={cn('text-xs', classes.lightText)}>
          mål: {Math.round(targetPercent * 100)}%
        </span>
        <span className={cn('text-sm font-medium', statusConfig.colorClass)}>
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
