import { useMemo } from 'react'
import { Edit2, Trash2, ScrollText, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Recipe, RecipeIngredient } from '@/hooks/useRecipes'
import type { FoodItem } from '@/hooks/useFoodItems'
import {
  calculateRecipeNutrition,
  type RecipeIngredientInput,
} from '@/lib/calculations/recipeCalculator'

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
  const caloriesPerServing = nutrition ? Math.round(nutrition.perServing.calories) : 0
  const proteinPerServing = nutrition ? nutrition.perServing.protein.toFixed(1) : '0.0'
  const carbsPerServing = nutrition ? nutrition.perServing.carbs.toFixed(1) : '0.0'
  const fatPerServing = nutrition ? nutrition.perServing.fat.toFixed(1) : '0.0'
  const energyDensityColor = nutrition?.energyDensityColor ?? null

  const colorBadgeClass = {
    Green: 'bg-green-100 text-green-700 border-green-300',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Orange: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const colorLabel = {
    Green: 'Grön',
    Yellow: 'Gul',
    Orange: 'Orange',
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
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

        {/* Servings info */}
        <div className="flex items-center gap-1 text-sm text-neutral-500 mb-4">
          <Users className="h-4 w-4" />
          <span>
            {servings} {servings === 1 ? 'portion' : 'portioner'}
          </span>
        </div>

        {/* Nutrition per serving */}
        <div className="bg-neutral-50 rounded-lg p-3 mb-4">
          <div className="text-xs text-neutral-500 mb-2">Per portion</div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-primary-600">{caloriesPerServing}</span>
            <span className="text-sm text-neutral-500">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-semibold text-green-600">{proteinPerServing}g</span>
              <span className="text-neutral-500 ml-1">P</span>
            </div>
            <div>
              <span className="font-semibold text-blue-600">{carbsPerServing}g</span>
              <span className="text-neutral-500 ml-1">K</span>
            </div>
            <div>
              <span className="font-semibold text-amber-600">{fatPerServing}g</span>
              <span className="text-neutral-500 ml-1">F</span>
            </div>
          </div>
        </div>

        {/* Ingredients count */}
        <div className="text-xs text-neutral-500 mb-4">
          {recipe.ingredients?.length || 0} ingredienser
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-3 gap-1">
            <Edit2 className="h-4 w-4" />
            Redigera
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 px-3 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Ta bort
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
