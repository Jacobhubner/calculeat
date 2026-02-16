import { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import DashboardNav from './DashboardNav'
import MobileBottomNav from './MobileBottomNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <DashboardNav />
        <main
          className={cn(
            'flex-1 transition-all duration-300 pt-16 pb-20 md:pb-0',
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
          )}
        >
          <div className="mx-auto px-3 py-4 md:px-4 md:py-8 lg:px-8 max-w-[1600px]">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
