import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Bookmark } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

export default function SavedMealsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // TODO: Replace with actual data from Supabase
  const savedMeals: unknown[] = []

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary-600" />
            Sparade Måltider
          </h1>
          <p className="text-neutral-600">Dina favoritmåltider för snabb loggning</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ny måltid
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Sök efter sparade måltider..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Saved Meals List */}
      {savedMeals.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Inga sparade måltider ännu"
          description="Spara dina favoritmåltider för att snabbt logga dem i framtiden."
          action={{
            label: 'Skapa måltid',
            onClick: () => console.log('Create saved meal'),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Saved meals will be mapped here */}
        </div>
      )}

      {/* Quick Tips */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
          <CardHeader>
            <CardTitle className="text-lg">💡 Använd Sparade Måltider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700">
            <p>• Skapa mallar för dina vanligaste måltider</p>
            <p>• Lägg till snabbt i dagens logg med ett klick</p>
            <p>• Perfekt för frukost som ofta är densamma</p>
            <p>• Ändra mängder vid behov när du loggar</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200">
          <CardHeader>
            <CardTitle className="text-lg">📋 Skillnad Recept vs Måltid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700">
            <p>
              <span className="font-semibold">Recept:</span> För mat du lagar själv. Kombinerar
              ingredienser till ett nytt &quot;livsmedelsobjekt&quot;.
            </p>
            <p>
              <span className="font-semibold">Sparad måltid:</span> En kombination av
              matvaror/recept som du ofta äter tillsammans.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
