import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { SavedMeal } from '@/hooks/useSavedMeals'
import { useUpdateSavedMeal } from '@/hooks/useSavedMeals'
import { toast } from 'sonner'

interface EditSavedMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meal: SavedMeal
}

export default function EditSavedMealDialog({
  open,
  onOpenChange,
  meal,
}: EditSavedMealDialogProps) {
  const { t } = useTranslation('recipes')
  const [mealName, setMealName] = useState(meal.name)
  const updateMeal = useUpdateSavedMeal()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setMealName(meal.name)
    }
  }, [open, meal])

  const handleSave = async () => {
    const trimmedName = mealName.trim()
    if (!trimmedName) {
      toast.error(t('editMealDialog.errorEmpty'))
      return
    }

    try {
      await updateMeal.mutateAsync({
        id: meal.id,
        name: trimmedName,
      })
      toast.success(t('editMealDialog.successRenamed'))
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating meal:', error)
      toast.error(t('editMealDialog.updateError'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editMealDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-2">
            <Label htmlFor="meal-name">{t('editMealDialog.nameLabel')}</Label>
            <Input
              id="meal-name"
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              placeholder={t('editMealDialog.namePlaceholder')}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('editMealDialog.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMeal.isPending || !mealName.trim()}
          >
            {updateMeal.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('editMealDialog.saving')}
              </>
            ) : (
              t('editMealDialog.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
