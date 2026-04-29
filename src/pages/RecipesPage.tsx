import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, BookOpen } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useRecipes, useDeleteRecipe, type Recipe } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCalculatorModal } from '@/components/recipe/RecipeCalculatorModal'
import { RecipePreviewModal } from '@/components/recipe/RecipePreviewModal'

export default function RecipesPage() {
  const { t } = useTranslation('recipes')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null)

  const { data: recipes, isLoading, isError } = useRecipes()
  const deleteRecipe = useDeleteRecipe()

  const filteredRecipes = useMemo(() => {
    return recipes?.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [recipes, searchQuery])

  const handleNewRecipe = () => {
    setEditingRecipe(null)
    setIsModalOpen(true)
  }

  const handlePreviewRecipe = (recipe: Recipe) => {
    setPreviewRecipe(recipe)
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setIsModalOpen(true)
  }

  const handleDeleteRecipe = async (recipe: Recipe) => {
    const message = t('page.deleteConfirm', { name: recipe.name })
    if (!confirm(message)) return

    try {
      await deleteRecipe.mutateAsync(recipe.id)
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      alert(t('page.deleteError'))
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
            {t('page.title')}
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {t('page.subtitle')}
            {recipes &&
              recipes.length > 0 &&
              ` ${t('page.subtitleWithCount', { filtered: filteredRecipes?.length || 0, total: recipes.length })}`}
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" size="sm" onClick={handleNewRecipe}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('page.newRecipe')}</span>
          <span className="sm:hidden">{t('page.newRecipeShort')}</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder={t('page.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError ? (
        <div className="text-center py-12">
          <p className="text-red-600">{t('page.errorLoading')}</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600">{t('page.loading')}</p>
        </div>
      ) : !filteredRecipes || filteredRecipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={searchQuery ? t('page.emptyTitleSearch') : t('page.emptyTitle')}
          description={searchQuery ? t('page.emptyDescriptionSearch') : t('page.emptyDescription')}
          action={
            searchQuery
              ? { label: t('page.clearSearch'), onClick: () => setSearchQuery('') }
              : { label: t('page.createRecipe'), onClick: handleNewRecipe }
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPreview={() => handlePreviewRecipe(recipe)}
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
            {t('page.infoTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-700">
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">{t('page.infoCombine')}</span>{' '}
              {t('page.infoCombineText')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">{t('page.infoNutrition')}</span>{' '}
              {t('page.infoNutritionText')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">{t('page.infoServings')}</span>{' '}
              {t('page.infoServingsText')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary-600" />
            </div>
            <p>
              <span className="font-semibold">{t('page.infoAdd')}</span> {t('page.infoAddText')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Preview Modal */}
      <RecipePreviewModal
        recipe={previewRecipe}
        open={!!previewRecipe}
        onOpenChange={open => !open && setPreviewRecipe(null)}
      />

      {/* Recipe Calculator Modal */}
      <RecipeCalculatorModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editRecipe={editingRecipe}
        onSuccess={() => {}}
      />
    </DashboardLayout>
  )
}
