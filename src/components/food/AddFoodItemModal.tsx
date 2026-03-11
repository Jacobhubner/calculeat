import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { ChevronDown, ChevronUp, AlertCircle, ScanBarcode, Camera, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createFoodItemSchema } from '@/lib/validation'
import {
  useCreateFoodItem,
  useUpdateFoodItem,
  useAdminCreateFoodItem,
  useAdminUpdateFoodItem,
  useSearchFoodItems,
  type FoodItem,
} from '@/hooks/useFoodItems'
import { calculateFoodColor, calculateCalorieDensity } from '@/lib/calculations/colorDensity'
import { useUpdateSharedListFoodItem, useCreateSharedListFoodItem } from '@/hooks/useSharedLists'
import { FEATURES } from '@/lib/config'
import { useBarcodeLookup } from '@/hooks/useBarcodeLookup'
import { useScanNutritionLabel } from '@/hooks/useScanNutritionLabel'
import { BarcodeScannerModal } from '@/components/food/BarcodeScannerModal'
import type { ScanResult } from '@/lib/types'
import { toast } from 'sonner'
import { useFoodNutrients } from '@/hooks/useFoodNutrients'
import { supabase } from '@/lib/supabase'

// z.preprocess() causes Zod to infer output fields as `unknown` at the type level,
// even though the runtime values are always the correct types. This explicit type
// matches the actual runtime output and satisfies react-hook-form's FieldValues constraint.
type FormData = {
  name: string
  default_amount: number
  default_unit: string
  weight_grams: number
  calories: number
  fat_g: number
  carb_g: number
  protein_g: number
  food_type: 'Solid' | 'Liquid' | 'Soup'
  ml_per_gram?: number
  grams_per_piece?: number
  serving_unit?: string
  saturated_fat_g?: number
  sugars_g?: number
  salt_g?: number
}

interface AddFoodItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  editItem?: FoodItem | null
  sharedListId?: string | null
  copyMode?: boolean // prefyll från editItem men skapa nytt personligt item
  adminGlobalMode?: boolean // admin: skapa/redigera globalt CalculEat-item direkt
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

// Volymkonverteringar: ml per enhet
const VOLUME_TO_ML: Record<string, number> = {
  dl: 100,
  msk: 15,
  tsk: 5,
}

type VolumeUnit = 'dl' | 'msk' | 'tsk'

