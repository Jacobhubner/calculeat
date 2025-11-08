import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell as DumbbellIcon,
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Separator } from '../ui/separator'

export default function DashboardNav() {
  const { user, profile, signOut } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    {
      to: '/app',
      label: 'Översikt',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/app/today',
      label: 'Dagens logg',
      icon: Calendar,
    },
    {
      to: '/app/food-items',
      label: 'Matvaror',
      icon: Apple,
    },
    {
      to: '/app/recipes',
      label: 'Recept',
      icon: ChefHat,
    },
    {
      to: '/app/saved-meals',
      label: 'Sparade måltider',
      icon: Bookmark,
    },
    {
      to: '/app/history',
      label: 'Historik',
      icon: History,
    },
    {
      to: '/app/workouts',
      label: 'Träning',
      icon: DumbbellIcon,
      badge: 'Kommer snart',
    },
    {
      to: '/app/profile',
      label: 'Profil',
      icon: User,
    },
  ]

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U'
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300 z-40',
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
                  {profile?.full_name || 'Användare'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = item.exact ? isActive(item.to) : location.pathname.startsWith(item.to)

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
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
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
            {!sidebarCollapsed && <span>Inställningar</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Inställningar
              </div>
            )}
          </Link>

          <button
            onClick={() => signOut()}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors relative group',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>Logga ut</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logga ut
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
                <span>Göm meny</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
