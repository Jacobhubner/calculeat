import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { tourAttr, type TourGroupKey } from '@/lib/constants/tourTargets'
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
  Users,
  BookOpen,
  Crosshair,
  Gauge,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { PlanBadge } from '@/components/premium/PlanBadge'
import { Separator } from '../ui/separator'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'
import { useIsAdmin } from '@/hooks/useAdminManagement'
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
  const { t, i18n } = useTranslation('common')
  const isEn = i18n.language?.startsWith('en')
  const calculatorsPath = isEn ? '/en/calculators' : '/kalkylatorer'
  const articlesPath = isEn ? '/en/articles' : '/artiklar'
  const { user, signOut, userProfile } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const socialBadgeCount = useSocialBadgeCount()
  const { data: isAdmin = false } = useIsAdmin()

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

  // Nycklarna är typade mot TourGroupKey — onboarding-tourens spotlight pekar
  // på dem via data-tour, så ett namnbyte här ska bli ett kompileringsfel.
  const navGroups: Record<TourGroupKey, { title: string; emoji: string; items: NavItem[] }> = {
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
        { type: 'single' as const, to: '/app/today', label: t('nav.today'), icon: Calendar },
        { type: 'single' as const, to: '/app/history', label: t('nav.history'), icon: History },
      ],
    },
    planering: {
      title: t('nav.sectionPlanning'),
      emoji: '🍽️',
      items: [
        { type: 'single' as const, to: '/app/food-items', label: t('nav.food'), icon: Apple },
        { type: 'single' as const, to: '/app/recipes', label: t('nav.recipes'), icon: ChefHat },
        {
          type: 'single' as const,
          to: '/app/saved-meals',
          label: t('nav.savedMeals'),
          icon: Bookmark,
        },
      ],
    },
    minplan: {
      title: t('nav.sectionMyPlan'),
      emoji: '🎯',
      items: [
        { type: 'single' as const, to: '/app/profile', label: t('nav.profile'), icon: User },
        {
          type: 'single' as const,
          to: '/app/tools/tdee-calculator',
          label: t('nav.calorieNeed'),
          icon: Gauge,
        },
        {
          type: 'single' as const,
          to: '/app/body-composition',
          label: t('nav.body'),
          icon: Activity,
        },
        {
          type: 'single' as const,
          to: '/app/tools/goal-calculator',
          label: t('nav.goalSetting'),
          icon: Crosshair,
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
  }

  const discreteLinks = [
    { to: '/app/tools/met-calculator', label: t('nav.met'), icon: Flame },
    { to: calculatorsPath, label: t('nav.freeTools'), icon: Calculator },
    { to: articlesPath, label: t('nav.articlesHub'), icon: BookOpen },
  ]

  const getInitials = () => {
    if (userProfile?.username) return userProfile.username.substring(0, 2).toUpperCase()
    return '...'
  }

  return (
    <aside
      className={cn(
        'hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-neutral-200 bg-gradient-to-b from-white via-neutral-50 to-white transition-all duration-300 z-40',
        'dark:border-neutral-700 dark:from-neutral-850 dark:via-neutral-900 dark:to-neutral-850',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* User Info */}
        <div className={cn('p-4', sidebarCollapsed && 'px-2')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-3',
              'dark:from-primary-900/30 dark:to-accent-900/20',
              sidebarCollapsed && 'justify-center p-2'
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-sm">{getInitials()}</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                  {userProfile?.username ? `@${userProfile.username}` : '...'}
                </p>
                <p className="text-xs text-neutral-500 truncate dark:text-neutral-400">
                  {user?.email}
                </p>
                <PlanBadge className="mt-1" />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {Object.entries(navGroups).map(([key, group], groupIndex) => (
            <div
              key={key}
              className={groupIndex > 0 ? 'mt-6' : ''}
              data-tour={tourAttr(key as TourGroupKey)}
            >
              {!sidebarCollapsed && (
                <h3 className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2 dark:text-neutral-400">
                  <span>{group.emoji}</span>
                  <span>{group.title}</span>
                </h3>
              )}
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
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative group',
                        active
                          ? 'bg-primary-100/60 text-primary-700 shadow-sm dark:bg-primary-900/40 dark:text-primary-300'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          active && 'text-primary-600 dark:text-primary-300'
                        )}
                      />
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
                        <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Diskreta resurslänkar — tonade, utanför kärnnavigationen */}
          <div className="mt-6 pt-4 border-t border-neutral-100 space-y-1 dark:border-neutral-700">
            {discreteLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors relative group',
                  'dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                    {label}
                  </div>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => navigate({ search: '?support=open' })}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors relative group',
                'dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{t('nav.support')}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                  {t('nav.support')}
                </div>
              )}
            </button>
          </div>
        </nav>

        <Separator />

        {/* Bottom Actions */}
        <div className={cn('p-4 space-y-1', sidebarCollapsed && 'px-2')}>
          {/* Adminverktygen samlade — ligger ovanför Inställningar eftersom
              det är dit en admin går oftare. Döljs helt för vanliga användare. */}
          {isAdmin && (
            <Link
              to="/app/admin"
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors relative group dark:text-neutral-100',
                'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <ShieldCheck className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{t('nav.admins')}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                  {t('nav.admins')}
                </div>
              )}
            </Link>
          )}

          <Link
            to="/app/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors relative group dark:text-neutral-100',
              'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                {t('nav.settings')}
              </div>
            )}
          </Link>

          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors relative group',
              'dark:text-error-400 dark:hover:bg-error-900/25',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-neutral-100 dark:text-neutral-900">
                {t('nav.logout')}
              </div>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors',
              'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
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
