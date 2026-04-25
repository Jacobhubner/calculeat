import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface ZonedCalorieRingProps {
  consumed: number
  min: number
  max: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Circular progress ring with colored zones:
 * - Blue zone: 0 to min (under goal)
 * - Green zone: min to max (within goal)
 * - Red zone: above max (over goal)
 */
export function ZonedCalorieRing({
  consumed,
  min,
  max,
  className,
  size = 'md',
}: ZonedCalorieRingProps) {
  // Clamp inputs: max can't be negative, min can't exceed max
  const safeMax = Math.max(0, max)
  const safeMin = Math.min(Math.max(0, min), safeMax)

  // Use 120% of max as the visual max so there's room to show "over"
  const visualMax = safeMax > 0 ? safeMax * 1.2 : 1 // avoid division by zero

  // Calculate percentages for each zone
  const minPercent = (safeMin / visualMax) * 100
  const maxPercent = (safeMax / visualMax) * 100
  const consumedPercent = Math.min((consumed / visualMax) * 100, 100)

  // Calculate remaining (count to min, not max)
  const remaining = Math.max(safeMin - consumed, 0)
  const isWithin = consumed >= safeMin && consumed <= safeMax
  const isOver = consumed > safeMax

  // Size configurations
  const sizeConfig = {
    sm: { size: 140, strokeWidth: 12, textSize: 'text-2xl', subTextSize: 'text-[10px]' },
    md: { size: 180, strokeWidth: 14, textSize: 'text-3xl', subTextSize: 'text-xs' },
    lg: { size: 220, strokeWidth: 16, textSize: 'text-4xl', subTextSize: 'text-sm' },
  }

  const { t } = useTranslation('dashboard')
  const config = sizeConfig[size]
  const radius = (config.size - config.strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  // Calculate dash offsets for zones
  // We draw arcs from the top (rotated -90deg)
  const minOffset = circumference - (minPercent / 100) * circumference
  const consumedOffset = circumference - (consumedPercent / 100) * circumference

  // Get status color for consumed arc
  const getConsumedColor = () => {
    if (isOver) return 'text-error-500'
    if (isWithin) return 'text-success-500'
    return 'text-sky-400'
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg width={config.size} height={config.size} className="transform -rotate-90">
          {/* Zone 1: Sky zone (0 to min) - background */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={minOffset}
            className="text-sky-100"
          />

          {/* Zone 2: Success zone (min to max) — clamped to 0 if min > max */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={`${Math.max(0, (maxPercent - minPercent) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((minPercent / 100) * circumference)}
            className="text-success-100"
          />

          {/* Zone 3: Error zone (max to visual max) — clamped to 0 */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={`${Math.max(0, (100 - maxPercent) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((maxPercent / 100) * circumference)}
            className="text-error-100"
          />

          {/* Consumed progress arc */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={consumedOffset}
            strokeLinecap="round"
            className={cn('transition-all duration-500 ease-out', getConsumedColor())}
          />

          {/* Min indicator mark */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth + 4}
            fill="none"
            strokeDasharray={`2 ${circumference - 2}`}
            strokeDashoffset={-((minPercent / 100) * circumference) + 1}
            className="text-success-700"
          />

          {/* Max indicator mark */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth + 4}
            fill="none"
            strokeDasharray={`2 ${circumference - 2}`}
            strokeDashoffset={-((maxPercent / 100) * circumference) + 1}
            className="text-error-700"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={cn('font-bold text-neutral-900', config.textSize)}>
            {Math.round(consumed)}
          </p>
          <p className={cn('text-neutral-500 uppercase tracking-wide', config.subTextSize)}>kcal</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 text-center">
        <div>
          <p className="text-lg font-semibold text-neutral-900">
            {Math.round(safeMin)}-{Math.round(safeMax)}{' '}
            <span className="text-sm font-normal text-neutral-400">kcal</span>
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{t('ring.goal')}</p>
        </div>
        <div className="h-8 w-px bg-neutral-200" />
        <div>
          <p
            className={cn('text-lg font-semibold', isOver ? 'text-error-600' : 'text-neutral-700')}
          >
            {isOver ? `+${Math.round(consumed - max)}` : Math.round(remaining)}{' '}
            <span className="text-sm font-normal text-neutral-400">kcal</span>
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">
            {isOver ? t('ring.over') : t('ring.remaining')}
          </p>
        </div>
      </div>
    </div>
  )
}
