import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, BookOpen } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useRecipes, useDeleteRecipe, type Recipe } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCalculatorModal } from '@/components/recipe/RecipeCalculatorModal'

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  const { data: recipes, isLoading } = useRecipes()
  const deleteRecipe = useDeleteRecipe()

  // Filter recipes based on search
  const filteredRecipes = recipes?.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewRecipe = () => {
    setEditingRecipe(null)
    setIsModalOpen(true)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setIsModalOpen(true)
  }

  const handleDeleteRecipe = async (recipe: Recipe) => {
    const message = `Vill du ta bort receptet "${recipe.name}"?\n\nOBS: Detta kommer att radera receptet både härifrån OCH från livsmedelslistan där det kan användas för loggning.`

    if (!confirm(message)) {
      return
    }

    try {
      await deleteRecipe.mutateAsync(recipe.id)
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      alert('Kunde inte ta bort receptet. Försök igen.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingRecipe(null)
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary-600" />
            Recept
          </h1>
          <p className="text-neutral-600">
            Skapa och hantera dina egna recept
            {recipes &&
              recipes.length > 0 &&
              ` (${filteredRecipes?.length || 0} av ${recipes.length})`}
          </p>
        </div>
        <Button className="gap-2" onClick={handleNewRecipe}>
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

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">Laddar recept...</p>
        </div>
      ) : /* Empty state */
      !filteredRecipes || filteredRecipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={searchQuery ? 'Inga recept hittades' : 'Inga recept ännu'}
          description={
            searchQuery
              ? 'Prova att ändra din sökning.'
              : 'Skapa ditt första recept genom att kombinera matvaror till måltider.'
          }
          action={
            searchQuery
              ? {
                  label: 'Rensa sökning',
                  onClick: () => setSearchQuery(''),
                }
              : {
                  label: 'Skapa recept',
                  onClick: handleNewRecipe,
                }
          }
        />
      ) : (
        /* Recipes grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => handleEditRecipe(recipe)}
              onDelete={() => handleDeleteRecipe(recipe)}
            />
          ))}
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
              <span className="font-semibold">Lägg till i måltider:</span> Sparade recept blir
              automatiskt sökbara som livsmedel och kan enkelt loggas i dina dagliga måltider.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Calculator Modal */}
      <RecipeCalculatorModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editRecipe={editingRecipe}
        onSuccess={() => {
          // Modal handles closing itself
        }}
      />
    </DashboardLayout>
  )
}
