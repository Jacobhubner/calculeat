import { useState, useEffect } from 'react'
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
      toast.error('Måltiden måste ha ett namn')
      return
    }

    try {
      await updateMeal.mutateAsync({
        id: meal.id,
        name: trimmedName,
      })
      toast.success('Måltiden har döpts om')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating meal:', error)
      toast.error('Kunde inte uppdatera måltiden')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Byt namn på måltid</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-2">
            <Label htmlFor="meal-name">Namn</Label>
            <Input
              id="meal-name"
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              placeholder="T.ex. Frukost med gröt"
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMeal.isPending || !mealName.trim()}
          >
            {updateMeal.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sparar...
              </>
            ) : (
              'Spara'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
