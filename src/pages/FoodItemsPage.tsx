import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  UtensilsCrossed,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Copy,
} from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { AddFoodItemModal } from '@/components/food/AddFoodItemModal'
import { FoodNutrientPanel } from '@/components/food/FoodNutrientPanel'
import {
  usePaginatedFoodItems,
  useDeleteFoodItem,
  useAdminDeleteFoodItem,
  useCopyFoodItemToCalculeat,
  type FoodItem,
  type FoodTab,
} from '@/hooks/useFoodItems'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { SOURCE_BADGES, getListItemBadgeConfig } from '@/lib/constants/sourceBadges'
import { useRecipeImpact, type RecipeImpact } from '@/hooks/useRecipeImpact'
import { RecipeImpactWarningModal } from '@/components/food/RecipeImpactWarningModal'
import {
  useSharedLists,
  useCopyToSharedList,
  useSharedListRealtime,
  useDeleteSharedListFoodItem,
} from '@/hooks/useSharedLists'
import { SharedListMembersBar } from '@/components/shared-lists/SharedListMembersBar'
import { CreateSharedListDialog } from '@/components/shared-lists/CreateSharedListDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// Display mode type
type DisplayMode = 'serving' | 'per100g' | 'perVolume'

// Sort types
type SortKey = 'name' | 'calories' | 'protein' | 'carb' | 'fat' | 'color'
type SortDirection = 'asc' | 'desc'

// Helper function: Get available display modes for a food item
function getAvailableDisplayModes(item: FoodItem): DisplayMode[] {
  const modes: DisplayMode[] = []

  if (item.grams_per_piece && item.serving_unit && item.kcal_per_unit) {
    modes.push('serving')
  }

  if (item.kcal_per_gram) {
    modes.push('per100g')
  }

  if (item.ml_per_gram && item.kcal_per_gram) {
    modes.push('perVolume')
  }

  return modes
}

// Helper function: Get display data based on mode
function getDisplayData(
  item: FoodItem,
  mode: DisplayMode
): {
  icon: string
  header: string
  kcal: number
  protein: number
  carb: number
  fat: number
} | null {
  switch (mode) {
    case 'serving':
      if (!item.grams_per_piece || !item.serving_unit || !item.kcal_per_unit) {
        return null
      }
      return {
        icon: '',
        header: `1 ${item.serving_unit} (${item.grams_per_piece}g)`,
        kcal: item.kcal_per_unit,
        protein: item.protein_per_unit || 0,
        carb: item.carb_per_unit || 0,
        fat: item.fat_per_unit || 0,
      }

    case 'per100g': {
      if (!item.kcal_per_gram) {
        return null
      }
      // For ml-based foods, macros are stored per reference_amount ml.
      // weight_grams = reference_amount / ml_per_gram (gram equivalent).
      // Per 100g: scale by 100 / weight_grams.
      const baseGrams = item.weight_grams || 100
      return {
        icon: '',
        header: '100g',
        kcal: item.kcal_per_gram * 100,
        protein: (item.protein_g / baseGrams) * 100,
        carb: (item.carb_g / baseGrams) * 100,
        fat: (item.fat_g / baseGrams) * 100,
      }
    }

    case 'perVolume': {
      if (!item.ml_per_gram || !item.kcal_per_gram) {
        return null
      }
      // Per 100ml: grams equivalent of 100ml = 100 / ml_per_gram
      // Scale macros the same way as per100g but using gramsIn100ml as the target weight.
      const baseGrams = item.weight_grams || 100
      const gramsIn100ml = 100 / item.ml_per_gram
      return {
        icon: '',
        header: '100ml',
        kcal: item.kcal_per_gram * gramsIn100ml,
        protein: (item.protein_g / baseGrams) * gramsIn100ml,
        carb: (item.carb_g / baseGrams) * gramsIn100ml,
        fat: (item.fat_g / baseGrams) * gramsIn100ml,
      }
    }

    default:
      return null
  }
}

// LocalStorage helper functions
function getSavedDisplayMode(itemId: string): DisplayMode | null {
  const key = `food-display-mode:${itemId}`
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed.mode as DisplayMode
  } catch {
    return null
  }
}

function saveDisplayMode(itemId: string, mode: DisplayMode): void {
  const key = `food-display-mode:${itemId}`
  try {
    localStorage.setItem(key, JSON.stringify({ mode }))
  } catch (error) {
    console.warn('Could not save display mode to localStorage:', error)
  }
}

// Helper function: Get default display mode for a food item
function getDefaultDisplayMode(item: FoodItem): DisplayMode {
  const saved = getSavedDisplayMode(item.id)
  if (saved) {
    const availableModes = getAvailableDisplayModes(item)
    if (availableModes.includes(saved)) {
      return saved
    }
  }

  if (item.grams_per_piece && item.serving_unit && item.kcal_per_unit) {
    return 'serving'
  }

  return 'per100g'
}

const PAGE_SIZE = 50

