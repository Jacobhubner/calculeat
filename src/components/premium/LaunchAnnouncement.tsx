import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'

/**
 * Engångsnotis vid premium-lanseringen (hard launch). Visas endast för:
 * - konton skapade FÖRE lanseringen (soft launch-testarna)
 * - efter att premium_enforcement flippats till 'on'
 * - användare på free-plan
 * Stängs permanent via localStorage (per användare). Nya konton efter
 * lanseringen ser den aldrig.
 */

const LAUNCH_DATE = '2026-07-18T00:00:00Z'

const dismissKey = (userId: string) => `calculeat-launch-notice-dismissed-${userId}`

/**
 * Om lanseringsnotisen fortfarande väntar på att stängas för en användare
 * (free-plan, konto före lanseringen, inte redan stängd) skulle den och
 * TermsUpdateAnnouncement annars kunna stapla två modaler direkt efter
 * varandra. Exporteras så den andra kan skjuta upp sig ett varv.
 */
export function isLaunchAnnouncementPending(userId: string, userCreatedAt: string | undefined) {
  if (!userCreatedAt || userCreatedAt >= LAUNCH_DATE) return false
  return !localStorage.getItem(dismissKey(userId))
}

export function LaunchAnnouncement() {
  const { t } = useTranslation('premium')
  const { user } = useAuth()
  const { plan, enforcement, isLoading } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || dismissed || !user) return null
  if (enforcement !== 'on' || plan !== 'free') return null
  if (!user.created_at || user.created_at >= LAUNCH_DATE) return null
  if (localStorage.getItem(dismissKey(user.id))) return null

  const dismiss = () => {
    localStorage.setItem(dismissKey(user.id), '1')
    setDismissed(true)
  }

  return (
    <Dialog open onOpenChange={open => !open && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t('launchNotice.title')}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line pt-2 text-left">
            {t('launchNotice.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              dismiss()
              openUpgradeModal()
            }}
          >
            {t('launchNotice.cta')}
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            {t('launchNotice.dismiss')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
