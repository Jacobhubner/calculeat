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

  const isOver = consumed > max

  return (
    <Card variant="gradient" className="border-t-4 border-t-neutral-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-8">
          {/* Left: Ring + Info */}
          <div className="flex flex-col items-center gap-6 flex-1">
            {/* Ring */}
            <ZonedCalorieRing consumed={consumed} min={min} max={max} size="lg" />
          </div>

          {/* Right: CTA Section */}
          <div className="flex flex-col gap-4 flex-1 w-full lg:w-auto">
            {/* Main CTA Button */}
            <Link to="/app/today" className="w-full">
              <Button className="w-full gap-3 text-lg py-7 bg-gradient-to-r from-primary-600 to-emerald-500 hover:from-primary-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="h-6 w-6" />
                {t('quickLinks.logFood')}
              </Button>
            </Link>

            {/* Tips or Info */}
            {isOver && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-error-700">{t('ring.exceededAlert')}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
