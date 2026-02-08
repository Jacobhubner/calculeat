import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { useProfileStore } from '@/stores/profileStore'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

export default function SiteHeader() {
  const { user, signOut, profile } = useAuth()
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Du har loggats ut')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error('Något gick fel vid utloggning')
      console.error('Sign out error:', error)
    }
  }

  const navLinks = [
    { to: '/', label: 'Hem' },
    { to: '/features', label: 'Funktioner' },
  ]

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

  // Close mobile user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setMobileUserMenuOpen(false)
      }
    }

    if (mobileUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileUserMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 bg-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to={user ? '/app' : '/'} className="flex items-center group">
          <img
            src="/CalculEat-logo.svg"
            alt="CalculEat Logo"
            className="h-10 object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation - Only show marketing links when logged out */}
        {!user && (
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'text-sm font-medium transition-colors relative',
                  isActive(link.to) ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        )}

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {activeProfile && (
                <Link
                  to="/app/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
                  title="Aktivt profilkort"
                >
                  <User className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    {activeProfile.profile_name}
                  </span>
                </Link>
              )}
              <Link to="/app">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary-200 transition-all">
                  <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Logga in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Skapa konto</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Only show when logged out */}
        {!user && (
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}

        {/* Mobile Avatar & Dropdown - Show when logged in */}
        {user && (
          <div className="md:hidden relative" ref={userMenuRef}>
            <button
              onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
              className="focus:outline-none"
            >
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent active:ring-primary-200 transition-all">
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
            </button>

            {/* Mobile User Dropdown Menu */}
            <AnimatePresence>
              {mobileUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {profile?.profile_name || 'Användare'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/app/profile"
                      onClick={() => setMobileUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                    <Link
                      to="/app/settings"
                      onClick={() => setMobileUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Inställningar</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-neutral-100 py-1">
                    <button
                      onClick={() => {
                        setMobileUserMenuOpen(false)
                        handleSignOut()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logga ut</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile Navigation - Only show when logged out */}
      {mobileMenuOpen && !user && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-50'
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t mt-2 pt-2">
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Logga in
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    Skapa konto
                  </Link>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
