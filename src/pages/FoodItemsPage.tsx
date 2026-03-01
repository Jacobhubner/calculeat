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
  RotateCcw,
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
import { useAuth } from '@/contexts/AuthContext'
import {
  usePaginatedFoodItems,
  useDeleteFoodItem,
  type FoodItem,
  type FoodTab,
} from '@/hooks/useFoodItems'
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

// Static tabs (shared list tabs are added dynamically)
const STATIC_TABS: { key: FoodTab; label: string }[] = [
  { key: 'mina', label: 'Mina' },
  { key: 'calculeat', label: 'CalculEat' },
  { key: 'slv', label: 'Livsmedelsverket' },
  { key: 'alla', label: 'Alla' },
]

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

    case 'per100g':
      if (!item.kcal_per_gram) {
        return null
      }
      return {
        icon: '',
        header: '100g',
        kcal: item.kcal_per_gram * 100,
        protein: (item.protein_g / (item.weight_grams || 100)) * 100,
        carb: (item.carb_g / (item.weight_grams || 100)) * 100,
        fat: (item.fat_g / (item.weight_grams || 100)) * 100,
      }

    case 'perVolume': {
      if (!item.ml_per_gram || !item.kcal_per_gram) {
        return null
      }
      const gramsIn100ml = 100 / item.ml_per_gram
      return {
        icon: '',
        header: '100ml',
        kcal: item.kcal_per_gram * gramsIn100ml,
        protein: (item.protein_g / (item.weight_grams || 100)) * gramsIn100ml,
        carb: (item.carb_g / (item.weight_grams || 100)) * gramsIn100ml,
        fat: (item.fat_g / (item.weight_grams || 100)) * gramsIn100ml,
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
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const deleteFood = useDeleteFoodItem()
  const deleteSharedListItem = useDeleteSharedListFoodItem()
  const { getRecipesUsingFoodItem } = useRecipeImpact()
  const { data: sharedLists = [], isLoading: sharedListsLoading } = useSharedLists()
  const { mutateAsync: copyToSharedList } = useCopyToSharedList()

  // Build full tab list: Mina | CalculEat | Livsmedelsverket | [delade listor] | Alla
  const allTabs = useMemo<{ key: FoodTab; label: string }[]>(
    () => [
      STATIC_TABS[0], // Mina
      STATIC_TABS[1], // CalculEat
      STATIC_TABS[2], // Livsmedelsverket
      ...sharedLists.map(list => ({
        key: `list:${list.id}` as FoodTab,
        label: list.name,
      })),
      STATIC_TABS[3], // Alla
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
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [displayModes, setDisplayModes] = useState<Record<string, DisplayMode>>({})
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [isResetting, setIsResetting] = useState(false)
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
    const servingLabel =
      item.serving_unit === 'portion' ? 'portion' : item.serving_unit || 'serveringsportion'
    const labels: Record<DisplayMode, string> = {
      serving: `Visa som ${servingLabel}`,
      per100g: 'Visa per 100g',
      perVolume: 'Visa per volym (ml)',
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
      alert('Kunde inte ta bort livsmedel. Försök igen.')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id)

    // List-items: direkt radering via RPC (ingen CoW/soft-delete)
    if (item?.shared_list_id) {
      if (!confirm(`Ta bort "${item.name}" från listan?`)) return
      try {
        await deleteSharedListItem.mutateAsync({ foodItemId: id, listId: item.shared_list_id })
      } catch {
        alert('Kunde inte ta bort livsmedel från listan. Försök igen.')
      }
      return
    }

    const isGlobal = item?.user_id === null
    const isRecipe = item?.is_recipe === true

    let message: string
    if (isRecipe) {
      message = `Vill du ta bort receptet "${item?.name}"?\n\nOBS: Detta kommer att radera receptet både från livsmedelslistan OCH från dina sparade recept.`
    } else if (isGlobal) {
      message =
        'Detta är ett globalt livsmedel. Det kommer att döljas från din lista men inte påverka andra användare. Vill du fortsätta?'
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
      message = 'Är du säker på att du vill ta bort detta livsmedel?'
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
    if (item.user_id === null) {
      if (
        !confirm(
          'Detta är ett globalt livsmedel. Dina ändringar sparas som en personlig kopia och påverkar inte andra användare. Vill du fortsätta?'
        )
      ) {
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

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setEditingItem(null)
    setEditCopyMode(false)
  }

  const handleModalSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    // Switch to Mina tab when: creating personal copy of list item, or CoW of global item
    if (
      editCopyMode ||
      (editingItem && editingItem.user_id === null && !editingItem.shared_list_id)
    ) {
      setActiveTab('mina')
    }
  }, [queryClient, editingItem, editCopyMode])

  const handleShowNutrients = (item: FoodItem) => {
    setSelectedItemForDetail(item)
    setNutrientPanelOpen(true)
  }

  // Reset all user customizations
  const handleResetList = async () => {
    if (!user) return

    try {
      setIsResetting(true)

      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('user_id', user.id)
        .eq('is_recipe', false)

      if (error) throw error

      // Clear localStorage display modes
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('food-display-mode:')) {
          localStorage.removeItem(key)
        }
      })

      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
      setResetStep(0)
    } catch (error) {
      console.error('Error resetting food list:', error)
      alert('Kunde inte återställa listan. Försök igen.')
    } finally {
      setIsResetting(false)
    }
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
  const activeListId = activeTab.startsWith('list:') ? activeTab.slice(5) : null
  const activeList = activeListId ? (sharedLists.find(l => l.id === activeListId) ?? null) : null

  // Realtime-prenumeration för aktiv lista — uppdaterar cachen vid ändringar från andra members
  useSharedListRealtime(activeListId)

  const handleCopyToList = async (foodItemId: string, sharedListId: string) => {
    const result = await copyToSharedList({ foodItemId, sharedListId })
    if (result?.success) {
      const listName = sharedLists.find(l => l.id === sharedListId)?.name ?? 'listan'
      toast.success(`Livsmedlet kopierades till "${listName}"`)
    } else if (result?.error === 'already_exists') {
      toast.info('Livsmedlet finns redan i listan')
    } else {
      toast.error('Kunde inte kopiera. Försök igen.')
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            Livsmedel
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {totalCount} livsmedel
            {isFetching && !isLoading && (
              <span className="text-neutral-400 ml-2">Uppdaterar...</span>
            )}
          </p>
        </div>
        {(isMina || activeListId) && (
          <Button
            className="gap-2 self-start sm:self-auto"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nytt livsmedel</span>
            <span className="sm:hidden">Nytt</span>
          </Button>
        )}
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
          title="Skapa delad lista"
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
                placeholder="Sök efter matvaror..."
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
                Alla
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
                Grön
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
                Gul
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
                Orange
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
                  <span>Recept</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Items List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">Laddar livsmedel...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={
            searchQuery || colorFilter || isRecipeFilter
              ? 'Inga livsmedel hittades'
              : 'Inga livsmedel ännu'
          }
          description={
            searchQuery || colorFilter || isRecipeFilter
              ? 'Prova att ändra dina sökkriterier eller filter.'
              : isMina
                ? 'Kom igång genom att lägga till ditt första livsmedel i databasen.'
                : 'Inga livsmedel finns i denna kategori.'
          }
          action={
            searchQuery || colorFilter || isRecipeFilter
              ? {
                  label: 'Rensa filter',
                  onClick: () => {
                    setSearchQuery('')
                    setDebouncedSearch('')
                    setColorFilter(null)
                    setIsRecipeFilter(false)
                  },
                }
              : isMina
                ? {
                    label: 'Lägg till livsmedel',
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
                      <span className="text-yellow-600">
                        F: {displayData ? displayData.fat.toFixed(1) : item.fat_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-blue-600">
                        K: {displayData ? displayData.carb.toFixed(1) : item.carb_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-green-600">
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
                          title="Visa näringsvärden"
                        >
                          <Info className="h-3 w-3 text-neutral-500" />
                        </Button>
                        {isMina && sharedLists.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Kopiera till lista"
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
                          Livsmedel
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
                        Portion
                      </th>
                      <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                        <button
                          onClick={() => handleSort('calories')}
                          className="flex items-center gap-1 ml-auto hover:text-primary-600 transition-colors"
                        >
                          Kalorier
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
                          Fett
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
                          Kolh.
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
                          Protein
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
                          Typ
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
                              <span title="Recept" className="text-base">
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
                                  <span className="font-semibold text-yellow-600">
                                    {item.fat_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-blue-600">{item.carb_g}</span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-green-600">
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
                                <span className="font-semibold text-yellow-600">
                                  {displayData.fat.toFixed(1)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">g</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-semibold text-blue-600">
                                  {displayData.carb.toFixed(1)}
                                </span>
                                <span className="text-xs text-neutral-500 ml-1">g</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-semibold text-green-600">
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
                                ? 'Grön'
                                : item.energy_density_color === 'Yellow'
                                  ? 'Gul'
                                  : 'Orange'}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {isMina && sharedLists.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={e => e.stopPropagation()}
                                    className="h-8 w-8 p-0"
                                    title="Kopiera till lista"
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
                Sida {page + 1} av {totalPages}
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
                  Föregående
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="gap-1"
                >
                  Nästa
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
              <div className="h-3 w-3 rounded-full bg-green-600" />
              Grön
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 mb-3">Låg energitäthet - ät mer av dessa!</p>
            <div className="space-y-1 text-xs text-neutral-600">
              <p>
                <span className="font-medium">Fast föda:</span> &lt; 1 kcal/g
              </p>
              <p>
                <span className="font-medium">Vätska:</span> &lt; 0.4 kcal/g
              </p>
              <p>
                <span className="font-medium">Soppa:</span> &lt; 0.5 kcal/g
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-3">Exempel: Grönsaker, frukt, magert kött</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-600" />
              Gul
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 mb-3">
              Måttlig energitäthet - ät i måttliga mängder.
            </p>
            <div className="space-y-1 text-xs text-neutral-600">
              <p>
                <span className="font-medium">Fast föda:</span> 1-2.4 kcal/g
              </p>
              <p>
                <span className="font-medium">Vätska:</span> 0.4-0.5 kcal/g
              </p>
              <p>
                <span className="font-medium">Soppa:</span> 0.5-1 kcal/g
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-3">Exempel: Pasta, ris, bröd, magert kött</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-600" />
              Orange
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 mb-3">Hög energitäthet - ät mindre av dessa.</p>
            <div className="space-y-1 text-xs text-neutral-600">
              <p>
                <span className="font-medium">Fast föda:</span> &gt; 2.4 kcal/g
              </p>
              <p>
                <span className="font-medium">Vätska:</span> &gt; 0.5 kcal/g
              </p>
              <p>
                <span className="font-medium">Soppa:</span> &gt; 1 kcal/g
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-3">Exempel: Nötter, olja, chips, godis</p>
          </CardContent>
        </Card>
      </div>

      {/* Reset List Section - only on Mina tab */}
      {isMina && (
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="flex flex-col items-center gap-4">
            {resetStep === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetStep(1)}
                className="text-neutral-500 hover:text-neutral-700 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Återställ lista
              </Button>
            )}

            {resetStep === 1 && (
              <Card className="w-full max-w-md border-amber-300 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-amber-600 font-semibold">
                      Är du säker på att du vill återställa listan?
                    </div>
                    <p className="text-sm text-neutral-600">
                      Detta kommer att ta bort alla dina anpassningar:
                    </p>
                    <ul className="text-sm text-neutral-600 list-disc list-inside text-left">
                      <li>Alla livsmedel du har skapat själv</li>
                      <li>Alla ändringar du gjort i globala livsmedel</li>
                      <li>Alla livsmedel du har dolt</li>
                    </ul>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setResetStep(0)}>
                        Avbryt
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setResetStep(2)}>
                        Ja, fortsätt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resetStep === 2 && (
              <Card className="w-full max-w-md border-red-400 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-red-600 font-bold text-lg">Sista varningen</div>
                    <p className="text-sm text-neutral-700 font-medium">
                      Denna åtgärd kan INTE ångras!
                    </p>
                    <p className="text-sm text-neutral-600">
                      ALLT du har gjort i livsmedelslistan sedan du skapade kontot kommer att
                      raderas permanent. Du får tillbaka den ursprungliga globala listan.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setResetStep(0)}>
                        Avbryt
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleResetList}
                        disabled={isResetting}
                        className="gap-2"
                      >
                        {isResetting ? (
                          <>Återställer...</>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Återställ allt
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

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
            <DialogTitle>Redigera &quot;{listEditItem?.name}&quot;</DialogTitle>
            <DialogDescription>
              Detta livsmedel finns i en delad lista. Välj hur du vill redigera det.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleListEditCopy} className="w-full justify-start h-auto py-3 px-4">
              <div className="text-left">
                <p className="font-medium">Skapa personlig kopia</p>
                <p className="text-xs font-normal opacity-80 mt-0.5">
                  Sparas under &quot;Mina&quot; — påverkar inte listan
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setListEditConfirmShared(true)}
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="text-left">
                <p className="font-medium text-orange-700">Ändra i listan</p>
                <p className="text-xs font-normal text-orange-600 mt-0.5">
                  Påverkar alla som har tillgång till listan
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
            <DialogTitle>Ändra i listan?</DialogTitle>
            <DialogDescription>
              Dina ändringar av &quot;{listEditItem?.name}&quot; syns för alla som delar listan. Är
              du säker?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setListEditConfirmShared(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleListEditShared}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ja, ändra i listan
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
        sharedListId={activeListId}
        copyMode={editCopyMode}
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
