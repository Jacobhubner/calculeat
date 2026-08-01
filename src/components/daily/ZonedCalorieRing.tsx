import { useId } from 'react'
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

  // Unik gradient-id per instans — ringen renderas på flera sidor samtidigt,
  // och delade SVG-id:n gör att den sist monterade vinner för alla.
  const glowId = useId()
  const glowDarkId = useId()

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg width={config.size} height={config.size} className="transform -rotate-90">
          <defs>
            {/* Loggans färger som mjuk glöd bakom ringen. Ligger under alla
                bågar och markörer, så statusavläsningen är oförändrad. */}
            <radialGradient id={glowId}>
              <stop offset="0%" stopColor="#edbe0c" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#7bbe2a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fc8518" stopOpacity="0" />
            </radialGradient>
            {/* Mörka bakgrunder slukar svaga toner, så glöden får högre
                opacitet i mörkt läge. Två gradienter i stället för en:
                stopOpacity är ett SVG-attribut och kan inte styras av
                dark:-klasser, bara valet av vilken cirkel som visas. */}
            <radialGradient id={glowDarkId}>
              <stop offset="0%" stopColor="#edbe0c" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#7bbe2a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#fc8518" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.size / 2 - 2}
            fill={`url(#${glowId})`}
            className="block dark:hidden"
          />
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.size / 2 - 2}
            fill={`url(#${glowDarkId})`}
            className="hidden dark:block"
          />

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
            // underzone-950 i stället för sky-950: den senare ligger på ~29 %
            // ljushet mot success-950:s 15 % och dominerade de andra zonerna.
            className="text-sky-100 dark:text-underzone-950"
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
            className="text-success-100 dark:text-success-950"
          />

          {/* Zone 3: Error zone (max to visual max) — clamped to 0.
              error-950 ligger på 14% L: error-900 (40% L) är för ljus för en
              bakgrundszon och skulle tävla med den betydelsebärande
              error-500-bågen. */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={`${Math.max(0, (100 - maxPercent) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((maxPercent / 100) * circumference)}
            className="text-error-100 dark:text-error-950"
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

          {/* Målmarkörer — ritas sist så de aldrig döljs av den konsumerade
              bågen. Understrecket ger kontrast oavsett vad som ligger under,
              så "här börjar målet" och "här är det för mycket" går att läsa
              av lika tydligt som förut. I mörkt läge vänds det från vitt till
              mörkt, annars lyser det som en rand mot den mörka ringen.
              stroke sätts via className (inte attributet) eftersom dark:
              bara kan påverka klasser. */}
          {[
            { percent: minPercent, color: 'text-success-700 dark:text-success-300' },
            { percent: maxPercent, color: 'text-error-700 dark:text-error-300' },
          ].map(mark => (
            <g key={mark.color}>
              <circle
                cx={config.size / 2}
                cy={config.size / 2}
                r={radius}
                strokeWidth={config.strokeWidth + 7}
                fill="none"
                className="stroke-white dark:stroke-neutral-900"
                strokeDasharray={`4 ${circumference - 4}`}
                strokeDashoffset={-((mark.percent / 100) * circumference) + 2}
              />
              <circle
                cx={config.size / 2}
                cy={config.size / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={config.strokeWidth + 7}
                fill="none"
                strokeDasharray={`2 ${circumference - 2}`}
                strokeDashoffset={-((mark.percent / 100) * circumference) + 1}
                className={mark.color}
              />
            </g>
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={cn('font-bold text-neutral-900 dark:text-neutral-100', config.textSize)}>
            {Math.round(consumed)}
          </p>
          <p
            className={cn(
              'text-neutral-500 uppercase tracking-wide dark:text-neutral-400',
              config.subTextSize
            )}
          >
            kcal
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 text-center">
        <div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {Math.round(safeMin)}-{Math.round(safeMax)} kcal
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide dark:text-neutral-400">
            Mål
          </p>
        </div>
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
        <div>
          <p
            className={cn(
              'text-lg font-semibold',
              isOver
                ? 'text-error-600 dark:text-error-400'
                : 'text-neutral-700 dark:text-neutral-300'
            )}
          >
            {isOver ? `+${Math.round(consumed - max)}` : Math.round(remaining)} kcal
          </p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide dark:text-neutral-400">
            {isOver ? 'Över' : 'Kvar'}
          </p>
        </div>
      </div>
    </div>
  )
}
