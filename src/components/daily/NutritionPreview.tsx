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
  saturatedFat?: number | null
  sugars?: number | null
  fiber?: number | null
  salt?: number | null
}

export function NutritionPreview({
  calories,
  protein,
  carbs,
  fat,
  weightGrams,
  energyDensityColor,
  showWeight = true,
  saturatedFat,
  sugars,
  fiber,
  salt,
}: NutritionPreviewProps) {
  const { t } = useTranslation('today')
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">
          {t('nutritionPreview.heading')}
        </span>
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
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
        {saturatedFat != null && (
          <div className="flex justify-between pl-2">
            <span className="text-neutral-500">
              {t('nutritionPreview.saturatedFat', 'varav mättat')}
            </span>
            <span className="font-medium text-neutral-700">{saturatedFat.toFixed(1)}g</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600">{t('nutritionPreview.carbs')}</span>
          <span className="font-medium" style={{ color: '#fb923c' }}>
            {carbs.toFixed(1)}g
          </span>
        </div>
        {sugars != null && (
          <div className="flex justify-between pl-2">
            <span className="text-neutral-500">
              {t('nutritionPreview.sugars', 'varav sockerarter')}
            </span>
            <span className="font-medium text-neutral-700">{sugars.toFixed(1)}g</span>
          </div>
        )}
        {fiber != null && (
          <div className="flex justify-between">
            <span className="text-neutral-600">{t('nutritionPreview.fiber', 'Fiber')}</span>
            <span className="font-medium text-neutral-700">{fiber.toFixed(1)}g</span>
          </div>
        )}
        <div className="flex justify-between col-span-2 sm:col-span-1">
          <span className="text-neutral-600">{t('nutritionPreview.protein')}</span>
          <span className="font-medium" style={{ color: '#f43f5e' }}>
            {protein.toFixed(1)}g
          </span>
        </div>
        {salt != null && (
          <div className="flex justify-between">
            <span className="text-neutral-600">{t('nutritionPreview.salt', 'Salt')}</span>
            <span className="font-medium text-neutral-700">{salt.toFixed(1)}g</span>
          </div>
        )}
      </div>
    </div>
  )
}
