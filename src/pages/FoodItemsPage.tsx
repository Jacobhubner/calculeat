import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, UtensilsCrossed } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein_g: number
  carb_g: number
  fat_g: number
  energy_density_color: 'Green' | 'Yellow' | 'Orange' | null
  default_amount: number
  default_unit: string
  is_recipe: boolean
}

export default function FoodItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'green' | 'yellow' | 'orange'>('all')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch food items from Supabase
  useEffect(() => {
    async function fetchFoodItems() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error

        setFoodItems(data || [])
      } catch (error) {
        console.error('Error fetching food items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFoodItems()
  }, [])

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
        <Button className="gap-2">
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
          title={searchQuery || selectedFilter !== 'all' ? 'Inga livsmedel hittades' : 'Inga livsmedel ännu'}
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
                  onClick: () => console.log('Add food item'),
                }
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFoodItems.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
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
                      {item.energy_density_color === 'Green' ? 'Grön' : item.energy_density_color === 'Yellow' ? 'Gul' : 'Orange'}
                    </Badge>
                  )}
                </div>
                {item.is_recipe && (
                  <Badge variant="secondary" className="w-fit mt-2">
                    Recept
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Portionsstorlek:</span>
                    <span className="font-medium">
                      {item.default_amount} {item.default_unit}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-neutral-600">Kalorier</p>
                        <p className="font-bold text-primary-600">{item.calories} kcal</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Protein</p>
                        <p className="font-semibold text-green-600">{item.protein_g}g</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Kolhydrater</p>
                        <p className="font-semibold text-blue-600">{item.carb_g}g</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Fett</p>
                        <p className="font-semibold text-yellow-600">{item.fat_g}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            <p className="text-sm text-neutral-700">
              Låg kaloritäthet (&lt; 1 kcal/g för fast föda). Ät mer av dessa!
            </p>
            <p className="text-xs text-neutral-600 mt-2">Exempel: Grönsaker, frukt, magert kött</p>
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
            <p className="text-sm text-neutral-700">
              Måttlig kaloritäthet (1-2.4 kcal/g). Ät i måttliga mängder.
            </p>
            <p className="text-xs text-neutral-600 mt-2">Exempel: Pasta, ris, bröd, magert kött</p>
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
            <p className="text-sm text-neutral-700">
              Hög kaloritäthet (&gt; 2.4 kcal/g). Ät mindre av dessa.
            </p>
            <p className="text-xs text-neutral-600 mt-2">Exempel: Nötter, olja, chips, godis</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
