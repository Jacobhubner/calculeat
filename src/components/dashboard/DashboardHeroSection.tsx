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
    <Card
      variant="gradient"
      className="border-t-4 border-t-neutral-300 overflow-hidden dark:border-t-neutral-700"
    >
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
              {/* Mjuk grön yta i stället för full gradient: ringen bredvid bär
                  redan märkets färger, och en gradientknapp här blev både en
                  andra huvudperson och en tvilling till "+"-knappen i
                  mobilnavigeringen. */}
              <Button
                variant="ghost"
                className="w-full gap-3 text-lg py-7 bg-[#eaf5da] text-[#3f6b12] font-semibold hover:bg-[#dcefc4] hover:text-[#33590d] hover:translate-y-0 active:scale-[0.99] transition-colors dark:bg-primary-900/40 dark:text-primary-200 dark:hover:bg-primary-900/60 dark:hover:text-primary-100"
              >
                <Plus className="h-6 w-6" />
                {t('quickLinks.logFood')}
              </Button>
            </Link>

            {/* Tips or Info */}
            {isOver && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 flex gap-3 dark:bg-error-900/25 dark:border-error-800">
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5 dark:text-error-400" />
                <p className="text-sm font-medium text-error-700 dark:text-error-200">
                  {t('ring.exceededAlert')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
