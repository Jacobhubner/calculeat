import { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import DashboardNav from './DashboardNav'
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
            'flex-1 transition-all duration-300 pt-16',
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          )}
        >
          <div className="mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
