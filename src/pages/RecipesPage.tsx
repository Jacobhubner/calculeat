import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  ChefHat,
  BookOpen,
  Compass,
  Lock,
  Lightbulb,
  Trash2,
  Globe,
} from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useRecipes, useDeleteRecipe, type Recipe } from '@/hooks/useRecipes'
import {
  useOfficialRecipes,
  useCopyOfficialRecipe,
  useRequestRecipe,
  useRecipeRequests,
  useDeleteRecipeRequest,
  usePublishRecipe,
  useUnpublishRecipe,
  useSetOfficialRecipeImage,
} from '@/hooks/useOfficialRecipes'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useRecipeImageUpload } from '@/hooks/useRecipeImageUpload'
import { useRef } from 'react'
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

  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allTags = useMemo(
    () => [...new Set(officialRecipes?.flatMap(r => r.tags ?? []) ?? [])].sort(),
    [officialRecipes]
  )

  const filteredOfficialRecipes = useMemo(() => {
    return officialRecipes?.filter(
      recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!tagFilter || (recipe.tags ?? []).includes(tagFilter))
    )
  }, [officialRecipes, searchQuery, tagFilter])

  const isRecipeLocked = (recipe: Recipe) => !!recipe.premium_only && !limits.recipe_bank_full

  const requestRecipe = useRequestRecipe()
  const [requestText, setRequestText] = useState('')
  const { data: isAdmin = false } = useIsAdmin()
  const { data: recipeRequests = [] } = useRecipeRequests(isAdmin)
  const deleteRecipeRequest = useDeleteRecipeRequest()

  // Admin: publicera/avpublicera + bilduppladdning på officiella recept
  const publishRecipe = usePublishRecipe()
  const unpublishRecipe = useUnpublishRecipe()
  const setOfficialImage = useSetOfficialRecipeImage()
  const { uploadImage } = useRecipeImageUpload()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageTargetRecipeId = useRef<string | null>(null)

  const handlePublishRecipe = async (recipe: Recipe) => {
    if (!confirm(t('discover.publishConfirm', { name: recipe.name }))) return
    const premium = confirm(t('discover.publishPremiumQ'))
    const tagsInput = prompt(t('discover.publishTagsPrompt'), 'middag') ?? ''
    const tags = tagsInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    try {
      const result = await publishRecipe.mutateAsync({ recipeId: recipe.id, premium, tags })
      if (!result.success) {
        if (result.error === 'non_global_ingredients') {
          alert(t('discover.publishNonGlobal', { list: (result.ingredients ?? []).join(', ') }))
        } else {
          toast.error(t('discover.publishError'))
        }
        return
      }
      toast.success(t('discover.publishSuccess', { name: recipe.name }))
    } catch {
      toast.error(t('discover.publishError'))
    }
  }

  const handleUnpublishRecipe = async (recipe: Recipe) => {
    if (!confirm(t('discover.unpublishConfirm', { name: recipe.name }))) return
    try {
      const result = await unpublishRecipe.mutateAsync(recipe.id)
      if (!result.success) {
        toast.error(t('discover.publishError'))
        return
      }
      toast.success(t('discover.unpublishSuccess', { name: recipe.name }))
    } catch {
      toast.error(t('discover.publishError'))
    }
  }

  const handlePickImage = (recipe: Recipe) => {
    imageTargetRecipeId.current = recipe.id
    imageInputRef.current?.click()
  }

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const recipeId = imageTargetRecipeId.current
    if (!file || !recipeId) return
    const result = await uploadImage(file)
    if (result.error || !result.url) {
      toast.error(t('discover.imageError'))
      return
    }
    try {
      await setOfficialImage.mutateAsync({ recipeId, imageUrl: result.url })
      toast.success(t('discover.imageUpdated'))
    } catch {
      toast.error(t('discover.imageError'))
    }
  }

  const handleRequestRecipe = async () => {
    const text = requestText.trim()
    if (text.length < 3) return
    try {
      await requestRecipe.mutateAsync(text)
      setRequestText('')
      toast.success(t('discover.requestThanks'))
    } catch (error) {
      if (error instanceof PreviewBlockedError) return
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('RATE_LIMIT:recipe_requests')) {
        toast.error(t('discover.requestRateLimit'))
      } else {
        toast.error(t('discover.requestError'))
      }
    }
  }

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

  // Admin: klick på Redigera på ett officiellt recept → beslutsdialog
  const [editChoiceRecipe, setEditChoiceRecipe] = useState<Recipe | null>(null)

  const handleEditGlobally = () => {
    if (!editChoiceRecipe) return
    setEditingRecipe(editChoiceRecipe)
    setIsModalOpen(true)
    setEditChoiceRecipe(null)
  }

  const handleEditAsCopy = async () => {
    const recipe = editChoiceRecipe
    setEditChoiceRecipe(null)
    if (!recipe) return
    await handleSaveOfficialRecipe(recipe) // skapar kopia i Mina recept + toast
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
            <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-primary-600 dark:text-primary-300" />
            {t('page.title')}
          </h1>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
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
      <div className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'mine'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-850 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-400'
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
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-850 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-400'
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
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
            <p className="text-red-600 dark:text-red-300">{t('page.errorLoading')}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400">{t('page.loading')}</p>
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
            {filteredRecipes.map(recipe => {
              const isOfficial = recipe.visibility === 'official'
              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPreview={() => handlePreviewRecipe(recipe)}
                  // Officiella recept redigeras/raderas inte härifrån —
                  // avpublicera först (följeslagar-food_item är globalägd)
                  onEdit={isOfficial ? undefined : () => handleEditRecipe(recipe)}
                  onDelete={isOfficial ? undefined : () => handleDeleteRecipe(recipe)}
                  onPublish={isAdmin && !isOfficial ? () => handlePublishRecipe(recipe) : undefined}
                  onUnpublish={
                    isAdmin && isOfficial ? () => handleUnpublishRecipe(recipe) : undefined
                  }
                />
              )
            })}
          </div>
        ))}

      {/* Taggfilter för Upptäck */}
      {tab === 'discover' && allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tagFilter === null
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {t('discover.allTags')}
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tagFilter === tag
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Innehåll: Upptäck (receptbanken) */}
      {tab === 'discover' &&
        (isLoadingOfficial ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400">{t('page.loading')}</p>
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
            <p className="mb-1 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-900/25 dark:text-primary-300">
              {t('discover.editHint')}
            </p>
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
                          <span className="font-semibold text-neutral-900 truncate dark:text-neutral-100">
                            {recipe.name}
                          </span>
                          <PremiumBadge />
                        </div>
                        <div
                          className="flex items-center gap-3 text-sm text-neutral-500 blur-sm select-none dark:text-neutral-400"
                          aria-hidden="true"
                        >
                          <span>
                            {recipe.servings || 1} {t('card.portionPlural')}
                          </span>
                          <span className="font-semibold text-primary-600 dark:text-primary-300">
                            000 kcal
                          </span>
                          <span>F:00g</span>
                          <span>K:00g</span>
                          <span>P:00g</span>
                        </div>
                      </div>
                      <Lock
                        className="h-4 w-4 text-neutral-400 shrink-0 dark:text-neutral-500"
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
                  onEdit={isAdmin ? () => setEditChoiceRecipe(recipe) : undefined}
                  onUploadImage={isAdmin ? () => handlePickImage(recipe) : undefined}
                  // Avpublicering hör hemma här: fliken "Mina recept" visar
                  // bara egna recept, så en admin som inte äger bankrecepten
                  // hade annars ingen väg att ta bort dem ur banken.
                  onUnpublish={isAdmin ? () => handleUnpublishRecipe(recipe) : undefined}
                />
              )
            )}
          </div>
        ))}

      {/* Önska recept — endast Upptäck-fliken */}
      {tab === 'discover' && (
        <Card className="mt-8 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200 dark:from-primary-900/30 dark:to-accent-900/20 dark:border-primary-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              {t('discover.requestTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('discover.requestDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
                placeholder={t('discover.requestPlaceholder')}
                maxLength={500}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRequestRecipe()
                }}
              />
              <Button
                onClick={handleRequestRecipe}
                disabled={requestText.trim().length < 3 || requestRecipe.isPending}
                className="shrink-0"
              >
                {requestRecipe.isPending
                  ? t('discover.requestSending')
                  : t('discover.requestSubmit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: inkomna receptönskemål — endast Upptäck-fliken */}
      {tab === 'discover' && isAdmin && (
        <Card className="mt-6 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              {t('discover.adminRequestsTitle')}
              <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                ({recipeRequests.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recipeRequests.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('discover.adminRequestsEmpty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {recipeRequests.map(req => (
                  <li
                    key={req.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:bg-neutral-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200">
                        {req.request_text}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        @{req.requester_name} · {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecipeRequest.mutate(req.id)}
                      disabled={deleteRecipeRequest.isPending}
                      className="h-7 w-7 shrink-0 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:text-neutral-500"
                      aria-label={t('discover.adminRequestDelete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card — endast Mina recept */}
      {tab === 'mine' && (
        <Card className="mt-8 bg-gradient-to-br from-accent-50 to-primary-50 border-primary-200 dark:from-accent-900/25 dark:to-primary-900/25 dark:border-primary-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('page.infoTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
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
      )}

      {/* Dold filväljare för admin-bilduppladdning på officiella recept */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      {/* Recipe Preview Modal */}
      <RecipePreviewModal
        recipe={previewRecipe}
        open={!!previewRecipe}
        onOpenChange={open => !open && setPreviewRecipeId(null)}
      />

      {/* Admin: redigera officiellt recept — val globalt eller egen kopia */}
      <Dialog open={!!editChoiceRecipe} onOpenChange={open => !open && setEditChoiceRecipe(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('discover.editChoiceTitle')}</DialogTitle>
            <DialogDescription>
              {t('discover.editChoiceDesc', { name: editChoiceRecipe?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={handleEditGlobally} className="justify-start gap-2">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <span className="flex flex-col items-start text-left">
                <span className="font-medium">{t('discover.editGlobal')}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('discover.editGlobalHint')}
                </span>
              </span>
            </Button>
            <Button variant="outline" onClick={handleEditAsCopy} className="justify-start gap-2">
              <ChefHat className="h-4 w-4 text-primary-600 dark:text-primary-300" />
              <span className="flex flex-col items-start text-left">
                <span className="font-medium">{t('discover.editCopy')}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('discover.editCopyHint')}
                </span>
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
