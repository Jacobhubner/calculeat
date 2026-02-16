import { Badge } from '@/components/ui/badge'

interface NutritionPreviewProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  weightGrams: number
  energyDensityColor?: 'Green' | 'Yellow' | 'Orange'
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
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Beräknat näringsinnehåll</span>
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
              ? 'Grön'
              : energyDensityColor === 'Yellow'
                ? 'Gul'
                : 'Orange'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Kalorier:</span>
          <span className="font-semibold text-neutral-900">{Math.round(calories)} kcal</span>
        </div>
        {showWeight && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Vikt:</span>
            <span className="font-medium text-neutral-900">{weightGrams}g</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600">Fett:</span>
          <span className="font-medium text-amber-600">{fat.toFixed(1)}g</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Kolhydrater:</span>
          <span className="font-medium text-green-600">{carbs.toFixed(1)}g</span>
        </div>
        <div className="flex justify-between col-span-2 sm:col-span-1">
          <span className="text-neutral-600">Protein:</span>
          <span className="font-medium text-blue-600">{protein.toFixed(1)}g</span>
        </div>
      </div>
    </div>
  )
}
