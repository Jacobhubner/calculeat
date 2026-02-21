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
  const count = affectedRecipes.length
  const isDelete = mode === 'delete'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isDelete ? 'text-red-500' : 'text-amber-500'}`} />
            {isDelete
              ? `Livsmedlet används i ${count} recept`
              : `Ändringen påverkar ${count} recept`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-neutral-600">
            {isDelete ? (
              <>
                <span className="font-medium">{foodItemName}</span> används i nedanstående recept.
                Om du raderar livsmedlet kommer dessa recept att visa en saknad ingrediens.
              </>
            ) : (
              <>
                Ändringen av <span className="font-medium">{foodItemName}</span> påverkar
                beräkningarna i nedanstående recept. Recepten uppdateras automatiskt när du sparar.
              </>
            )}
          </p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-neutral-200 p-2">
            {affectedRecipes.map(recipe => (
              <div
                key={recipe.recipe_id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-neutral-50"
              >
                <ChefHat className="h-4 w-4 text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-800 flex-1 truncate">
                  {recipe.recipe_name}
                </span>
                <span className="text-xs text-neutral-400 shrink-0">
                  {recipe.servings} port · {recipe.ingredient_count} ing.
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isConfirming}>
              Avbryt
            </Button>
            <Button
              variant={isDelete ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={isConfirming}
              className="gap-2"
            >
              {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDelete ? 'Radera ändå' : 'Spara ändå'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
