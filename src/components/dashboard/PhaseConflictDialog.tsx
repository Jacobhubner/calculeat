import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { DietPhase } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Den pågående perioden som skulle avslutas */
  phase: DietPhase
  isPending?: boolean
  /** Avsluta perioden och skriv det nya målet */
  onConfirm: () => void
}

/**
 * Frågar innan ett nytt kalorimål avslutar den pågående perioden.
 *
 * Bakgrund: databastriggern speglar bara diet_phases → profiles, aldrig
 * tvärtom. Utan den här frågan kan Målsättning eller profilsidan skriva ett
 * mål som motsäger perioden, och de två divergerar tyst — dashboarden visar
 * en periodtyp medan kalibreringen räknar på en annan.
 *
 * Alternativen som valdes bort: låta perioden alltid vinna (gör
 * "Applicera på profil" verkningslös) eller avsluta perioden tyst (en period
 * försvinner utan att användaren förstår varför). Båda bryter mot
 * förväntan — frågan är billig eftersom den bara ställs vid faktisk krock.
 */
export function PhaseConflictDialog({ open, onOpenChange, phase, isPending, onConfirm }: Props) {
  const { t } = useTranslation('dashboard')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            {t('phase.conflict.title')}
          </DialogTitle>
          <DialogDescription>
            {t('phase.conflict.body', {
              phase: t(`phase.types.${phase.focus}.${phase.phase_type}`),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('phase.conflict.cancel')}
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={isPending}>
            {t('phase.conflict.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
