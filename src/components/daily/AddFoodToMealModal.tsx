import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { usePaginatedFoodItems, type FoodItem, type FoodTab } from '@/hooks/useFoodItems'
import { useRecentFoodItems } from '@/hooks/useRecentFoodItems'
import { useAddFoodToMeal, useCreateMealEntry, useUpdateMealItem } from '@/hooks/useDailyLogs'
import { useMealSettings } from '@/hooks/useMealSettings'
import { useSharedLists } from '@/hooks/useSharedLists'
import { UnitSelector, getAvailableUnits, calculateNutritionForUnit } from './UnitSelector'
import { calculateIngredientWeight } from '@/lib/calculations/recipeCalculator'
import { convertWeightToUnit } from '@/lib/utils/unitConversion'
import { NutritionPreview } from './NutritionPreview'
import { useShowEnergyDensity } from '@/hooks/useShowEnergyDensity'
import { toast } from 'sonner'
import { SOURCE_BADGES, getListItemBadgeConfig } from '@/lib/constants/sourceBadges'
import { DATA_SOURCES } from '@/lib/constants/dataSources'
import { AddFoodItemModal } from '@/components/food/AddFoodItemModal'
import { CopyToCalculeatPrompt } from '@/components/food/CopyToCalculeatPrompt'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { SavedMealPicker } from './SavedMealPicker'
import { pickDefaultMealIndex } from '@/lib/utils/defaultMealForTime'

const PAGE_SIZE = 50

interface PreselectedFood {
  food: FoodItem
  amount: number
  unit: string
}

interface EditItemData {
  itemId: string
  food: FoodItem
  amount: number
  unit: string
}

interface AddFoodToMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealName: string
  mealEntryId?: string
  dailyLogId?: string
  onSuccess?: () => void
  preselectedFood?: PreselectedFood
  editItem?: EditItemData
  onFoodSelect?: (food: FoodItem) => void
  showMealSelector?: boolean
  extraMealOptions?: { id: string; meal_name: string; meal_order: number }[]
  /** Visar växeln Livsmedel / Sparade måltider högst upp. Kräver dailyLogId. */
  allowSavedMeals?: boolean
  /**
   * Måltidsplatsens ordning, när modalen öppnats från en specifik måltid.
   * Utelämnas vid snabbloggning — då härleds den ur mealSettings via namnet.
   */
  mealOrder?: number
}

