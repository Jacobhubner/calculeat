import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Apple, History, Menu } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app', label: 'Översikt', icon: LayoutDashboard, exact: true },
  { to: '/app/today', label: 'Idag', icon: Calendar },
  { to: '/app/food-items', label: 'Livsmedel', icon: Apple },
  { to: '/app/history', label: 'Historik', icon: History },
] as const

export default function MobileBottomNav() {
  const location = useLocation()
  const { toggleMobileDrawer } = useUIStore()

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-stretch h-16">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.to, item.exact)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0',
                active ? 'text-primary-600' : 'text-neutral-400 active:text-neutral-600'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary-600')} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={toggleMobileDrawer}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-neutral-400 active:text-neutral-600 min-w-0"
        >
          <Menu className="h-5 w-5" />
          <span>Meny</span>
        </button>
      </div>
    </nav>
  )
}
