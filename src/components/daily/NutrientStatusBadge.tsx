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
  const progressPercent = status.max > 0 ? Math.min((status.current / status.max) * 100, 150) : 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">
            {Math.round(status.current)}
            {unit && ` ${unit}`}
          </span>
          <span className={cn('text-sm font-medium', config.colorClass)}>{status.displayText}</span>
        </div>
      </div>
      {showProgress && (
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              status.status === 'under' && 'bg-sky-400',
              status.status === 'within' && 'bg-green-500',
              status.status === 'over' && 'bg-red-500'
            )}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
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
