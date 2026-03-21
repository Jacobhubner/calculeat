import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Bookmark, Loader2 } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import SavedMealCard from '@/components/saved-meals/SavedMealCard'
import EditSavedMealDialog from '@/components/saved-meals/EditSavedMealDialog'
import SelectMealSlotDialog from '@/components/daily/SelectMealSlotDialog'
import { useSavedMeals } from '@/hooks/useSavedMeals'
import type { SavedMeal } from '@/hooks/useSavedMeals'

export default function SavedMealsPage() {
  const { t } = useTranslation('recipes')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectSlotDialogOpen, setSelectSlotDialogOpen] = useState(false)
  const [selectedMealForUse, setSelectedMealForUse] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<SavedMeal | null>(null)

  const { data: savedMeals, isLoading } = useSavedMeals()

  // Filter saved meals by search query
  const filteredMeals = useMemo(() => {
    if (!savedMeals) return []
    if (!searchQuery.trim()) return savedMeals

    const query = searchQuery.toLowerCase()
    return savedMeals.filter(meal => meal.name.toLowerCase().includes(query))
  }, [savedMeals, searchQuery])

  // Sort by last used date (most recent first), then alphabetically
  const sortedMeals = useMemo(() => {
    return [...filteredMeals].sort((a, b) => {
      // Sort by last_used_at (most recent first)
      if (a.last_used_at && b.last_used_at) {
        return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
      }
      if (a.last_used_at) return -1
      if (b.last_used_at) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name, 'sv-SE')
    })
  }, [filteredMeals])

  const handleUseToday = (mealId: string) => {
    const meal = savedMeals?.find(m => m.id === mealId)
    if (meal) {
      setSelectedMealForUse({ id: meal.id, name: meal.name })
      setSelectSlotDialogOpen(true)
    }
  }

  const handleEdit = (mealId: string) => {
    const meal = savedMeals?.find(m => m.id === mealId)
    if (meal) {
      setSelectedMealForEdit(meal)
      setEditDialogOpen(true)
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <Bookmark className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            {t('savedMeals.title')}
          </h1>
          <p className="text-sm md:text-base text-neutral-600">
            {t('savedMeals.subtitle')}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder={t('savedMeals.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Saved Meals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : sortedMeals.length === 0 ? (
        <EmptyState
          icon={searchQuery ? Search : Bookmark}
          title={searchQuery ? t('savedMeals.emptyTitleSearch') : t('savedMeals.emptyTitle')}
          description={
            searchQuery
              ? t('savedMeals.emptyDescriptionSearch')
              : t('savedMeals.emptyDescription')
          }
          action={
            searchQuery
              ? undefined
              : {
                  label: t('savedMeals.goToLog'),
                  onClick: () => (window.location.href = '/app/today'),
                }
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedMeals.map(meal => (
            <SavedMealCard
              key={meal.id}
              meal={meal}
              onUseToday={handleUseToday}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Quick Tips */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
          <CardHeader>
            <CardTitle className="text-lg">💡 {t('savedMeals.tipsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700">
            <p>• {t('savedMeals.tip1')}</p>
            <p>• {t('savedMeals.tip2')}</p>
            <p>• {t('savedMeals.tip3')}</p>
            <p>• {t('savedMeals.tip4')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200">
          <CardHeader>
            <CardTitle className="text-lg">📋 {t('savedMeals.differenceTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700">
            <p>
              <span className="font-semibold">{t('savedMeals.recipeExplain')}</span> {t('savedMeals.recipeExplainText')}
            </p>
            <p>
              <span className="font-semibold">{t('savedMeals.savedMealExplain')}</span> {t('savedMeals.savedMealExplainText')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Select Meal Slot Dialog */}
      {selectedMealForUse && (
        <SelectMealSlotDialog
          open={selectSlotDialogOpen}
          onOpenChange={setSelectSlotDialogOpen}
          savedMealId={selectedMealForUse.id}
          savedMealName={selectedMealForUse.name}
        />
      )}

      {/* Edit Saved Meal Dialog */}
      {selectedMealForEdit && (
        <EditSavedMealDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          meal={selectedMealForEdit}
        />
      )}
    </DashboardLayout>
  )
}
