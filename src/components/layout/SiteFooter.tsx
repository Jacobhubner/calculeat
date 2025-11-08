import { Link } from 'react-router-dom'
import { Dumbbell, Github, Mail, Twitter, Heart } from 'lucide-react'
import { Separator } from '../ui/separator'

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Produkt',
      links: [
        { label: 'Funktioner', to: '/features' },
        { label: 'Dashboard', to: '/app' },
        { label: 'Priser', to: '#' },
      ],
    },
    {
      title: 'Resurser',
      links: [
        { label: 'Guider', to: '#' },
        { label: 'FAQ', to: '#' },
        { label: 'Support', to: '#' },
        { label: 'API Dokumentation', to: '#' },
      ],
    },
    {
      title: 'Företag',
      links: [
        { label: 'Om oss', to: '#' },
        { label: 'Blogg', to: '#' },
        { label: 'Karriär', to: '#' },
        { label: 'Kontakt', to: '#' },
      ],
    },
    {
      title: 'Legalt',
      links: [
        { label: 'Integritetspolicy', to: '#' },
        { label: 'Användarvillkor', to: '#' },
        { label: 'Cookies', to: '#' },
      ],
    },
  ]

  return (
    <footer className="border-t bg-neutral-50">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="rounded-xl bg-gradient-primary p-2 group-hover:scale-105 transition-transform">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                CalculEat
              </span>
            </Link>
            <p className="text-sm text-neutral-600 max-w-xs">
              Din kompletta plattform för kaloriräkning, måltidsplanering och träningsspårning. Ät
              smart. Träna rätt. Följ allt.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                aria-label="Github"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section (Optional - UI only) */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-8">
          <div className="max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Håll dig uppdaterad</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Få de senaste tipsen om näring, träning och hälsa direkt i din inkorg.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Din e-postadress"
                className="flex-1 h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              />
              <button className="h-11 px-6 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                Prenumerera
              </button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <p>&copy; {currentYear} CalculEat. Alla rättigheter förbehållna.</p>
          <p className="flex items-center gap-1">
            Gjord med <Heart className="h-4 w-4 text-error-500 fill-error-500" /> i Sverige
          </p>
        </div>
      </div>
    </footer>
  )
}