export function AddFoodItemModal({
  open,
  onOpenChange,
  onSuccess,
  editItem,
  sharedListId,
  copyMode = false,
  adminGlobalMode = false,
}: AddFoodItemModalProps) {
  const queryClient = useQueryClient()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // Volymkonvertering state
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('dl')
  const [gramsPerVolume, setGramsPerVolume] = useState<number | undefined>(undefined)

  // Spara initiala värden för att jämföra vid redigering
  const [initialEditValues, setInitialEditValues] = useState<{
    name: string
    default_amount: number
    default_unit: string
    weight_grams: number
    calories: number
    fat_g: number
    carb_g: number
    protein_g: number
    food_type: string
    ml_per_gram: number | undefined
    grams_per_piece: number | undefined
    serving_unit: string | undefined
    gramsPerVolume: number | undefined
  } | null>(null)

  // Barcode scanning state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  // pendingBarcode: driver useBarcodeLookup (nollställs när lookup avslutas)
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null)
  // lockedBarcode: kvarstår för UI + submit tills modal stängs
  const [lockedBarcode, setLockedBarcode] = useState<string | null>(null)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
  const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null)

  // Nutrition label scanning
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const labelScan = useScanNutritionLabel()

  const {
    data: barcodeResult,
    error: barcodeError,
    isFetching: isBarcodeFetching,
  } = useBarcodeLookup(pendingBarcode)

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
    resolver: zodResolver(createFoodItemSchema) as Resolver<FormData>,
    mode: 'onChange',
    defaultValues: {
      food_type: 'Solid',
      default_amount: 100,
      default_unit: 'g',
      weight_grams: 100,
      calories: 0,
      fat_g: 0,
      carb_g: 0,
      protein_g: 0,
    },
  })

  const createMutation = useCreateFoodItem()
  const updateMutation = useUpdateFoodItem()
  const adminCreateMutation = useAdminCreateFoodItem()
  const adminUpdateMutation = useAdminUpdateFoodItem()
  const updateSharedListFoodItem = useUpdateSharedListFoodItem()
  const createSharedListFoodItem = useCreateSharedListFoodItem()

  const { data: editItemNutrients } = useFoodNutrients(editItem?.id ?? null)

  // Watch all form values for live calculations

  const name = watch('name')
  const defaultAmount = watch('default_amount')
  const defaultUnit = watch('default_unit')
  const weightGrams = watch('weight_grams')
  const calories = watch('calories')
  const fatG = watch('fat_g')
  const carbG = watch('carb_g')
  const proteinG = watch('protein_g')
  const saturatedFatG = watch('saturated_fat_g')
  const sugarsG = watch('sugars_g')
  const saltG = watch('salt_g')
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

      let initialGramsPerVolume: number | undefined = undefined
      if (editItem.ml_per_gram) {
        setValue('ml_per_gram', editItem.ml_per_gram)
        // Bakåtberäkna gramsPerVolume från ml_per_gram (visa som dl default)
        // ml_per_gram = ml_i_enhet / gram_per_enhet
        // gram_per_enhet = ml_i_enhet / ml_per_gram
        const gramsPerDl = VOLUME_TO_ML.dl / editItem.ml_per_gram
        setVolumeUnit('dl')
        initialGramsPerVolume = Math.round(gramsPerDl * 10) / 10
        setGramsPerVolume(initialGramsPerVolume)
      } else {
        setVolumeUnit('dl')
        setGramsPerVolume(undefined)
      }
      if (editItem.grams_per_piece) {
        setValue('grams_per_piece', editItem.grams_per_piece)
      }
      if (editItem.serving_unit) {
        setValue('serving_unit', editItem.serving_unit)
      }

      // Prefill extra nutrients if available
      if (editItemNutrients) {
        const satFat = editItemNutrients.find(n => n.nutrient_code === 'saturated_fat')
        const sugars = editItemNutrients.find(n => n.nutrient_code === 'sugars')
        const salt = editItemNutrients.find(n => n.nutrient_code === 'salt')
        if (satFat) setValue('saturated_fat_g', satFat.amount)
        if (sugars) setValue('sugars_g', sugars.amount)
        if (salt) setValue('salt_g', salt.amount)
      }

      // Spara initiala värden för jämförelse
      setInitialEditValues({
        name: editItem.name,
        default_amount: editItem.default_amount,
        default_unit: editItem.default_unit,
        weight_grams: editItem.weight_grams || editItem.default_amount,
        calories: editItem.calories,
        fat_g: editItem.fat_g,
        carb_g: editItem.carb_g,
        protein_g: editItem.protein_g,
        food_type: editItem.food_type,
        ml_per_gram: editItem.ml_per_gram,
        grams_per_piece: editItem.grams_per_piece,
        serving_unit: editItem.serving_unit,
        gramsPerVolume: initialGramsPerVolume,
      })
    } else if (!editItem && open) {
      // Reset to defaults when opening for create
      reset()
      setVolumeUnit('dl')
      setGramsPerVolume(undefined)
      setInitialEditValues(null)
    }
  }, [editItem, open, editItemNutrients, setValue, reset])

  // Smart default: if unit is "g" or "gram", auto-set weight_grams to match default_amount
  // This works both when creating new items AND when editing (user changes unit to 'g')
  useEffect(() => {
    if (defaultUnit && defaultAmount) {
      const unit = defaultUnit.toLowerCase().trim()
      if (unit === 'g' || unit === 'gram') {
        // Only auto-set if weight_grams doesn't match (avoids unnecessary updates)
        if (Math.abs((weightGrams || 0) - defaultAmount) > 0.01) {
          setValue('weight_grams', defaultAmount, { shouldValidate: true })
        }
      }
    }
  }, [defaultUnit, defaultAmount, weightGrams, setValue])

  // Besluta om viktfältet ska visas
  const shouldShowWeightField = useMemo(() => {
    const unit = (defaultUnit || '').toLowerCase().trim()
    const isGrams = unit === 'g' || unit === 'gram'

    // Visa bara om INTE (enhet är gram OCH weight_grams matchar default_amount)
    return !(isGrams && Math.abs((weightGrams || 0) - (defaultAmount || 0)) < 0.01)
  }, [defaultUnit, defaultAmount, weightGrams])

  // Kontrollera om portionsenheten är en volymenhet
  // Om så, ska "vikt per portion" fältet döljas (använd volymkonvertering istället)
  const isServingUnitVolume = useMemo(() => {
    const unit = (servingUnit || '').toLowerCase().trim()
    const volumeUnits = ['ml', 'msk', 'tsk', 'dl']
    return volumeUnits.includes(unit)
  }, [servingUnit])

  // Kontrollera om formuläret har ändrats (för redigeringsläge)
  const hasChanges = useMemo(() => {
    // Om vi inte redigerar, tillåt alltid submit
    if (!editItem || !initialEditValues) return true

    // Jämför alla värden
    const nameChanged = name !== initialEditValues.name
    const amountChanged = defaultAmount !== initialEditValues.default_amount
    const unitChanged = defaultUnit !== initialEditValues.default_unit
    const weightChanged = weightGrams !== initialEditValues.weight_grams
    const caloriesChanged = calories !== initialEditValues.calories
    const fatChanged = fatG !== initialEditValues.fat_g
    const carbChanged = carbG !== initialEditValues.carb_g
    const proteinChanged = proteinG !== initialEditValues.protein_g
    const typeChanged = foodType !== initialEditValues.food_type
    const gramsPerVolumeChanged = gramsPerVolume !== initialEditValues.gramsPerVolume
    const gramsPerPieceChanged = (gramsPerPiece || null) !== initialEditValues.grams_per_piece
    const servingUnitChanged = (servingUnit?.trim() || null) !== initialEditValues.serving_unit

    return (
      nameChanged ||
      amountChanged ||
      unitChanged ||
      weightChanged ||
      caloriesChanged ||
      fatChanged ||
      carbChanged ||
      proteinChanged ||
      typeChanged ||
      gramsPerVolumeChanged ||
      gramsPerPieceChanged ||
      servingUnitChanged
    )
  }, [
    editItem,
    initialEditValues,
    name,
    defaultAmount,
    defaultUnit,
    weightGrams,
    calories,
    fatG,
    carbG,
    proteinG,
    foodType,
    gramsPerVolume,
    gramsPerPiece,
    servingUnit,
  ])

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
    // Tillåt 0 kalorier (t.ex. vatten)
    if (
      gramsPerPieceValue <= 0 ||
      !servingUnitValue.trim() ||
      weightGramsValue <= 0 ||
      calories < 0
    ) {
      return null
    }

    const kcalPerGram = calories / weightGramsValue

    const scale = gramsPerPieceValue / weightGramsValue
    return {
      unit: servingUnitValue,
      grams: gramsPerPieceValue,
      kcal: kcalPerGram * gramsPerPieceValue,
      protein: proteinG * scale,
      carb: carbG * scale,
      fat: fatG * scale,
      saturatedFat: saturatedFatG != null && !isNaN(saturatedFatG) ? saturatedFatG * scale : null,
      sugars: sugarsG != null && !isNaN(sugarsG) ? sugarsG * scale : null,
      salt: saltG != null && !isNaN(saltG) ? saltG * scale : null,
    }
  }, [
    gramsPerPiece,
    servingUnit,
    weightGrams,
    calories,
    proteinG,
    carbG,
    fatG,
    saturatedFatG,
    sugarsG,
    saltG,
  ])

  // Check if form has non-default values
  const formHasValues = useCallback(() => {
    return (name && name.trim().length > 0) || calories > 0 || proteinG > 0 || carbG > 0 || fatG > 0
  }, [name, calories, proteinG, carbG, fatG])

  // Apply scan result to form
  const applyScanResult = useCallback(
    (result: ScanResult) => {
      if (result.name) setValue('name', result.name)
      setValue('calories', result.calories)
      setValue('default_amount', result.default_amount, { shouldValidate: true })
      setValue('default_unit', result.default_unit, { shouldValidate: true })
      setValue('weight_grams', result.default_amount, { shouldValidate: true })
      if (result.protein_g !== null) setValue('protein_g', result.protein_g)
      if (result.carb_g !== null) setValue('carb_g', result.carb_g)
      if (result.fat_g !== null) setValue('fat_g', result.fat_g)
      if (result.food_type) setValue('food_type', result.food_type)
      if (result.saturated_fat_g != null) setValue('saturated_fat_g', result.saturated_fat_g)
      if (result.sugars_g != null) setValue('sugars_g', result.sugars_g)
      if (result.salt_g != null) setValue('salt_g', result.salt_g)
      setPendingScanResult(null)
    },
    [setValue]
  )

  // Handle scan result — check for overwrite
  const handleScanResult = useCallback(
    (result: ScanResult) => {
      if (formHasValues()) {
        setPendingScanResult(result)
        setShowOverwriteConfirm(true)
      } else {
        applyScanResult(result)
      }
    },
    [formHasValues, applyScanResult]
  )

  // When barcode lookup completes (success or error) — stop spinner
  useEffect(() => {
    if (barcodeResult) {
      handleScanResult(barcodeResult)
      setPendingBarcode(null)
    }
  }, [barcodeResult, handleScanResult])

  useEffect(() => {
    if (barcodeError) {
      setPendingBarcode(null)
    }
  }, [barcodeError])

  // Handle nutrition label file selection
  const handleLabelFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      // Reset input so same file can be re-selected
      e.target.value = ''

      try {
        const result = await labelScan.mutateAsync(file)
        handleScanResult(result)
      } catch {
        // Error is available via labelScan.error
      }
    },
    [labelScan, handleScanResult]
  )

  const onSubmit = async (data: FormData) => {
    try {
      // Beräkna ml_per_gram från volymkonvertering
      // Formel: ml_per_gram = ml_i_vald_enhet / gram_per_enhet
      let calculatedMlPerGram: number | null = null

      // 1. Om gramsPerVolume är satt (från volymkonverteringssektionen)
      if (gramsPerVolume && gramsPerVolume > 0) {
        calculatedMlPerGram = VOLUME_TO_ML[volumeUnit] / gramsPerVolume
      }
      // 2. Om enheten är 'ml' och weight_grams är satt, beräkna automatiskt
      else if (
        data.default_unit.toLowerCase() === 'ml' &&
        data.weight_grams &&
        data.weight_grams > 0
      ) {
        // ml_per_gram = antal ml / antal gram
        // T.ex. 100ml / 100g = 1.0 (vatten), 100ml / 92g = 1.087 (olja)
        calculatedMlPerGram = data.default_amount / data.weight_grams
      }

      // Calculate density_g_per_ml from ml_per_gram (inverse)
      let density_g_per_ml: number | null = null
      if (calculatedMlPerGram && calculatedMlPerGram > 0) {
        density_g_per_ml = 1.0 / calculatedMlPerGram
      }

      // Determine reference_unit based on default_unit
      const isMLBased = data.default_unit.toLowerCase() === 'ml'
      const reference_unit: 'g' | 'ml' = isMLBased ? 'ml' : 'g'

      // Clean up NaN values from optional number fields
      const cleanedData = {
        ...data,
        barcode: lockedBarcode ?? undefined,
        grams_per_piece:
          data.grams_per_piece && !isNaN(data.grams_per_piece) ? data.grams_per_piece : null,
        ml_per_gram: calculatedMlPerGram,
        serving_unit: data.serving_unit?.trim() || null,
        reference_amount: data.weight_grams || 100,
        reference_unit,
        density_g_per_ml,
      }

      let savedFoodItemId: string | null = null

      if (!copyMode && editItem?.shared_list_id) {
        await updateSharedListFoodItem.mutateAsync({
          foodItemId: editItem.id,
          listId: editItem.shared_list_id,
          fields: cleanedData,
        })
        savedFoodItemId = editItem.id
      } else if (!copyMode && editItem && adminGlobalMode) {
        // Admin: uppdatera globalt item direkt (ingen CoW)
        const updated = await adminUpdateMutation.mutateAsync({ id: editItem.id, ...cleanedData })
        savedFoodItemId = updated?.id ?? editItem.id
      } else if (!copyMode && editItem) {
        // updateMutation may return a new item ID if it was a copy-on-write of a global item
        const updated = await updateMutation.mutateAsync({ id: editItem.id, ...cleanedData })
        savedFoodItemId = updated?.id ?? editItem.id
      } else if (sharedListId) {
        const created = await createSharedListFoodItem.mutateAsync({
          listId: sharedListId,
          ...cleanedData,
        })
        savedFoodItemId = created?.id ?? null
      } else if (adminGlobalMode) {
        // Admin: skapa globalt CalculEat-item
        const created = await adminCreateMutation.mutateAsync(cleanedData)
        savedFoodItemId = created?.id ?? null
      } else {
        const created = await createMutation.mutateAsync(cleanedData)
        savedFoodItemId = created?.id ?? null
      }

      // Spara valfria näringsvärden (mättat fett, sockerarter, salt) i food_nutrients
      if (savedFoodItemId) {
        const upsertRows: Array<{
          food_item_id: string
          nutrient_code: string
          amount: number
          unit: string
          reference_amount: number
          reference_unit: 'g' | 'ml'
        }> = []

        if (data.saturated_fat_g != null && !isNaN(data.saturated_fat_g))
          upsertRows.push({
            food_item_id: savedFoodItemId,
            nutrient_code: 'saturated_fat',
            amount: data.saturated_fat_g,
            unit: 'g',
            reference_amount: 100,
            reference_unit: 'g' as const,
          })
        if (data.sugars_g != null && !isNaN(data.sugars_g))
          upsertRows.push({
            food_item_id: savedFoodItemId,
            nutrient_code: 'sugars',
            amount: data.sugars_g,
            unit: 'g',
            reference_amount: 100,
            reference_unit: 'g' as const,
          })
        if (data.salt_g != null && !isNaN(data.salt_g))
          upsertRows.push({
            food_item_id: savedFoodItemId,
            nutrient_code: 'salt',
            amount: data.salt_g,
            unit: 'g',
            reference_amount: 100,
            reference_unit: 'g' as const,
          })

        if (upsertRows.length > 0) {
          await supabase
            .from('food_nutrients')
            .upsert(upsertRows, { onConflict: 'food_item_id,nutrient_code' })
        }

        // Radera rader för fält som användaren lämnat tomma
        const toDel = (['saturated_fat', 'sugars', 'salt'] as const).filter(code => {
          if (code === 'saturated_fat')
            return data.saturated_fat_g == null || isNaN(data.saturated_fat_g)
          if (code === 'sugars') return data.sugars_g == null || isNaN(data.sugars_g)
          if (code === 'salt') return data.salt_g == null || isNaN(data.salt_g)
          return false
        })
        if (toDel.length > 0) {
          await supabase
            .from('food_nutrients')
            .delete()
            .eq('food_item_id', savedFoodItemId)
            .in('nutrient_code', toDel)
        }
      }

      // Om produkten inte hittades externt men användaren fyllt i manuellt:
      // bidra med näringsvärden till user_contributed-databasen (fire-and-forget)
      if (lockedBarcode && barcodeError?.type === 'off_not_found') {
        supabase
          .rpc('contribute_barcode_data', {
            p_barcode: lockedBarcode,
            p_name: data.name,
            p_calories: data.calories,
            p_fat_g: data.fat_g,
            p_carb_g: data.carb_g,
            p_protein_g: data.protein_g,
            p_saturated_fat_g: data.saturated_fat_g ?? null,
            p_sugars_g: data.sugars_g ?? null,
            p_salt_g: data.salt_g ?? null,
            p_default_unit: data.default_unit === 'ml' ? 'ml' : 'g',
            p_food_type: data.food_type,
          })
          .then(({ data: result }) => {
            if (result?.action === 'created') {
              toast.success('Du var först att lägga till denna produkt. Tack!')
            }
          })
      }

      reset()
      setGramsPerVolume(undefined)
      setVolumeUnit('dl')
      setPendingBarcode(null)
      setLockedBarcode(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error(`Failed to ${editItem ? 'update' : 'create'} food item:`, error)
      toast.error(`Kunde inte ${editItem ? 'uppdatera' : 'spara'} livsmedlet. Försök igen.`)
    }
  }

  const handleClose = () => {
    reset()
    setDuplicateWarning(null)
    setGramsPerVolume(undefined)
    setVolumeUnit('dl')
    setPendingBarcode(null)
    setLockedBarcode(null)
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop())
      setCameraStream(null)
    }
    setPendingScanResult(null)
    setShowOverwriteConfirm(false)
    labelScan.reset()
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="md:max-w-2xl md:max-h-[90vh] md:overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {copyMode
                ? 'Skapa personlig kopia'
                : adminGlobalMode && editItem
                  ? 'Redigera CalculEat-livsmedel'
                  : adminGlobalMode
                    ? 'Nytt CalculEat-livsmedel'
                    : editItem
                      ? 'Redigera livsmedel'
                      : 'Nytt livsmedel'}
            </DialogTitle>
          </DialogHeader>

          {adminGlobalMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
              {editItem
                ? 'Redigerar globalt livsmedel. Ändringarna syns direkt för alla användare.'
                : 'Skapar globalt CalculEat-livsmedel. Syns för alla användare.'}
            </div>
          )}
          {!adminGlobalMode &&
            editItem &&
            editItem.user_id === null &&
            !editItem.shared_list_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                En personlig kopia skapas i din lista (Mina).
              </div>
            )}
          {!copyMode && editItem?.shared_list_id && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
              Redigerar ett delat livsmedel. Ändringarna syns hos alla listmedlemmar.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-4 pb-4 md:px-0 md:pb-0">
            {/* Scan buttons (only in create mode) */}
            {!editItem && (
              <div className="flex flex-wrap gap-2">
                {FEATURES.SCAN_BARCODE && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: {
                            facingMode: 'environment',
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                          },
                        })
                        setCameraStream(stream)
                      } catch {
                        // Camera denied or not available — silently ignore
                      }
                    }}
                    disabled={isBarcodeFetching}
                  >
                    {isBarcodeFetching ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <ScanBarcode className="h-4 w-4 mr-1.5" />
                    )}
                    {isBarcodeFetching ? 'Söker produkt...' : 'Streckkod'}
                  </Button>
                )}
                {FEATURES.SCAN_NUTRITION_LABEL ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={labelScan.isPending}
                  >
                    {labelScan.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-1.5" />
                    )}
                    {labelScan.isPending ? 'Analyserar...' : 'Skanna etikett'}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled title="Kommer snart">
                    <Camera className="h-4 w-4 mr-1.5" />
                    Skanna etikett
                  </Button>
                )}
              </div>
            )}

            {/* Barcode error */}
            {barcodeError && barcodeError.type === 'off_not_found' ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Produkten hittades inte i databasen
                    </p>
                    {lockedBarcode && (
                      <p className="text-xs text-orange-600 mt-0.5">Streckkod: {lockedBarcode}</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-orange-300 text-orange-800 hover:bg-orange-100"
                  onClick={() => nameInputRef.current?.focus()}
                >
                  Fyll i näringsvärden manuellt
                  <span className="text-xs ml-1.5 opacity-70">(streckkod sparas)</span>
                </Button>
              </div>
            ) : barcodeError ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  {barcodeError.message || 'Kunde inte hämta produkten'}
                </p>
              </div>
            ) : null}

            {/* Label scan error */}
            {labelScan.error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  {labelScan.error.message || 'Kunde inte läsa etiketten'}
                </p>
              </div>
            )}

            {/* Overwrite confirmation */}
            {showOverwriteConfirm && pendingScanResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-3">
                  Du har redan fyllt i värden. Vill du ersätta dem med skannade värden?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      applyScanResult(pendingScanResult)
                      setShowOverwriteConfirm(false)
                    }}
                  >
                    Ersätt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingScanResult(null)
                      setShowOverwriteConfirm(false)
                    }}
                  >
                    Behåll mina värden
                  </Button>
                </div>
              </div>
            )}

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
                      ref={e => {
                        register('name').ref(e)
                        nameInputRef.current = e
                      }}
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
                        step="any"
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
                    <div className="col-span-2">
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

                    <div>
                      <Label htmlFor="saturated_fat_g" className="text-neutral-500">
                        varav mättat fett (g)
                      </Label>
                      <Input
                        id="saturated_fat_g"
                        type="number"
                        step="0.1"
                        {...register('saturated_fat_g', { valueAsNumber: true })}
                        placeholder="0"
                        className={errors.saturated_fat_g ? 'border-red-500' : ''}
                      />
                      {errors.saturated_fat_g && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.saturated_fat_g.message}
                        </p>
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
                      <Label htmlFor="sugars_g" className="text-neutral-500">
                        varav sockerarter (g)
                      </Label>
                      <Input
                        id="sugars_g"
                        type="number"
                        step="0.1"
                        {...register('sugars_g', { valueAsNumber: true })}
                        placeholder="0"
                        className={errors.sugars_g ? 'border-red-500' : ''}
                      />
                      {errors.sugars_g && (
                        <p className="text-sm text-red-600 mt-1">{errors.sugars_g.message}</p>
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
                      <Label htmlFor="salt_g" className="text-neutral-500">
                        Salt (g)
                      </Label>
                      <Input
                        id="salt_g"
                        type="number"
                        step="0.01"
                        {...register('salt_g', { valueAsNumber: true })}
                        placeholder="0"
                        className={errors.salt_g ? 'border-red-500' : ''}
                      />
                      {errors.salt_g && (
                        <p className="text-sm text-red-600 mt-1">{errors.salt_g.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Macro mismatch warning */}
                  {liveCalculations?.macroCaloriesMismatch && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Makronutrienterna ger {Math.round(proteinG * 4 + carbG * 4 + fatG * 9)}{' '}
                        kcal, men du angav {Math.round(calories)} kcal (
                        {Math.round(liveCalculations.caloriesDiffPercent)}% skillnad). Detta kan
                        bero på fiber, alkohol eller rundning.
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

                      {/* Volymkonvertering - tillgänglig för alla livsmedel */}
                      <div className="space-y-3 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                        <p className="text-sm font-medium text-neutral-900">
                          Volymkonvertering (valfritt)
                        </p>

                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Label htmlFor="volume_grams">
                              Hur mycket väger 1 {volumeUnit} ({VOLUME_TO_ML[volumeUnit]}ml)?
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <select
                                id="volume_unit"
                                value={volumeUnit}
                                onChange={e => setVolumeUnit(e.target.value as VolumeUnit)}
                                className="w-20 px-2 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                              >
                                <option value="dl">dl</option>
                                <option value="msk">msk</option>
                                <option value="tsk">tsk</option>
                              </select>
                              <Input
                                id="volume_grams"
                                type="number"
                                step="0.1"
                                value={gramsPerVolume ?? ''}
                                onChange={e => {
                                  const val = e.target.value
                                  setGramsPerVolume(val === '' ? undefined : parseFloat(val))
                                }}
                                placeholder="gram"
                                className="flex-1"
                              />
                              <span className="self-center text-sm text-neutral-600">gram</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500">
                          Mjöl ≈ 60g/dl, Socker ≈ 90g/dl, Havregryn ≈ 40g/dl, Ris ≈ 85g/dl
                        </p>
                      </div>

                      {/* Serveringsfunktion - gram per bit/styck */}
                      <div className="space-y-3 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                        <p className="text-sm font-medium text-neutral-900">
                          Serveringsinformation (valfritt)
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Vikt per portion - dölj om portionsenheten är en volymenhet */}
                          {!isServingUnitVolume && (
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
                          )}

                          <div className={isServingUnitVolume ? 'col-span-2' : ''}>
                            <Label htmlFor="serving_unit">
                              Enhet
                              <span className="text-xs text-neutral-500 ml-1 font-normal">
                                (pkt, burk, osv.)
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

                        {isServingUnitVolume ? (
                          <p className="text-xs text-amber-600">
                            💡 För volymenheter (dl, msk, tsk), använd Volymkonvertering ovan
                            istället.
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-500">
                            T.ex. 1 ägg = 50g (enhet: &quot;st&quot;), 1 yoghurt = 150g (enhet:
                            &quot;pkt&quot;)
                          </p>
                        )}
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
                                <span className="text-neutral-600">Fett:</span>
                                <span className="font-medium text-neutral-900">
                                  {servingPreview.fat.toFixed(1)}g
                                </span>
                              </div>
                              {servingPreview.saturatedFat != null && (
                                <div className="flex justify-between pl-3">
                                  <span className="text-neutral-400">varav mättat fett:</span>
                                  <span className="text-neutral-600">
                                    {servingPreview.saturatedFat.toFixed(1)}g
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Kolhydrater:</span>
                                <span className="font-medium text-neutral-900">
                                  {servingPreview.carb.toFixed(1)}g
                                </span>
                              </div>
                              {servingPreview.sugars != null && (
                                <div className="flex justify-between pl-3">
                                  <span className="text-neutral-400">varav sockerarter:</span>
                                  <span className="text-neutral-600">
                                    {servingPreview.sugars.toFixed(1)}g
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Protein:</span>
                                <span className="font-medium text-neutral-900">
                                  {servingPreview.protein.toFixed(1)}g
                                </span>
                              </div>
                              {servingPreview.salt != null && (
                                <div className="flex justify-between pl-3">
                                  <span className="text-neutral-400">Salt:</span>
                                  <span className="text-neutral-600">
                                    {servingPreview.salt.toFixed(1)}g
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Näringsvärden per referensmängd */}
                      {(saturatedFatG != null || sugarsG != null || saltG != null) && (
                        <div>
                          <p className="text-xs text-neutral-600 mb-1">
                            Per {defaultAmount || '?'} {defaultUnit || '?'}
                          </p>
                          <div className="space-y-1 text-sm">
                            {saturatedFatG != null && !isNaN(saturatedFatG) && (
                              <div className="flex justify-between">
                                <span className="text-neutral-500">varav mättat fett:</span>
                                <span className="font-medium text-neutral-900">
                                  {saturatedFatG.toFixed(1)}g
                                </span>
                              </div>
                            )}
                            {sugarsG != null && !isNaN(sugarsG) && (
                              <div className="flex justify-between">
                                <span className="text-neutral-500">varav sockerarter:</span>
                                <span className="font-medium text-neutral-900">
                                  {sugarsG.toFixed(1)}g
                                </span>
                              </div>
                            )}
                            {saltG != null && !isNaN(saltG) && (
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Salt:</span>
                                <span className="font-medium text-neutral-900">
                                  {saltG.toFixed(1)}g
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="border-t border-neutral-200 mt-2 mb-2" />
                        </div>
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
                disabled={
                  !isValid ||
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  updateSharedListFoodItem.isPending ||
                  createSharedListFoodItem.isPending ||
                  (!!editItem && !hasChanges)
                }
              >
                {createMutation.isPending ||
                updateMutation.isPending ||
                updateSharedListFoodItem.isPending ||
                createSharedListFoodItem.isPending
                  ? 'Sparar...'
                  : editItem
                    ? 'Uppdatera'
                    : 'Spara livsmedel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for nutrition label */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleLabelFile}
      />

      {/* Barcode scanner modal */}
      <BarcodeScannerModal
        stream={cameraStream}
        onDetected={code => {
          // Rensa eventuell cachad data för denna streckkod så att lookup alltid körs
          queryClient.removeQueries({ queryKey: ['barcode', code] })
          setPendingBarcode(code)
          setLockedBarcode(code)
          if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop())
            setCameraStream(null)
          }
        }}
        onClose={() => {
          if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop())
            setCameraStream(null)
          }
        }}
      />
    </>
  )
}
