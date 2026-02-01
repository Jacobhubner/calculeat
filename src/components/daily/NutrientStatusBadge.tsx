import { cn } from '@/lib/utils'
import type { NutrientStatus } from '@/lib/calculations/dailySummary'
import { getStatusBadgeConfig } from '@/lib/calculations/dailySummary'

interface NutrientStatusBadgeProps {
  status: NutrientStatus
  label: string
  showValue?: boolean
  showDifference?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Badge component for displaying nutrient status with ⇧/✔/⇩ indicators
 * Matches Excel "Today" sheet styling
 */
export function NutrientStatusBadge({
  status,
  label,
  showValue = true,
  showDifference = true,
  size = 'md',
  className,
}: NutrientStatusBadgeProps) {
  const config = getStatusBadgeConfig(status)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border',
        config.bgClass,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('font-medium', config.colorClass)}>{label}</span>
      {showValue && (
        <span className={cn('font-semibold', config.textClass)}>{Math.round(status.current)}</span>
      )}
      {showDifference && (
        <span className={cn('font-medium', config.colorClass)}>{status.displayText}</span>
      )}
    </div>
  )
}

interface NutrientStatusRowProps {
  status: NutrientStatus
  label: string
  unit?: string
  showProgress?: boolean
  className?: string
}

/**
 * Row component for displaying nutrient status with optional progress bar
 */
export function NutrientStatusRow({
  status,
  label,
  unit = '',
  showProgress = false,
  className,
}: NutrientStatusRowProps) {
  const config = getStatusBadgeConfig(status)

  // Calculate positions for zone-based progress bar (same as RangeProgressBar)
  const effectiveAbsoluteMax = status.max * 1.2
  const minPosition = status.max > 0 ? (status.min / effectiveAbsoluteMax) * 100 : 0
  const maxPosition = status.max > 0 ? (status.max / effectiveAbsoluteMax) * 100 : 0
  const valuePosition =
    status.max > 0 ? Math.min((status.current / effectiveAbsoluteMax) * 100, 100) : 0
  const goalZoneWidth = maxPosition - minPosition
  const overZoneWidth = 100 - maxPosition

  // Get bar color based on status
  const getBarColor = () => {
    if (status.status === 'over') return 'bg-red-600'
    if (status.status === 'within') return 'bg-green-600'
    return 'bg-blue-600'
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">
            {Math.round(status.current)} / {Math.round(status.min)}-{Math.round(status.max)}
            {unit && ` ${unit}`}
          </span>
          <span className={cn('text-sm font-medium', config.colorClass)}>{status.displayText}</span>
        </div>
      </div>
      {showProgress && (
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

          {/* Filled bar (consumed value) - strong color */}
          <div
            className={cn(
              'absolute h-full rounded-full transition-all duration-300 shadow-sm',
              getBarColor()
            )}
            style={{ width: `${valuePosition}%` }}
          />

          {/* Min indicator line */}
          <div
            className="absolute w-0.5 h-full bg-green-700 z-10"
            style={{ left: `${minPosition}%` }}
            title={`Min: ${Math.round(status.min)} ${unit}`}
          />

          {/* Max indicator line */}
          <div
            className="absolute w-0.5 h-full bg-red-700 z-10"
            style={{ left: `${maxPosition}%` }}
            title={`Max: ${Math.round(status.max)} ${unit}`}
          />
        </div>
      )}
    </div>
  )
}

interface CompactStatusIndicatorProps {
  status: NutrientStatus
  label: string
  className?: string
}

/**
 * Compact status indicator with just icon and label
 */
export function CompactStatusIndicator({ status, label, className }: CompactStatusIndicatorProps) {
  const config = getStatusBadgeConfig(status)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className={cn('text-lg', config.colorClass)}>{config.icon}</span>
      <span className="text-sm text-neutral-700">{label}</span>
    </div>
  )
}

interface StatusIconProps {
  status: NutrientStatus['status']
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Just the status icon (⇧/✔/⇩)
 */
export function StatusIcon({ status, size = 'md', className }: StatusIconProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const colorClasses = {
    under: 'text-sky-600',
    within: 'text-green-600',
    over: 'text-red-600',
  }

  const icons = {
    under: '⇧',
    within: '✔',
    over: '⇩',
  }

  return (
    <span className={cn(sizeClasses[size], colorClasses[status], className)}>{icons[status]}</span>
  )
}
