import React, { useState, useMemo, useEffect, useRef, useCallback, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, ChefHat, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

// Uncontrolled inputs — local state never causes the modal to re-render during typing.
// Syncs to parent only on blur so the heavy ingredient list is not touched during typing.

const RecipeNameInput = React.memo(function RecipeNameInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.value !== value) ref.current.value = value
  }, [value])
  return (
    <Input
      ref={ref}
      id="recipe-name"
      defaultValue={value}
      onBlur={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  )
})

const ServingsInput = React.memo(function ServingsInput({
  value,
  onChange,
}: {
  value: number | ''
  onChange: (v: number | '') => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.value !== String(value)) ref.current.value = String(value)
  }, [value])
  return (
    <Input
      ref={ref}
      id="servings"
      type="number"
      defaultValue={value === '' ? '' : value}
      onBlur={e => {
        const val = e.target.value
        onChange(val === '' ? '' : Math.max(1, parseInt(val) || 1))
      }}
      min={1}
    />
  )
})

const InstructionsTextarea = React.memo(function InstructionsTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  // Keep internal value in sync when parent resets (e.g. modal close/open)
  useEffect(() => {
    if (ref.current && ref.current.value !== value) {
      ref.current.value = value
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      id="recipe-instructions"
      defaultValue={value}
      onBlur={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="w-full rounded-xl border border-neutral-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  )
})

const SortableIngredientRow = React.memo(function SortableIngredientRow(
  props: React.ComponentProps<typeof IngredientRow>
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.ingredient.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <IngredientRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
})

interface MemoizedWrapperProps {
  ingredient: IngredientData
  availableFoods: React.ComponentProps<typeof IngredientRow>['availableFoods']
  sharedLists: React.ComponentProps<typeof IngredientRow>['sharedLists']
  onIngredientChange: (id: string, updated: IngredientData) => void
  onIngredientRemove: (id: string) => void
}

const MemoizedSortableIngredientRowWrapper = React.memo(
  function MemoizedSortableIngredientRowWrapper({
    ingredient,
    availableFoods,
    sharedLists,
    onIngredientChange,
    onIngredientRemove,
  }: MemoizedWrapperProps) {
    const onChange = useCallback(
      (updated: IngredientData) => onIngredientChange(ingredient.id, updated),
      [ingredient.id, onIngredientChange]
    )
    const onRemove = useCallback(
      () => onIngredientRemove(ingredient.id),
      [ingredient.id, onIngredientRemove]
    )
    return (
      <SortableIngredientRow
        ingredient={ingredient}
        availableFoods={availableFoods}
        sharedLists={sharedLists}
        onChange={onChange}
        onRemove={onRemove}
      />
    )
  }
)

export function RecipeCalculatorModal({
  open,
  onOpenChange,
  editRecipe,
  onSuccess,
  sharedListId,
}: RecipeCalculatorModalProps) {
  const { t } = useTranslation('recipes')
  const [, startTransition] = useTransition()
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
  // Snapshot of form state when edit recipe was loaded — used to detect changes
  const [initialSnapshot, setInitialSnapshot] = useState<{
    name: string
    servings: number | ''
    ingredients: IngredientData[]
    saveAs: '100g' | 'portion'
    imageUrl: string | null
    instructions: string
    equipment: string[]
    equipmentSettings: Record<string, Record<string, string | number>>
    prepTime: number | ''
    cookTime: number | ''
  } | null>(null)

  // Include recipes as ingredients, but exclude the current recipe itself (prevent circular reference)
  const availableFoods = useMemo(() => {
    return mergedFoods.filter(f => !editRecipe?.food_item_id || f.id !== editRecipe.food_item_id)
  }, [mergedFoods, editRecipe])

  // Reset form function (does NOT touch initialized — caller handles that)
  const resetForm = useCallback(() => {
    setName('')
    setServings(1)
    setIngredients([])
    setSaveAs('portion')
    setError(null)
    lastInitializedRecipeId.current = null
    setInitialSnapshot(null)
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
          snapshot_calories?: number | null
          snapshot_fat_g?: number | null
          snapshot_carb_g?: number | null
          snapshot_protein_g?: number | null
        }): IngredientData | null => {
          const foodItem = foodsList.find(f => f.id === ing.food_item_id)
          if (!foodItem) return null // Skip orphan ingredients
          return {
            id: ing.id || generateId(),
            foodItem,
            amount: ing.amount,
            unit: ing.unit,
            snapshotCalories: ing.snapshot_calories ?? null,
          }
        }
      )
      .filter((ing): ing is IngredientData => ing !== null)

    const mappedSaveAs =
      recipe.food_item?.default_unit === 'g' ? ('100g' as const) : ('portion' as const)
    const mappedImageUrl = recipe.image_url ?? null
    const mappedInstructions = recipe.instructions ?? ''
    const mappedEquipment = recipe.equipment ?? []
    const mappedEquipmentSettings =
      (recipe.equipment_settings as Record<string, Record<string, string | number>>) ?? {}
    const mappedPrepTime: number | '' = recipe.prep_time_min ?? ''
    const mappedCookTime: number | '' = recipe.cook_time_min ?? ''

    setName(recipe.name)
    setServings(recipe.servings)
    setIngredients(mappedIngredients)
    setSaveAs(mappedSaveAs)
    setError(null)
    setInitialized(true)
    lastInitializedRecipeId.current = recipe.id
    setImageUrl(mappedImageUrl)
    setInstructions(mappedInstructions)
    setEquipment(mappedEquipment)
    setEquipmentSettings(mappedEquipmentSettings)
    setPrepTime(mappedPrepTime)
    setCookTime(mappedCookTime)

    // Save initial snapshot for dirty tracking
    setInitialSnapshot({
      name: recipe.name,
      servings: recipe.servings,
      ingredients: mappedIngredients,
      saveAs: mappedSaveAs,
      imageUrl: mappedImageUrl,
      instructions: mappedInstructions,
      equipment: mappedEquipment,
      equipmentSettings: mappedEquipmentSettings,
      prepTime: mappedPrepTime,
      cookTime: mappedCookTime,
    })
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
      lastInitializedRecipeId.current = null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialized(false)
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
        initializeForm(editRecipe, mergedFoods)
      }
    } else if (!editRecipe && !initialized) {
      // New recipe mode — reset all fields and start with one empty ingredient row
      resetForm()
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
    startTransition(() => {
      setIngredients(prev => [
        ...prev,
        {
          id: generateId(),
          foodItem: null,
          amount: 0,
          unit: 'g',
        },
      ])
    })
  }

  const handleIngredientChange = useCallback(
    (id: string, updated: IngredientData) => {
      startTransition(() => {
        setIngredients(prev => prev.map(ing => (ing.id === id ? updated : ing)))
      })
    },
    [startTransition]
  )

  const handleIngredientRemove = useCallback(
    (id: string) => {
      startTransition(() => {
        setIngredients(prev => prev.filter(ing => ing.id !== id))
      })
    },
    [startTransition]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setIngredients(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id)
        const newIndex = prev.findIndex(i => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return
    // Validate
    if (!name.trim()) {
      setError(t('modal.errorName'))
      return
    }

    const validIngredients = ingredients.filter(ing => ing.foodItem && ing.amount > 0)
    if (validIngredients.length === 0) {
      setError(t('modal.errorIngredients'))
      return
    }

    const servingsNum = saveAs === '100g' ? 1 : typeof servings === 'number' ? servings : 0
    if (saveAs !== '100g' && servingsNum <= 0) {
      setError(t('modal.errorServings'))
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
          snapshot_calories: ing.foodItem!.calories,
          snapshot_fat_g: ing.foodItem!.fat_g,
          snapshot_carb_g: ing.foodItem!.carb_g,
          snapshot_protein_g: ing.foodItem!.protein_g,
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
        toast.success(t('modal.toastUpdated', { name: name.trim() }))
      } else if (editRecipe) {
        await updateRecipe.mutateAsync({ id: editRecipe.id, ...recipeData })
        toast.success(t('modal.toastUpdated', { name: name.trim() }))
      } else if (capturedSharedListId.current) {
        await createSharedListRecipe.mutateAsync({
          sharedListId: capturedSharedListId.current,
          ...recipeData,
        })
        toast.success(t('modal.toastCreatedInList', { name: name.trim() }))
      } else {
        await createRecipe.mutateAsync(recipeData)
        toast.success(t('modal.toastCreated', { name: name.trim() }))
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save recipe:', err)
      toast.error(t('modal.saveError'))
    }
  }

  const isLoading =
    createRecipe.isPending ||
    updateRecipe.isPending ||
    createSharedListRecipe.isPending ||
    updateSharedListRecipe.isPending
  const isEditing = !!editRecipe
  const isSharedListRecipe = !!(editRecipe?.shared_list_id || sharedListId)

  // Detect ingredients whose nutrition has changed since recipe was last saved
  const changedIngredients = useMemo(() => {
    if (!isEditing) return []
    return ingredients.filter(ing => {
      if (!ing.foodItem || ing.snapshotCalories == null) return false
      return Math.abs(ing.foodItem.calories - ing.snapshotCalories) > 0.5
    })
  }, [isEditing, ingredients])

  // Compute dirty state for edit mode
  const isDirty = useMemo(() => {
    if (!isEditing || !initialSnapshot) return true
    if (changedIngredients.length > 0) return true
    const s = initialSnapshot
    if (name !== s.name) return true
    if (servings !== s.servings) return true
    if (saveAs !== s.saveAs) return true
    if (imageUrl !== s.imageUrl) return true
    if (instructions !== s.instructions) return true
    if (prepTime !== s.prepTime) return true
    if (cookTime !== s.cookTime) return true
    if (equipment.length !== s.equipment.length || equipment.some((e, i) => e !== s.equipment[i]))
      return true
    if (JSON.stringify(equipmentSettings) !== JSON.stringify(s.equipmentSettings)) return true
    if (ingredients.length !== s.ingredients.length) return true
    for (let i = 0; i < ingredients.length; i++) {
      const a = ingredients[i]
      const b = s.ingredients[i]
      if (a.foodItem?.id !== b.foodItem?.id) return true
      if (a.amount !== b.amount) return true
      if (a.unit !== b.unit) return true
    }
    return false
  }, [
    isEditing,
    initialSnapshot,
    changedIngredients,
    name,
    servings,
    saveAs,
    imageUrl,
    instructions,
    prepTime,
    cookTime,
    equipment,
    equipmentSettings,
    ingredients,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl md:max-h-[90vh] md:overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary-600" />
            {isEditing ? t('modal.titleEdit') : t('modal.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('modal.descriptionEdit') : t('modal.descriptionNew')}
          </DialogDescription>
        </DialogHeader>

        {isSharedListRecipe && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700 mx-3 md:mx-0">
            {isEditing ? t('modal.sharedListEdit') : t('modal.sharedListNew')}
          </div>
        )}

        {changedIngredients.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 mx-3 md:mx-0">
            <p className="font-medium mb-1">{t('modal.ingredientsChangedTitle')}</p>
            <ul className="list-disc list-inside space-y-0.5">
              {changedIngredients.map(ing => (
                <li key={ing.id}>
                  {ing.foodItem!.name} — {t('modal.ingredientsChangedFrom')}{' '}
                  {Math.round(ing.snapshotCalories!)} {t('modal.ingredientsChangedTo')}{' '}
                  {Math.round(ing.foodItem!.calories)} kcal/100g
                </li>
              ))}
            </ul>
            <p className="mt-1 text-amber-700 text-xs">{t('modal.ingredientsChangedHint')}</p>
          </div>
        )}

        <div className="space-y-6 px-3 pb-4 md:px-0 md:pb-0 overflow-x-hidden">
          <div className="space-y-6">
            {/* Form */}
            <div className="space-y-6">
              {/* Recipe name and servings */}
              <div className={`grid gap-4 ${saveAs === '100g' ? '' : 'sm:grid-cols-2'}`}>
                <div className="space-y-2">
                  <Label htmlFor="recipe-name">{t('modal.recipeName')}</Label>
                  <RecipeNameInput
                    value={name}
                    onChange={setName}
                    placeholder={t('modal.recipeNamePlaceholder')}
                    label={t('modal.recipeName')}
                  />
                </div>
                {saveAs !== '100g' && (
                  <div className="space-y-2">
                    <Label htmlFor="servings">{t('modal.servings')}</Label>
                    <ServingsInput value={servings} onChange={setServings} />
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <Label>{t('modal.ingredients')}</Label>

                {/* Loading state for foods */}
                {foodsLoading && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center">
                    <p className="text-neutral-500 text-sm">{t('modal.loadingFoods')}</p>
                  </div>
                )}

                {/* Error state for foods */}
                {foodsError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{t('modal.foodsError')}</p>
                  </div>
                )}

                {/* Empty state - no ingredients yet */}
                {!foodsLoading && !foodsError && ingredients.length === 0 && (
                  <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center">
                    <p className="text-neutral-500 text-sm mb-4">{t('modal.noIngredients')}</p>
                    <Button variant="outline" onClick={handleAddIngredient} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('modal.addIngredient')}
                    </Button>
                  </div>
                )}

                {/* Ingredients list */}
                {!foodsLoading && !foodsError && ingredients.length > 0 && (
                  <div className="space-y-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={ingredients.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {ingredients.map(ingredient => (
                          <MemoizedSortableIngredientRowWrapper
                            key={ingredient.id}
                            ingredient={ingredient}
                            availableFoods={availableFoods}
                            sharedLists={sharedLists}
                            onIngredientChange={handleIngredientChange}
                            onIngredientRemove={handleIngredientRemove}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    <Button
                      variant="outline"
                      onClick={handleAddIngredient}
                      className="w-full gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      {t('modal.addIngredient')}
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
                  <span>{t('modal.detailsSection')}</span>
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
                      <Label>{t('modal.imageLabel')}</Label>
                      <RecipeImageUpload value={imageUrl} onChange={setImageUrl} />
                    </div>

                    {/* Instruktioner */}
                    <div className="space-y-2">
                      <Label htmlFor="recipe-instructions">{t('modal.instructionsLabel')}</Label>
                      <InstructionsTextarea
                        value={instructions}
                        onChange={setInstructions}
                        placeholder={t('modal.instructionsPlaceholder')}
                      />
                    </div>

                    {/* Tillagningstid */}
                    <div className="space-y-2">
                      <Label>{t('modal.cookingTime')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-neutral-500">{t('modal.prepTime')}</span>
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
                          <span className="text-xs text-neutral-500">{t('modal.cookTime')}</span>
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
                              {t('modal.totalTime', {
                                minutes:
                                  (typeof prepTime === 'number' ? prepTime : 0) +
                                  (typeof cookTime === 'number' ? cookTime : 0),
                              })}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Utrustning */}
                    <div className="space-y-3">
                      <Label>{t('modal.equipment')}</Label>
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
              <Label className="text-sm font-medium mb-3 block">{t('modal.saveAsLabel')}</Label>
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
                    {t('modal.saveAsPortion', { weight: Math.round(nutrition.perServing.weight) })}
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
                  <span className="text-sm">{t('modal.saveAs100g')}</span>
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {saveAs === 'portion' ? t('modal.saveAsPortionHint') : t('modal.saveAs100gHint')}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {t('modal.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (isEditing && !isDirty)}
              className="gap-2"
            >
              {isLoading ? (
                t('modal.saving')
              ) : (
                <>
                  <ChefHat className="h-4 w-4" />
                  {isEditing ? t('modal.update') : t('modal.save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