export default function FoodItemsPage() {
  const { t } = useTranslation('food')
  const queryClient = useQueryClient()

  // Static tabs depend on t() so defined inside component
  const STATIC_TABS: { key: FoodTab; label: string }[] = [
    { key: 'alla', label: t('tabs.all') },
    { key: 'mina', label: t('tabs.mine') },
    { key: 'calculeat', label: t('tabs.calculeat') },
    { key: 'slv', label: t('tabs.slv') },
  ]
  const { data: isAdmin = false } = useIsAdmin()
  const deleteFood = useDeleteFoodItem()
  const adminDeleteFood = useAdminDeleteFoodItem()
  const deleteSharedListItem = useDeleteSharedListFoodItem()
  const { getRecipesUsingFoodItem } = useRecipeImpact()
  const { data: sharedLists = [], isLoading: sharedListsLoading } = useSharedLists()
  const { mutateAsync: copyToSharedList } = useCopyToSharedList()
  const { mutateAsync: copyToCalculeat } = useCopyFoodItemToCalculeat()

  // Build full tab list: Mina | CalculEat | Livsmedelsverket | [delade listor] | Alla
  const allTabs = useMemo<{ key: FoodTab; label: string }[]>(
    () => [
      STATIC_TABS[0], // Alla
      STATIC_TABS[1], // Mina
      STATIC_TABS[2], // CalculEat
      STATIC_TABS[3], // Livsmedelsverket
      ...sharedLists.map(list => ({
        key: `list:${list.id}` as FoodTab,
        label: list.name,
      })),
    ],
    [sharedLists]
  )

  // Tab & pagination state
  const [activeTab, setActiveTab] = useState<FoodTab>('mina')
  const [createListOpen, setCreateListOpen] = useState(false)
  const [page, setPage] = useState(0)

  // Search with debounce
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Filters (only for mina tab)
  const [colorFilter, setColorFilter] = useState<'Green' | 'Yellow' | 'Orange' | null>(null)
  const [isRecipeFilter, setIsRecipeFilter] = useState(false)

  // UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  // Redigeringsval för list-items: null = inte öppen, FoodItem = väntar på val
  const [listEditItem, setListEditItem] = useState<FoodItem | null>(null)
  const [listEditConfirmShared, setListEditConfirmShared] = useState(false)
  const [editCopyMode, setEditCopyMode] = useState(false)
  const [listDeleteItem, setListDeleteItem] = useState<FoodItem | null>(null)
  const [adminDeleteItem, setAdminDeleteItem] = useState<FoodItem | null>(null)
  const [adminEditItem, setAdminEditItem] = useState<FoodItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [displayModes, setDisplayModes] = useState<Record<string, DisplayMode>>({})
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Nutrient panel state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<FoodItem | null>(null)
  const [nutrientPanelOpen, setNutrientPanelOpen] = useState(false)

  // Recipe impact modal state
  const [impactModal, setImpactModal] = useState<{
    open: boolean
    mode: 'delete' | 'update'
    foodItemId: string
    foodItemName: string
    affectedRecipes: RecipeImpact[]
    pendingAction: () => Promise<void>
  } | null>(null)
  const [isImpactConfirming, setIsImpactConfirming] = useState(false)

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page on tab/search/filter change
  useEffect(() => {
    setPage(0)
  }, [activeTab, debouncedSearch, colorFilter, isRecipeFilter])

  // Om activeTab pekar på en lista som inte längre finns (t.ex. efter leave),
  // navigera automatiskt tillbaka till 'mina'-fliken.
  useEffect(() => {
    if (!activeTab.startsWith('list:')) return
    // Vänta tills sharedLists är laddad — tom array under loading betyder inte "borttagen"
    if (sharedListsLoading) return
    const id = activeTab.slice(5)
    if (!sharedLists.some(l => l.id === id)) {
      setActiveTab('mina')
    }
  }, [sharedLists, sharedListsLoading, activeTab])

  // Fetch paginated data via RPC
  const { data, isLoading, isFetching } = usePaginatedFoodItems({
    tab: activeTab,
    page,
    pageSize: PAGE_SIZE,
    searchQuery: debouncedSearch || undefined,
    colorFilter: colorFilter || undefined,
    isRecipeFilter: isRecipeFilter || undefined,
  })

  const activeListName = useMemo(() => {
    if (!activeTab.startsWith('list:')) return null
    const listId = activeTab.slice(5)
    return sharedLists.find(l => l.id === listId)?.name ?? null
  }, [activeTab, sharedLists])

  const items = useMemo(() => data?.items ?? [], [data])
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 0

  // Page clamping: if totalPages decreases (e.g. after filtering), auto-adjust
  useEffect(() => {
    if (data && page >= data.totalPages && data.totalPages > 0) {
      setPage(data.totalPages - 1)
    }
  }, [data, page])

  // Initialize display modes when items change
  useEffect(() => {
    if (items.length > 0) {
      setDisplayModes(prev => {
        const next = { ...prev }
        for (const item of items) {
          if (!next[item.id]) {
            next[item.id] = getDefaultDisplayMode(item)
          }
        }
        return next
      })
    }
  }, [items])

  // Get button label for a display mode
  const getButtonLabel = (mode: DisplayMode, item: FoodItem): string => {
    switch (mode) {
      case 'serving':
        if (item.serving_unit === 'portion') return 'port'
        return item.serving_unit || 'st'
      case 'per100g':
        return '100g'
      case 'perVolume':
        return 'ml'
      default:
        return ''
    }
  }

  // Get tooltip text for a unit button
  const getUnitButtonTooltip = (mode: DisplayMode, item: FoodItem): string => {
    const servingLabel = item.serving_unit || 'portion'
    const labels: Record<DisplayMode, string> = {
      serving: t('tooltip.viewAsServing', { serving: servingLabel }),
      per100g: t('tooltip.viewPer100g'),
      perVolume: t('tooltip.viewPerVolume'),
    }
    return labels[mode] || ''
  }

  // Switch to a specific display mode
  const switchToDisplayMode = (itemId: string, mode: DisplayMode) => {
    setDisplayModes(prev => ({
      ...prev,
      [itemId]: mode,
    }))
    saveDisplayMode(itemId, mode)
  }

  const performDelete = async (id: string) => {
    const item = items.find(i => i.id === id)
    const isRecipe = item?.is_recipe === true

    try {
      setDeletingItemId(id)

      if (isRecipe) {
        // For recipes: delete both the recipe AND the food_item
        const { error: recipeDeleteError } = await supabase
          .from('recipes')
          .delete()
          .eq('food_item_id', id)

        if (recipeDeleteError) {
          console.error('Error deleting linked recipe:', recipeDeleteError)
        }

        const { error } = await supabase.from('food_items').delete().eq('id', id)
        if (error) throw error

        queryClient.invalidateQueries({ queryKey: ['recipes'] })
        queryClient.invalidateQueries({ queryKey: ['foodItems'] })
      } else {
        // Use the hook for regular items (handles CoW soft-delete for global items)
        await deleteFood.mutateAsync(id)
      }
    } catch (error) {
      console.error('Error deleting food item:', error)
      alert(t('toast.deleteError'))
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id)

    // List-items: visa bekräftelsedialog (påverkar alla i listan)
    if (item?.shared_list_id) {
      setListDeleteItem(item)
      return
    }

    // Admin på CalculEat-fliken: hård delete av globalt item — kräver bekräftelsedialog
    if (isAdmin && activeTab === 'calculeat' && item?.user_id === null) {
      setAdminDeleteItem(item)
      return
    }

    const isGlobal = item?.user_id === null
    const isRecipe = item?.is_recipe === true

    let message: string
    if (isRecipe) {
      message = `${item?.name}`
    } else if (isGlobal) {
      message = t('adminEdit.description', { name: item?.name ?? '' })
    } else {
      // User-owned non-recipe: check recipe impact before confirming
      try {
        const affected = await getRecipesUsingFoodItem(id)
        if (affected.length > 0) {
          setImpactModal({
            open: true,
            mode: 'delete',
            foodItemId: id,
            foodItemName: item?.name ?? '',
            affectedRecipes: affected,
            pendingAction: () => performDelete(id),
          })
          return
        }
      } catch {
        // If the check fails, fall through to simple confirm
      }
      message = t('listDelete.description', { name: item?.name ?? '' })
    }

    if (!confirm(message)) {
      return
    }

    await performDelete(id)
  }

  const handleEdit = (item: FoodItem) => {
    // List-items: visa val — personlig kopia eller ändra i listan
    if (item.shared_list_id) {
      setListEditItem(item)
      setListEditConfirmShared(false)
      return
    }
    // Admin på CalculEat-fliken: redigera globalt item — kräver bekräftelsedialog
    if (isAdmin && activeTab === 'calculeat' && item.user_id === null) {
      setAdminEditItem(item)
      return
    }
    if (item.user_id === null) {
      if (!confirm(t('addFoodModal.cowInfo'))) {
        return
      }
    }
    setEditingItem(item)
    setIsAddModalOpen(true)
  }

  const handleListEditCopy = () => {
    if (!listEditItem) return
    setEditingItem(listEditItem)
    setEditCopyMode(true)
    setListEditItem(null)
    setListEditConfirmShared(false)
    setIsAddModalOpen(true)
  }

  const handleListEditShared = () => {
    if (!listEditItem) return
    setEditingItem(listEditItem)
    setEditCopyMode(false)
    setListEditItem(null)
    setListEditConfirmShared(false)
    setIsAddModalOpen(true)
  }

  const handleConfirmListDelete = async () => {
    if (!listDeleteItem?.shared_list_id) return
    try {
      await deleteSharedListItem.mutateAsync({
        foodItemId: listDeleteItem.id,
        listId: listDeleteItem.shared_list_id,
      })
    } catch {
      alert(t('toast.deleteError'))
    } finally {
      setListDeleteItem(null)
    }
  }

  const handleConfirmAdminDelete = async () => {
    if (!adminDeleteItem) return
    const id = adminDeleteItem.id
    setAdminDeleteItem(null)
    setDeletingItemId(id)
    try {
      await adminDeleteFood.mutateAsync(id)
    } catch {
      alert(t('toast.deleteError'))
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleConfirmAdminEdit = () => {
    if (!adminEditItem) return
    setEditingItem(adminEditItem)
    setAdminEditItem(null)
    setIsAddModalOpen(true)
  }

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setEditingItem(null)
    setEditCopyMode(false)
  }

  const handleModalSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    // Switch to Mina tab when: creating personal copy of list item, or CoW of global item
    // But NOT when admin is editing/creating directly on the calculeat tab
    const adminOnCalculeat = isAdmin && activeTab === 'calculeat'
    if (
      editCopyMode ||
      (editingItem &&
        editingItem.user_id === null &&
        !editingItem.shared_list_id &&
        !adminOnCalculeat)
    ) {
      setActiveTab('mina')
    }
  }, [queryClient, editingItem, editCopyMode, isAdmin, activeTab])

  const handleShowNutrients = (item: FoodItem) => {
    setSelectedItemForDetail(item)
    setNutrientPanelOpen(true)
  }

  // Sort food items (client-side on current page)
  const sortedItems = useMemo(() => {
    const sorted = [...items]

    sorted.sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortBy) {
        case 'name':
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)

        case 'calories': {
          const aModeData = displayModes[a.id] ? getDisplayData(a, displayModes[a.id]) : null
          const bModeData = displayModes[b.id] ? getDisplayData(b, displayModes[b.id]) : null
          aVal = aModeData?.kcal ?? a.calories
          bVal = bModeData?.kcal ?? b.calories
          break
        }

        case 'protein': {
          const aModeData = displayModes[a.id] ? getDisplayData(a, displayModes[a.id]) : null
          const bModeData = displayModes[b.id] ? getDisplayData(b, displayModes[b.id]) : null
          aVal = aModeData?.protein ?? a.protein_g
          bVal = bModeData?.protein ?? b.protein_g
          break
        }

        case 'carb': {
          const aModeData = displayModes[a.id] ? getDisplayData(a, displayModes[a.id]) : null
          const bModeData = displayModes[b.id] ? getDisplayData(b, displayModes[b.id]) : null
          aVal = aModeData?.carb ?? a.carb_g
          bVal = bModeData?.carb ?? b.carb_g
          break
        }

        case 'fat': {
          const aModeData = displayModes[a.id] ? getDisplayData(a, displayModes[a.id]) : null
          const bModeData = displayModes[b.id] ? getDisplayData(b, displayModes[b.id]) : null
          aVal = aModeData?.fat ?? a.fat_g
          bVal = bModeData?.fat ?? b.fat_g
          break
        }

        case 'color': {
          const colorOrder: Record<string, number> = { Green: 1, Yellow: 2, Orange: 3 }
          aVal = colorOrder[a.energy_density_color || ''] ?? 4
          bVal = colorOrder[b.energy_density_color || ''] ?? 4
          break
        }

        default:
          return 0
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [items, sortBy, sortDirection, displayModes])

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDirection('asc')
    }
  }

  // Tab change handler
  const handleTabChange = (tab: FoodTab) => {
    setActiveTab(tab)
    setColorFilter(null)
    setIsRecipeFilter(false)
    setSearchQuery('')
    setDebouncedSearch('')
    setSortBy('name')
    setSortDirection('asc')
    setResetStep(0)
  }

  const isMina = activeTab === 'mina'
  const isCalculeat = activeTab === 'calculeat'
  const activeListId = activeTab.startsWith('list:') ? activeTab.slice(5) : null
  const activeList = activeListId ? (sharedLists.find(l => l.id === activeListId) ?? null) : null
  const isAdminCalculeatTab = isAdmin && isCalculeat

  // Realtime-prenumeration för aktiv lista — uppdaterar cachen vid ändringar från andra members
  useSharedListRealtime(activeListId)

  const handleCopyToList = async (foodItemId: string, sharedListId: string) => {
    const result = await copyToSharedList({ foodItemId, sharedListId })
    if (result?.success) {
      const listName = sharedLists.find(l => l.id === sharedListId)?.name ?? ''
      toast.success(t('toast.copiedToList', { listName }))
    } else if (result?.error === 'already_exists') {
      toast.info(t('toast.alreadyInList'))
    } else {
      toast.error(t('toast.copyError'))
    }
  }

  const handleCopyToCalculeat = async (foodItemId: string) => {
    const result = await copyToCalculeat(foodItemId)
    if (result?.success) {
      toast.success(t('toast.copiedToCalculeat'))
    } else if (result?.error === 'already_exists') {
      toast.info(t('toast.alreadyInCalculeat'))
    } else {
      toast.error(t('toast.copyError'))
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            {t('header.title')}
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {t('items', { count: totalCount })}
            {isFetching && !isLoading && (
              <span className="text-neutral-400 ml-2">{t('updating')}</span>
            )}
          </p>
        </div>
        <Button
          className="gap-2 self-start sm:self-auto"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('header.newFood')}</span>
          <span className="sm:hidden">{t('header.newFoodShort')}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-0 border-b border-neutral-200 overflow-x-auto">
        {allTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* "+" knapp för att skapa ny delad lista */}
        <button
          onClick={() => setCreateListOpen(true)}
          className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-neutral-400 hover:text-primary-600 hover:border-neutral-300 transition-colors"
          title={t('tooltip.createSharedList')}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* SharedListMembersBar — visas under tabbraden när en delad lista är aktiv */}
      {activeList && (
        <div className="mb-4">
          <SharedListMembersBar list={activeList} onLeft={() => handleTabChange('mina')} />
        </div>
      )}

      {!activeList && <div className="mb-4" />}

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder={t('filter.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters — döljs för delade listor */}
            <div className={`flex gap-2 flex-wrap${activeListId ? ' hidden' : ''}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColorFilter(null)
                  setIsRecipeFilter(false)
                }}
                className={
                  !colorFilter && !isRecipeFilter
                    ? 'bg-neutral-200 hover:bg-neutral-300 border-neutral-400 font-semibold'
                    : ''
                }
              >
                {t('filter.all')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColorFilter('Green')
                  setIsRecipeFilter(false)
                }}
                className={
                  colorFilter === 'Green'
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 font-semibold'
                    : ''
                }
              >
                {t('filter.green')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColorFilter('Yellow')
                  setIsRecipeFilter(false)
                }}
                className={
                  colorFilter === 'Yellow'
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-neutral-900 border-yellow-500 font-semibold'
                    : ''
                }
              >
                {t('filter.yellow')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColorFilter('Orange')
                  setIsRecipeFilter(false)
                }}
                className={
                  colorFilter === 'Orange'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 font-semibold'
                    : ''
                }
              >
                {t('filter.orange')}
              </Button>
              {isMina && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setColorFilter(null)
                    setIsRecipeFilter(true)
                  }}
                  className={
                    isRecipeFilter
                      ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600 font-semibold gap-1'
                      : 'gap-1'
                  }
                >
                  <span>{t('filter.recipe')}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Items List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">{t('loading')}</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={
            searchQuery || colorFilter || isRecipeFilter
              ? t('emptyState.noResults')
              : t('emptyState.noItems')
          }
          description={
            searchQuery || colorFilter || isRecipeFilter
              ? t('emptyState.noResultsDesc')
              : isMina
                ? t('emptyState.noItemsMine')
                : t('emptyState.noItemsOther')
          }
          action={
            searchQuery || colorFilter || isRecipeFilter
              ? {
                  label: t('filter.clearFilters'),
                  onClick: () => {
                    setSearchQuery('')
                    setDebouncedSearch('')
                    setColorFilter(null)
                    setIsRecipeFilter(false)
                  },
                }
              : isMina
                ? {
                    label: t('header.newFood'),
                    onClick: () => setIsAddModalOpen(true),
                  }
                : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-1">
            {sortedItems.map(item => {
              const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
              const displayData = getDisplayData(item, currentMode)
              const allModes = getAvailableDisplayModes(item)
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-2">
                    {/* Row 1: Name + color badge */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-medium text-neutral-900 text-sm truncate">
                          {item.name}
                        </span>
                        {item.is_recipe && <span className="text-xs shrink-0">👨‍🍳</span>}
                        {(() => {
                          const badge =
                            activeListName && item.shared_list_id
                              ? getListItemBadgeConfig(activeListName)
                              : SOURCE_BADGES[item.source]
                          return (
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1 py-0 h-4 shrink-0 ${badge.className}`}
                            >
                              {badge.label}
                            </Badge>
                          )
                        })()}
                      </div>
                      {item.energy_density_color && (
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            item.energy_density_color === 'Green'
                              ? 'bg-green-500'
                              : item.energy_density_color === 'Yellow'
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                          }`}
                        />
                      )}
                    </div>
                    {/* Row 2: Portion + Macros combined */}
                    <div className="flex items-center gap-1.5 text-[10px] mb-1 flex-wrap">
                      <span className="text-neutral-500">
                        {displayData ? (
                          <>
                            {displayData.icon} {displayData.header}
                          </>
                        ) : (
                          <>
                            {item.default_amount} {item.default_unit}
                          </>
                        )}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-semibold text-primary-600">
                        {displayData ? Math.round(displayData.kcal) : item.calories} kcal
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span style={{ color: '#f5c518' }}>
                        F: {displayData ? displayData.fat.toFixed(1) : item.fat_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span style={{ color: '#fb923c' }}>
                        K: {displayData ? displayData.carb.toFixed(1) : item.carb_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span style={{ color: '#f43f5e' }}>
                        P: {displayData ? displayData.protein.toFixed(1) : item.protein_g}g
                      </span>
                    </div>
                    {/* Row 3: Unit pills + actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {allModes.length > 1 &&
                          allModes.map(mode => (
                            <button
                              key={mode}
                              onClick={() => switchToDisplayMode(item.id, mode)}
                              className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-all ${
                                mode === currentMode
                                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                                  : 'text-neutral-600 bg-white border border-neutral-300 active:bg-neutral-100'
                              }`}
                            >
                              {getButtonLabel(mode, item)}
                            </button>
                          ))}
                      </div>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowNutrients(item)}
                          className="h-7 w-7 p-0"
                          title={t('tooltip.viewNutrients')}
                        >
                          <Info className="h-3 w-3 text-neutral-500" />
                        </Button>
                        {isMina && (sharedLists.length > 0 || isAdmin) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title={t('tooltip.copyToList')}
                              >
                                <Copy className="h-3 w-3 text-neutral-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sharedLists.map(list => (
                                <DropdownMenuItem
                                  key={list.id}
                                  onClick={() => handleCopyToList(item.id, list.id)}
                                >
                                  {list.name}
                                </DropdownMenuItem>
                              ))}
                              {isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => handleCopyToCalculeat(item.id)}
                                  className="text-amber-700 font-medium"
                                >
                                  CalculEat-listan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3 w-3 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingItemId === item.id}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                        >
                          {t('table.food')}
                          {sortBy === 'name' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-4 text-sm font-semibold text-neutral-900">
                        {t('table.portion')}
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('calories')}
                          className="flex items-center gap-1 ml-auto hover:text-primary-600 transition-colors"
                        >
                          {t('table.calories')}
                          {sortBy === 'calories' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('fat')}
                          className="flex items-center gap-1 ml-auto hover:text-primary-600 transition-colors"
                        >
                          {t('table.fat')}
                          {sortBy === 'fat' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('carb')}
                          className="flex items-center gap-1 ml-auto hover:text-primary-600 transition-colors"
                        >
                          {t('table.carbs')}
                          {sortBy === 'carb' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('protein')}
                          className="flex items-center gap-1 ml-auto hover:text-primary-600 transition-colors"
                        >
                          {t('table.protein')}
                          {sortBy === 'protein' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                      <th className="text-center p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('color')}
                          className="flex items-center gap-1 mx-auto hover:text-primary-600 transition-colors"
                        >
                          {t('table.type')}
                          {sortBy === 'color' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map(item => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-neutral-50 transition-colors cursor-pointer"
                        onClick={() => handleShowNutrients(item)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900">{item.name}</span>
                            {item.is_recipe && (
                              <span title={t('filter.recipe')} className="text-base">
                                👨‍🍳
                              </span>
                            )}
                            {(() => {
                              const badge =
                                activeListName && item.shared_list_id
                                  ? getListItemBadgeConfig(activeListName)
                                  : SOURCE_BADGES[item.source]
                              return (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 h-5 ${badge.className}`}
                                >
                                  {badge.label}
                                </Badge>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="p-4 text-neutral-600 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              {(() => {
                                const currentMode =
                                  displayModes[item.id] || getDefaultDisplayMode(item)
                                const displayData = getDisplayData(item, currentMode)

                                if (!displayData) {
                                  return (
                                    <div>
                                      {item.default_amount} {item.default_unit}
                                    </div>
                                  )
                                }

                                return (
                                  <div className="font-medium text-neutral-900 flex items-center gap-1">
                                    <span className="text-base">{displayData.icon}</span>
                                    <span>{displayData.header}</span>
                                  </div>
                                )
                              })()}
                            </div>

                            {(() => {
                              const currentMode =
                                displayModes[item.id] || getDefaultDisplayMode(item)
                              const allModes = getAvailableDisplayModes(item)

                              if (allModes.length <= 1) {
                                return null
                              }

                              return (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {allModes.map(mode => {
                                    const isActive = mode === currentMode
                                    return (
                                      <button
                                        key={mode}
                                        onClick={e => {
                                          e.stopPropagation()
                                          switchToDisplayMode(item.id, mode)
                                        }}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all max-w-20 truncate ${
                                          isActive
                                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                                            : 'text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 hover:text-neutral-800 hover:border-neutral-400'
                                        }`}
                                        title={getUnitButtonTooltip(mode, item)}
                                        aria-label={getUnitButtonTooltip(mode, item)}
                                      >
                                        {getButtonLabel(mode, item)}
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </div>
                        </td>
                        {/* Kalori-kolumn */}
                        <td className="p-4 text-right">
                          {(() => {
                            const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
                            const displayData = getDisplayData(item, currentMode)

                            if (!displayData || !item.kcal_per_gram) {
                              return (
                                <div>
                                  <span className="font-semibold text-primary-600">
                                    {item.calories}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">kcal</span>
                                </div>
                              )
                            }

                            return (
                              <div>
                                <span className="font-semibold text-primary-600">
                                  {Math.round(displayData.kcal)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">kcal</span>
                              </div>
                            )
                          })()}
                        </td>
                        {/* Makrokolumner */}
                        {(() => {
                          const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
                          const displayData = getDisplayData(item, currentMode)

                          if (!displayData) {
                            return (
                              <>
                                <td className="p-4 text-right">
                                  <span className="font-semibold" style={{ color: '#f5c518' }}>
                                    {item.fat_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold" style={{ color: '#fb923c' }}>
                                    {item.carb_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold" style={{ color: '#f43f5e' }}>
                                    {item.protein_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                              </>
                            )
                          }

                          return (
                            <>
                              <td className="p-4 text-right">
                                <span className="font-semibold" style={{ color: '#f5c518' }}>
                                  {displayData.fat.toFixed(1)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">g</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-semibold" style={{ color: '#fb923c' }}>
                                  {displayData.carb.toFixed(1)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">g</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-semibold" style={{ color: '#f43f5e' }}>
                                  {displayData.protein.toFixed(1)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">g</span>
                              </td>
                            </>
                          )
                        })()}
                        <td className="p-4 text-center">
                          {item.energy_density_color && (
                            <Badge
                              variant="outline"
                              className={
                                item.energy_density_color === 'Green'
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : item.energy_density_color === 'Yellow'
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                    : 'bg-orange-100 text-orange-700 border-orange-300'
                              }
                            >
                              {item.energy_density_color === 'Green'
                                ? t('color.green')
                                : item.energy_density_color === 'Yellow'
                                  ? t('color.yellow')
                                  : t('color.orange')}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {isMina && (sharedLists.length > 0 || isAdmin) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={e => e.stopPropagation()}
                                    className="h-8 w-8 p-0"
                                    title={t('tooltip.copyToList')}
                                  >
                                    <Copy className="h-4 w-4 text-neutral-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {sharedLists.map(list => (
                                    <DropdownMenuItem
                                      key={list.id}
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleCopyToList(item.id, list.id)
                                      }}
                                    >
                                      {list.name}
                                    </DropdownMenuItem>
                                  ))}
                                  {isAdmin && (
                                    <DropdownMenuItem
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleCopyToCalculeat(item.id)
                                      }}
                                      className="text-amber-700 font-medium"
                                    >
                                      CalculEat-listan
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleEdit(item)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(item.id)
                              }}
                              disabled={deletingItemId === item.id}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-neutral-500">
                {t('pagination.page', { page: page + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('pagination.prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="gap-1"
                >
                  {t('pagination.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🟢</span>
              {t('infoCards.green.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-neutral-600">
            <p className="text-sm text-neutral-700 font-medium">{t('infoCards.green.subtitle')}</p>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.green.solidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Bladgrönsaker (spenat, sallad)', icon: '🥬' },
                  { label: 'Gurka, tomat, zucchini', icon: '🥒' },
                  { label: 'Broccoli, blomkål', icon: '🥦' },
                  { label: 'Bär (jordgubbar, hallon)', icon: '🍓' },
                  { label: 'Frukt med hög vattenhalt (melon, apelsin)', icon: '🍉' },
                  { label: 'Potatis (kokt)', icon: '🥔' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.green.liquidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Vatten', icon: '💧' },
                  { label: 'Lightdryck', icon: '' },
                  { label: 'Kaffe/te (utan socker)', icon: '☕' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.green.soupLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Klara grönsakssoppor', icon: '🥣' },
                  { label: 'Buljongbaserade soppor', icon: '' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-neutral-500 pt-1">{t('infoCards.green.tip')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🟡</span>
              {t('infoCards.yellow.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-neutral-600">
            <p className="text-sm text-neutral-700 font-medium">{t('infoCards.yellow.subtitle')}</p>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.yellow.solidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Kycklingfilé, kalkon', icon: '🍗' },
                  { label: 'Ägg', icon: '🥚' },
                  { label: 'Pasta, ris, quinoa', icon: '🍝' },
                  { label: 'Bröd', icon: '🍞' },
                  { label: 'Baljväxter (linser, bönor)', icon: '🫘' },
                  { label: 'Lättare mejeriprodukter (kvarg, yoghurt)', icon: '🥛' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.yellow.liquidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Mjölk', icon: '🥛' },
                  { label: 'Juice', icon: '🧃' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.yellow.soupLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Linssoppa', icon: '🥣' },
                  { label: 'Kycklingsoppa', icon: '🍲' },
                  { label: 'Lätt krämig soppa', icon: '' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-neutral-500 pt-1">{t('infoCards.yellow.tip')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🟠</span>
              {t('infoCards.orange.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-neutral-600">
            <p className="text-sm text-neutral-700 font-medium">{t('infoCards.orange.subtitle')}</p>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.orange.solidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Nötter och frön', icon: '🥜' },
                  { label: 'Ost', icon: '🧀' },
                  { label: 'Fett kött (t.ex. entrecôte)', icon: '🥩' },
                  { label: 'Chips, kex', icon: '🍟' },
                  { label: 'Godis, choklad', icon: '🍫' },
                  { label: 'Bakverk', icon: '🥐' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.orange.liquidLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  { label: 'Läsk med socker', icon: '🥤' },
                  { label: 'Milkshakes', icon: '🧋' },
                  { label: 'Alkohol', icon: '🍺' },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-700 mb-1">
                {t('infoCards.orange.soupLabel')}
              </p>
              <ul className="space-y-0.5 pl-2">
                {[
                  {
                    label: 'Gräddbaserade soppor (t.ex. potatis- & purjolök med grädde)',
                    icon: '🍲',
                  },
                ].map(({ label, icon }) => (
                  <li key={label} className="flex gap-1.5 items-center">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-neutral-500 pt-1">{t('infoCards.orange.tip')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Skapa delad lista */}
      <CreateSharedListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        onCreated={listId => {
          setCreateListOpen(false)
          handleTabChange(`list:${listId}` as FoodTab)
        }}
      />

      {/* Redigeringsval för list-items */}
      <Dialog
        open={!!listEditItem && !listEditConfirmShared}
        onOpenChange={open => {
          if (!open) setListEditItem(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('listEdit.title', { name: listEditItem?.name ?? '' })}</DialogTitle>
            <DialogDescription>{t('listEdit.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleListEditCopy} className="w-full justify-start h-auto py-3 px-4">
              <div className="text-left">
                <p className="font-medium">{t('listEdit.createCopy')}</p>
                <p className="text-xs font-normal opacity-80 mt-0.5">
                  {t('listEdit.createCopyDesc')}
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setListEditConfirmShared(true)}
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="text-left">
                <p className="font-medium text-orange-700">{t('listEdit.editInList')}</p>
                <p className="text-xs font-normal text-orange-600 mt-0.5">
                  {t('listEdit.editInListDesc')}
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bekräftelse: ändra list-item som påverkar alla */}
      <Dialog
        open={!!listEditItem && listEditConfirmShared}
        onOpenChange={open => {
          if (!open) {
            setListEditConfirmShared(false)
            setListEditItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('listEdit.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('listEdit.confirmDesc', { name: listEditItem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setListEditConfirmShared(false)}
              className="flex-1"
            >
              {t('listEdit.cancel')}
            </Button>
            <Button
              onClick={handleListEditShared}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {t('listEdit.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bekräftelse: admin redigerar globalt CalculEat-livsmedel */}
      <Dialog
        open={!!adminEditItem}
        onOpenChange={open => {
          if (!open) setAdminEditItem(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('adminEdit.title')}</DialogTitle>
            <DialogDescription>
              {t('adminEdit.description', { name: adminEditItem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setAdminEditItem(null)} className="flex-1">
              {t('adminEdit.cancel')}
            </Button>
            <Button
              onClick={handleConfirmAdminEdit}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {t('adminEdit.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bekräftelse: admin tar bort globalt CalculEat-livsmedel permanent */}
      <Dialog
        open={!!adminDeleteItem}
        onOpenChange={open => {
          if (!open) setAdminDeleteItem(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('adminDelete.title')}</DialogTitle>
            <DialogDescription>
              {t('adminDelete.description', { name: adminDeleteItem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setAdminDeleteItem(null)} className="flex-1">
              {t('adminDelete.cancel')}
            </Button>
            <Button
              onClick={handleConfirmAdminDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={adminDeleteFood.isPending}
            >
              {adminDeleteFood.isPending ? t('adminDelete.removing') : t('adminDelete.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bekräftelse: ta bort list-item (påverkar alla) */}
      <Dialog
        open={!!listDeleteItem}
        onOpenChange={open => {
          if (!open) setListDeleteItem(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('listDelete.title')}</DialogTitle>
            <DialogDescription>
              {t('listDelete.description', { name: listDeleteItem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setListDeleteItem(null)} className="flex-1">
              {t('listDelete.cancel')}
            </Button>
            <Button
              onClick={handleConfirmListDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSharedListItem.isPending}
            >
              {deleteSharedListItem.isPending ? t('listDelete.removing') : t('listDelete.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Food Item Modal */}
      <AddFoodItemModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        onSuccess={handleModalSuccess}
        editItem={editingItem}
        sharedListId={editingItem ? activeListId : null}
        copyMode={editCopyMode}
        adminGlobalMode={isAdminCalculeatTab}
      />

      {/* Nutrient Detail Panel */}
      <FoodNutrientPanel
        foodItem={selectedItemForDetail}
        open={nutrientPanelOpen}
        onOpenChange={setNutrientPanelOpen}
      />

      {/* Recipe Impact Warning Modal */}
      {impactModal && (
        <RecipeImpactWarningModal
          open={impactModal.open}
          onOpenChange={open => {
            if (!open) setImpactModal(null)
          }}
          mode={impactModal.mode}
          foodItemName={impactModal.foodItemName}
          affectedRecipes={impactModal.affectedRecipes}
          isConfirming={isImpactConfirming}
          onConfirm={async () => {
            setIsImpactConfirming(true)
            try {
              await impactModal.pendingAction()
              setImpactModal(null)
            } finally {
              setIsImpactConfirming(false)
            }
          }}
        />
      )}
    </DashboardLayout>
  )
}
