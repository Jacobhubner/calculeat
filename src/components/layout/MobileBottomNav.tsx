import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Calendar, Apple, ChefHat, type LucideIcon } from 'lucide-react'
import QuickLogButton from '@/components/daily/QuickLogButton'
import { cn } from '@/lib/utils'

export default function MobileBottomNav() {
  const { t } = useTranslation('common')
  const location = useLocation()

  // Två destinationer per sida om den upphöjda snabblogg-knappen i mitten.
  // Historik ligger i avatar-menyn — det är en vecko-/månadsvy, inte ett
  // dagligt behov, och den nås även från Översikt.
  const leftItems = [
    { to: '/app', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/app/today', label: t('nav.today'), icon: Calendar },
  ] as const

  const rightItems = [
    { to: '/app/food-items', label: t('nav.food'), icon: Apple },
    { to: '/app/recipes', label: t('nav.recipes'), icon: ChefHat },
  ] as const

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    // Sparade måltider är en flik i Mat-ytan — markera Livsmedel där, annars
    // skulle ingen knapp lysa när användaren står på den fliken.
    if (path === '/app/food-items' && location.pathname.startsWith('/app/saved-meals')) return true
    return location.pathname.startsWith(path)
  }

  const renderItem = (item: { to: string; label: string; icon: LucideIcon; exact?: boolean }) => {
    const Icon = item.icon
    const active = isActive(item.to, item.exact)
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
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch h-16">
        {leftItems.map(renderItem)}
        <QuickLogButton />
        {rightItems.map(renderItem)}
      </div>
    </nav>
  )
}
