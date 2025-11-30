import * as React from 'react'
import { cn } from '@/lib/utils'

interface TriZoneProgressProps {
  value: number // Konsumerade kalorier
  min: number // Min-gräns
  max: number // Max-gräns
  className?: string
}

const TriZoneProgress = React.forwardRef<HTMLDivElement, TriZoneProgressProps>(
  ({ value, min, max, className }, ref) => {
    const minPercentage = (min / max) * 100
    const valuePercentage = Math.min((value / max) * 100, 100)

    const getZoneColor = () => {
      if (value < min) return 'bg-sky-400' // Väldigt ljusblå - behöver äta mer
      if (value >= min && value <= max) return 'bg-success-500' // Grön - perfekt
      return 'bg-error-500' // Röd - över gränsen
    }

    return (
      <div ref={ref} className={cn('relative h-3 w-full overflow-hidden rounded-full', className)}>
        {/* Bakgrund med tre zoner */}
        <div className="absolute inset-0 flex">
          <div
            className="bg-sky-100 border-r-2 border-sky-300"
            style={{ width: `${minPercentage}%` }}
          />
          <div className="bg-success-100" style={{ width: `${100 - minPercentage}%` }} />
        </div>

        {/* Progress-indikator */}
        <div
          className={cn('h-full transition-all duration-300 ease-out', getZoneColor())}
          style={{ width: `${valuePercentage}%` }}
        />
      </div>
    )
  }
)

TriZoneProgress.displayName = 'TriZoneProgress'

export { TriZoneProgress }
