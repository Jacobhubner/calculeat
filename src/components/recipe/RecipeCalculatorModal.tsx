import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, ChefHat, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IngredientRow, type IngredientData } from './IngredientRow'
import { NutritionSummary } from './NutritionSummary'
import { useFoodItems } from '@/hooks/useFoodItems'
import { useFavoriteFoods, useToggleFavorite } from '@/hooks/useFavoriteFoods'
import { useCreateRecipe, useUpdateRecipe, type Recipe } from '@/hooks/useRecipes'
import {
  calculateRecipeNutrition,
  type RecipeIngredientInput,
} from '@/lib/calculations/recipeCalculator'

interface RecipeCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRecipe?: Recipe | null
  onSuccess?: () => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function RecipeCalculatorModal({
  open,
  onOpenChange,
  editRecipe,
  onSuccess,
}: RecipeCalculatorModalProps) {
  const [name, setName] = useState('')
  const [servings, setServings] = useState<number | ''>(1)
  const [ingredients, setIngredients] = useState<IngredientData[]>([])
  const [saveAs, setSaveAs] = useState<'100g' | 'portion'>('portion')
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const { data: foods, isError: foodsError, isLoading: foodsLoading } = useFoodItems()
  const { data: favorites } = useFavoriteFoods()
  const { toggle: toggleFavorite } = useToggleFavorite()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  // Track recipe ID for detecting changes
  const lastInitializedRecipeId = useRef<string | null>(null)

  // Filter out recipes from available foods
  const availableFoods = useMemo(() => {
    if (!foods) return []
    return foods.filter(f => !f.is_recipe)
  }, [foods])

  // Reset form function
  const resetForm = useCallback(() => {
    setName('')
    setServings(1)
    setIngredients([])
    setSaveAs('portion')
    setError(null)
    setInitialized(false)
    lastInitializedRecipeId.current = null
  }, [])

  // Initialize form function
  const initializeForm = useCallback((recipe: Recipe, foodsList: typeof foods) => {
    if (!foodsList) return

    // Map existing ingredients (filter out orphans where food has been deleted)
    const mappedIngredients: IngredientData[] = (recipe.ingredients || [])
      .map(
        (ing: {
          id: string
          food_item_id: string
          amount: number
          unit: string
          food_item?: unknown
        }) => {
          const foodItem = foodsList.find(f => f.id === ing.food_item_id)
          if (!foodItem) return null // Skip orphan ingredients
          return {
            id: ing.id || generateId(),
            foodItem,
            amount: ing.amount,
            unit: ing.unit,
          }
        }
      )
      .filter((ing): ing is IngredientData => ing !== null)

    setName(recipe.name)
    setServings(recipe.servings)
    setIngredients(mappedIngredients)
    setSaveAs(recipe.food_item?.default_unit === 'g' ? '100g' : 'portion')
    setError(null)
    setInitialized(true)
    lastInitializedRecipeId.current = recipe.id
  }, [])

  // Handle modal open/close and initialization
  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate use: resetting form state when modal closes
      resetForm()
      return
    }

    // Modal is open
    if (editRecipe && foods) {
      // Only initialize if we haven't already initialized this recipe
      if (lastInitializedRecipeId.current !== editRecipe.id) {
        initializeForm(editRecipe, foods)
      }
    } else if (!editRecipe && !initialized) {
      // New recipe mode - start with one empty ingredient row
      setIngredients([{ id: generateId(), foodItem: null, amount: 0, unit: 'g' }])
      setInitialized(true)
    }
  }, [open, editRecipe, foods, initialized, resetForm, initializeForm])

  // Calculate nutrition
  const nutrition = useMemo(() => {
    const validIngredients: RecipeIngredientInput[] = ingredients
      .filter(ing => ing.foodItem && ing.amount > 0)
      .map(ing => ({
        foodItem: ing.foodItem!,
        amount: ing.amount,
        unit: ing.unit,
      }))

    if (validIngredients.length === 0) return null
    return calculateRecipeNutrition(validIngredients, typeof servings === 'number' ? servings : 1)
  }, [ingredients, servings])

  const handleAddIngredient = () => {
    setIngredients(prev => [
      ...prev,
      {
        id: generateId(),
        foodItem: null,
        amount: 0,
        unit: 'g',
      },
    ])
  }

  const handleIngredientChange = (id: string, updated: IngredientData) => {
    setIngredients(prev => prev.map(ing => (ing.id === id ? updated : ing)))
  }

  const handleIngredientRemove = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const handleSubmit = async () => {
    // Validate
    if (!name.trim()) {
      setError('Ange ett namn för receptet')
      return
    }

    const validIngredients = ingredients.filter(ing => ing.foodItem && ing.amount > 0)
    if (validIngredients.length === 0) {
      setError('Lägg till minst en ingrediens')
      return
    }

    const servingsNum = typeof servings === 'number' ? servings : 0
    if (servingsNum <= 0) {
      setError('Antal portioner måste vara minst 1')
      return
    }

    setError(null)

    try {
      const recipeData = {
        name: name.trim(),
        servings: servingsNum,
        saveAs, // 100g or portion
        ingredients: validIngredients.map(ing => ({
          food_item_id: ing.foodItem!.id,
          amount: ing.amount,
          unit: ing.unit,
        })),
        // Include calculated nutrition for food_item creation
        nutrition: nutrition
          ? {
              totalWeight: nutrition.totalWeight,
              totalCalories: nutrition.totalCalories,
              totalProtein: nutrition.totalProtein,
              totalCarbs: nutrition.totalCarbs,
              totalFat: nutrition.totalFat,
              perServing: nutrition.perServing,
              per100g: nutrition.per100g,
              energyDensityColor: nutrition.energyDensityColor,
            }
          : undefined,
      }

      if (editRecipe) {
        await updateRecipe.mutateAsync({ id: editRecipe.id, ...recipeData })
        toast.success(`Receptet "${name.trim()}" har uppdaterats`)
      } else {
        await createRecipe.mutateAsync(recipeData)
        toast.success(`Receptet "${name.trim()}" har skapats`)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save recipe:', err)
      toast.error('Kunde inte spara receptet. Försök igen.')
    }
  }

  const isLoading = createRecipe.isPending || updateRecipe.isPending
  const isEditing = !!editRecipe

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl md:max-h-[90vh] md:overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary-600" />
            {isEditing ? 'Redigera recept' : 'Nytt recept'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Redigera ingredienser och portioner för ditt recept.'
              : 'Skapa ett nytt recept genom att lägga till ingredienser.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-3 pb-4 md:px-0 md:pb-0 overflow-x-hidden">
          <div className="space-y-6">
            {/* Form */}
            <div className="space-y-6">
              {/* Recipe name and servings */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe-name">Receptnamn</Label>
                  <Input
                    id="recipe-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="T.ex. Pannkakor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Antal portioner</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={e => {
                      const val = e.target.value
                      setServings(val === '' ? '' : Math.max(1, parseInt(val)))
                    }}
                    min={1}
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <Label>Ingredienser</Label>

                {/* Loading state for foods */}
                {foodsLoading && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center">
                    <p className="text-neutral-500 text-sm">Laddar livsmedel...</p>
                  </div>
                )}

                {/* Error state for foods */}
                {foodsError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">
                      Kunde inte ladda livsmedel. Stäng och öppna igen.
                    </p>
                  </div>
                )}

                {/* Empty state - no ingredients yet */}
                {!foodsLoading && !foodsError && ingredients.length === 0 && (
                  <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center">
                    <p className="text-neutral-500 text-sm mb-4">Inga ingredienser tillagda ännu</p>
                    <Button variant="outline" onClick={handleAddIngredient} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Lägg till ingrediens
                    </Button>
                  </div>
                )}

                {/* Ingredients list */}
                {!foodsLoading && !foodsError && ingredients.length > 0 && (
                  <div className="space-y-2">
                    {ingredients.map(ingredient => (
                      <IngredientRow
                        key={ingredient.id}
                        ingredient={ingredient}
                        availableFoods={availableFoods}
                        favorites={favorites}
                        onChange={updated => handleIngredientChange(ingredient.id, updated)}
                        onRemove={() => handleIngredientRemove(ingredient.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}

                    <Button
                      variant="outline"
                      onClick={handleAddIngredient}
                      className="w-full gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Lägg till ingrediens
                    </Button>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Nutrition summary */}
            <div>
              <NutritionSummary
                nutrition={nutrition}
                servings={typeof servings === 'number' ? servings : 1}
                saveAs={saveAs}
              />
            </div>
          </div>

          {/* Save format selection */}
          {nutrition && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Spara som livsmedel</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="saveAs"
                    value="portion"
                    checked={saveAs === 'portion'}
                    onChange={() => setSaveAs('portion')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">
                    Per portion ({Math.round(nutrition.perServing.weight)}g)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="saveAs"
                    value="100g"
                    checked={saveAs === '100g'}
                    onChange={() => setSaveAs('100g')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Per 100g</span>
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {saveAs === 'portion'
                  ? 'Receptet sparas med portionsstorlek som standardenhet.'
                  : 'Receptet sparas med 100g som standardenhet (likt vanliga livsmedel).'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
              {isLoading ? (
                'Sparar...'
              ) : (
                <>
                  <ChefHat className="h-4 w-4" />
                  {isEditing ? 'Uppdatera recept' : 'Spara recept'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
