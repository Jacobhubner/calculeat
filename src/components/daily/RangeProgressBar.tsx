import { cn } from '@/lib/utils'

interface RangeProgressBarProps {
  value: number // Current value
  min: number // Min goal
  max: number // Max goal
  absoluteMax?: number // For calculating bar width (default: max * 1.2)
  label: string // "Kalorier" | "Protein"
  unit: string // "kcal" | "g"
  size?: 'sm' | 'md' // sm for meals, md for main bars
  showLabel?: boolean // Show label and header (default: true)
}

export function RangeProgressBar({
  value,
  min,
  max,
  absoluteMax,
  label,
  unit,
  size = 'md',
  showLabel = true,
}: RangeProgressBarProps) {
  // Calculate absolute max for bar width (120% of max goal by default)
  const effectiveAbsoluteMax = absoluteMax ?? max * 1.2

  // Calculate positions as percentages
  const minPosition = (min / effectiveAbsoluteMax) * 100
  const maxPosition = (max / effectiveAbsoluteMax) * 100
  const valuePosition = Math.min((value / effectiveAbsoluteMax) * 100, 100)
  const goalZoneWidth = maxPosition - minPosition
  const overZoneWidth = 100 - maxPosition

  // Determine status and colors
  const getStatus = () => {
    if (value < min) {
      return {
        status: 'under' as const,
        difference: min - value,
        text: `⇧ ${Math.round(min - value)} ${unit}`,
        barColor: 'bg-blue-600',
        textColor: 'text-blue-600',
      }
    } else if (value <= max) {
      return {
        status: 'within' as const,
        difference: max - value,
        text: value === 0 ? '' : '✓',
        barColor: 'bg-green-600',
        textColor: 'text-green-600',
      }
    } else {
      return {
        status: 'over' as const,
        difference: value - max,
        text: `⇩ ${Math.round(value - max)} ${unit}`,
        barColor: 'bg-red-600',
        textColor: 'text-red-600',
      }
    }
  }

  const statusInfo = getStatus()

  const barHeight = size === 'sm' ? 'h-2' : 'h-3'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="space-y-1">
      {/* Header */}
      {showLabel && (
        <div className={cn('flex justify-between', textSize)}>
          <span className="font-medium">{label}</span>
          <span className="text-neutral-600">
            {Math.round(value)} / {Math.round(min)}-{Math.round(max)} {unit}
          </span>
        </div>
      )}

      {/* Progress track with zone backgrounds */}
      <div className={cn('relative rounded-full overflow-hidden', barHeight)}>
        {/* Zone 1: Path to goal (0 to min) - light blue/gray */}
        <div
          className="absolute h-full bg-blue-100"
          style={{ left: 0, width: `${minPosition}%` }}
        />

        {/* Zone 2: Goal zone (min to max) - light green */}
        <div
          className="absolute h-full bg-green-200"
          style={{
            left: `${minPosition}%`,
            width: `${goalZoneWidth}%`,
          }}
        />

        {/* Zone 3: Over zone (max to end) - light red */}
        <div
          className="absolute h-full bg-red-200"
          style={{
            left: `${maxPosition}%`,
            width: `${overZoneWidth}%`,
          }}
        />

        {/* Filled bar (consumed value) - strong color */}
        <div
          className={cn(
            'absolute h-full rounded-full transition-all duration-300 shadow-sm',
            statusInfo.barColor
          )}
          style={{ width: `${valuePosition}%` }}
        />

        {/* Min indicator line */}
        <div
          className="absolute w-0.5 h-full bg-green-700 z-10"
          style={{ left: `${minPosition}%` }}
          title={`Min: ${Math.round(min)} ${unit}`}
        />

        {/* Max indicator line */}
        <div
          className="absolute w-0.5 h-full bg-red-700 z-10"
          style={{ left: `${maxPosition}%` }}
          title={`Max: ${Math.round(max)} ${unit}`}
        />
      </div>

      {/* Status text */}
      {statusInfo.text && (
        <p className={cn(textSize === 'text-sm' ? 'text-xs' : 'text-[10px]', statusInfo.textColor)}>
          {statusInfo.text}
        </p>
      )}
    </div>
  )
}

// Compact version for meal cards with zone backgrounds and min-max range
interface MealProgressBarProps {
  current: number
  targetMin: number // Min goal for this meal
  targetMax: number // Max goal for this meal
  unit?: string
}

export function MealProgressBar({
  current,
  targetMin,
  targetMax,
  unit = 'kcal',
}: MealProgressBarProps) {
  // Use 120% of max as the visual max so the lines aren't at the edge
  const visualMax = targetMax * 1.2
  const progress = visualMax > 0 ? Math.min((current / visualMax) * 100, 100) : 0
  const minPosition = (targetMin / visualMax) * 100
  const maxPosition = (targetMax / visualMax) * 100
  const goalZoneWidth = maxPosition - minPosition
  const overZoneWidth = 100 - maxPosition

  const getBarColor = () => {
    if (current > targetMax) return 'bg-red-600'
    if (current >= targetMin) return 'bg-green-600'
    return 'bg-blue-600'
  }

  const getStatusText = () => {
    if (current < targetMin) return `⇧ ${Math.round(targetMin - current)} ${unit}`
    if (current > targetMax) return `⇩ ${Math.round(current - targetMax)} ${unit}`
    return '✓'
  }

  const getStatusColor = () => {
    if (current > targetMax) return 'text-red-600'
    if (current >= targetMin) return 'text-green-600'
    return 'text-neutral-500'
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
        <span>
          {Math.round(current)} / {Math.round(targetMin)}-{Math.round(targetMax)} {unit}
        </span>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden">
        {/* Zone 1: Path to goal (0 to min) - light blue */}
        <div
          className="absolute h-full bg-blue-100"
          style={{ left: 0, width: `${minPosition}%` }}
        />

        {/* Zone 2: Goal zone (min to max) - light green */}
        <div
          className="absolute h-full bg-green-200"
          style={{
            left: `${minPosition}%`,
            width: `${goalZoneWidth}%`,
          }}
        />

        {/* Zone 3: Over zone (max to end) - light red */}
        <div
          className="absolute h-full bg-red-200"
          style={{
            left: `${maxPosition}%`,
            width: `${overZoneWidth}%`,
          }}
        />

        {/* Filled bar - strong color */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all shadow-sm',
            getBarColor()
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Min indicator line */}
        <div
          className="absolute w-0.5 h-full bg-green-700 z-10"
          style={{ left: `${minPosition}%` }}
          title={`Min: ${Math.round(targetMin)} ${unit}`}
        />

        {/* Max indicator line */}
        <div
          className="absolute w-0.5 h-full bg-red-700 z-10"
          style={{ left: `${maxPosition}%` }}
          title={`Max: ${Math.round(targetMax)} ${unit}`}
        />
      </div>
    </div>
  )
}
