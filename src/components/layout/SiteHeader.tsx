import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { Button } from './ui/button'

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <Dumbbell className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-heading font-bold text-neutral-800">CalculEat</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/features"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Funktioner
          </Link>
          <Link
            to="/app"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            Logga in
          </Button>
          <Button size="sm">Skapa konto</Button>
        </div>
      </div>
    </header>
  )
}
