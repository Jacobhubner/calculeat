import { useState, useEffect, useMemo } from 'react'
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
  Globe,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { AddFoodItemModal } from '@/components/food/AddFoodItemModal'
import { useAuth } from '@/contexts/AuthContext'

interface FoodItem {
  id: string
  user_id: string | null // NULL = global item
  global_food_id?: string | null // Reference to original (for user copies)
  is_hidden?: boolean
  name: string
  calories: number
  protein_g: number
  carb_g: number
  fat_g: number
  energy_density_color: 'Green' | 'Yellow' | 'Orange' | null
  default_amount: number
  default_unit: string
  is_recipe: boolean
  weight_grams?: number
  kcal_per_gram?: number
  food_type: 'Solid' | 'Liquid' | 'Soup'
  ml_per_gram?: number
  grams_per_piece?: number
  serving_unit?: string
  kcal_per_unit?: number
  fat_per_unit?: number
  carb_per_unit?: number
  protein_per_unit?: number
}

// Display mode type
type DisplayMode = 'serving' | 'per100g' | 'perVolume'

// Sort types
type SortKey = 'name' | 'calories' | 'protein' | 'carb' | 'fat' | 'color'
type SortDirection = 'asc' | 'desc'

// Helper function: Get available display modes for a food item
function getAvailableDisplayModes(item: FoodItem): DisplayMode[] {
  const modes: DisplayMode[] = []

  // Serveringsportion (om både grams_per_piece och serving_unit finns)
  if (item.grams_per_piece && item.serving_unit && item.kcal_per_unit) {
    modes.push('serving')
  }

  // Per 100g (alltid tillgängligt om kcal_per_gram finns)
  if (item.kcal_per_gram) {
    modes.push('per100g')
  }

  // Per volym (om ml_per_gram finns)
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
        icon: '⚖️',
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
      // 100ml = 100 / ml_per_gram gram
      const gramsIn100ml = 100 / item.ml_per_gram
      return {
        icon: '🧊',
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
    // LocalStorage quota exceeded or disabled - fail silently
    console.warn('Could not save display mode to localStorage:', error)
  }
}

// Helper function: Get default display mode for a food item
function getDefaultDisplayMode(item: FoodItem): DisplayMode {
  // 1. Kolla localStorage först
  const saved = getSavedDisplayMode(item.id)
  if (saved) {
    const availableModes = getAvailableDisplayModes(item)
    // Verifiera att sparat läge fortfarande är tillgängligt
    if (availableModes.includes(saved)) {
      return saved
    }
  }

  // 2. Om serveringsinformation finns, visa den som default
  if (item.grams_per_piece && item.serving_unit && item.kcal_per_unit) {
    return 'serving'
  }

  // 3. Fallback till per 100g
  return 'per100g'
}

