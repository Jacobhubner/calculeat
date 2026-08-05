import { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import { LaunchAnnouncement } from '@/components/premium/LaunchAnnouncement'
import { TermsUpdateAnnouncement } from '@/components/legal/TermsUpdateAnnouncement'
import DashboardNav from './DashboardNav'
import MobileBottomNav from './MobileBottomNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { usePreviewMode } from '@/hooks/usePreviewMode'
import { SupportChatButton } from '@/components/support/SupportChatButton'
import { useSupportAdminUnreadCount } from '@/hooks/useSupportChat'
import { useFoodHubTabs } from './foodHubTabs'

interface DashboardLayoutProps {
  children: ReactNode
  fullHeight?: boolean
}

export default function DashboardLayout({ children, fullHeight }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore()
  const { isEmailVerified, user, isPreviewMode } = useAuth()
  const { exitPreview } = usePreviewMode()
  const foodHubTabs = useFoodHubTabs()
  useSupportAdminUnreadCount() // aktiverar realtime-kanal för admin-inbox

  const handleResend = async () => {
    if (!user?.email) return
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
    if (error) {
      toast.error('Kunde inte skicka mejlet. Försök igen.')
    } else {
      toast.success('Verifieringsmejl skickat!')
    }
  }

  return (
    <div className={cn('flex flex-col', fullHeight ? 'h-screen' : 'min-h-screen')}>
      {/* Engångsnotis till soft launch-testare efter premium-flippen */}
      <LaunchAnnouncement />
      {/* Notis vid ändrade användarvillkor — se komponentens egen kommentar */}
      <TermsUpdateAnnouncement />
      {/* z-60, inte z-50: avatarmenyn hänger ut ur headern och kan nå ner till
          skärmens botten, där MobileBottomNav ligger på z-50. Vid samma nivå
          vinner det element som kommer senare i DOM:en — bottennavigeringen —
          och den täckte menyns nedersta rad (språkväljaren). Menyns egen z-50
          räcker inte, eftersom den sitter fast inuti den här stackningskontexten. */}
      <div className="sticky top-0 z-60">
        <SiteHeader />
        {isPreviewMode && (
          <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-sm text-amber-800 flex items-center justify-between gap-4 dark:bg-amber-900/25 dark:border-amber-800 dark:text-amber-200">
            <span className="font-medium">🔍 Förhandsvisning — ny användare</span>
            <button
              onClick={() => exitPreview.mutate()}
              disabled={exitPreview.isPending}
              className="shrink-0 text-xs font-semibold underline hover:no-underline disabled:opacity-50"
            >
              {exitPreview.isPending ? 'Avslutar…' : 'Avsluta preview'}
            </button>
          </div>
        )}
        {!isEmailVerified && user && !isPreviewMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between gap-4 dark:bg-amber-900/25 dark:border-amber-800 dark:text-amber-200">
            <span>Verifiera din e-postadress för att säkra ditt konto.</span>
            <button
              onClick={handleResend}
              className="shrink-0 text-xs font-medium underline hover:no-underline"
            >
              Skicka om mejl
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-1 min-h-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-850 dark:to-neutral-900">
        <DashboardNav />
        <main
          className={cn(
            'flex-1 min-w-0 transition-all duration-300 pt-16 pb-20 md:pb-0',
            fullHeight && 'flex flex-col min-h-0 overflow-hidden',
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          )}
        >
          {fullHeight ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {foodHubTabs}
              {children}
            </div>
          ) : (
            <div className="mx-auto px-3 py-4 md:px-4 md:py-8 lg:px-8 max-w-[1600px] overflow-x-hidden">
              {foodHubTabs}
              {children}
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
      <SupportChatButton />
    </div>
  )
}
