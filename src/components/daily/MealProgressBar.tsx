import { cn } from '@/lib/utils'
import type { NutrientStatus } from '@/lib/calculations/dailySummary'
import { getStatusBadgeConfig } from '@/lib/calculations/dailySummary'

interface MealProgressBarProps {
  calories: number
  targetMin: number
  targetMax: number
  status: NutrientStatus
  showLabels?: boolean
  showStatus?: boolean
  height?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Progress bar for meal calorie tracking
 * Shows current calories vs meal-specific target range
 */
export function MealProgressBar({
  calories,
  targetMin,
  targetMax,
  status,
  showLabels = true,
  showStatus = true,
  height = 'md',
  className,
}: MealProgressBarProps) {
  const statusConfig = getStatusBadgeConfig(status)

  // Calculate progress percentage (relative to max target)
  const progressPercent = targetMax > 0 ? Math.min((calories / targetMax) * 100, 120) : 0

  // Calculate where the "green zone" starts and ends
  const minZonePercent = targetMax > 0 ? (targetMin / targetMax) * 100 : 0

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={cn('space-y-1', className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{calories} kcal</span>
          <span>
            {Math.round(targetMin)}-{Math.round(targetMax)} kcal
          </span>
        </div>
      )}

      {/* Progress bar with zones */}
      <div className="relative">
        {/* Background with zone indicators */}
        <div
          className={cn(
            'w-full bg-neutral-100 rounded-full overflow-hidden',
            heightClasses[height]
          )}
        >
          {/* Under-minimum zone (left part - cyan when under) */}
          <div
            className="absolute top-0 left-0 h-full bg-sky-50 rounded-l-full"
            style={{ width: `${minZonePercent}%` }}
          />

          {/* Target zone (green area) */}
          <div
            className="absolute top-0 h-full bg-green-50"
            style={{
              left: `${minZonePercent}%`,
              width: `${100 - minZonePercent}%`,
            }}
          />
        </div>

        {/* Progress fill */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300',
            heightClasses[height],
            status.status === 'under' && 'bg-sky-400',
            status.status === 'within' && 'bg-green-500',
            status.status === 'over' && 'bg-red-500'
          )}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />

        {/* Zone markers */}
        {targetMin > 0 && targetMin !== targetMax && (
          <div
            className="absolute top-0 h-full w-0.5 bg-neutral-300"
            style={{ left: `${minZonePercent}%` }}
          />
        )}
      </div>

      {showStatus && (
        <div className="flex justify-end">
          <span className={cn('text-xs font-medium', statusConfig.colorClass)}>
            {status.displayText}
          </span>
        </div>
      )}
    </div>
  )
}

interface MealProgressCompactProps {
  mealName: string
  mealPercent: number
  calories: number
  status: NutrientStatus
  className?: string
}

/**
 * Compact meal progress display for list view
 */
export function MealProgressCompact({
  mealName,
  mealPercent,
  calories,
  status,
  className,
}: MealProgressCompactProps) {
  const statusConfig = getStatusBadgeConfig(status)

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-700">{mealName}</span>
        <span className="text-xs text-neutral-400">({Math.round(mealPercent * 100)}%)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">{calories} kcal</span>
        <span className={cn('text-sm font-medium', statusConfig.colorClass)}>
          {status.displayText}
        </span>
      </div>
    </div>
  )
}

interface MealProgressHeaderProps {
  mealName: string
  mealPercent: number
  status: NutrientStatus
  className?: string
}

/**
 * Header component for meal cards showing name, percentage, and status
 */
export function MealProgressHeader({
  mealName,
  mealPercent,
  status,
  className,
}: MealProgressHeaderProps) {
  const statusConfig = getStatusBadgeConfig(status)

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-neutral-800">{mealName}</span>
        <span className="text-sm text-neutral-500">({Math.round(mealPercent * 100)}%)</span>
      </div>
      <span className={cn('text-sm font-medium', statusConfig.colorClass)}>
        {status.displayText}
      </span>
    </div>
  )
}

interface AllMealsProgressProps {
  meals: Array<{
    name: string
    percent: number
    calories: number
    status: NutrientStatus
  }>
  className?: string
}

/**
 * Display all meals progress in a compact list
 */
export function AllMealsProgress({ meals, className }: AllMealsProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {meals.map(meal => (
        <MealProgressCompact
          key={meal.name}
          mealName={meal.name}
          mealPercent={meal.percent}
          calories={meal.calories}
          status={meal.status}
        />
      ))}
    </div>
  )
}
