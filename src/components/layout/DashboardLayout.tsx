import { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import DashboardNav from './DashboardNav'
import MobileBottomNav from './MobileBottomNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  fullHeight?: boolean
}

export default function DashboardLayout({ children, fullHeight }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div
      className={cn('flex flex-col overflow-x-hidden', fullHeight ? 'h-screen' : 'min-h-screen')}
    >
      <SiteHeader />
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
