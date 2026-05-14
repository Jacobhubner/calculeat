import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, LogOut, Users, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { useState, useEffect } from 'react'
import { SocialHub } from '@/components/social/SocialHub'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import type { Friend } from '@/lib/types/friends'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'

export default function SiteHeader() {
  const { t } = useTranslation('common')
  const { user, signOut, userProfile } = useAuth()
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore()

  const location = useLocation()
  const navigate = useNavigate()
  const [socialHubOpen, setSocialHubOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [sharePreselectedFriend, setSharePreselectedFriend] = useState<Friend | undefined>(
    undefined
  )
  const handleOpenShareDialog = (friend?: Friend) => {
    setSharePreselectedFriend(friend)
    setSocialHubOpen(false)
    setShareDialogOpen(true)
  }

  const badgeCount = useSocialBadgeCount()
  const { data: isAdmin = false } = useIsAdmin()

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

  const anchorLinks = location.pathname === '/' ? [{ href: '#features', label: 'Funktioner' }] : []

  const navLinks = [
    { to: '/kalkylatorer', label: 'Kalkylatorer' },
    { to: '/artiklar', label: 'Artiklar' },
  ]

  const isOnHomePage = location.pathname === '/'

  const getInitials = () => {
    if (userProfile?.username) return userProfile.username.substring(0, 2).toUpperCase()
    return '...'
  }

  // Scroll-lock + back navigation for social hub
  useEffect(() => {
    if (!socialHubOpen) return

    document.body.style.overflow = 'hidden'

    if (!window.history.state?.socialHub) {
      window.history.pushState({ socialHub: true }, '')
    }

    const handlePop = (e: PopStateEvent) => {
      if (e.state?.socialHub) {
        setSocialHubOpen(false)
      }
    }

    window.addEventListener('popstate', handlePop)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('popstate', handlePop)
    }
  }, [socialHubOpen])

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
            {!isOnHomePage && (
              <Link
                to="/"
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900"
              >
                Hem
              </Link>
            )}
            {anchorLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Desktop Social Hub trigger */}
              <div className="relative">
                <button
                  onClick={() => setSocialHubOpen(prev => !prev)}
                  className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Social"
                  title="Social"
                >
                  <Users className="h-5 w-5" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {socialHubOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSocialHubOpen(false)} />
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-[420px] max-h-[600px] bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 overflow-hidden flex flex-col"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SocialHub
                          onClose={() => setSocialHubOpen(false)}
                          onOpenShareDialog={handleOpenShareDialog}
                        />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/app" className="relative">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary-200 transition-all">
                  <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                  </span>
                )}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
              <LanguageSwitcher />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Only show when logged out */}
        {!user && (
          <div className="md:hidden flex items-center gap-1">
            <LanguageSwitcher />
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}

        {/* Mobile: Social + Avatar when logged in */}
        {user && (
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            {/* Mobile Social — navigera direkt till /app/social */}
            <Link
              to="/app/social"
              className="relative p-2 text-neutral-600 rounded-lg transition-colors"
              aria-label="Social"
            >
              <Users className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>

            <Link to="/app" className="relative">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent active:ring-primary-200 transition-all">
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              {isAdmin && (
                <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                </span>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navigation - Only show when logged out */}
      {mobileMenuOpen && !user && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {!isOnHomePage && (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50"
              >
                Hem
              </Link>
            )}
            {anchorLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50"
              >
                {link.label}
              </a>
            ))}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t mt-2 pt-2">
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.register')}
                  </Link>
                </Button>
                <div className="flex justify-center pt-1">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* ShareDialog — alltid monterad i headern */}
      {user && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={open => {
            setShareDialogOpen(open)
            if (!open) setSharePreselectedFriend(undefined)
          }}
          preselectedFriend={sharePreselectedFriend}
        />
      )}
    </header>
  )
}
