import { Link } from 'react-router-dom'
import { Dumbbell, Github, Mail, Twitter } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="border-t bg-neutral-50">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-heading font-bold">CalculEat</span>
            </div>
            <p className="text-sm text-neutral-600">Ät smart. Träna rätt. Följ allt.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Produkt</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Funktioner
                </Link>
              </li>
              <li>
                <Link to="/app" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Hjälpcenter
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Kontakta oss
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Följ oss</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-600 hover:text-neutral-900">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 hover:text-neutral-900">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 hover:text-neutral-900">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-neutral-600">
          <p>&copy; {new Date().getFullYear()} CalculEat. Alla rättigheter förbehållna.</p>
        </div>
      </div>
    </footer>
  )
}
