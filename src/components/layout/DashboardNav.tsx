import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Apple,
  ChefHat,
  Bookmark,
  Calendar,
  History,
  Activity,
  Flame,
  Calculator,
  Target,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

interface NavItem {
  type: 'single'
  to: string
  label: string
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
  exact?: boolean
}

export default function DashboardNav() {
  const { t } = useTranslation('common')
  const { user, signOut, userProfile } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const socialBadgeCount = useSocialBadgeCount()

  const isActive = (path: string) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success(t('auth.loggedOut'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(t('auth.logoutError'))
      console.error('Sign out error:', error)
    }
  }

  // Organized navigation items by functional groups
  const navGroups: Record<string, { title: string; emoji: string; items: NavItem[] }> = {
    oversikt: {
      title: t('nav.sectionOverview'),
      emoji: '📍',
      items: [
        {
          type: 'single' as const,
          to: '/app',
          label: t('nav.dashboard'),
          icon: LayoutDashboard,
          exact: true,
        },
        {
          type: 'single' as const,
          to: '/app/today',
          label: t('nav.today'),
          icon: Calendar,
        },
        {
          type: 'single' as const,
          to: '/app/history',
          label: t('nav.history'),
          icon: History,
        },
      ],
    },
    planering: {
      title: t('nav.sectionPlanning'),
      emoji: '🍽️',
      items: [
        {
          type: 'single' as const,
          to: '/app/food-items',
          label: t('nav.food'),
          icon: Apple,
        },
        {
          type: 'single' as const,
          to: '/app/recipes',
          label: t('nav.recipes'),
          icon: ChefHat,
        },
        {
          type: 'single' as const,
          to: '/app/saved-meals',
          label: t('nav.savedMeals'),
          icon: Bookmark,
        },
      ],
    },
    social: {
      title: t('nav.sectionSocial'),
      emoji: '👥',
      items: [
        {
          type: 'single' as const,
          to: '/app/social',
          label: t('nav.social'),
          icon: Users,
          exact: true,
        },
      ],
    },
    profil: {
      title: t('nav.sectionProfile'),
      emoji: '👤',
      items: [
        {
          type: 'single' as const,
          to: '/app/profile',
          label: t('nav.profile'),
          icon: User,
        },
        {
          type: 'single' as const,
          to: '/app/body-composition',
          label: t('nav.body'),
          icon: Activity,
        },
      ],
    },
    verktyg: {
      title: t('nav.sectionTools'),
      emoji: '🧮',
      items: [
        {
          type: 'single' as const,
          to: '/app/tools/met-calculator',
          label: t('nav.met'),
          icon: Flame,
        },
        {
          type: 'single' as const,
          to: '/app/tools/tdee-calculator',
          label: t('nav.tdee'),
          icon: Calculator,
        },
        {
          type: 'single' as const,
          to: '/app/tools/goal-calculator',
          label: t('nav.goalCalc'),
          icon: Target,
        },
      ],
    },
  }

  const getInitials = () => {
    if (userProfile?.username) return userProfile.username.substring(0, 2).toUpperCase()
    return '...'
  }

  return (
    <aside
      className={cn(
        'hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* User Info */}
        <div className={cn('p-4', sidebarCollapsed && 'px-2')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-3',
              sidebarCollapsed && 'justify-center p-2'
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-sm">{getInitials()}</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {userProfile?.username ? `@${userProfile.username}` : '...'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {Object.entries(navGroups).map(([key, group], groupIndex) => (
            <div key={key} className={groupIndex > 0 ? 'mt-6' : ''}>
              {/* Section Header */}
              {!sidebarCollapsed && (
                <h3 className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <span>{group.emoji}</span>
                  <span>{group.title}</span>
                </h3>
              )}

              {/* Section Items */}
              <div className="space-y-1 mt-2">
                {group.items.map(item => {
                  const Icon = item.icon
                  const active = item.exact
                    ? isActive(item.to)
                    : location.pathname.startsWith(item.to)

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors relative group',
                        active
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-600')} />
                      {!sidebarCollapsed && (
                        <span className="flex-1 flex items-center gap-2">
                          {item.label}
                          {item.to === '/app/social' && socialBadgeCount > 0 && (
                            <span className="ml-auto text-xs bg-primary-600 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-5">
                              {socialBadgeCount > 99 ? '99+' : socialBadgeCount}
                            </span>
                          )}
                        </span>
                      )}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <Separator />

        {/* Bottom Actions */}
        <div className={cn('p-4 space-y-1', sidebarCollapsed && 'px-2')}>
          <Link
            to="/app/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors relative group',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t('nav.settings')}
              </div>
            )}
          </Link>

          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors relative group',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t('nav.logout')}
              </div>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span>{t('nav.hideMenu')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
