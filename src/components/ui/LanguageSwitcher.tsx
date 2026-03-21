import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'sv'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => i18n.changeLanguage('sv')}
        className={`text-lg leading-none transition-opacity ${current === 'sv' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        aria-label="Svenska"
        title="Svenska"
      >
        🇸🇪
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`text-lg leading-none transition-opacity ${current === 'en' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        aria-label="English"
        title="English"
      >
        🇬🇧
      </button>
    </div>
  )
}
