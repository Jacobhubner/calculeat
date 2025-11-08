import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, UtensilsCrossed } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

export default function FoodItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'green' | 'yellow' | 'orange'>('all')

  // TODO: Replace with actual data from Supabase
  const foodItems: unknown[] = []

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-primary-600" />
            Matvaror
          </h1>
          <p className="text-neutral-600">Hantera dina matvaror och livsmedelsdatabas</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ny matvara
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

            {/* Noom Filter */}
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
      {foodItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Inga matvaror ännu"
          description="Kom igång genom att lägga till din första matvara i databasen."
          action={{
            label: 'Lägg till matvara',
            onClick: () => console.log('Add food item'),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Food items will be mapped here */}
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
