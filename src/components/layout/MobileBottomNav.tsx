import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Calendar, Apple, History, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MobileBottomNav() {
  const { t } = useTranslation('common')
  const location = useLocation()

  const navItems = [
    // CORE ITEMS — Daily use only
    { to: '/app', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/app/today', label: t('nav.today'), icon: Calendar },
    { to: '/app/history', label: t('nav.history'), icon: History },
    { to: '/app/food-items', label: t('nav.food'), icon: Apple },
    { to: '/app/recipes', label: t('nav.recipes'), icon: ChefHat },
    // NOTE: Profile, Settings, TDEE, Goal, Body, Social, and Tools moved to avatar menu
  ] as const

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.to, 'exact' in item ? item.exact : undefined)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors flex-1 px-2',
                active ? 'text-primary-600' : 'text-neutral-400 active:text-neutral-600'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary-600')} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
