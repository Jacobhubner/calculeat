import { useTranslation } from 'react-i18next'
import { Clock, Users, ScrollText, ChefHat } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Recipe, RecipeIngredient } from '@/hooks/useRecipes'
import type { FoodItem } from '@/hooks/useFoodItems'

interface RecipeIngredientWithFood extends RecipeIngredient {
  food_item?: FoodItem
}

interface RecipeWithIngredients extends Recipe {
  ingredients?: RecipeIngredientWithFood[]
}

interface RecipePreviewModalProps {
  recipe: RecipeWithIngredients | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const colorBadgeClass = {
  Green: 'bg-green-100 text-green-700 border-green-300',
  Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Orange: 'bg-orange-100 text-orange-700 border-orange-300',
}

export function RecipePreviewModal({ recipe, open, onOpenChange }: RecipePreviewModalProps) {
  const { t } = useTranslation('recipes')

  if (!recipe) return null

  const servings = recipe.servings || 1
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)
  const fi = recipe.food_item
  const savedAs100g = fi?.default_unit === 'g'

  const displayCalories = fi
    ? Math.round(savedAs100g ? fi.calories : (fi.kcal_per_unit ?? fi.calories))
    : null
  const displayFat = fi ? (savedAs100g ? fi.fat_g : (fi.fat_per_unit ?? fi.fat_g)).toFixed(1) : null
  const displayCarbs = fi
    ? (savedAs100g ? fi.carb_g : (fi.carb_per_unit ?? fi.carb_g)).toFixed(1)
    : null
  const displayProtein = fi
    ? (savedAs100g ? fi.protein_g : (fi.protein_per_unit ?? fi.protein_g)).toFixed(1)
    : null

  const energyDensityColor = fi?.energy_density_color ?? null

  const sortedIngredients = recipe.ingredients
    ? [...recipe.ingredients].sort((a, b) => a.ingredient_order - b.ingredient_order)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-lg">
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3">
            <ScrollText className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <DialogTitle className="text-left">{recipe.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {energyDensityColor && (
                  <Badge
                    variant="outline"
                    className={`${colorBadgeClass[energyDensityColor]} text-xs`}
                  >
                    {t(`card.color${energyDensityColor}`)}
                  </Badge>
                )}
                <DialogDescription className="text-xs text-neutral-500 mt-0">
                  {savedAs100g
                    ? t('card.per100g')
                    : `${servings} ${servings === 1 ? t('card.portion') : t('card.portionPlural')}`}
                  {totalTime > 0 && ` · ${totalTime} min`}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4 md:px-0 md:pb-0 space-y-5 mt-2">
          {/* Recipe image */}
          {recipe.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img src={recipe.image_url} alt={recipe.name} className="w-full h-48 object-cover" />
            </div>
          )}

          {/* Nutrition summary */}
          {displayCalories !== null && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {savedAs100g
                  ? t('nutrition.per100g')
                  : t('nutrition.perServing', { weight: fi?.weight_grams ?? '?' })}
              </p>
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-primary-600">{displayCalories}</p>
                  <p className="text-xs text-neutral-500">kcal</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold" style={{ color: '#f5c518' }}>
                    {displayFat}g
                  </p>
                  <p className="text-xs text-neutral-500">{t('nutrition.fat')}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                    {displayCarbs}g
                  </p>
                  <p className="text-xs text-neutral-500">{t('nutrition.carbs')}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold" style={{ color: '#f43f5e' }}>
                    {displayProtein}g
                  </p>
                  <p className="text-xs text-neutral-500">{t('nutrition.protein')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Time info */}
          {(recipe.prep_time_min || recipe.cook_time_min) && (
            <div className="flex gap-4 text-sm text-neutral-600">
              {recipe.prep_time_min ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {t('preview.prepTime', { minutes: recipe.prep_time_min })}
                </span>
              ) : null}
              {recipe.cook_time_min ? (
                <span className="flex items-center gap-1">
                  <ChefHat className="h-3.5 w-3.5 text-neutral-400" />
                  {t('preview.cookTime', { minutes: recipe.cook_time_min })}
                </span>
              ) : null}
              {!savedAs100g && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-neutral-400" />
                  {servings} {servings === 1 ? t('card.portion') : t('card.portionPlural')}
                </span>
              )}
            </div>
          )}

          {/* Ingredients */}
          {sortedIngredients.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">
                {t('modal.ingredients')}
              </p>
              <ul className="space-y-1.5">
                {sortedIngredients.map(ing => (
                  <li key={ing.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-800">
                      {ing.food_item?.name ?? t('preview.unknownIngredient')}
                    </span>
                    <span className="text-neutral-500 ml-4 flex-shrink-0">
                      {ing.amount} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">
                {t('modal.instructionsLabel')}
              </p>
              <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                {recipe.instructions}
              </p>
            </div>
          )}

          {/* Equipment */}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">{t('modal.equipment')}</p>
              <div className="flex flex-wrap gap-2">
                {recipe.equipment.map(eq => (
                  <Badge key={eq} variant="outline" className="text-xs">
                    {t(`equipmentOptions.${eq}`, { defaultValue: eq })}
                    {recipe.equipment_settings?.[eq] &&
                      Object.entries(recipe.equipment_settings[eq])
                        .map(
                          ([k, v]) => ` · ${t(`equipmentFields.${k}`, { defaultValue: k })}: ${v}`
                        )
                        .join('')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="pt-1">
            <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
              {t('modal.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