export default function FoodItemsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'green' | 'yellow' | 'orange' | 'recipe'>(
    'all'
  )
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [displayModes, setDisplayModes] = useState<Record<string, DisplayMode>>({})
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0) // 0 = none, 1 = first confirm, 2 = second confirm
  const [isResetting, setIsResetting] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Apply shadowing logic to food items
  const applyShadowing = (items: FoodItem[], userId: string): FoodItem[] => {
    // Get IDs of global items that user has copied
    const shadowedGlobalIds = new Set(
      items
        .filter(item => item.user_id === userId && item.global_food_id)
        .map(item => item.global_food_id)
    )

    // Get names of user items (for name-based shadowing)
    const userItemNames = new Set(
      items
        .filter(item => item.user_id === userId && !item.is_hidden)
        .map(item => item.name.toLowerCase())
    )

    return items.filter(item => {
      if (item.is_hidden) return false
      if (item.user_id === userId) return true
      if (item.user_id === null) {
        if (shadowedGlobalIds.has(item.id)) return false
        if (userItemNames.has(item.name.toLowerCase())) return false
      }
      return true
    })
  }

  // Fetch food items from Supabase (global + user items with shadowing)
  const fetchFoodItems = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Include recipes (is_recipe=true) so they appear in the food list
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('name', { ascending: true })

      if (error) throw error

      // Apply shadowing
      const shadowedItems = applyShadowing(data || [], user.id)
      setFoodItems(shadowedItems)
    } catch (error) {
      console.error('Error fetching food items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchFoodItems()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchFoodItems is stable, only re-run when user changes
  }, [user])

  // Initialize display modes when food items are loaded
  useEffect(() => {
    if (foodItems && foodItems.length > 0) {
      const initialModes: Record<string, DisplayMode> = {}
      foodItems.forEach(item => {
        initialModes[item.id] = getDefaultDisplayMode(item)
      })
      setDisplayModes(initialModes)
    }
  }, [foodItems])

  // Get ALL available display modes (including the current one)
  const getAllAvailableModes = (item: FoodItem): DisplayMode[] => {
    return getAvailableDisplayModes(item)
  }

  // Get button label for a display mode
  const getButtonLabel = (mode: DisplayMode, item: FoodItem): string => {
    switch (mode) {
      case 'serving':
        // Visa serving_unit som knapptext (t.ex. "st", "glas", "burk", "port")
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

  const handleDelete = async (id: string) => {
    const item = foodItems.find(i => i.id === id)
    const isGlobal = item?.user_id === null
    const isRecipe = item?.is_recipe === true

    let message: string
    if (isRecipe) {
      message = `Vill du ta bort receptet "${item?.name}"?\n\nOBS: Detta kommer att radera receptet både från livsmedelslistan OCH från dina sparade recept.`
    } else if (isGlobal) {
      message =
        'Detta är ett globalt livsmedel. Det kommer att döljas från din lista men inte påverka andra användare. Vill du fortsätta?'
    } else {
      message = 'Är du säker på att du vill ta bort detta livsmedel?'
    }

    if (!confirm(message)) {
      return
    }

    try {
      setDeletingItemId(id)

      if (isGlobal && user) {
        // For global items: create a hidden marker (soft delete)
        const { error: insertError } = await supabase.from('food_items').insert({
          user_id: user.id,
          global_food_id: id,
          is_hidden: true,
          name: `_hidden_${item?.name || id}`,
          default_amount: 100,
          default_unit: 'g',
          weight_grams: 100,
          calories: 0,
          fat_g: 0,
          carb_g: 0,
          protein_g: 0,
          food_type: 'Solid',
          is_recipe: false,
        })

        if (insertError) throw insertError
      } else if (isRecipe) {
        // For recipes: delete both the recipe AND the food_item
        // First, find and delete the recipe that links to this food_item
        const { error: recipeDeleteError } = await supabase
          .from('recipes')
          .delete()
          .eq('food_item_id', id)

        if (recipeDeleteError) {
          console.error('Error deleting linked recipe:', recipeDeleteError)
        }

        // Then delete the food_item
        const { error } = await supabase.from('food_items').delete().eq('id', id)
        if (error) throw error

        // Invalidate recipes cache so RecipesPage updates
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      } else {
        // For regular user's own items: actually delete
        const { error } = await supabase.from('food_items').delete().eq('id', id)
        if (error) throw error
      }

      await fetchFoodItems()
    } catch (error) {
      console.error('Error deleting food item:', error)
      alert('Kunde inte ta bort livsmedel. Försök igen.')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleEdit = (item: FoodItem) => {
    if (item.user_id === null) {
      // Global item - inform user that a copy will be created
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

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setEditingItem(null)
  }

  // Reset all user customizations (delete all user-specific food items)
  const handleResetList = async () => {
    if (!user) return

    try {
      setIsResetting(true)

      // Delete all user-specific food items (both custom items and hidden markers/copies)
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

      // Refresh the list
      await fetchFoodItems()
      setResetStep(0)
    } catch (error) {
      console.error('Error resetting food list:', error)
      alert('Kunde inte återställa listan. Försök igen.')
    } finally {
      setIsResetting(false)
    }
  }

  // Count user customizations for display
  const userCustomizationCount = foodItems.filter(item => item.user_id === user?.id).length

  // Filter food items based on search and energy density color
  const filteredFoodItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'green' && item.energy_density_color === 'Green') ||
      (selectedFilter === 'yellow' && item.energy_density_color === 'Yellow') ||
      (selectedFilter === 'orange' && item.energy_density_color === 'Orange') ||
      (selectedFilter === 'recipe' && item.is_recipe === true)

    return matchesSearch && matchesFilter
  })

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      // Toggle direction
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // New column, default to ascending
      setSortBy(key)
      setSortDirection('asc')
    }
  }

  // Sort food items
  const sortedFoodItems = useMemo(() => {
    const sorted = [...filteredFoodItems]

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
  }, [filteredFoodItems, sortBy, sortDirection, displayModes])

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
            {filteredFoodItems.length} av {foodItems.length} livsmedel
          </p>
        </div>
        <Button
          className="gap-2 self-start sm:self-auto"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nytt livsmedel</span>
          <span className="sm:hidden">Nytt</span>
        </Button>
      </div>

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

            {/* Energitäthet Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('all')}
                className={
                  selectedFilter === 'all'
                    ? 'bg-neutral-200 hover:bg-neutral-300 border-neutral-400 font-semibold'
                    : ''
                }
              >
                Alla
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('green')}
                className={
                  selectedFilter === 'green'
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 font-semibold'
                    : ''
                }
              >
                Grön
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('yellow')}
                className={
                  selectedFilter === 'yellow'
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-neutral-900 border-yellow-500 font-semibold'
                    : ''
                }
              >
                Gul
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('orange')}
                className={
                  selectedFilter === 'orange'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 font-semibold'
                    : ''
                }
              >
                Orange
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFilter('recipe')}
                className={
                  selectedFilter === 'recipe'
                    ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600 font-semibold gap-1'
                    : 'gap-1'
                }
              >
                <span>👨‍🍳</span>
                <span>Recept</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Items List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">Laddar livsmedel...</p>
        </div>
      ) : filteredFoodItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={
            searchQuery || selectedFilter !== 'all'
              ? 'Inga livsmedel hittades'
              : 'Inga livsmedel ännu'
          }
          description={
            searchQuery || selectedFilter !== 'all'
              ? 'Prova att ändra dina sökkriterier eller filter.'
              : 'Kom igång genom att lägga till ditt första livsmedel i databasen.'
          }
          action={
            searchQuery || selectedFilter !== 'all'
              ? {
                  label: 'Rensa filter',
                  onClick: () => {
                    setSearchQuery('')
                    setSelectedFilter('all')
                  },
                }
              : {
                  label: 'Lägg till livsmedel',
                  onClick: () => setIsAddModalOpen(true),
                }
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-1">
            {sortedFoodItems.map(item => {
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
                        {item.user_id === null && (
                          <Globe className="h-3 w-3 text-blue-500 shrink-0" />
                        )}
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
                      <span className="text-green-600">
                        P: {displayData ? displayData.protein.toFixed(1) : item.protein_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-blue-600">
                        K: {displayData ? displayData.carb.toFixed(1) : item.carb_g}g
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-yellow-600">
                        F: {displayData ? displayData.fat.toFixed(1) : item.fat_g}g
                      </span>
                    </div>
                    {/* Row 3: Unit pills + actions (previously Row 4) */}
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
                    {sortedFoodItems.map(item => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900">{item.name}</span>
                            {item.is_recipe && (
                              <span title="Recept" className="text-base">
                                👨‍🍳
                              </span>
                            )}
                            {/* Global item indicator - only globe icon */}
                            {item.user_id === null && (
                              <Globe className="h-4 w-4 text-blue-500" title="Globalt livsmedel" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-neutral-600 text-sm">
                          <div className="flex items-center gap-2">
                            {/* Portionsinformation (utan makrovärden) */}
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

                            {/* Enhets-pill-badges för ALLA enheter */}
                            {(() => {
                              const currentMode =
                                displayModes[item.id] || getDefaultDisplayMode(item)
                              const allModes = getAllAvailableModes(item)

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
                        {/* Kalori-kolumn - visa dynamiskt baserat på vald enhet */}
                        <td className="p-4 text-right">
                          {(() => {
                            const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
                            const displayData = getDisplayData(item, currentMode)

                            if (!displayData || !item.kcal_per_gram) {
                              // Fallback
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
                        {/* Makrokolumner - visa dynamiska värden baserat på vald enhet */}
                        {(() => {
                          const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
                          const displayData = getDisplayData(item, currentMode)

                          if (!displayData) {
                            // Fallback till databas-värden
                            return (
                              <>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-green-600">
                                    {item.protein_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-blue-600">{item.carb_g}</span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-yellow-600">
                                    {item.fat_g}
                                  </span>
                                  <span className="text-xs text-neutral-500 ml-1">g</span>
                                </td>
                              </>
                            )
                          }

                          return (
                            <>
                              <td className="p-4 text-right">
                                <span className="font-semibold text-green-600">
                                  {displayData.protein.toFixed(1)}
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
                                <span className="font-semibold text-yellow-600">
                                  {displayData.fat.toFixed(1)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
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
                <span className="font-medium">🍖 Fast föda:</span> &lt; 1 kcal/g
              </p>
              <p>
                <span className="font-medium">🥤 Vätska:</span> &lt; 0.4 kcal/g
              </p>
              <p>
                <span className="font-medium">🍲 Soppa:</span> &lt; 0.5 kcal/g
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
                <span className="font-medium">🍖 Fast föda:</span> 1-2.4 kcal/g
              </p>
              <p>
                <span className="font-medium">🥤 Vätska:</span> 0.4-0.5 kcal/g
              </p>
              <p>
                <span className="font-medium">🍲 Soppa:</span> 0.5-1 kcal/g
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
                <span className="font-medium">🍖 Fast föda:</span> &gt; 2.4 kcal/g
              </p>
              <p>
                <span className="font-medium">🥤 Vätska:</span> &gt; 0.5 kcal/g
              </p>
              <p>
                <span className="font-medium">🍲 Soppa:</span> &gt; 1 kcal/g
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-3">Exempel: Nötter, olja, chips, godis</p>
          </CardContent>
        </Card>
      </div>

      {/* Reset List Section */}
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
                  <div className="text-red-600 font-bold text-lg">⚠️ Sista varningen</div>
                  <p className="text-sm text-neutral-700 font-medium">
                    Denna åtgärd kan INTE ångras!
                  </p>
                  <p className="text-sm text-neutral-600">
                    ALLT du har gjort i livsmedelslistan sedan du skapade kontot kommer att raderas
                    permanent. Du får tillbaka den ursprungliga globala listan.
                  </p>
                  {userCustomizationCount > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      Du har {userCustomizationCount} anpassning
                      {userCustomizationCount !== 1 ? 'ar' : ''} som kommer att raderas.
                    </p>
                  )}
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

      {/* Add/Edit Food Item Modal */}
      <AddFoodItemModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        onSuccess={fetchFoodItems}
        editItem={editingItem}
      />
    </DashboardLayout>
  )
}