export function AddFoodToMealModal({
  open,
  onOpenChange,
  mealName,
  mealEntryId,
  dailyLogId,
  onSuccess,
  preselectedFood,
  editItem,
  onFoodSelect,
  showMealSelector = false,
  extraMealOptions = [],
  allowSavedMeals = false,
  mealOrder,
}: AddFoodToMealModalProps) {
  const { t } = useTranslation('food')
  const tAny = t as (key: string) => string
  const showEnergyDensity = useShowEnergyDensity()
  const isEditMode = !!editItem

  // Admin: efter att ha skapat ett nytt personligt livsmedel härifrån — fråga om
  // en kopia även ska läggas i den globala Calculeat-listan. Aldrig i preview.
  const { data: isAdmin = false } = useIsAdmin()
  const { isPreviewMode } = useAuth()
  const [copyPrompt, setCopyPrompt] = useState<FoodItem | null>(null)

  // Datakällsflikarna kommer ur DATA_SOURCES — tidigare var de uppräknade
  // här och i allTabs nedan, frikopplat från registret, så en ny källa hade
  // behövt läggas till på båda ställena.
  const STATIC_TABS: { key: FoodTab; label: string }[] = [
    { key: 'mina', label: t('tabs.mine') },
    { key: 'calculeat', label: t('tabs.calculeat') },
    ...DATA_SOURCES.map(ds => ({ key: ds.tabKey, label: tAny(ds.labelKey) })),
    { key: 'alla', label: t('tabs.all') },
  ]

  // Food-selection state
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(
    editItem?.food ?? preselectedFood?.food ?? null
  )
  const [amount, setAmount] = useState<number | ''>(
    editItem?.amount ?? preselectedFood?.amount ?? 1
  )
  const [selectedUnit, setSelectedUnit] = useState<string>(
    editItem?.unit ?? preselectedFood?.unit ?? ''
  )
  const [selectedMealName, setSelectedMealName] = useState<string>(mealName)

  // AddFoodItemModal (scan flow)
  const [addFoodItemModalOpen, setAddFoodItemModalOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Livsmedel eller sparad måltid. Ligger ovanför livsmedelsflikarna eftersom
  // FoodTab styr livsmedelsfrågan — en 'meals'-flik där hade skickat ett
  // meningslöst värde vidare till usePaginatedFoodItems.
  const [source, setSource] = useState<'food' | 'meals'>('food')

  // Redigering byter ett befintligt livsmedel — att ladda en hel måltid där
  // vore något helt annat.
  const showSavedMealSwitch = allowSavedMeals && !isEditMode && !!dailyLogId

  /** Måltidsläget är aktivt — livsmedelslistan och dess kontroller ska vika undan. */
  const isSavedMealMode = showSavedMealSwitch && source === 'meals' && !selectedFood

  // Tab + pagination + filter state
  const [activeTab, setActiveTab] = useState<FoodTab>('alla')
  const [page, setPage] = useState(0)
  const [colorFilter, setColorFilter] = useState<'Green' | 'Yellow' | 'Orange' | null>(null)
  const [recipeFilter, setRecipeFilter] = useState<boolean | null>(null)

  // Refs
  const isPreselectedRef = useRef(false)
  const prevOpenRef = useRef(open)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { data: mealSettings } = useMealSettings()
  const { data: sharedLists = [] } = useSharedLists()

  /** Måltidsplatser att välja mellan när en sparad måltid ska laddas. */
  const savedMealOptions = useMemo(
    () =>
      [...(mealSettings ?? []), ...extraMealOptions]
        .sort((a, b) => a.meal_order - b.meal_order)
        .map(m => ({ name: m.meal_name, order: m.meal_order })),
    [mealSettings, extraMealOptions]
  )

  /**
   * Vilken plats den sparade måltiden laddas till.
   *
   * mealOrder kommer som prop när modalen öppnats från en måltidsrubrik, men
   * vid snabbloggning finns ingen — då härleds den ur mealSettings via namnet.
   * mealEntryId får bara följa med när platsen fortfarande är den modalen
   * öppnades för; byter användaren plats pekar id:t på fel måltid och skulle
   * lägga innehållet i den gamla.
   */
  const savedMealTarget = useMemo(() => {
    const name = selectedMealName || mealName
    const match = savedMealOptions.find(m => m.name === name)
    return {
      name,
      order: match?.order ?? mealOrder ?? 0,
      entryId: name === mealName ? mealEntryId : undefined,
    }
  }, [selectedMealName, mealName, mealEntryId, mealOrder, savedMealOptions])

  const allTabs = useMemo<{ key: FoodTab; label: string }[]>(
    () => [
      STATIC_TABS.find(tab => tab.key === 'alla')!,
      STATIC_TABS.find(tab => tab.key === 'mina')!,
      STATIC_TABS.find(tab => tab.key === 'calculeat')!,
      // Datakällorna i registrets ordning, i stället för uppräknade per namn
      ...DATA_SOURCES.map(ds => STATIC_TABS.find(tab => tab.key === ds.tabKey)!),
      ...sharedLists.map(list => ({
        key: `list:${list.id}` as FoodTab,
        label: list.name,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- STATIC_TABS byggs om varje render men innehållet ändras bara med språket
    [sharedLists, t]
  )
  const addFoodToMeal = useAddFoodToMeal()
  const createMealEntry = useCreateMealEntry()
  const updateMealItem = useUpdateMealItem()

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Dead-tab guard: om aktiv lista-flik försvinner, falla tillbaka till 'mina'

  useEffect(() => {
    if (!activeTab.startsWith('list:')) return
    const listId = activeTab.slice(5)
    if (!sharedLists.some(l => l.id === listId)) {
      setActiveTab('alla')
    }
  }, [sharedLists, activeTab])

  // Reset page on tab/search/filter change

  useEffect(() => {
    setPage(0)
  }, [activeTab, debouncedSearch, colorFilter, recipeFilter])

  // Reset colorFilter and recipeFilter on tab change
  useEffect(() => {
    setColorFilter(null)
    setRecipeFilter(null)
  }, [activeTab])

  // Paginated data via RPC
  const { data: paginatedData, isLoading: foodsLoading } = usePaginatedFoodItems({
    tab: activeTab,
    page,
    pageSize: PAGE_SIZE,
    searchQuery: debouncedSearch || undefined,
    colorFilter: colorFilter || undefined,
    isRecipeFilter: recipeFilter ?? undefined,
  })

  const foods = paginatedData?.items ?? []
  const totalPages = paginatedData?.totalPages ?? 0

  // Senaste loggade livsmedel — visas överst när listan är ofiltrerad.
  // Samma limit som RecentFoodsCard så att React Query-cachen delas.
  const { data: recentFoods = [] } = useRecentFoodItems(6)
  const showRecentSection =
    activeTab === 'alla' &&
    !debouncedSearch &&
    !colorFilter &&
    recipeFilter === null &&
    page === 0 &&
    recentFoods.length > 0

  // Page clamping

  useEffect(() => {
    if (paginatedData && page >= paginatedData.totalPages && paginatedData.totalPages > 0) {
      setPage(paginatedData.totalPages - 1)
    }
  }, [paginatedData, page])

  // Reset form state
  const resetForm = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedFood(null)
    setAmount(1)
    setSelectedUnit('')
    setSelectedMealName('')
    setActiveTab('alla')
    setPage(0)
    setColorFilter(null)
    setRecipeFilter(null)
    // Utan detta öppnas modalen i måltidsläget nästa gång, trots att
    // "Lägg till" som regel syftar på ett livsmedel.
    setSource('food')
    isPreselectedRef.current = false
  }, [])

  // Initialize form when modal opens
  const initializeForm = useCallback(() => {
    if (mealName) {
      setSelectedMealName(mealName)
    } else if (mealSettings && mealSettings.length > 0) {
      // Snabbloggning har ingen given plats. Tidigare valdes sista måltiden,
      // alltså "Middag" även på morgonen — maten hamnade tyst i fel måltid.
      const ordered = [...mealSettings].sort((a, b) => a.meal_order - b.meal_order)
      const index = pickDefaultMealIndex(ordered.length)
      setSelectedMealName(ordered[index]!.meal_name)
    }

    if (editItem) {
      isPreselectedRef.current = true
      setSelectedFood(editItem.food)
      setAmount(editItem.amount)
      setSelectedUnit(editItem.unit)
      return
    }

    if (preselectedFood) {
      isPreselectedRef.current = true
      setSelectedFood(preselectedFood.food)
      setAmount(preselectedFood.amount)
      setSelectedUnit(preselectedFood.unit)
    }
  }, [mealName, mealSettings, preselectedFood, editItem])

  // Handle modal open/close

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      initializeForm()
      // Focus search field after dialog animation completes
    } else if (!open && prevOpenRef.current) {
      resetForm()
    }
    prevOpenRef.current = open
  }, [open, initializeForm, resetForm])

  // Nutrition preview
  const nutritionPreview = useMemo(() => {
    if (!selectedFood || amount === '' || amount <= 0) return null
    return calculateNutritionForUnit(selectedFood, amount, selectedUnit)
  }, [selectedFood, amount, selectedUnit])

  const handleSelectFood = (food: FoodItem) => {
    if (onFoodSelect) {
      onFoodSelect(food)
      onOpenChange(false)
      return
    }
    isPreselectedRef.current = false
    setSelectedFood(food)
    setSearchQuery('')

    const availableUnits = getAvailableUnits(food)

    // Förifyll senast loggad mängd/enhet för detta livsmedel
    try {
      const savedPortion = localStorage.getItem(`food-last-portion:${food.id}`)
      if (savedPortion) {
        const parsed = JSON.parse(savedPortion) as { amount?: number; unit?: string }
        if (
          typeof parsed.amount === 'number' &&
          parsed.amount > 0 &&
          typeof parsed.unit === 'string' &&
          availableUnits.includes(parsed.unit)
        ) {
          setSelectedUnit(parsed.unit)
          setAmount(parsed.amount)
          return
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    let displayMode: string | null = null

    try {
      const savedMode = localStorage.getItem(`food-display-mode:${food.id}`)
      if (savedMode) {
        displayMode = (JSON.parse(savedMode) as { mode: string }).mode
      }
    } catch {
      // Ignore localStorage errors
    }

    if (!displayMode) {
      if (food.grams_per_piece && food.serving_unit && food.kcal_per_unit) {
        displayMode = 'serving'
      } else {
        displayMode = 'per100g'
      }
    }

    let defaultUnit: string
    let defaultAmount: number
    if (displayMode === 'serving') {
      defaultUnit = food.serving_unit || 'st'
      defaultAmount = 1
    } else if (displayMode === 'perVolume') {
      defaultUnit = 'ml'
      defaultAmount = 100
    } else {
      // Respect the food's own default_unit (e.g. 'ml' for liquid foods)
      defaultUnit = food.default_unit && food.default_unit !== 'portion' ? food.default_unit : 'g'
      defaultAmount = 100
    }

    if (!availableUnits.includes(defaultUnit)) {
      defaultUnit = availableUnits[0]
      defaultAmount = food.default_amount
    }

    setSelectedUnit(defaultUnit)
    setAmount(defaultAmount)
  }

  const handleUnitChange = (newUnit: string) => {
    if (!selectedFood || amount === '' || amount <= 0) {
      setSelectedUnit(newUnit)
      return
    }

    const WEIGHT_VOLUME_UNITS = new Set(['g', 'kg', 'dl', 'ml', 'msk', 'tsk'])
    const PIECE_UNITS = new Set(['st', 'portion'])
    const oldIsPiece = PIECE_UNITS.has(selectedUnit) || !WEIGHT_VOLUME_UNITS.has(selectedUnit)
    const newIsPiece = PIECE_UNITS.has(newUnit) || !WEIGHT_VOLUME_UNITS.has(newUnit)

    const gramsPerPiece =
      selectedFood.grams_per_piece && selectedFood.grams_per_piece > 0
        ? selectedFood.grams_per_piece
        : null

    if (oldIsPiece && newIsPiece) {
      setSelectedUnit(newUnit)
      return
    }

    const weightGrams = calculateIngredientWeight(selectedFood, Number(amount), selectedUnit)

    let newAmount: number
    if (newIsPiece && gramsPerPiece) {
      newAmount = Math.round((weightGrams / gramsPerPiece) * 100) / 100
    } else if (newIsPiece) {
      // no grams_per_piece — keep amount
      setSelectedUnit(newUnit)
      return
    } else {
      newAmount =
        Math.round(
          convertWeightToUnit(weightGrams, newUnit, selectedFood.ml_per_gram ?? undefined) * 100
        ) / 100
    }

    setSelectedUnit(newUnit)
    setAmount(newAmount)
  }

  const saveLastPortion = () => {
    if (!selectedFood || amount === '' || amount <= 0) return
    try {
      localStorage.setItem(
        `food-last-portion:${selectedFood.id}`,
        JSON.stringify({ amount: Number(amount), unit: selectedUnit })
      )
    } catch {
      // Ignore localStorage errors
    }
  }

  const handleAddFood = async () => {
    if (!selectedFood || !nutritionPreview) return

    try {
      if (isEditMode && editItem) {
        await updateMealItem.mutateAsync({
          itemId: editItem.itemId,
          amount: Number(amount),
          unit: selectedUnit,
          weightGrams: nutritionPreview.weightGrams,
          calories: nutritionPreview.calories,
          protein_g: nutritionPreview.protein,
          carb_g: nutritionPreview.carbs,
          fat_g: nutritionPreview.fat,
        })
        saveLastPortion()
        toast.success(t('addToMealModal.toastUpdated'))
        onOpenChange(false)
        onSuccess?.()
        return
      }

      let targetMealEntryId = mealEntryId

      if (!targetMealEntryId) {
        const effectiveMealName = selectedMealName || mealName
        if (!effectiveMealName) {
          toast.error(t('addToMealModal.toastNoMeal'))
          return
        }
        const mealSetting = mealSettings?.find(m => m.meal_name === effectiveMealName)
        const newMealEntry = await createMealEntry.mutateAsync({
          dailyLogId: dailyLogId!,
          mealName: effectiveMealName!,
          mealOrder: mealSetting?.meal_order ?? 0,
        })
        targetMealEntryId = newMealEntry.id
      }

      await addFoodToMeal.mutateAsync({
        mealEntryId: targetMealEntryId,
        foodItemId: selectedFood.id,
        amount: Number(amount),
        unit: selectedUnit,
        weightGrams: nutritionPreview.weightGrams,
        calories: nutritionPreview.calories,
        protein_g: nutritionPreview.protein,
        carb_g: nutritionPreview.carbs,
        fat_g: nutritionPreview.fat,
      })

      saveLastPortion()
      toast.success(
        t('addToMealModal.toastAdded', { food: selectedFood.name, meal: selectedMealName })
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add food:', error)
      toast.error(t('addToMealModal.toastError'))
    }
  }

  const getColorBadge = (color?: string | null) => {
    if (!showEnergyDensity || !color) return null
    return (
      <Badge
        variant="outline"
        className={
          color === 'Green'
            ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/25 dark:text-green-300 dark:border-green-800'
            : color === 'Yellow'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-800'
              : 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800'
        }
      >
        {tAny(`color.${color.toLowerCase()}`)}
      </Badge>
    )
  }

  const renderFoodRow = (food: FoodItem, keyPrefix = '') => (
    <button
      key={`${keyPrefix}${food.id}`}
      onClick={() => handleSelectFood(food)}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left border border-transparent hover:border-neutral-200 dark:hover:bg-neutral-800 dark:hover:border-neutral-700"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-medium text-neutral-900 truncate dark:text-neutral-100">{food.name}</p>
          <Badge
            variant="outline"
            className={`text-[9px] px-1 py-0 h-4 shrink-0 ${
              food.shared_list_id
                ? getListItemBadgeConfig(
                    sharedLists.find(l => l.id === food.shared_list_id)?.name ?? ''
                  ).className
                : (SOURCE_BADGES[food.source] ?? SOURCE_BADGES.user).className
            }`}
          >
            {food.shared_list_id
              ? getListItemBadgeConfig(
                  sharedLists.find(l => l.id === food.shared_list_id)?.name ?? ''
                ).label
              : (SOURCE_BADGES[food.source] ?? SOURCE_BADGES.user).label}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {food.calories} kcal / {food.default_amount} {food.default_unit}
          {food.brand && ` • ${food.brand}`}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        {getColorBadge(food.energy_density_color)}
        <Plus className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
      </div>
    </button>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg flex flex-col"
          onOpenAutoFocus={e => {
            e.preventDefault()
            searchInputRef.current?.focus()
          }}
        >
          <DialogHeader>
            {/* Rubriken följer läget — "Lägg till livsmedel" ovanför en lista
                med sparade måltider beskriver fel sak. */}
            <DialogTitle>
              {isEditMode
                ? t('addToMealModal.titleEdit')
                : isSavedMealMode
                  ? t('addToMealModal.titleSavedMeal')
                  : t('addToMealModal.title')}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `${t('addToMealModal.descriptionEdit')} ${editItem?.food.name}`
                : isSavedMealMode
                  ? t('addToMealModal.descriptionSavedMeal')
                  : mealName
                    ? `${t('addToMealModal.descriptionMeal')} ${mealName}`
                    : t('addToMealModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto space-y-3">
            {/* Källväxel — döljs så fort ett livsmedel valts, då handlar
                resten av modalen om mängd och enhet. */}
            {showSavedMealSwitch && !selectedFood && (
              <div className="flex gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {(
                  [
                    { key: 'food', label: t('addToMealModal.sourceFood') },
                    { key: 'meals', label: t('addToMealModal.sourceSavedMeals') },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSource(opt.key)}
                    aria-pressed={source === opt.key}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      source === opt.key
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {isSavedMealMode ? (
              <SavedMealPicker
                targetMealName={savedMealTarget.name}
                targetMealOrder={savedMealTarget.order}
                // Bara relevant när modalen öppnats från en befintlig måltid.
                // Vid snabbloggning väljer man plats i listan, och då skulle
                // ett medskickat id peka på fel måltid.
                targetMealEntryId={savedMealTarget.entryId}
                dailyLogId={dailyLogId!}
                mealOptions={savedMealOptions}
                onMealChange={setSelectedMealName}
                onLoaded={() => onOpenChange(false)}
              />
            ) : !selectedFood ? (
              <>
                {/* Tabs */}
                <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto dark:border-neutral-700">
                  {allTabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key)
                        setPage(0)
                      }}
                      className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? 'border-primary-500 text-primary-600 dark:text-primary-300'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search + scan row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    <Input
                      ref={searchInputRef}
                      placeholder={t('addToMealModal.searchPlaceholder')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    title={t('addToMealModal.scanBarcode')}
                    onClick={() => {
                      // Stäng INTE den här modalen först. Flera anropare
                      // renderar villkorligt (t.ex. `{dailyLogId && ...}` i
                      // QuickLogButton), så onOpenChange(false) avmonterar hela
                      // komponenten — och då hinner tillståndet nedan aldrig
                      // användas. Knappen såg helt död ut.
                      // AddFoodItemModal renderas utanför <Dialog> och lägger
                      // sig ovanpå, så det räcker att öppna den.
                      setAddFoodItemModalOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Color filter pills — respekterar show_energy_density */}
                <div className="flex flex-wrap gap-1">
                  {showEnergyDensity &&
                    ([null, 'Green', 'Yellow', 'Orange'] as const).map(c => (
                      <button
                        key={c ?? 'all'}
                        onClick={() => {
                          setColorFilter(c)
                          setPage(0)
                        }}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                          colorFilter === c
                            ? c === 'Green'
                              ? 'bg-green-500 text-white border-green-600'
                              : c === 'Yellow'
                                ? 'bg-yellow-400 text-neutral-900 border-yellow-500 dark:text-neutral-100'
                                : c === 'Orange'
                                  ? 'bg-orange-500 text-white border-orange-600'
                                  : 'bg-neutral-200 text-neutral-700 border-neutral-400 dark:border-neutral-500 dark:bg-neutral-700 dark:text-neutral-200'
                            : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-400'
                        }`}
                      >
                        {c === null
                          ? t('addToMealModal.colorAll')
                          : tAny(`color.${c.toLowerCase()}`)}
                      </button>
                    ))}

                  {/* Recipe filter — on Mina, Calculeat and Alla tabs */}
                  {(activeTab === 'mina' || activeTab === 'calculeat' || activeTab === 'alla') && (
                    <>
                      {showEnergyDensity && (
                        <span className="text-neutral-200 border-l border-neutral-200 mx-0.5 dark:border-neutral-700" />
                      )}
                      {([null, true, false] as const).map(r => (
                        <button
                          key={r === null ? 'r-all' : r ? 'r-recept' : 'r-livsmedel'}
                          onClick={() => {
                            setRecipeFilter(r)
                            setPage(0)
                          }}
                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                            recipeFilter === r
                              ? 'bg-primary-500 text-white border-primary-600'
                              : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-400'
                          }`}
                        >
                          {r === null
                            ? t('addToMealModal.typeAll')
                            : r
                              ? t('addToMealModal.typeRecipe')
                              : t('addToMealModal.typeFood')}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {/* Food list */}
                <div className="space-y-1">
                  {showRecentSection && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 px-1 pt-1 dark:text-neutral-500">
                        {t('addToMealModal.recentHeading')}
                      </p>
                      {recentFoods.map(food => renderFoodRow(food, 'recent-'))}
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 px-1 pt-2 dark:text-neutral-500">
                        {t('addToMealModal.allFoodsHeading')}
                      </p>
                    </>
                  )}
                  {foodsLoading ? (
                    <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">
                      {t('addToMealModal.loading')}
                    </p>
                  ) : foods.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">
                      {searchQuery ? t('addToMealModal.noFoodsFound') : t('addToMealModal.noFoods')}
                    </p>
                  ) : (
                    foods.map(food => renderFoodRow(food))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('addToMealModal.page', { page: page + 1, total: totalPages })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <ChevronLeft className="h-3 w-3" /> {t('addToMealModal.prev')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {t('addToMealModal.next')} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Selected food header */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg dark:bg-neutral-900">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedFood.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {selectedFood.calories} kcal / {selectedFood.default_amount}{' '}
                      {selectedFood.default_unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getColorBadge(selectedFood.energy_density_color)}
                    {!isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFood(null)}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Amount and unit selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">{t('addToMealModal.fieldAmount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      min="0.1"
                      value={amount}
                      onChange={e => {
                        const val = e.target.value
                        setAmount(val === '' ? '' : parseFloat(val))
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('addToMealModal.fieldUnit')}</Label>
                    <UnitSelector
                      food={selectedFood}
                      value={selectedUnit}
                      onChange={handleUnitChange}
                      className="mt-1 w-full"
                    />
                  </div>
                </div>

                {/* Nutrition preview */}
                {nutritionPreview && (
                  <NutritionPreview
                    calories={nutritionPreview.calories}
                    protein={nutritionPreview.protein}
                    carbs={nutritionPreview.carbs}
                    fat={nutritionPreview.fat}
                    weightGrams={nutritionPreview.weightGrams}
                    energyDensityColor={selectedFood.energy_density_color}
                    saturatedFat={nutritionPreview.saturatedFat}
                    sugars={nutritionPreview.sugars}
                    fiber={nutritionPreview.fiber}
                    salt={nutritionPreview.salt}
                  />
                )}
              </>
            )}
          </div>

          <div>
            {/* Meal selector — visas längst ned när användaren kommer från sidebar.
                I måltidsläget har SavedMealPicker en egen väljare överst, eftersom
                en sparad måltid laddas direkt vid klick och platsen därför måste
                vara vald innan. Utan source-villkoret visades båda samtidigt. */}
            {!isEditMode &&
              !isSavedMealMode &&
              (showMealSelector || !mealName) &&
              !onFoodSelect &&
              mealSettings &&
              mealSettings.length > 0 && (
                <div className="space-y-2 mt-3">
                  <Label>{t('addToMealModal.selectMeal')}</Label>
                  <Select
                    value={selectedMealName}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedMealName(e.target.value)
                    }
                  >
                    {[...(mealSettings ?? []), ...extraMealOptions]
                      .sort((a, b) => a.meal_order - b.meal_order)
                      .map(meal => (
                        <option key={meal.id} value={meal.meal_name}>
                          {meal.meal_name}
                        </option>
                      ))}
                  </Select>
                </div>
              )}

            {/* Action buttons */}
            <div className="flex justify-between pt-4 border-t mt-4 pb-4 md:pb-0">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('addToMealModal.cancel')}
              </Button>
              {selectedFood && (
                <Button
                  onClick={handleAddFood}
                  disabled={
                    !nutritionPreview ||
                    addFoodToMeal.isPending ||
                    createMealEntry.isPending ||
                    updateMealItem.isPending
                  }
                >
                  {isEditMode
                    ? updateMealItem.isPending
                      ? t('addToMealModal.saving')
                      : t('addToMealModal.save')
                    : addFoodToMeal.isPending || createMealEntry.isPending
                      ? t('addToMealModal.adding')
                      : t('addToMealModal.add')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddFoodItemModal
        open={addFoodItemModalOpen}
        onOpenChange={open => {
          // Den här modalen ligger ovanpå och stängs för sig. Föräldern har
          // aldrig stängts, så den behöver inte öppnas igen.
          setAddFoodItemModalOpen(open)
        }}
        onSuccess={newFood => {
          if (newFood) {
            // Admin skapade ett nytt personligt livsmedel härifrån (ej preview) →
            // fråga om en kopia även ska läggas i globala Calculeat-listan.
            if (isAdmin && !isPreviewMode && newFood.id && newFood.user_id !== null) {
              setCopyPrompt(newFood)
            }
            // Välj det nya livsmedlet direkt — listan är kvar under.
            handleSelectFood(newFood)
          }
        }}
      />

      {/* Admin: fråga om nyskapat livsmedel även ska kopieras till Calculeat-listan */}
      <CopyToCalculeatPrompt item={copyPrompt} onClose={() => setCopyPrompt(null)} />
    </>
  )
}
