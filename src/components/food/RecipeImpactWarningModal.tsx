import { useTranslation } from 'react-i18next'
import { ChefHat, AlertTriangle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { RecipeImpact } from '@/hooks/useRecipeImpact'

interface RecipeImpactWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'delete' | 'update'
  foodItemName: string
  affectedRecipes: RecipeImpact[]
  onConfirm: () => void
  isConfirming: boolean
}

export function RecipeImpactWarningModal({
  open,
  onOpenChange,
  mode,
  foodItemName,
  affectedRecipes,
  onConfirm,
  isConfirming,
}: RecipeImpactWarningModalProps) {
  const { t } = useTranslation('recipes')
  const count = affectedRecipes.length
  const isDelete = mode === 'delete'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isDelete ? 'text-red-500' : 'text-amber-500'}`} />
            {isDelete
              ? t('recipeImpact.titleDelete_other', { count })
              : t('recipeImpact.titleUpdate_other', { count })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {isDelete ? (
              <>
                <span className="font-medium">{foodItemName}</span>{' '}
                {t('recipeImpact.deleteDescriptionSuffix')}
              </>
            ) : (
              <>
                {t('recipeImpact.updateDescriptionPrefix')}{' '}
                <span className="font-medium">{foodItemName}</span>{' '}
                {t('recipeImpact.updateDescriptionSuffix')}
              </>
            )}
          </p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-neutral-200 p-2 dark:border-neutral-700">
            {affectedRecipes.map(recipe => (
              <div
                key={recipe.recipe_id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-neutral-50 dark:bg-neutral-900"
              >
                <ChefHat className="h-4 w-4 text-neutral-400 shrink-0 dark:text-neutral-500" />
                <span className="text-sm text-neutral-800 flex-1 truncate dark:text-neutral-200">
                  {recipe.recipe_name}
                </span>
                {/* Officiella recept syns bara för admins — märk dem, en ändring
                    där slår mot receptbanken och alla användare. */}
                {recipe.is_official && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {t('recipeImpact.official')}
                  </span>
                )}
                <span className="text-xs text-neutral-400 shrink-0 dark:text-neutral-500">
                  {t('recipeImpact.servings', { count: recipe.servings })} ·{' '}
                  {t('recipeImpact.ingredients', { count: recipe.ingredient_count })}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isConfirming}>
              {t('recipeImpact.cancel')}
            </Button>
            <Button
              variant={isDelete ? 'destructive' : 'primary'}
              onClick={onConfirm}
              disabled={isConfirming}
              className="gap-2"
            >
              {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              {/* I update-läget har inget sparats än — knappen tar användaren
                  vidare till redigeraren, den bekräftar ingen ändring. */}
              {isDelete ? t('recipeImpact.deleteAnyway') : t('recipeImpact.continueToEdit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
