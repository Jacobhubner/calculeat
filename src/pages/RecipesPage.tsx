import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ChefHat, BookOpen, Compass, Lock } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useRecipes, useDeleteRecipe, type Recipe } from '@/hooks/useRecipes'
import { useOfficialRecipes, useCopyOfficialRecipe } from '@/hooks/useOfficialRecipes'
import { PreviewBlockedError } from '@/hooks/usePreviewMutation'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCalculatorModal } from '@/components/recipe/RecipeCalculatorModal'
import { RecipePreviewModal } from '@/components/recipe/RecipePreviewModal'
import { QuotaCounter } from '@/components/premium/QuotaCounter'
import { PremiumBadge } from '@/components/premium/PremiumBadge'
import { useEntitlements, isUnlimited } from '@/hooks/useEntitlements'
import { useUpgradeModalStore, handlePremiumLimitError } from '@/stores/upgradeModalStore'

type RecipesTab = 'mine' | 'discover'

export default function RecipesPage() {
  const { t } = useTranslation('recipes')
  const [tab, setTab] = useState<RecipesTab>('mine')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [previewRecipeId, setPreviewRecipeId] = useState<string | null>(null)

  const { data: recipes, isLoading, isError } = useRecipes()
  const { data: officialRecipes, isLoading: isLoadingOfficial } = useOfficialRecipes()
  const deleteRecipe = useDeleteRecipe()
  const copyOfficialRecipe = useCopyOfficialRecipe()
  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  const filteredRecipes = useMemo(() => {
    return recipes?.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [recipes, searchQuery])

  const filteredOfficialRecipes = useMemo(() => {
    return officialRecipes?.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [officialRecipes, searchQuery])

  const isRecipeLocked = (recipe: Recipe) => !!recipe.premium_only && !limits.recipe_bank_full

  const handleSaveOfficialRecipe = async (recipe: Recipe) => {
    try {
      const result = await copyOfficialRecipe.mutateAsync(recipe.id)
      toast.success(t('discover.savedToast', { name: result.name ?? recipe.name }))
    } catch (error) {
      if (error instanceof PreviewBlockedError) return
      if (handlePremiumLimitError(error)) return
      console.error('Failed to copy official recipe:', error)
      toast.error(t('discover.saveError'))
    }
  }

  const handleNewRecipe = () => {
    // Mjuk förkontroll av receptkvoten — servertriggern är sista försvarslinjen
    if (!isUnlimited(limits.recipes) && (recipes?.length ?? 0) >= limits.recipes) {
      openUpgradeModal('recipes')
      return
    }
    setEditingRecipe(null)
    setIsModalOpen(true)
  }

  const previewRecipe =
    recipes?.find(r => r.id === previewRecipeId) ??
    officialRecipes?.find(r => r.id === previewRecipeId) ??
    null

  const handlePreviewRecipe = (recipe: Recipe) => {
    setPreviewRecipeId(recipe.id)
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
            <QuotaCounter used={recipes?.length ?? 0} limit={limits.recipes} className="ml-2" />
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" size="sm" onClick={handleNewRecipe}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('page.newRecipe')}</span>
          <span className="sm:hidden">{t('page.newRecipeShort')}</span>
        </Button>
      </div>

      {/* Flikar: Mina recept / Upptäck */}
      <div className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'mine'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ChefHat className="h-4 w-4" />
          {t('tabs.mine')}
        </button>
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'discover'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Compass className="h-4 w-4" />
          {t('tabs.discover')}
        </button>
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

      {/* Innehåll: Mina recept */}
      {tab === 'mine' &&
        (isError ? (
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
            description={
              searchQuery ? t('page.emptyDescriptionSearch') : t('page.emptyDescription')
            }
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
        ))}

      {/* Innehåll: Upptäck (receptbanken) */}
      {tab === 'discover' &&
        (isLoadingOfficial ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">{t('page.loading')}</p>
          </div>
        ) : !filteredOfficialRecipes || filteredOfficialRecipes.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={searchQuery ? t('page.emptyTitleSearch') : t('discover.emptyTitle')}
            description={
              searchQuery ? t('page.emptyDescriptionSearch') : t('discover.emptyDescription')
            }
            action={
              searchQuery
                ? { label: t('page.clearSearch'), onClick: () => setSearchQuery('') }
                : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredOfficialRecipes.map(recipe =>
              isRecipeLocked(recipe) ? (
                // Låst premiumrecept — blur-mönstret från kostlägena
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openUpgradeModal('recipe_bank_full')}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-900 truncate">
                            {recipe.name}
                          </span>
                          <PremiumBadge />
                        </div>
                        <div
                          className="flex items-center gap-3 text-sm text-neutral-500 blur-sm select-none"
                          aria-hidden="true"
                        >
                          <span>
                            {recipe.servings || 1} {t('card.portionPlural')}
                          </span>
                          <span className="font-semibold text-primary-600">000 kcal</span>
                          <span>F:00g</span>
                          <span>K:00g</span>
                          <span>P:00g</span>
                        </div>
                      </div>
                      <Lock
                        className="h-4 w-4 text-neutral-400 shrink-0"
                        aria-label={t('discover.lockedHint')}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPreview={() => handlePreviewRecipe(recipe)}
                  onSave={() => handleSaveOfficialRecipe(recipe)}
                  isSaving={copyOfficialRecipe.isPending}
                />
              )
            )}
          </div>
        ))}

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
        onOpenChange={open => !open && setPreviewRecipeId(null)}
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
