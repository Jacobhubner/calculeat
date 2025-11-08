import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, BookOpen } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // TODO: Replace with actual data from Supabase
  const recipes: unknown[] = []

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary-600" />
            Recept
          </h1>
          <p className="text-neutral-600">Skapa och hantera dina egna recept</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nytt recept
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Sök efter recept..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Inga recept ännu"
          description="Skapa ditt första recept genom att kombinera matvaror till måltider."
          action={{
            label: 'Skapa recept',
            onClick: () => console.log('Create recipe'),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Recipes will be mapped here */}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 bg-gradient-to-br from-accent-50 to-primary-50 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Om Recept
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-700">
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">Kombinera matvaror:</span> Skapa recept genom att
              lägga till flera matvaror med specifika mängder.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">Automatisk näring:</span> Näringsvärden beräknas
              automatiskt baserat på ingredienser.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">Portionsstorlek:</span> Ange antal portioner för att
              få näring per portion.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">Lägg till i måltider:</span> Använd recept direkt i
              din dagliga logg.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
