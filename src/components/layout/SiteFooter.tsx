import { Link } from 'react-router-dom'
import { Github, Mail, Twitter, Heart } from 'lucide-react'
import { Separator } from '../ui/separator'
import { useTranslation } from 'react-i18next'

export default function SiteFooter() {
  const { t } = useTranslation('marketing')
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: t('footer.sections.product'),
      links: [
        { label: t('footer.links.dashboard'), to: '/app' },
        { label: t('footer.links.pricing'), to: '#' },
      ],
    },
    {
      title: t('footer.sections.resources'),
      links: [
        { label: t('footer.links.guides'), to: '#' },
        { label: t('footer.links.faq'), to: '#' },
        { label: t('footer.links.support'), to: '#' },
        { label: t('footer.links.apiDocs'), to: '#' },
      ],
    },
    {
      title: t('footer.sections.company'),
      links: [
        { label: t('footer.links.about'), to: '#' },
        { label: t('footer.links.blog'), to: '#' },
        { label: t('footer.links.careers'), to: '#' },
        { label: t('footer.links.contact'), to: '#' },
      ],
    },
    {
      title: t('footer.sections.legal'),
      links: [
        { label: t('footer.links.privacy'), to: '#' },
        { label: t('footer.links.terms'), to: '#' },
        { label: t('footer.links.cookies'), to: '#' },
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
            <Link to="/" className="flex items-center group w-fit">
              <img
                src="/CalculEat-logo.svg"
                alt="CalculEat Logo"
                className="h-10 object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-neutral-600 max-w-xs">{t('footer.tagline')}</p>
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

        {/* Newsletter Section */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-8">
          <div className="max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('footer.newsletter.title')}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">{t('footer.newsletter.description')}</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              />
              <button className="h-11 px-6 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                {t('footer.newsletter.button')}
              </button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <p>{t('footer.copyright', { year: currentYear })}</p>
          <p className="flex items-center gap-1">
            {t('footer.madeWith')} <Heart className="h-4 w-4 text-error-500 fill-error-500" />{' '}
            {t('footer.madeIn')}
          </p>
        </div>
      </div>
    </footer>
  )
}
