import { Card } from './ui/card'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface CalorieRingProps {
  consumed: number
  target: number
  min?: number
  max?: number
  remaining?: number
  className?: string
}

export default function CalorieRing({
  consumed,
  target,
  min,
  max,
  remaining,
  className,
}: CalorieRingProps) {
  const { t } = useTranslation('dashboard')
  const goalForProgress = max || target
  const percentage = Math.min((consumed / goalForProgress) * 100, 100)
  const calculatedRemaining = remaining ?? Math.max(goalForProgress - consumed, 0)
  const isOverTarget = consumed > goalForProgress

  const getRingColor = () => {
    if (!min) return isOverTarget ? 'text-error-500' : 'text-primary-500'

    if (consumed < min) return 'text-sky-400' // Ljusblå - under min
    if (consumed >= min && consumed <= goalForProgress) return 'text-success-500' // Grön
    return 'text-error-500' // Röd - över max
  }

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
            className={cn('transition-all duration-500 ease-out', getRingColor())}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-5xl font-bold text-neutral-900">{Math.round(consumed)}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">kcal</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div className="text-center">
          {min && max ? (
            <p className="text-xl font-semibold text-neutral-900">
              {Math.round(min)} - {Math.round(max)}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-neutral-900">{Math.round(target)}</p>
          )}
          <p className="text-xs text-neutral-500 uppercase tracking-wide">{t('ring.goal')}</p>
        </div>
        <div className="text-center">
          <p
            className={cn(
              'text-2xl font-semibold',
              isOverTarget ? 'text-error-600' : 'text-success-600'
            )}
          >
            {isOverTarget ? '+' : ''}
            {isOverTarget
              ? Math.round(consumed - goalForProgress)
              : Math.round(calculatedRemaining)}
          </p>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {isOverTarget ? t('ring.over') : t('ring.remaining')}
          </p>
        </div>
      </div>
    </Card>
  )
}
