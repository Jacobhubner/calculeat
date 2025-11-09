import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export default function SiteHeader() {
  const { user, signOut, profile } = useAuth()
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { to: '/', label: 'Hem' },
    { to: '/features', label: 'Funktioner' },
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
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 bg-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <svg
            viewBox="0 0 200 200"
            className="h-10 w-10 transition-transform group-hover:scale-105"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background gradient circle */}
            <defs>
              <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF3B0" />
                <stop offset="100%" stopColor="#FF9A3C" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="95" fill="url(#orangeGradient)" />

            {/* Green leaves on top */}
            <ellipse cx="70" cy="30" rx="28" ry="20" fill="#3BB54A" transform="rotate(-35 70 30)" />
            <ellipse
              cx="130"
              cy="25"
              rx="40"
              ry="25"
              fill="#3BB54A"
              transform="rotate(20 130 25)"
            />

            {/* White person silhouette */}
            {/* Head */}
            <circle cx="100" cy="70" r="20" fill="#FFFFFF" />
            {/* Body/torso */}
            <ellipse cx="100" cy="130" rx="40" ry="50" fill="#FFFFFF" />

            {/* Green calculator - simplified */}
            <rect x="82" y="108" width="36" height="44" rx="4" fill="#3BB54A" />
            {/* Calculator display screen */}
            <rect x="86" y="113" width="28" height="10" rx="2" fill="#FFFFFF" />
            {/* Simple button symbols */}
            {/* Top row: minus symbol */}
            <rect x="90" y="128" width="8" height="2" rx="1" fill="#FFFFFF" />
            {/* Middle row: plus symbol */}
            <rect x="90" y="138" width="2" height="8" rx="1" fill="#FFFFFF" />
            <rect x="87" y="141" width="8" height="2" rx="1" fill="#FFFFFF" />
            {/* Bottom row: minus and equals */}
            <rect x="102" y="138" width="8" height="2" rx="1" fill="#FFFFFF" />
            <rect x="102" y="142" width="8" height="2" rx="1" fill="#FFFFFF" />
          </svg>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            CalculEat
          </span>
        </Link>

        {/* Desktop Navigation */}
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
          {user && (
            <Link
              to="/app"
              className={cn(
                'text-sm font-medium transition-colors relative',
                isActive('/app') ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              Dashboard
              {isActive('/app') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </Link>
          )}
        </nav>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/app">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary-200 transition-all">
                  <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
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

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
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
            {user && (
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive('/app')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-50'
                )}
              >
                Dashboard
              </Link>
            )}

            <div className="border-t mt-2 pt-2">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {profile?.full_name || 'Användare'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logga ut
                  </Button>
                </div>
              ) : (
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
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
