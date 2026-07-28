import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickSummaryCardsProps {
  calorieDeficit: number
  weightChange?: number
  isWeightTrendingDown?: boolean
}

export function QuickSummaryCards({
  calorieDeficit,
  weightChange = 0,
  isWeightTrendingDown = false,
}: QuickSummaryCardsProps) {
  const { t } = useTranslation('dashboard')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Calorie Deficit Card */}
      <Card variant="gradient" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                {t('summary.calorieDeficit') || 'Calorie Deficit'}
              </p>
              <p className="text-3xl font-bold text-primary-600">{Math.abs(calorieDeficit)}</p>
              <p className="text-xs text-neutral-500 mt-1">kcal/dag</p>
            </div>
            <div className="p-2 rounded-lg bg-primary-100">
              <TrendingDown className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <p className="text-xs text-neutral-600">
            {calorieDeficit < 0 ? 'Surplus' : 'Deficit tracking'}
          </p>
        </CardContent>
      </Card>

      {/* Weight Trend Card */}
      <Card variant="gradient" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wider">
                {t('summary.weightTrend') || 'Weight Trend'}
              </p>
              <div className="flex items-baseline gap-1">
                <p
                  className={cn('text-3xl font-bold', {
                    'text-success-600': isWeightTrendingDown,
                    'text-error-600': !isWeightTrendingDown && weightChange > 0,
                    'text-neutral-600': weightChange === 0,
                  })}
                >
                  {isWeightTrendingDown ? '-' : '+'}
                  {Math.abs(weightChange).toFixed(1)}
                </p>
                <p
                  className={cn('text-sm font-semibold', {
                    'text-success-600': isWeightTrendingDown,
                    'text-error-600': !isWeightTrendingDown && weightChange > 0,
                    'text-neutral-600': weightChange === 0,
                  })}
                >
                  kg
                </p>
              </div>
              <p className="text-xs text-neutral-500 mt-1">this month</p>
            </div>
            <div
              className={cn('p-2 rounded-lg', {
                'bg-success-100': isWeightTrendingDown,
                'bg-error-100': !isWeightTrendingDown && weightChange > 0,
                'bg-neutral-100': weightChange === 0,
              })}
            >
              {isWeightTrendingDown ? (
                <TrendingDown
                  className={cn('h-5 w-5', {
                    'text-success-600': isWeightTrendingDown,
                  })}
                />
              ) : (
                <TrendingUp
                  className={cn('h-5 w-5', {
                    'text-error-600': !isWeightTrendingDown && weightChange > 0,
                    'text-neutral-600': weightChange === 0,
                  })}
                />
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-600">
            {isWeightTrendingDown ? '↘ Losing' : '↗ Gaining'} weight
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
