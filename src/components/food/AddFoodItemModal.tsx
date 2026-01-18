import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createFoodItemSchema } from '@/lib/validation'
import {
  useCreateFoodItem,
  useUpdateFoodItem,
  useSearchFoodItems,
  type FoodItem,
} from '@/hooks/useFoodItems'
import { calculateFoodColor, calculateCalorieDensity } from '@/lib/calculations/colorDensity'

type FormData = z.infer<typeof createFoodItemSchema>

interface AddFoodItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  editItem?: FoodItem | null
}

// Slumpmässiga placeholder-exempel för namn-fältet
const PLACEHOLDER_FOODS = [
  'Banan',
  'Broccoli',
  'Lax',
  'Fullkornsbröd',
  'Yoghurt',
  'Mandlar',
  'Havregryn',
  'Kyckling',
  'Quinoa',
  'Spenat',
]

export function AddFoodItemModal({
  open,
  onOpenChange,
  onSuccess,
  editItem,
}: AddFoodItemModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // Slumpmässig placeholder som ändras vid varje öppning
  const randomPlaceholder = useMemo(() => {
    return PLACEHOLDER_FOODS[Math.floor(Math.random() * PLACEHOLDER_FOODS.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(createFoodItemSchema),
    mode: 'onChange',
    defaultValues: {
      food_type: 'Solid',
      default_amount: 100,
      default_unit: 'g',
      weight_grams: 100,
      // Ta bort förifyllda nollor - använd placeholder istället
    },
  })

  const createMutation = useCreateFoodItem()
  const updateMutation = useUpdateFoodItem()

  // Watch all form values for live calculations

  const name = watch('name')
  const defaultAmount = watch('default_amount')
  const defaultUnit = watch('default_unit')
  const weightGrams = watch('weight_grams')
  const calories = watch('calories')
  const fatG = watch('fat_g')
  const carbG = watch('carb_g')
  const proteinG = watch('protein_g')
  const foodType = watch('food_type')
  const gramsPerPiece = watch('grams_per_piece')
  const servingUnit = watch('serving_unit')

  // Populate form when editing
  useEffect(() => {
    if (editItem && open) {
      setValue('name', editItem.name)
      setValue('default_amount', editItem.default_amount)
      setValue('default_unit', editItem.default_unit)
      setValue('weight_grams', editItem.weight_grams || editItem.default_amount)
      setValue('calories', editItem.calories)
      setValue('fat_g', editItem.fat_g)
      setValue('carb_g', editItem.carb_g)
      setValue('protein_g', editItem.protein_g)
      setValue('food_type', editItem.food_type)
      if (editItem.ml_per_gram) {
        setValue('ml_per_gram', editItem.ml_per_gram)
      }
      if (editItem.grams_per_piece) {
        setValue('grams_per_piece', editItem.grams_per_piece)
      }
      if (editItem.serving_unit) {
        setValue('serving_unit', editItem.serving_unit)
      }
    } else if (!editItem && open) {
      // Reset to defaults when opening for create
      reset()
    }
  }, [editItem, open, setValue, reset])

  // Smart default: if unit is "g" or "gram", auto-set weight_grams to match default_amount
  useEffect(() => {
    if (!editItem && defaultUnit && defaultAmount) {
      const unit = defaultUnit.toLowerCase().trim()
      if (unit === 'g' || unit === 'gram') {
        setValue('weight_grams', defaultAmount, { shouldValidate: true })
      }
    }
  }, [editItem, defaultUnit, defaultAmount, setValue])

  // Besluta om viktfältet ska visas
  const shouldShowWeightField = useMemo(() => {
    const unit = (defaultUnit || '').toLowerCase().trim()
    const isGrams = unit === 'g' || unit === 'gram'

    // Visa bara om INTE (enhet är gram OCH weight_grams matchar default_amount)
    return !(isGrams && Math.abs((weightGrams || 0) - (defaultAmount || 0)) < 0.01)
  }, [defaultUnit, defaultAmount, weightGrams])

  // Duplicate warning - debounced search
  const [searchQuery, setSearchQuery] = useState('')
  const { data: searchResults } = useSearchFoodItems(searchQuery)

  useEffect(() => {
    // Don't search if editing existing item or if name is too short
    if (editItem || !name || name.trim().length < 3) {
      setDuplicateWarning(null)
      setSearchQuery('')
      return
    }

    const timeoutId = setTimeout(() => {
      setSearchQuery(name.trim())
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [name, editItem])

  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !editItem) {
      const duplicateNames = searchResults
        .filter(item => item.name.toLowerCase() === name.toLowerCase())
        .map(item => item.name)
        .join(', ')

      if (duplicateNames) {
        setDuplicateWarning(
          `⚠️ Ett livsmedel med namnet "${duplicateNames}" finns redan. Är du säker på att du vill skapa en till?`
        )
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }, [searchResults, name, editItem])

  // Live calculations
  const liveCalculations = useMemo(() => {
    if (!weightGrams || weightGrams <= 0) {
      return null
    }

    const kcalPerGram = calculateCalorieDensity(calories, weightGrams)
    const energyDensityColor = calculateFoodColor({
      calories,
      weightGrams,
      foodType,
    })

    // Macro distribution
    const totalMacroCalories = proteinG * 4 + carbG * 4 + fatG * 9
    const proteinPercent = totalMacroCalories > 0 ? ((proteinG * 4) / totalMacroCalories) * 100 : 0
    const carbPercent = totalMacroCalories > 0 ? ((carbG * 4) / totalMacroCalories) * 100 : 0
    const fatPercent = totalMacroCalories > 0 ? ((fatG * 9) / totalMacroCalories) * 100 : 0

    // Check if macro calories match total calories (within 10%)
    const caloriesDiff = Math.abs(totalMacroCalories - calories)
    const caloriesDiffPercent = calories > 0 ? (caloriesDiff / calories) * 100 : 0
    const macroCaloriesMismatch = caloriesDiffPercent > 10

    return {
      kcalPerGram,
      energyDensityColor,
      proteinPercent,
      carbPercent,
      fatPercent,
      macroCaloriesMismatch,
      caloriesDiffPercent,
    }
  }, [weightGrams, calories, fatG, carbG, proteinG, foodType])

  // Serving preview calculations
  const servingPreview = useMemo(() => {
    const gramsPerPieceValue = Number(gramsPerPiece) || 0
    const servingUnitValue = servingUnit || ''
    const weightGramsValue = Number(weightGrams) || 0

    // Visa bara om alla nödvändiga fält är ifyllda
    if (
      gramsPerPieceValue <= 0 ||
      !servingUnitValue.trim() ||
      weightGramsValue <= 0 ||
      calories <= 0
    ) {
      return null
    }

    const kcalPerGram = calories / weightGramsValue

    return {
      unit: servingUnitValue,
      grams: gramsPerPieceValue,
      kcal: kcalPerGram * gramsPerPieceValue,
      protein: (proteinG / weightGramsValue) * gramsPerPieceValue,
      carb: (carbG / weightGramsValue) * gramsPerPieceValue,
      fat: (fatG / weightGramsValue) * gramsPerPieceValue,
    }
  }, [gramsPerPiece, servingUnit, weightGrams, calories, proteinG, carbG, fatG])

  const onSubmit = async (data: FormData) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...data })
      } else {
        await createMutation.mutateAsync(data)
      }
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error(`Failed to ${editItem ? 'update' : 'create'} food item:`, error)
    }
  }

  const handleClose = () => {
    reset()
    setDuplicateWarning(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Redigera livsmedel' : 'Nytt livsmedel'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-900">{duplicateWarning}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
            {/* Main form */}
            <div className="space-y-6">
              {/* Basic information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Grundläggande information
                </h3>

                <div>
                  <Label htmlFor="name">Namn *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder={randomPlaceholder}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default_amount">Mängd *</Label>
                    <Input
                      id="default_amount"
                      type="number"
                      step="0.01"
                      {...register('default_amount', { valueAsNumber: true })}
                      placeholder="100"
                      className={errors.default_amount ? 'border-red-500' : ''}
                    />
                    {errors.default_amount && (
                      <p className="text-sm text-red-600 mt-1">{errors.default_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="default_unit">Enhet *</Label>
                    <Input
                      id="default_unit"
                      {...register('default_unit')}
                      placeholder="g, ml, st, dl..."
                      className={errors.default_unit ? 'border-red-500' : ''}
                    />
                    {errors.default_unit && (
                      <p className="text-sm text-red-600 mt-1">{errors.default_unit.message}</p>
                    )}
                  </div>
                </div>

                {/* Viktfält - visa bara om enheten inte är gram ELLER vikten skiljer sig från mängden */}
                {shouldShowWeightField && (
                  <div>
                    <Label htmlFor="weight_grams">
                      Vikt (gram) *
                      <span className="text-xs text-neutral-500 ml-2 font-normal">
                        Hur mycket väger {defaultAmount || '?'} {defaultUnit || '?'}?
                      </span>
                    </Label>
                    <Input
                      id="weight_grams"
                      type="number"
                      step="0.01"
                      {...register('weight_grams', { valueAsNumber: true })}
                      placeholder="100"
                      className={errors.weight_grams ? 'border-red-500' : ''}
                    />
                    {errors.weight_grams && (
                      <p className="text-sm text-red-600 mt-1">{errors.weight_grams.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Nutrition */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Näringsinnehåll (per {defaultAmount || '?'} {defaultUnit || '?'})
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calories">Kalorier (kcal) *</Label>
                    <Input
                      id="calories"
                      type="number"
                      step="0.1"
                      {...register('calories', { valueAsNumber: true })}
                      placeholder="0"
                      className={errors.calories ? 'border-red-500' : ''}
                    />
                    {errors.calories && (
                      <p className="text-sm text-red-600 mt-1">{errors.calories.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="protein_g">Protein (g) *</Label>
                    <Input
                      id="protein_g"
                      type="number"
                      step="0.1"
                      {...register('protein_g', { valueAsNumber: true })}
                      placeholder="0"
                      className={errors.protein_g ? 'border-red-500' : ''}
                    />
                    {errors.protein_g && (
                      <p className="text-sm text-red-600 mt-1">{errors.protein_g.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="carb_g">Kolhydrater (g) *</Label>
                    <Input
                      id="carb_g"
                      type="number"
                      step="0.1"
                      {...register('carb_g', { valueAsNumber: true })}
                      placeholder="0"
                      className={errors.carb_g ? 'border-red-500' : ''}
                    />
                    {errors.carb_g && (
                      <p className="text-sm text-red-600 mt-1">{errors.carb_g.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fat_g">Fett (g) *</Label>
                    <Input
                      id="fat_g"
                      type="number"
                      step="0.1"
                      {...register('fat_g', { valueAsNumber: true })}
                      placeholder="0"
                      className={errors.fat_g ? 'border-red-500' : ''}
                    />
                    {errors.fat_g && (
                      <p className="text-sm text-red-600 mt-1">{errors.fat_g.message}</p>
                    )}
                  </div>
                </div>

                {/* Macro mismatch warning */}
                {liveCalculations?.macroCaloriesMismatch && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Makronutrienterna ger {Math.round(proteinG * 4 + carbG * 4 + fatG * 9)}{' '}
                      kcal, men du angav {Math.round(calories)} kcal (
                      {Math.round(liveCalculations.caloriesDiffPercent)}% skillnad). Detta kan bero
                      på fiber, alkohol eller rundning.
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced settings */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Avancerade inställningar
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="food_type">Livsmedeltyp</Label>
                      <select
                        id="food_type"
                        {...register('food_type')}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Solid">Fast föda</option>
                        <option value="Liquid">Vätska</option>
                        <option value="Soup">Soppa</option>
                      </select>
                    </div>

                    {foodType === 'Liquid' && (
                      <div>
                        <Label htmlFor="ml_per_gram">ml per gram (för vätskor)</Label>
                        <Input
                          id="ml_per_gram"
                          type="number"
                          step="0.01"
                          {...register('ml_per_gram', { valueAsNumber: true })}
                          placeholder="1.0"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          T.ex. vatten = 1.0, mjölk ≈ 1.03, olja ≈ 0.92
                        </p>
                      </div>
                    )}

                    {/* Serveringsfunktion - gram per bit/styck */}
                    <div className="space-y-3 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                      <p className="text-sm font-medium text-neutral-900">
                        Serveringsinformation (optional)
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="grams_per_piece">
                            Vikt per portion
                            <span className="text-xs text-neutral-500 ml-1 font-normal">
                              (gram)
                            </span>
                          </Label>
                          <Input
                            id="grams_per_piece"
                            type="number"
                            step="0.01"
                            {...register('grams_per_piece', { valueAsNumber: true })}
                            placeholder="t.ex. 50"
                          />
                        </div>

                        <div>
                          <Label htmlFor="serving_unit">
                            Enhet
                            <span className="text-xs text-neutral-500 ml-1 font-normal">
                              (pkt, burk, etc.)
                            </span>
                          </Label>
                          <Input
                            id="serving_unit"
                            type="text"
                            {...register('serving_unit')}
                            placeholder="t.ex. pkt, burk, påse"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500">
                        T.ex. 1 ägg = 50g (enhet: &quot;st&quot;), 1 yoghurt = 150g (enhet:
                        &quot;pkt&quot;)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live preview panel */}
            <div className="lg:sticky lg:top-0 h-fit">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  📊 Förhandsgranskning
                </h3>

                {liveCalculations ? (
                  <>
                    {/* Energy density */}
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Energitäthet</p>
                      <p className="text-lg font-semibold text-neutral-900">
                        {liveCalculations.kcalPerGram.toFixed(2)} kcal/g
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            liveCalculations.energyDensityColor === 'Green'
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : liveCalculations.energyDensityColor === 'Yellow'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                : 'bg-orange-50 text-orange-700 border-orange-300'
                          }
                        >
                          {liveCalculations.energyDensityColor === 'Green'
                            ? 'Grön'
                            : liveCalculations.energyDensityColor === 'Yellow'
                              ? 'Gul'
                              : 'Orange'}
                        </Badge>
                        <span className="text-xs text-neutral-600">
                          (
                          {foodType === 'Solid'
                            ? 'Fast föda'
                            : foodType === 'Liquid'
                              ? 'Vätska'
                              : 'Soppa'}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Serving portion preview - NY SEKTION */}
                    {servingPreview && (
                      <>
                        <div className="border-t border-neutral-200 my-3" />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🍽️</span>
                            <p className="text-xs text-neutral-600 font-medium">
                              Serveringsportion
                            </p>
                          </div>

                          <p className="text-lg font-semibold text-neutral-900 mb-2">
                            1 {servingPreview.unit} ({servingPreview.grams}g)
                          </p>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Energi:</span>
                              <span className="font-semibold text-neutral-900">
                                {Math.round(servingPreview.kcal)} kcal
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Protein:</span>
                              <span className="font-medium text-neutral-900">
                                {servingPreview.protein.toFixed(1)}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Kolhydrater:</span>
                              <span className="font-medium text-neutral-900">
                                {servingPreview.carb.toFixed(1)}g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Fett:</span>
                              <span className="font-medium text-neutral-900">
                                {servingPreview.fat.toFixed(1)}g
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Energy comparison */}
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Energijämförelse</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Makronutrienter:</span>
                          <span className="font-medium">
                            {Math.round(proteinG * 4 + carbG * 4 + fatG * 9)} kcal
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Angivet:</span>
                          <span className="font-medium">{Math.round(calories)} kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Skillnad:</span>
                          <span
                            className={`font-semibold ${
                              Math.abs(liveCalculations.caloriesDiffPercent) > 10
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {calories - (proteinG * 4 + carbG * 4 + fatG * 9) > 0 ? '+' : ''}
                            {Math.round(liveCalculations.caloriesDiffPercent)}%
                          </span>
                        </div>
                      </div>
                      {/* Divider */}
                      <div className="border-t border-neutral-200 mt-2 mb-2"></div>
                    </div>

                    {/* Macro distribution */}
                    <div>
                      <p className="text-xs text-neutral-600 mb-2">Makrofördelning</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Protein</span>
                            <span className="font-medium">
                              {Math.round(liveCalculations.proteinPercent)}%
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${liveCalculations.proteinPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Kolhydrater</span>
                            <span className="font-medium">
                              {Math.round(liveCalculations.carbPercent)}%
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${liveCalculations.carbPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Fett</span>
                            <span className="font-medium">
                              {Math.round(liveCalculations.fatPercent)}%
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${liveCalculations.fatPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Fyll i formuläret för att se förhandsgranskning
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Sparar...'
                : editItem
                  ? 'Uppdatera'
                  : 'Spara livsmedel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
