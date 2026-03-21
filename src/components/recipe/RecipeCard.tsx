import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, Trash2, ScrollText, Users, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Recipe, RecipeIngredient } from '@/hooks/useRecipes'
import type { FoodItem } from '@/hooks/useFoodItems'
import {
  calculateRecipeNutrition,
  type RecipeIngredientInput,
} from '@/lib/calculations/recipeCalculator'
import { EQUIPMENT_OPTIONS, type EquipmentValue } from '@/lib/constants/recipeEquipment'

interface RecipeWithIngredients extends Recipe {
  ingredients?: Array<
    RecipeIngredient & {
      food_item?: FoodItem
    }
  >
}

interface RecipeCardProps {
  recipe: RecipeWithIngredients
  onEdit: () => void
  onDelete: () => void
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const { t } = useTranslation('recipes')
  // Use centralized calculation from recipeCalculator.ts
  const nutrition = useMemo(() => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return null
    }

    // Map recipe ingredients to RecipeIngredientInput format
    const validIngredients: RecipeIngredientInput[] = recipe.ingredients
      .filter(ing => ing.food_item)
      .map(ing => ({
        foodItem: ing.food_item!,
        amount: ing.amount,
        unit: ing.unit,
      }))

    if (validIngredients.length === 0) return null

    return calculateRecipeNutrition(validIngredients, recipe.servings || 1)
  }, [recipe.ingredients, recipe.servings])

  const servings = recipe.servings || 1
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)

  // Determine display format based on how the recipe was saved
  // Check the linked food_item's default_unit to know if saved as 100g or portion
  const savedAs100g = recipe.food_item?.default_unit === 'g'

  // Get display values based on saved format
  const displayLabel = savedAs100g ? t('card.per100g') : t('card.perServing')
  const displayCalories = nutrition
    ? Math.round(savedAs100g ? nutrition.per100g.calories : nutrition.perServing.calories)
    : 0
  const displayProtein = nutrition
    ? (savedAs100g ? nutrition.per100g.protein : nutrition.perServing.protein).toFixed(1)
    : '0.0'
  const displayCarbs = nutrition
    ? (savedAs100g ? nutrition.per100g.carbs : nutrition.perServing.carbs).toFixed(1)
    : '0.0'
  const displayFat = nutrition
    ? (savedAs100g ? nutrition.per100g.fat : nutrition.perServing.fat).toFixed(1)
    : '0.0'
  const energyDensityColor = nutrition?.energyDensityColor ?? null

  const colorBadgeClass = {
    Green: 'bg-green-100 text-green-700 border-green-300',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Orange: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const colorLabel = {
    Green: t('card.colorGreen'),
    Yellow: t('card.colorYellow'),
    Orange: t('card.colorOrange'),
  }

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardContent className="p-0">
        {/* Receptbild */}
        {recipe.image_url && (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <ScrollText className="h-5 w-5 text-primary-600 flex-shrink-0" />
              <h3 className="font-semibold text-neutral-900 truncate">{recipe.name}</h3>
            </div>
            {energyDensityColor && (
              <Badge
                variant="outline"
                className={`${colorBadgeClass[energyDensityColor]} flex-shrink-0`}
              >
                {colorLabel[energyDensityColor]}
              </Badge>
            )}
          </div>

          {/* Servings info + tid */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {servings} {servings === 1 ? t('card.portion') : t('card.portionPlural')}
              </span>
            </div>
            {totalTime > 0 && (
              <>
                <span className="text-neutral-300">·</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalTime} min</span>
                </div>
              </>
            )}
          </div>

          {/* Utrustningschips */}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {recipe.equipment.map(eq => {
                const label = EQUIPMENT_OPTIONS.find(o => o.value === eq)?.label ?? eq
                const settings = recipe.equipment_settings?.[eq as EquipmentValue]
                const details: string[] = []
                if (settings) {
                  if (settings.temp_c) details.push(`${settings.temp_c}°C`)
                  if (settings.watt) details.push(`${settings.watt}W`)
                  if (settings.heat) details.push(String(settings.heat))
                  if (settings.duration) details.push(`${settings.duration} min`)
                }
                return (
                  <span
                    key={eq}
                    className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5"
                  >
                    {details.length > 0 ? `${label} · ${details.join(' · ')}` : label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Nutrition display */}
          <div className="bg-neutral-50 rounded-lg p-3 mb-4">
            <div className="text-xs text-neutral-500 mb-2">{displayLabel}</div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-primary-600">{displayCalories}</span>
              <span className="text-sm text-neutral-500">kcal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-semibold" style={{ color: '#f5c518' }}>
                  {displayFat}g
                </span>
                <span className="text-neutral-500 ml-1">F</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: '#fb923c' }}>
                  {displayCarbs}g
                </span>
                <span className="text-neutral-500 ml-1">K</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: '#f43f5e' }}>
                  {displayProtein}g
                </span>
                <span className="text-neutral-500 ml-1">P</span>
              </div>
            </div>
          </div>

          {/* Ingredients count */}
          <div className="text-xs text-neutral-500 mb-4">
            {t('card.ingredientCount', { count: recipe.ingredients?.length || 0 })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-3 gap-1">
              <Edit2 className="h-4 w-4" />
              {t('card.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {t('card.delete')}
            </Button>
          </div>
        </div>
        {/* /p-4 */}
      </CardContent>
    </Card>
  )
}
