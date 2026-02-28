import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, BookOpen } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useRecipes, useDeleteRecipe, type Recipe } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCalculatorModal } from '@/components/recipe/RecipeCalculatorModal'
import {
  useSharedLists,
  useSharedListRecipes,
  useSharedListRealtime,
  useDeleteSharedListRecipe,
} from '@/hooks/useSharedLists'
import { SharedListMembersBar } from '@/components/shared-lists/SharedListMembersBar'

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [activeListId, setActiveListId] = useState<string | null>(null)

  const { data: recipes, isLoading, isError } = useRecipes()
  const deleteRecipe = useDeleteRecipe()
  const deleteSharedListRecipe = useDeleteSharedListRecipe()
  const { data: sharedLists = [], isLoading: sharedListsLoading } = useSharedLists()
  const activeList = activeListId ? (sharedLists.find(l => l.id === activeListId) ?? null) : null
  const { data: listRecipes, isLoading: isListLoading } = useSharedListRecipes(activeListId)

  // Realtime-prenumeration för aktiv lista
  useSharedListRealtime(activeListId)

  // Filter recipes based on search
  const filteredRecipes = useMemo(() => {
    const source = activeListId ? (listRecipes as Recipe[] | undefined) : recipes
    return source?.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [activeListId, listRecipes, recipes, searchQuery])

  const handleNewRecipe = () => {
    setEditingRecipe(null)
    setIsModalOpen(true)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setIsModalOpen(true)
  }

  const handleTabChange = (listId: string | null) => {
    setActiveListId(listId)
    setSearchQuery('')
  }

  // Om activeListId pekar på en lista som inte längre finns (t.ex. efter leave),
  // navigera automatiskt tillbaka till 'mina recept'.
  const listExists =
    !activeListId || sharedListsLoading || sharedLists.some(l => l.id === activeListId)
  if (!listExists) setActiveListId(null)

  const handleDeleteRecipe = async (recipe: Recipe) => {
    // List-owned recipe: direct delete via RPC
    if (recipe.shared_list_id) {
      if (!confirm(`Ta bort receptet "${recipe.name}" från listan?`)) return
      try {
        await deleteSharedListRecipe.mutateAsync({
          recipeId: recipe.id,
          listId: recipe.shared_list_id!,
        })
      } catch (error) {
        console.error('Failed to delete list recipe:', error)
        alert('Kunde inte ta bort receptet från listan. Försök igen.')
      }
      return
    }

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
      <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            Recept
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {activeListId ? 'Listans recept' : 'Skapa och hantera dina egna recept'}
            {!activeListId &&
              recipes &&
              recipes.length > 0 &&
              ` (${filteredRecipes?.length || 0} av ${recipes.length})`}
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" size="sm" onClick={handleNewRecipe}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nytt recept</span>
          <span className="sm:hidden">Nytt</span>
        </Button>
      </div>

      {/* Tabs — Mina recept + en per delad lista */}
      {sharedLists.length > 0 && (
        <>
          <div className="flex gap-1 mb-0 border-b border-neutral-200 overflow-x-auto">
            <button
              onClick={() => handleTabChange(null)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                !activeListId
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Mina recept
            </button>
            {sharedLists.map(list => (
              <button
                key={list.id}
                onClick={() => handleTabChange(list.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeListId === list.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {list.name}
              </button>
            ))}
          </div>
          {activeList && (
            <div className="mb-4">
              <SharedListMembersBar list={activeList} onLeft={() => handleTabChange(null)} />
            </div>
          )}
          {!activeList && <div className="mb-4" />}
        </>
      )}

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

      {/* Error state */}
      {!activeListId && isError ? (
        <div className="text-center py-12">
          <p className="text-red-600">Kunde inte ladda recept. Försök igen senare.</p>
        </div>
      ) : /* Loading state */
      (activeListId ? isListLoading : isLoading) ? (
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
              : activeListId
                ? 'Inga recept i den här listan ännu.'
                : 'Skapa ditt första recept genom att kombinera matvaror till måltider.'
          }
          action={
            searchQuery
              ? {
                  label: 'Rensa sökning',
                  onClick: () => setSearchQuery(''),
                }
              : !activeListId
                ? {
                    label: 'Skapa recept',
                    onClick: handleNewRecipe,
                  }
                : undefined
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
        sharedListId={activeListId ?? undefined}
        onSuccess={() => {
          // Modal handles closing itself
        }}
      />
    </DashboardLayout>
  )
}
