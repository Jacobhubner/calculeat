import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ZonedCalorieRing } from '@/components/daily/ZonedCalorieRing'

interface DashboardHeroSectionProps {
  consumed: number
  min: number
  max: number
}

export function DashboardHeroSection({ consumed, min, max }: DashboardHeroSectionProps) {
  const { t } = useTranslation('dashboard')

  // Calculate status
  const remaining = Math.max(min - consumed, 0)
  const isWithin = consumed >= min && consumed <= max
  const isOver = consumed > max

  // Get status display
  const getStatusDisplay = () => {
    if (isOver) {
      return {
        emoji: '🔴',
        text: t('status.exceeded') || 'Over Target',
        color: 'text-error-600',
        bgColor: 'bg-error-50',
      }
    }
    if (isWithin) {
      return {
        emoji: '🟢',
        text: t('status.onTarget') || 'On Target',
        color: 'text-success-600',
        bgColor: 'bg-success-50',
      }
    }
    return {
      emoji: '🟡',
      text: t('status.undershoot') || 'Under Target',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    }
  }

  const status = getStatusDisplay()

  return (
    <Card variant="gradient" className="border-t-4 border-t-primary-600 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-8">
          {/* Left: Ring + Info */}
          <div className="flex flex-col items-center gap-6 flex-1">
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full ${status.bgColor} flex items-center gap-2`}>
              <span className="text-2xl">{status.emoji}</span>
              <span className={`text-sm font-semibold ${status.color}`}>{status.text}</span>
            </div>

            {/* Ring */}
            <div className="relative">
              <ZonedCalorieRing consumed={consumed} min={min} max={max} size="lg" />

              {/* Remaining display overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-sm text-neutral-600 font-medium">{t('ring.remaining')}</p>
                  <p className="text-3xl font-bold text-primary-600">{isOver ? '0' : remaining}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('ring.calories')}</p>
                </div>
              </div>
            </div>

            {/* Breakdown Text */}
            <div className="text-center space-y-2 mt-4">
              <div className="text-sm text-neutral-600">
                <p className="font-medium">
                  {consumed.toLocaleString()} / {max.toLocaleString()} {t('ring.calories')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {t('ring.targetRange', { min: min.toLocaleString(), max: max.toLocaleString() })}
                </p>
              </div>
            </div>
          </div>

          {/* Right: CTA Section */}
          <div className="flex flex-col gap-6 flex-1 w-full lg:w-auto">
            {/* Main CTA Button */}
            <Link to="/app/today" className="w-full">
              <Button className="w-full gap-3 text-lg py-6 bg-gradient-to-r from-primary-600 to-emerald-500 hover:from-primary-700 hover:to-emerald-600">
                <Plus className="h-6 w-6" />
                {t('quickLinks.logFood')}
              </Button>
            </Link>

            {/* Secondary Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Calorie Target */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-200">
                <p className="text-xs text-neutral-600 font-medium mb-1">{t('ring.dailyGoal')}</p>
                <p className="text-lg font-bold text-neutral-900">{max.toLocaleString()}</p>
                <p className="text-[10px] text-neutral-500 mt-1">{t('ring.targetLabel')}</p>
              </div>

              {/* Burned (Exercise) */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-200">
                <p className="text-xs text-neutral-600 font-medium mb-1">{t('ring.burned')}</p>
                <p className="text-lg font-bold text-neutral-900">0</p>
                <p className="text-[10px] text-neutral-500 mt-1">{t('ring.exercise')}</p>
              </div>
            </div>

            {/* Tips or Info */}
            {isOver && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{t('ring.exceededAlert')}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
