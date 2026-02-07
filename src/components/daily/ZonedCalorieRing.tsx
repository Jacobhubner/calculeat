import { cn } from '@/lib/utils'

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
  // Use 120% of max as the visual max so there's room to show "over"
  const visualMax = max * 1.2

  // Calculate percentages for each zone
  const minPercent = (min / visualMax) * 100
  const maxPercent = (max / visualMax) * 100
  const consumedPercent = Math.min((consumed / visualMax) * 100, 100)

  // Calculate remaining (count to min, not max)
  const remaining = Math.max(min - consumed, 0)
  const isWithin = consumed >= min && consumed <= max
  const isOver = consumed > max

  // Size configurations
  const sizeConfig = {
    sm: { size: 140, strokeWidth: 12, textSize: 'text-2xl', subTextSize: 'text-[10px]' },
    md: { size: 180, strokeWidth: 14, textSize: 'text-3xl', subTextSize: 'text-xs' },
    lg: { size: 220, strokeWidth: 16, textSize: 'text-4xl', subTextSize: 'text-sm' },
  }

  const config = sizeConfig[size]
  const radius = (config.size - config.strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  // Calculate dash offsets for zones
  // We draw arcs from the top (rotated -90deg)
  const minOffset = circumference - (minPercent / 100) * circumference
  const consumedOffset = circumference - (consumedPercent / 100) * circumference

  // Get status color for consumed arc
  const getConsumedColor = () => {
    if (isOver) return 'text-red-500'
    if (isWithin) return 'text-green-500'
    return 'text-blue-500'
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg width={config.size} height={config.size} className="transform -rotate-90">
          {/* Zone 1: Blue zone (0 to min) - background */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={minOffset}
            className="text-blue-100"
          />

          {/* Zone 2: Green zone (min to max) */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={`${((maxPercent - minPercent) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((minPercent / 100) * circumference)}
            className="text-green-100"
          />

          {/* Zone 3: Red zone (max to visual max) */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={`${((100 - maxPercent) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((maxPercent / 100) * circumference)}
            className="text-red-100"
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
            className="text-green-700"
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
            className="text-red-700"
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
      <div className="mt-4 flex items-center justify-center gap-6 text-center">
        <div>
          <p className="text-lg font-semibold text-neutral-900">
            {Math.round(min)}-{Math.round(max)}
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Mål</p>
        </div>
        <div className="h-8 w-px bg-neutral-200" />
        <div>
          <p className={cn('text-lg font-semibold', isOver ? 'text-red-600' : 'text-neutral-700')}>
            {isOver ? `+${Math.round(consumed - max)}` : Math.round(remaining)}
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">
            {isOver ? 'Över' : 'Kvar'}
          </p>
        </div>
      </div>

      {/* Zone legend */}
      <div className="mt-1 flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-neutral-500">&lt;{Math.round(min)}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-neutral-500">
            {Math.round(min)}-{Math.round(max)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-neutral-500">&gt;{Math.round(max)}</span>
        </div>
      </div>
    </div>
  )
}
