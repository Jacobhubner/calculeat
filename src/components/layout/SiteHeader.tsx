import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Users,
  ShieldCheck,
  Activity,
  Gauge,
  Crosshair,
  BookOpen,
  MessageCircle,
  Flame,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { PlanBadge } from '@/components/premium/PlanBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { useState, useRef, useEffect } from 'react'
import { SocialHub } from '@/components/social/SocialHub'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import { useSocialBadgeCount } from '@/hooks/useShareInvitations'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import type { Friend } from '@/lib/types/friends'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { ThemeToggle } from '../ui/ThemeToggle'
import { AppearanceControls } from '../ui/AppearanceControls'
import { cn } from '@/lib/utils'
import { Logo } from '../ui/Logo'

export default function SiteHeader() {
  const { t, i18n } = useTranslation('common')
  const { user: authUser, signOut, userProfile } = useAuth()
  // Anonyma gästsessioner (supportchatt) ska se headern som utloggade —
  // annars visas "Logga ut"/tom avatar och /app-länkar som gästen inte får nå
  const user = authUser && !authUser.is_anonymous ? authUser : null
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore()

  const location = useLocation()
  const navigate = useNavigate()
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const [socialHubOpen, setSocialHubOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const socialHubRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socialHubOpen) return
    const handler = (e: MouseEvent) => {
      if (socialHubRef.current && !socialHubRef.current.contains(e.target as Node)) {
        setSocialHubOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [socialHubOpen])
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

  const isEnPath = location.pathname.startsWith('/en/')
  const isEn = isEnPath || i18n.language?.startsWith('en')
  const loc = (sv: string, en: string) => (isEn ? en : sv)

  const anchorLinks =
    location.pathname === '/' ? [{ href: '#features', label: t('nav.features') }] : []

  const navLinks = [
    { to: loc('/kalkylatorer', '/en/calculators'), label: t('nav.calculators') },
    { to: loc('/artiklar', '/en/articles'), label: t('nav.articles') },
  ]

  const isOnHomePage = location.pathname === '/'

  const isActive = (path: string) => location.pathname === path

  // Delade klasser för mobilmenyns länkar — py-3 ger 44px tap-target (Apple HIG)
  const menuItemClass = (path?: string) =>
    cn(
      'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
      path && isActive(path)
        ? 'bg-primary-100 text-primary-700 font-medium dark:bg-primary-900/40 dark:text-primary-300'
        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
    )

  const getInitials = () => {
    if (userProfile?.username) return userProfile.username.substring(0, 2).toUpperCase()
    return '...'
  }

  // Close mobile user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setMobileUserMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileUserMenuOpen(false)
      }
    }
    if (mobileUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [mobileUserMenuOpen])

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
    <header className="w-full border-b bg-white/95 bg-blur shadow-sm dark:bg-neutral-850/95 dark:border-neutral-700">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to={user ? '/app' : '/'} className="flex items-center group">
          <Logo
            style={{ minHeight: '4rem' }}
            className="h-8 object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation - Only show marketing links when logged out */}
        {!user && (
          <nav className="hidden md:flex items-center gap-6">
            {!isOnHomePage && (
              <Link
                to="/"
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                {t('nav.home')}
              </Link>
            )}
            {anchorLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                {link.label}
              </a>
            ))}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium transition-colors text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
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
              <div className="relative" ref={socialHubRef}>
                <button
                  onClick={() => setSocialHubOpen(prev => !prev)}
                  className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
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
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-[420px] max-h-[600px] bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 overflow-hidden flex flex-col dark:bg-neutral-850 dark:border-neutral-700"
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
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 dark:bg-neutral-850">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  </span>
                )}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
              {/* Desktop saknar avatarmeny — avataren länkar rakt till /app —
                  så tema och språk stannar i headern här. Utrymmet finns, till
                  skillnad från i mobilheadern. */}
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Temaväxlaren finns annars bara i inställningarna, bakom
                  inloggning — en besökare med mörkt OS hade ingen väg ur. */}
              <ThemeToggle />
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
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-300 dark:hover:text-neutral-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}

        {/* Mobile: Social + Avatar when logged in */}
        {user && (
          <div className="md:hidden flex items-center gap-1 sm:gap-2">
            {/* Plan-chip — i mobilen finns ingen sidebar, så planen visas här */}
            <PlanBadge />

            {/* Social — egen knapp med badge. En inkorg som kräver att man
                öppnar en meny för att se att något hänt fungerar inte som
                inkorg; notisen ska synas direkt i headern. */}
            <Link
              to="/app/social"
              aria-label={
                badgeCount > 0 ? t('nav.socialWithCount', { count: badgeCount }) : t('nav.social')
              }
              className={cn(
                'relative flex items-center justify-center h-10 w-10 rounded-lg transition-colors',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
                isActive('/app/social')
                  ? 'text-primary-600 bg-primary-50 dark:text-primary-300 dark:bg-primary-900/40'
                  : 'text-neutral-600 active:bg-neutral-100 dark:text-neutral-300 dark:active:bg-neutral-800'
              )}
            >
              <Users className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none ring-2 ring-white dark:ring-neutral-850">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                className="relative flex items-center gap-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
                aria-haspopup="menu"
                aria-expanded={mobileUserMenuOpen}
                aria-label={t('nav.openMenu')}
              >
                <span className="relative">
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent active:ring-primary-200 transition-all">
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 dark:bg-neutral-850">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-neutral-400 transition-transform',
                    mobileUserMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {mobileUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 dark:bg-neutral-850 dark:border-neutral-700"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                      <p className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                        {userProfile?.username ? `@${userProfile.username}` : '...'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate dark:text-neutral-400">
                        {user.email}
                      </p>
                    </div>

                    {/* MY PLAN — Historik och Sparade måltider ligger inte här:
                        Historik finns i bottennavigeringen, Sparade måltider är
                        en flik i Mat-ytan. Menyn ska inte dubblera dem. */}
                    <div className="py-2 px-4">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                        {t('nav.myPlan')}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/app/profile"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/profile')}
                      >
                        <User className="h-4 w-4" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                      <Link
                        to="/app/tools/tdee-calculator"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/tools/tdee-calculator')}
                      >
                        <Gauge className="h-4 w-4" />
                        <span>{t('nav.calorieNeed')}</span>
                      </Link>
                      <Link
                        to="/app/body-composition"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/body-composition')}
                      >
                        <Activity className="h-4 w-4" />
                        <span>{t('nav.body')}</span>
                      </Link>
                      <Link
                        to="/app/tools/goal-calculator"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/tools/goal-calculator')}
                      >
                        <Crosshair className="h-4 w-4" />
                        <span>{t('nav.goalSetting')}</span>
                      </Link>
                    </div>

                    {/* VERKTYG & RESURSER — Social ligger som egen knapp i
                        headern, inte här, så notisen syns utan att menyn öppnas. */}
                    <div className="border-t border-neutral-100 py-2 px-4 dark:border-neutral-700">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                        {t('nav.explore')}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/app/tools/met-calculator"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/tools/met-calculator')}
                      >
                        <Flame className="h-4 w-4" />
                        <span>{t('nav.met')}</span>
                      </Link>
                      <Link
                        to={loc('/kalkylatorer', '/en/calculators')}
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass()}
                      >
                        <Gauge className="h-4 w-4" />
                        <span>{t('nav.freeTools')}</span>
                      </Link>
                      <Link
                        to={loc('/artiklar', '/en/articles')}
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass()}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>{t('nav.articlesHub')}</span>
                      </Link>
                    </div>

                    {/* ACCOUNT */}
                    <div className="border-t border-neutral-100 py-2 px-4 dark:border-neutral-700">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                        {t('nav.account')}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/app/settings"
                        role="menuitem"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className={menuItemClass('/app/settings')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>{t('nav.settings')}</span>
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMobileUserMenuOpen(false)
                          navigate({ search: '?support=open' })
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{t('nav.support')}</span>
                      </button>
                    </div>

                    {/* Tema + språk. Låg tidigare som permanenta ikoner i
                        mobilheadern — dyr yta för val man gör en gång. */}
                    <div className="border-t border-neutral-100 dark:border-neutral-700">
                      <AppearanceControls onNavigate={() => setMobileUserMenuOpen(false)} />
                    </div>

                    <div className="border-t border-neutral-100 py-1 dark:border-neutral-700">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMobileUserMenuOpen(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error-600 hover:bg-error-50 transition-colors dark:text-error-400 dark:hover:bg-error-900/25"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation - Only show when logged out */}
      {mobileMenuOpen && !user && (
        <div className="md:hidden border-t bg-white dark:bg-neutral-850 dark:border-neutral-700">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {!isOnHomePage && (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t('nav.home')}
              </Link>
            )}
            {anchorLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {link.label}
              </a>
            ))}
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t mt-2 pt-2 dark:border-neutral-700">
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
