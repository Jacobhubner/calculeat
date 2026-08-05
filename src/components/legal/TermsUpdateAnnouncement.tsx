import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Notis om ändrade användarvillkor — GDPR/konsumenträtt §9 i villkoren kräver
 * att väsentliga ändringar meddelas i appen minst 30 dagar innan de träder i
 * kraft, och att fortsatt användning efter det räknas som godkännande.
 *
 * Generell, återanvändbar mekanism i stället för LaunchAnnouncements
 * engångslösning: lägg till en post i CHANGES vid varje ändring i villkoren,
 * så visas notisen automatiskt för konton skapade före det datumet. Nya
 * konton godkänner alltid den aktuella versionen vid registrering och ser
 * den aldrig.
 *
 * Stängs permanent per version och användare via localStorage — ändras
 * villkoren igen visas en ny notis även om en tidigare redan stängts.
 *
 * Ordning mot LaunchAnnouncement: den kollades tidigare löpande via
 * isLaunchAnnouncementPending(), vilket blockerade permanent — en kund som
 * aldrig stängde lanseringsmodalen (t.ex. lämnade fliken utan att klicka)
 * fick aldrig se villkorsnotisen alls, gång efter gång. DashboardLayout
 * skickar nu in en onLaunchDismiss-callback som talar om när lanseringsmodalen
 * faktiskt stängs, så den här visas direkt efteråt i samma inloggning i
 * stället för att gissa via en tidsgräns.
 */

/** Nycklarna under legal:termsUpdate.changes — lägg till nya här när sv/legal.json växer. */
type TermsChangeKey = 'harassment'

interface TermsChange {
  /** Datum ändringen publicerades, YYYY-MM-DD. Även dismiss-nyckeln. */
  date: string
  summaryKey: TermsChangeKey
}

// Senaste ändringen sist. Bara den nyaste posten kunden inte redan stängt visas.
const CHANGES: TermsChange[] = [{ date: '2026-08-03', summaryKey: 'harassment' }]

const dismissKey = (userId: string, date: string) =>
  `calculeat-terms-update-dismissed-${userId}-${date}`

interface TermsUpdateAnnouncementProps {
  /**
   * True medan en LaunchAnnouncement väntar på att stängas av samma kund.
   * Håller villkorsnotisen borta tills dess, i stället för att riskera att
   * aldrig visas om lanseringsmodalen aldrig stängs aktivt.
   */
  waitingFor?: boolean
}

export function TermsUpdateAnnouncement({ waitingFor = false }: TermsUpdateAnnouncementProps) {
  const { t } = useTranslation('legal')
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isEn = pathname.startsWith('/en/')
  const termsPath = isEn ? '/en/terms' : '/villkor'
  const [dismissedNow, setDismissedNow] = useState<string | null>(null)

  const latest = CHANGES[CHANGES.length - 1]

  if (!user || !latest || waitingFor) return null
  // Konton skapade efter ändringsdatumet godkände redan den aktuella
  // versionen vid registrering — de har inget att bli notifierade om.
  if (!user.created_at || user.created_at >= `${latest.date}T00:00:00Z`) return null
  if (dismissedNow === latest.date) return null
  if (localStorage.getItem(dismissKey(user.id, latest.date))) return null

  const dismiss = () => {
    localStorage.setItem(dismissKey(user.id, latest.date), '1')
    setDismissedNow(latest.date)
  }

  return (
    <Dialog open onOpenChange={open => !open && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText
              className="h-5 w-5 text-primary-600 dark:text-primary-300"
              aria-hidden="true"
            />
            {t('termsUpdate.title')}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line pt-2 text-left">
            {/* summaryKey är begränsad till TermsChangeKey (i dagsläget bara
                'harassment'), så den fasta nyckeln nedan speglar hela
                unionen — TypeScript flaggar det om sv/legal.json och
                CHANGES-listan glider isär. */}
            {t(`termsUpdate.changes.${latest.summaryKey}` as 'termsUpdate.changes.harassment')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button asChild>
            <a href={termsPath} target="_blank" rel="noopener noreferrer" onClick={dismiss}>
              {t('termsUpdate.cta')}
            </a>
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            {t('termsUpdate.dismiss')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
