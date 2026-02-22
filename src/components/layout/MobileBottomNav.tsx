import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Apple,
  History,
  ChefHat,
  Bookmark,
  User,
  Activity,
  Flame,
  Calculator,
  Target,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'

const navItems = [
  { to: '/app', label: 'Översikt', icon: LayoutDashboard, exact: true },
  { to: '/app/today', label: 'Idag', icon: Calendar },
  { to: '/app/food-items', label: 'Livsmedel', icon: Apple },
  { to: '/app/history', label: 'Historik', icon: History },
  { to: '/app/recipes', label: 'Recept', icon: ChefHat },
  { to: '/app/saved-meals', label: 'Måltider', icon: Bookmark },
  { to: '/app/social', label: 'Social', icon: Users },
  { to: '/app/profile', label: 'Profil', icon: User },
  { to: '/app/body-composition', label: 'Kropp', icon: Activity },
  { to: '/app/tools/met-calculator', label: 'MET', icon: Flame },
  { to: '/app/tools/tdee-calculator', label: 'TDEE', icon: Calculator },
  { to: '/app/tools/goal-calculator', label: 'Mål', icon: Target },
  { to: '/app/settings', label: 'Inställningar', icon: Settings },
] as const

// Persists across unmount/remount since each page wraps its own DashboardLayout
let persistedScrollLeft = 0

export default function MobileBottomNav() {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const leftFadeRef = useRef<HTMLDivElement>(null)
  const rightFadeRef = useRef<HTMLDivElement>(null)
  const socialBadgeCount = useSocialBadgeCount()

  const updateFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const canLeft = el.scrollLeft > 4
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    if (leftFadeRef.current) leftFadeRef.current.style.opacity = canLeft ? '1' : '0'
    if (rightFadeRef.current) rightFadeRef.current.style.opacity = canRight ? '1' : '0'
  }, [])

  // Restore scroll position on mount — try synchronously first,
  // then retry after layout in case children aren't measured yet
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || persistedScrollLeft === 0) return
    el.scrollLeft = persistedScrollLeft
    // Fallback: if the element wasn't wide enough yet, retry after frame
    if (el.scrollLeft !== persistedScrollLeft) {
      requestAnimationFrame(() => {
        el.scrollLeft = persistedScrollLeft
        updateFades()
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll position and update fades
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateFades()
    const onScroll = () => {
      persistedScrollLeft = el.scrollLeft
      updateFades()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [updateFades])

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="relative">
        {/* Left fade */}
        <div
          ref={leftFadeRef}
          className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white via-white/60 to-transparent z-10 pointer-events-none transition-opacity duration-150"
          style={{ opacity: 0 }}
        />
        {/* Right fade */}
        <div
          ref={rightFadeRef}
          className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white via-white/60 to-transparent z-10 pointer-events-none transition-opacity duration-150"
          style={{ opacity: 1 }}
        />
        <div ref={scrollRef} className="flex items-stretch h-16 overflow-x-auto scrollbar-hide">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.to, 'exact' in item ? item.exact : undefined)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-[4.25rem] px-2',
                  active ? 'text-primary-600' : 'text-neutral-400 active:text-neutral-600'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5', active && 'text-primary-600')} />
                  {item.to === '/app/social' && socialBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex items-center justify-center bg-primary-600 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 leading-none">
                      {socialBadgeCount > 99 ? '99+' : socialBadgeCount}
                    </span>
                  )}
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
