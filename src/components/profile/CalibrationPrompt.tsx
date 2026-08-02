/**
 * CalibrationPrompt - Shows when calibration is available in WeightTracker
 * Prompts user to calibrate TDEE based on weight trend data
 */

import { Button } from '@/components/ui/button'
import { Zap, TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle } from 'lucide-react'
import type { CalibrationAvailability, CalibrationHistory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CalibrationPromptProps {
  availability: CalibrationAvailability
  lastCalibration: CalibrationHistory | null
  onCalibrate: () => void
  className?: string
}

export default function CalibrationPrompt({
  availability,
  lastCalibration,
  onCalibrate,
  className,
}: CalibrationPromptProps) {
  if (!availability.isAvailable) {
    return null
  }

  const getTrendIcon = () => {
    switch (availability.weightTrend) {
      case 'losing':
        return <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-300" />
      case 'gaining':
        return <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-300" />
      case 'erratic':
        return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-300" />
      case 'stable':
        return <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
      default:
        return <Minus className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
    }
  }

  const getTrendText = () => {
    switch (availability.weightTrend) {
      case 'losing':
        return 'Viktminskning'
      case 'gaining':
        return 'Viktökning'
      case 'erratic':
        return 'Oregelbunden'
      case 'stable':
        return 'Stabil'
      default:
        return 'Okänd'
    }
  }

  const formatLastCalibration = () => {
    if (!lastCalibration) return null
    const date = new Date(lastCalibration.calibrated_at)
    return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        availability.isRecommended
          ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/25'
          : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-2',
            availability.isRecommended
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'bg-neutral-100 dark:bg-neutral-800'
          )}
        >
          <Zap
            className={cn(
              'h-4 w-4',
              availability.isRecommended
                ? 'text-primary-600 dark:text-primary-300'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {availability.isRecommended ? 'Kalibrering rekommenderas' : 'Kalibrering tillgänglig'}
            </h4>
            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              {getTrendIcon()}
              <span>{getTrendText()}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 mb-3 dark:text-neutral-400">
            {availability.reason}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {lastCalibration ? (
                <span>Senast: {formatLastCalibration()}</span>
              ) : (
                <span>Aldrig kalibrerad</span>
              )}
              {availability.daysSinceLastCalibration !== null && (
                <span className="ml-1">({availability.daysSinceLastCalibration} dagar sedan)</span>
              )}
              {availability.daysUntilNextRecommended !== null &&
                availability.daysUntilNextRecommended > 0 && (
                  <span className="ml-1 text-neutral-400 dark:text-neutral-500">
                    · nästa om {availability.daysUntilNextRecommended} dag
                    {availability.daysUntilNextRecommended !== 1 ? 'ar' : ''}
                  </span>
                )}
            </div>

            <Button
              size="sm"
              variant={availability.isRecommended ? 'primary' : 'outline'}
              onClick={onCalibrate}
              className="text-xs"
            >
              Kalibrera nu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
