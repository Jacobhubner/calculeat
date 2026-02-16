import { cn } from '@/lib/utils'

interface MealMacroBreakdownProps {
  fat: number
  carbs: number
  protein: number
  totalWeight: number // gram
  className?: string
}

/**
 * Mini pie chart component for macro visualization
 */
function MiniPieChart({
  segments,
  size = 40,
  strokeWidth = 5,
  label,
}: {
  segments: { percent: number; color: string; label: string }[]
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  // Pre-calculate offsets to avoid mutation during render
  const segmentOffsets = segments.reduce<number[]>((acc, segment, i) => {
    const prev = i === 0 ? 0 : acc[i - 1] + (segments[i - 1].percent / 100) * circumference
    acc.push(prev)
    return acc
  }, [])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-100"
        />
        {/* Segments */}
        {segments.map((segment, i) => {
          const dashLength = (segment.percent / 100) * circumference
          const dashOffset = -segmentOffsets[i]

          if (segment.percent <= 0) return null

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
      {label && <span className="text-[10px] text-neutral-500 font-medium">{label}</span>}
      {/* Percentage labels */}
      <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5 text-[10px]">
        {segments.map((segment, i) => (
          <span key={i} style={{ color: segment.color }} className="font-medium">
            {segment.label}:{segment.percent.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Displays macro breakdown for a meal with two mini pie charts
 * - Vikt: Shows what % of total food weight is each macro
 * - Makro: Shows what % of macro grams is each macro
 */
export function MealMacroBreakdown({
  fat,
  carbs,
  protein,
  totalWeight,
  className,
}: MealMacroBreakdownProps) {
  // Total macro grams
  const totalMacroGrams = fat + carbs + protein

  // Early return if no macros
  if (totalMacroGrams === 0) return null

  // Weight percentages (of total food weight)
  const fatWeightPercent = totalWeight > 0 ? (fat / totalWeight) * 100 : 0
  const carbWeightPercent = totalWeight > 0 ? (carbs / totalWeight) * 100 : 0
  const proteinWeightPercent = totalWeight > 0 ? (protein / totalWeight) * 100 : 0

  // Macro percentages (of total macro grams)
  const fatMacroPercent = (fat / totalMacroGrams) * 100
  const carbMacroPercent = (carbs / totalMacroGrams) * 100
  const proteinMacroPercent = (protein / totalMacroGrams) * 100

  // Segment colors
  const fatColor = '#facc15' // yellow-400
  const carbColor = '#60a5fa' // blue-400
  const proteinColor = '#f87171' // red-400

  return (
    <div className={cn('mt-3 pt-2 border-t border-neutral-100', className)}>
      <div className="flex items-start justify-center gap-4 sm:gap-6">
        {/* Weight pie chart (only if weight is available) */}
        {totalWeight > 0 && (
          <MiniPieChart
            segments={[
              { percent: fatWeightPercent, color: fatColor, label: 'F' },
              { percent: carbWeightPercent, color: carbColor, label: 'K' },
              { percent: proteinWeightPercent, color: proteinColor, label: 'P' },
            ]}
            size={44}
            strokeWidth={6}
            label="Vikt"
          />
        )}

        {/* Macro pie chart */}
        <MiniPieChart
          segments={[
            { percent: fatMacroPercent, color: fatColor, label: 'F' },
            { percent: carbMacroPercent, color: carbColor, label: 'K' },
            { percent: proteinMacroPercent, color: proteinColor, label: 'P' },
          ]}
          size={44}
          strokeWidth={6}
          label="Makro"
        />
      </div>
    </div>
  )
}
