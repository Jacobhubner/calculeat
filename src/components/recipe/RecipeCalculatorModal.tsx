import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, ChefHat, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
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
import { RecipeImageUpload } from './RecipeImageUpload'
import {
  EQUIPMENT_OPTIONS,
  EQUIPMENT_SETTINGS_FIELDS,
  type EquipmentValue,
} from '@/lib/constants/recipeEquipment'
import { useFoodItems } from '@/hooks/useFoodItems'
import { useFoodNutrientsBatch } from '@/hooks/useFoodNutrients'
import { useCreateRecipe, useUpdateRecipe, type Recipe } from '@/hooks/useRecipes'
import {
  useCreateSharedListRecipe,
  useUpdateSharedListRecipe,
  useMergedFoodItemsForList,
  useMergedFoodItemsForAllLists,
  useSharedLists,
} from '@/hooks/useSharedLists'
import {
  calculateRecipeNutrition,
  type RecipeIngredientInput,
} from '@/lib/calculations/recipeCalculator'

interface RecipeCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRecipe?: Recipe | null
  onSuccess?: () => void
  sharedListId?: string
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function RecipeCalculatorModal({
  open,
  onOpenChange,
  editRecipe,
  onSuccess,
  sharedListId,
}: RecipeCalculatorModalProps) {
  const [name, setName] = useState('')
  const [servings, setServings] = useState<number | ''>(1)
  const [ingredients, setIngredients] = useState<IngredientData[]>([])
  const [saveAs, setSaveAs] = useState<'100g' | 'portion'>('portion')
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Detaljfält
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [instructions, setInstructions] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [equipmentSettings, setEquipmentSettings] = useState<
    Record<string, Record<string, string | number>>
  >({})
  const [prepTime, setPrepTime] = useState<number | ''>('')
  const [cookTime, setCookTime] = useState<number | ''>('')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data: foods, isError: foodsError, isLoading: foodsLoading } = useFoodItems()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()
  const createSharedListRecipe = useCreateSharedListRecipe()
  const updateSharedListRecipe = useUpdateSharedListRecipe()

  // Merge list-items with own/global foods when in a list context
  const activeListId = editRecipe?.shared_list_id ?? sharedListId ?? null
  const mergedFoodsForActive = useMergedFoodItemsForList(foods ?? [], activeListId)
  const mergedFoodsForAll = useMergedFoodItemsForAllLists(foods ?? [])
  const mergedFoods = mergedFoodsForAll.length > 0 ? mergedFoodsForAll : mergedFoodsForActive
  const { data: sharedLists = [] } = useSharedLists()

  // Track recipe ID for detecting changes
  const lastInitializedRecipeId = useRef<string | null>(null)
  // Capture sharedListId at modal-open time to avoid race if parent tab changes while modal is open
  const capturedSharedListId = useRef<string | null>(null)

  // Filter out recipes from available foods
  const availableFoods = useMemo(() => {
    return mergedFoods.filter(f => !f.is_recipe)
  }, [mergedFoods])

  // Reset form function
  const resetForm = useCallback(() => {
    setName('')
    setServings(1)
    setIngredients([])
    setSaveAs('portion')
    setError(null)
    setInitialized(false)
    lastInitializedRecipeId.current = null
    setImageUrl(null)
    setInstructions('')
    setEquipment([])
    setEquipmentSettings({})
    setPrepTime('')
    setCookTime('')
    setDetailsOpen(false)
  }, [])

  // Initialize form function
  const initializeForm = useCallback((recipe: Recipe, foodsList: typeof mergedFoods) => {
    if (!foodsList) return

    // Map existing ingredients (filter out orphans where food has been deleted)
    const mappedIngredients = (recipe.ingredients || [])
      .map(
        (ing: {
          id: string
          food_item_id: string
          amount: number
          unit: string
          food_item?: unknown
        }): IngredientData | null => {
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
    setImageUrl(recipe.image_url ?? null)
    setInstructions(recipe.instructions ?? '')
    setEquipment(recipe.equipment ?? [])
    setEquipmentSettings(
      (recipe.equipment_settings as Record<string, Record<string, string | number>>) ?? {}
    )
    setPrepTime(recipe.prep_time_min ?? '')
    setCookTime(recipe.cook_time_min ?? '')
    if (
      recipe.image_url ||
      recipe.instructions ||
      (recipe.equipment?.length ?? 0) > 0 ||
      recipe.prep_time_min ||
      recipe.cook_time_min
    ) {
      setDetailsOpen(true)
    }
  }, [])

  // Handle modal open/close and initialization
  useEffect(() => {
    if (!open) {
      capturedSharedListId.current = null
      return
    }

    // Capture sharedListId at open time so parent tab-changes don't affect submit
    if (capturedSharedListId.current === null) {
      capturedSharedListId.current = sharedListId ?? null
    }

    // Modal is open
    if (editRecipe && mergedFoods.length > 0) {
      // Only initialize if we haven't already initialized this recipe
      if (lastInitializedRecipeId.current !== editRecipe.id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        initializeForm(editRecipe, mergedFoods)
      }
    } else if (!editRecipe && !initialized) {
      // New recipe mode - start with one empty ingredient row

      setIngredients([{ id: generateId(), foodItem: null, amount: 0, unit: 'g' }])

      setInitialized(true)
    }
  }, [open, editRecipe, foods, mergedFoods, initialized, resetForm, initializeForm, sharedListId])

  // Fetch optional nutrients (saturated fat, sugars, salt) for all ingredient food items
  const ingredientFoodIds = useMemo(
    () => ingredients.filter(ing => ing.foodItem).map(ing => ing.foodItem!.id),
    [ingredients]
  )
  const { data: ingredientNutrients } = useFoodNutrientsBatch(ingredientFoodIds)

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
    return calculateRecipeNutrition(
      validIngredients,
      typeof servings === 'number' ? servings : 1,
      ingredientNutrients ?? undefined
    )
  }, [ingredients, servings, ingredientNutrients])

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
    if (isLoading) return
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
        // Detaljfält
        image_url: imageUrl,
        instructions: instructions.trim() || null,
        equipment: equipment.length > 0 ? equipment : null,
        equipment_settings: Object.keys(equipmentSettings).length > 0 ? equipmentSettings : null,
        prep_time_min: typeof prepTime === 'number' ? prepTime : null,
        cook_time_min: typeof cookTime === 'number' ? cookTime : null,
      }

      if (editRecipe?.shared_list_id) {
        await updateSharedListRecipe.mutateAsync({ recipeId: editRecipe.id, fields: recipeData })
        toast.success(`Receptet "${name.trim()}" har uppdaterats`)
      } else if (editRecipe) {
        await updateRecipe.mutateAsync({ id: editRecipe.id, ...recipeData })
        toast.success(`Receptet "${name.trim()}" har uppdaterats`)
      } else if (capturedSharedListId.current) {
        await createSharedListRecipe.mutateAsync({
          sharedListId: capturedSharedListId.current,
          ...recipeData,
        })
        toast.success(`Receptet "${name.trim()}" har skapats i listan`)
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

  const isLoading =
    createRecipe.isPending ||
    updateRecipe.isPending ||
    createSharedListRecipe.isPending ||
    updateSharedListRecipe.isPending
  const isEditing = !!editRecipe
  const isSharedListRecipe = !!(editRecipe?.shared_list_id || sharedListId)

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

        {isSharedListRecipe && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700 mx-3 md:mx-0">
            {isEditing
              ? 'Redigerar ett delat recept. Ändringarna syns hos alla listmedlemmar.'
              : 'Receptet sparas i den delade listan och syns hos alla listmedlemmar.'}
          </div>
        )}

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
                      setServings(val === '' ? '' : Math.max(1, parseInt(val) || 1))
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
                        sharedLists={sharedLists}
                        onChange={updated => handleIngredientChange(ingredient.id, updated)}
                        onRemove={() => handleIngredientRemove(ingredient.id)}
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

              {/* Hopfällbar detaljsektion */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-700"
                >
                  <span>Detaljer (valfritt)</span>
                  {detailsOpen ? (
                    <ChevronUp className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  )}
                </button>

                {detailsOpen && (
                  <div className="px-4 py-4 space-y-5">
                    {/* Bild */}
                    <div className="space-y-2">
                      <Label>Bild på rätten</Label>
                      <RecipeImageUpload value={imageUrl} onChange={setImageUrl} />
                    </div>

                    {/* Instruktioner */}
                    <div className="space-y-2">
                      <Label htmlFor="recipe-instructions">Tillagningsinstruktioner</Label>
                      <textarea
                        id="recipe-instructions"
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        placeholder="Beskriv hur du tillagar rätten steg för steg..."
                        rows={5}
                        className="w-full rounded-xl border border-neutral-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Tillagningstid */}
                    <div className="space-y-2">
                      <Label>Tillagningstid</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-neutral-500">Förberedelse (min)</span>
                          <Input
                            type="number"
                            min={0}
                            value={prepTime}
                            onChange={e =>
                              setPrepTime(
                                e.target.value === ''
                                  ? ''
                                  : Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-neutral-500">Tillagning (min)</span>
                          <Input
                            type="number"
                            min={0}
                            value={cookTime}
                            onChange={e =>
                              setCookTime(
                                e.target.value === ''
                                  ? ''
                                  : Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                      {(typeof prepTime === 'number' || typeof cookTime === 'number') &&
                        (prepTime as number) + (cookTime as number) > 0 && (
                          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              Total tid:{' '}
                              {(typeof prepTime === 'number' ? prepTime : 0) +
                                (typeof cookTime === 'number' ? cookTime : 0)}{' '}
                              min
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Utrustning */}
                    <div className="space-y-3">
                      <Label>Utrustning som behövs</Label>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map(opt => {
                          const selected = equipment.includes(opt.value)
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setEquipment(prev =>
                                  selected
                                    ? prev.filter(v => v !== opt.value)
                                    : [...prev, opt.value]
                                )
                                // Rensa inställningar om utrustningen avmarkeras
                                if (selected) {
                                  setEquipmentSettings(prev => {
                                    const next = { ...prev }
                                    delete next[opt.value]
                                    return next
                                  })
                                }
                              }}
                              className={`
                                px-3 py-1.5 rounded-full text-sm border transition-colors
                                ${
                                  selected
                                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                                }
                              `}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Inställningsfält per vald utrustning */}
                      {equipment
                        .filter(eq => EQUIPMENT_SETTINGS_FIELDS[eq as EquipmentValue])
                        .map(eq => {
                          const fields = EQUIPMENT_SETTINGS_FIELDS[eq as EquipmentValue]!
                          const settings = equipmentSettings[eq] ?? {}
                          const label = EQUIPMENT_OPTIONS.find(o => o.value === eq)?.label ?? eq
                          return (
                            <div key={eq} className="bg-neutral-50 rounded-xl p-3 space-y-2">
                              <p className="text-xs font-medium text-neutral-600">{label}</p>
                              <div className="grid grid-cols-2 gap-3">
                                {fields.map(field => (
                                  <div key={field.key} className="space-y-1">
                                    <span className="text-xs text-neutral-500">
                                      {field.label}
                                      {field.unit ? ` (${field.unit})` : ''}
                                    </span>
                                    <Input
                                      type={field.type}
                                      min={field.type === 'number' ? 0 : undefined}
                                      placeholder={field.placeholder}
                                      value={settings[field.key] ?? ''}
                                      onChange={e => {
                                        const raw = e.target.value
                                        const val =
                                          field.type === 'number'
                                            ? raw === ''
                                              ? ''
                                              : Number(raw)
                                            : raw
                                        setEquipmentSettings(prev => ({
                                          ...prev,
                                          [eq]: {
                                            ...prev[eq],
                                            [field.key]: val as string | number,
                                          },
                                        }))
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                    </div>
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
