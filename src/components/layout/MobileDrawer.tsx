import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Apple,
  ChefHat,
  Bookmark,
  Calendar,
  History,
  Activity,
  Flame,
  Calculator,
  Target,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Separator } from '../ui/separator'

const navItems = [
  { to: '/app', label: 'Översikt', icon: LayoutDashboard, exact: true },
  { to: '/app/today', label: 'Dagens logg', icon: Calendar },
  { to: '/app/food-items', label: 'Livsmedel', icon: Apple },
  { to: '/app/recipes', label: 'Recept', icon: ChefHat },
  { to: '/app/saved-meals', label: 'Sparade måltider', icon: Bookmark },
  { to: '/app/history', label: 'Historik', icon: History },
  { to: '/app/profile', label: 'Profil', icon: User },
  { to: '/app/body-composition', label: 'Kroppssammansättning', icon: Activity },
  { to: '/app/tools/met-calculator', label: 'MET Aktivitetskalkylator', icon: Flame },
  { to: '/app/tools/tdee-calculator', label: 'TDEE & Kaloriuträknare', icon: Calculator },
  { to: '/app/tools/goal-calculator', label: 'Måluträknare', icon: Target },
]

export default function MobileDrawer() {
  const { user, profile, signOut } = useAuth()
  const { mobileDrawerOpen, setMobileDrawerOpen } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()

  const close = () => setMobileDrawerOpen(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const handleSignOut = async () => {
    close()
    try {
      await signOut()
      toast.success('Du har loggats ut')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error('Något gick fel vid utloggning')
      console.error('Sign out error:', error)
    }
  }

  const getInitials = () => {
    if (profile?.profile_name) {
      return profile.profile_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U'
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
                    {profile?.profile_name || 'Användare'}
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
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon
                const active = isActive(item.to, item.exact)
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
                    <span>{item.label}</span>
                  </Link>
                )
              })}
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
