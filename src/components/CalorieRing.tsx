import { Card } from './ui/card'
import { cn } from '@/lib/utils'

interface CalorieRingProps {
  consumed: number
  target: number
  remaining?: number
  className?: string
}

export default function CalorieRing({ consumed, target, remaining, className }: CalorieRingProps) {
  const percentage = Math.min((consumed / target) * 100, 100)
  const calculatedRemaining = remaining ?? Math.max(target - consumed, 0)
  const isOverTarget = consumed > target

  // SVG Circle parameters
  const size = 200
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <Card className={cn('flex flex-col items-center justify-center p-6', className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-neutral-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-500 ease-out',
              isOverTarget ? 'text-error-500' : 'text-primary-500'
            )}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-bold text-neutral-900">{consumed}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">kcal</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-6 w-full">
        <div className="text-center">
          <p className="text-2xl font-semibold text-neutral-900">{target}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Mål</p>
        </div>
        <div className="text-center">
          <p
            className={cn(
              'text-2xl font-semibold',
              isOverTarget ? 'text-error-600' : 'text-success-600'
            )}
          >
            {isOverTarget ? '+' : ''}
            {isOverTarget ? consumed - target : calculatedRemaining}
          </p>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {isOverTarget ? 'Över' : 'Kvar'}
          </p>
        </div>
      </div>

      {/* Percentage */}
      <div className="mt-4">
        <p className="text-sm text-neutral-600">{Math.round(percentage)}% av dagligt mål</p>
      </div>
    </Card>
  )
}
