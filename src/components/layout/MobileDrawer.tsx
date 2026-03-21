import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Settings,
  LogOut,
  ChefHat,
  Bookmark,
  Activity,
  Flame,
  Calculator,
  Target,
  X,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'

// Secondary pages organized by functional groups
// (Primary pages Översikt, Idag, Livsmedel, Historik are in bottom nav)
const navGroups = {
  planering: {
    title: 'PLANERING',
    emoji: '🍽️',
    items: [
      { to: '/app/recipes', label: 'Recept', icon: ChefHat },
      { to: '/app/saved-meals', label: 'Sparade måltider', icon: Bookmark },
    ],
  },
  social: {
    title: 'SOCIAL',
    emoji: '👥',
    items: [{ to: '/app/social', label: 'Social', icon: Users }],
  },
  profil: {
    title: 'PROFIL',
    emoji: '👤',
    items: [
      { to: '/app/profile', label: 'Profil', icon: User },
      { to: '/app/body-composition', label: 'Kroppssammansättning', icon: Activity },
    ],
  },
  verktyg: {
    title: 'VERKTYG',
    emoji: '🧮',
    items: [
      { to: '/app/tools/met-calculator', label: 'MET Aktivitetskalkylator', icon: Flame },
      { to: '/app/tools/tdee-calculator', label: 'TDEE & Kaloriuträknare', icon: Calculator },
      { to: '/app/tools/goal-calculator', label: 'Måluträknare', icon: Target },
    ],
  },
}

export default function MobileDrawer() {
  const { t } = useTranslation('common')
  const { user, signOut, userProfile } = useAuth()
  const { mobileDrawerOpen, setMobileDrawerOpen } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const socialBadgeCount = useSocialBadgeCount()

  const close = () => setMobileDrawerOpen(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const handleSignOut = async () => {
    close()
    try {
      await signOut()
      toast.success(t('auth.loggedOut'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(t('auth.logoutError'))
      console.error('Sign out error:', error)
    }
  }

  const getInitials = () => {
    if (userProfile?.username) return userProfile.username.substring(0, 2).toUpperCase()
    return '...'
  }

  return (
    <AnimatePresence>
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 z-[60]"
            onClick={close}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.x > 100) close()
            }}
            className="md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {userProfile?.username ? `@${userProfile.username}` : '...'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3">
              {Object.entries(navGroups).map(([key, group], groupIndex) => (
                <div key={key} className={groupIndex > 0 ? 'mt-6' : ''}>
                  {/* Section Header */}
                  <h3 className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <span>{group.emoji}</span>
                    <span>{group.title}</span>
                  </h3>

                  {/* Section Items */}
                  <div className="space-y-0.5 mt-2">
                    {group.items.map(item => {
                      const Icon = item.icon
                      const active = isActive(item.to)
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={close}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                            active
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-neutral-600 active:bg-neutral-50'
                          )}
                        >
                          <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-600')} />
                          <span className="flex items-center gap-2">
                            {item.label}
                            {item.to === '/app/social' && socialBadgeCount > 0 && (
                              <span className="ml-auto text-xs bg-primary-600 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-5">
                                {socialBadgeCount > 99 ? '99+' : socialBadgeCount}
                              </span>
                            )}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <Separator />

            {/* Bottom Actions */}
            <div className="p-3 space-y-0.5">
              <Link
                to="/app/settings"
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-600 active:bg-neutral-50 transition-colors"
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span>Inställningar</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-error-600 active:bg-error-50 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Logga ut</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
