import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPageConfigByPath, type SupportedLocale } from '@/lib/config/pages'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // On public pages with URL-based locale routing use the URL; elsewhere use i18n state.
  // URL wins only when the current path is actually a known public page —
  // otherwise (app pages, unknown paths) fall back to i18n.language.
  const pageConfig = getPageConfigByPath(pathname)
  const isEnglishPath = pathname === '/en' || pathname.startsWith('/en/')
  const current: SupportedLocale = pageConfig
    ? isEnglishPath
      ? 'en'
      : 'sv'
    : i18n.language?.startsWith('en')
      ? 'en'
      : 'sv'

  function switchLanguage(target: SupportedLocale) {
    if (target === current) return

    // For public pages: navigate to the equivalent URL in the target locale
    const config = getPageConfigByPath(pathname)
    if (config) {
      const targetEntry = config.locales[target]
      if (targetEntry) {
        navigate('/' + targetEntry.path)
        return
      }
      // Target locale not yet available — fall through to i18n change only
    }

    // For app pages (or public pages without an EN equivalent yet): change i18n state
    i18n.changeLanguage(target)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => switchLanguage('sv')}
        className={`fi fi-se rounded-sm transition-opacity ${current === 'sv' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        style={{ width: '1.5rem', height: '1.125rem', backgroundSize: 'cover' }}
        aria-label="Svenska"
        title="Svenska"
      />
      <button
        onClick={() => switchLanguage('en')}
        className={`fi fi-gb rounded-sm transition-opacity ${current === 'en' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        style={{ width: '1.5rem', height: '1.125rem', backgroundSize: 'cover' }}
        aria-label="English"
        title="English"
      />
    </div>
  )
}
