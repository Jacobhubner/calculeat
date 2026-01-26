import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, UtensilsCrossed, Edit2, Trash2, Globe, RotateCcw } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'green' | 'yellow' | 'orange'>('all')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [displayModes, setDisplayModes] = useState<Record<string, DisplayMode>>({})
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0) // 0 = none, 1 = first confirm, 2 = second confirm
  const [isResetting, setIsResetting] = useState(false)

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
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('is_recipe', false)
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
        // Visa serving_unit som knapptext (t.ex. "st", "glas", "burk")
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
    const labels: Record<DisplayMode, string> = {
      serving: `Visa som ${item.serving_unit || 'serveringsportion'}`,
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

    const message = isGlobal
      ? 'Detta är ett globalt livsmedel. Det kommer att döljas från din lista men inte påverka andra användare. Vill du fortsätta?'
      : 'Är du säker på att du vill ta bort detta livsmedel?'

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
      } else {
        // For user's own items: actually delete
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
      (selectedFilter === 'orange' && item.energy_density_color === 'Orange')

    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-primary-600" />
            Livsmedel
          </h1>
          <p className="text-neutral-600">
            Hantera dina livsmedel och livsmedelsdatabas ({filteredFoodItems.length} av{' '}
            {foodItems.length})
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nytt livsmedel
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
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                Alla
              </Button>
              <Button
                variant={selectedFilter === 'green' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('green')}
                className={selectedFilter === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Grön
              </Button>
              <Button
                variant={selectedFilter === 'yellow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('yellow')}
                className={selectedFilter === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Gul
              </Button>
              <Button
                variant={selectedFilter === 'orange' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('orange')}
                className={selectedFilter === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                Orange
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">
                      Livsmedel
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-neutral-900">
                      Portion
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                      Kalorier
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-neutral-900">
                      Protein
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-neutral-900">Kolh.</th>
                    <th className="text-right p-4 text-sm font-semibold text-neutral-900">Fett</th>
                    <th className="text-center p-4 text-sm font-semibold text-neutral-900">Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoodItems.map(item => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{item.name}</span>
                          {item.is_recipe && (
                            <Badge variant="secondary" className="text-xs">
                              Recept
                            </Badge>
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
                            const currentMode = displayModes[item.id] || getDefaultDisplayMode(item)
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
                                <span className="font-semibold text-yellow-600">{item.fat_g}</span>
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
              Återställ till standardlistan
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
