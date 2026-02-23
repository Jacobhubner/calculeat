import { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import DashboardNav from './DashboardNav'
import MobileBottomNav from './MobileBottomNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DashboardLayoutProps {
  children: ReactNode
  fullHeight?: boolean
}

export default function DashboardLayout({ children, fullHeight }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore()
  const { isEmailVerified, user } = useAuth()

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
    <div
      className={cn('flex flex-col overflow-x-hidden', fullHeight ? 'h-screen' : 'min-h-screen')}
    >
      <SiteHeader />
      {!isEmailVerified && user && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between gap-4">
          <span>Verifiera din e-postadress för att säkra ditt konto.</span>
          <button
            onClick={handleResend}
            className="shrink-0 text-xs font-medium underline hover:no-underline"
          >
            Skicka om mejl
          </button>
        </div>
      )}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DashboardNav />
        <main
          className={cn(
            'flex-1 min-w-0 transition-all duration-300 pt-16 pb-20 md:pb-0',
            fullHeight && 'flex flex-col min-h-0 overflow-hidden',
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          )}
        >
          {fullHeight ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
          ) : (
            <div className="mx-auto px-3 py-4 md:px-4 md:py-8 lg:px-8 max-w-[1600px]">
              {children}
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
