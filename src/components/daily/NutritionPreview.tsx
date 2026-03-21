import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

interface NutritionPreviewProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  weightGrams: number
  energyDensityColor?: 'Green' | 'Yellow' | 'Orange' | null
  showWeight?: boolean
}

export function NutritionPreview({
  calories,
  protein,
  carbs,
  fat,
  weightGrams,
  energyDensityColor,
  showWeight = true,
}: NutritionPreviewProps) {
  const { t } = useTranslation('today')
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{t('nutritionPreview.heading')}</span>
        {energyDensityColor && (
          <Badge
            variant="outline"
            className={
              energyDensityColor === 'Green'
                ? 'bg-green-50 text-green-700 border-green-300'
                : energyDensityColor === 'Yellow'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : 'bg-orange-50 text-orange-700 border-orange-300'
            }
          >
            {energyDensityColor === 'Green'
              ? t('nutritionPreview.colorGreen')
              : energyDensityColor === 'Yellow'
                ? t('nutritionPreview.colorYellow')
                : t('nutritionPreview.colorOrange')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">{t('nutritionPreview.calories')}</span>
          <span className="font-semibold text-neutral-900">{Math.round(calories)} kcal</span>
        </div>
        {showWeight && (
          <div className="flex justify-between">
            <span className="text-neutral-600">{t('nutritionPreview.weight')}</span>
            <span className="font-medium text-neutral-900">{weightGrams}g</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600">{t('nutritionPreview.fat')}</span>
          <span className="font-medium" style={{ color: '#f5c518' }}>
            {fat.toFixed(1)}g
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">{t('nutritionPreview.carbs')}</span>
          <span className="font-medium" style={{ color: '#fb923c' }}>
            {carbs.toFixed(1)}g
          </span>
        </div>
        <div className="flex justify-between col-span-2 sm:col-span-1">
          <span className="text-neutral-600">{t('nutritionPreview.protein')}</span>
          <span className="font-medium" style={{ color: '#f43f5e' }}>
            {protein.toFixed(1)}g
          </span>
        </div>
      </div>
    </div>
  )
}
