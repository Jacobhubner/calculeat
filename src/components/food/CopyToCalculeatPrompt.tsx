import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { type FoodItem, useCopyFoodItemToCalculeat } from '@/hooks/useFoodItems'

interface CopyToCalculeatPromptProps {
  /** Livsmedlet som just skapats, eller null när dialogen är stängd. */
  item: FoodItem | null
  onClose: () => void
}

/**
 * Admin-dialog: efter att ett nytt personligt livsmedel skapats, fråga om en
 * kopia även ska läggas i den globala Calculeat-listan. Delad mellan
 * Livsmedel-sidan och Dagens logg (AddFoodToMealModal). Anroparen ansvarar för
 * att bara sätta `item` när villkoren gäller (admin, nyskapat, ej preview).
 */
export function CopyToCalculeatPrompt({ item, onClose }: CopyToCalculeatPromptProps) {
  const { t } = useTranslation('food')
  const { mutateAsync: copyToCalculeat } = useCopyFoodItemToCalculeat()

  const handleConfirm = async () => {
    const target = item
    onClose()
    if (!target) return
    try {
      const result = await copyToCalculeat(target.id)
      if (result?.success) {
        toast.success(t('toast.copiedToCalculeat'))
      } else if (result?.error === 'already_exists') {
        toast.info(t('toast.alreadyInCalculeat'))
      } else {
        toast.error(t('toast.copyError'))
      }
    } catch {
      toast.error(t('toast.copyError'))
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('copyToCalculeatPrompt.title')}</DialogTitle>
          <DialogDescription>
            {t('copyToCalculeatPrompt.body', { name: item?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={onClose}>
            {t('copyToCalculeatPrompt.decline')}
          </Button>
          <Button onClick={handleConfirm}>{t('copyToCalculeatPrompt.confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
