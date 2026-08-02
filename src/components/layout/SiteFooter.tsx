import { Link, useLocation } from 'react-router-dom'
import { Github, Mail, Twitter, Heart } from 'lucide-react'
import { Separator } from '../ui/separator'
import { useTranslation } from 'react-i18next'

export default function SiteFooter() {
  const { t } = useTranslation('marketing')
  const currentYear = new Date().getFullYear()
  const { pathname } = useLocation()
  const isEnPath = pathname.startsWith('/en/')
  const loc = (sv: string, en: string) => (isEnPath ? en : sv)

  const footerSections = [
    {
      title: t('footer.sections.calculators'),
      links: [
        {
          label: t('footer.links.tdeecalc'),
          to: loc('/kalkylatorer/tdee-kalkylator', '/en/calculators/tdee-calculator'),
        },
        {
          label: t('footer.links.caloriedeficit'),
          to: loc('/kalkylatorer/kaloriunderskott', '/en/calculators/calorie-deficit-calculator'),
        },
        {
          label: t('footer.links.bmicalc'),
          to: loc('/kalkylatorer/bmi-kalkylator', '/en/calculators/bmi-calculator'),
        },
        {
          label: t('footer.links.proteinneeds'),
          to: loc('/kalkylatorer/proteinbehov', '/en/calculators/protein-calculator'),
        },
        {
          label: t('footer.links.idealweight'),
          to: loc('/kalkylatorer/idealvikt', '/en/calculators/ideal-weight-calculator'),
        },
        {
          label: t('footer.links.bodyfat'),
          to: loc('/kalkylatorer/kroppsfett', '/en/calculators/body-fat-calculator'),
        },
        { label: t('footer.links.allcalculators'), to: loc('/kalkylatorer', '/en/calculators') },
      ],
    },
    {
      title: t('footer.sections.articles'),
      links: [
        {
          label: t('footer.links.calorieneeds'),
          to: loc('/artiklar/kaloribehov', '/en/articles/calorie-needs'),
        },
        {
          label: t('footer.links.whatistdee'),
          to: loc('/artiklar/vad-ar-tdee', '/en/articles/what-is-tdee'),
        },
        {
          label: t('footer.links.caloriedeficiency'),
          to: loc('/artiklar/kaloribrist', '/en/articles/calorie-deficit'),
        },
        {
          label: t('footer.links.bmrvsrmr'),
          to: loc('/artiklar/bmr-vs-rmr', '/en/articles/bmr-vs-rmr'),
        },
        {
          label: t('footer.links.lbmvsffm'),
          to: loc('/artiklar/lbm-vs-ffm', '/en/articles/lbm-vs-ffm'),
        },
        {
          label: t('footer.links.measurebodyfat'),
          to: loc('/artiklar/hur-mater-man-kroppsfett', '/en/articles/how-to-measure-body-fat'),
        },
        { label: t('footer.links.allarticles'), to: loc('/artiklar', '/en/articles') },
      ],
    },
    {
      title: t('footer.sections.product'),
      links: [
        { label: t('footer.links.dashboard'), to: '/app' },
        { label: t('footer.links.pricing'), to: loc('/premium', '/en/premium') },
        { label: t('footer.links.aboutus'), to: '/om-oss' },
        { label: t('footer.links.terms'), to: loc('/villkor', '/en/terms') },
        { label: t('footer.links.privacy'), to: loc('/integritetspolicy', '/en/privacy') },
      ],
    },
  ]

  return (
    <footer className="border-t bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center group w-fit">
              <img
                src="/calculeat-logo-full.svg"
                alt="Calculeat"
                className="h-16 object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-neutral-600 max-w-xs dark:text-neutral-400">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors dark:bg-neutral-700 dark:text-neutral-200"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors dark:bg-neutral-700 dark:text-neutral-200"
                aria-label="Github"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-200 text-neutral-700 hover:bg-primary-100 hover:text-primary-600 transition-colors dark:bg-neutral-700 dark:text-neutral-200"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-neutral-900 uppercase tracking-wider dark:text-neutral-100">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-block dark:text-neutral-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600 dark:text-neutral-400">
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
