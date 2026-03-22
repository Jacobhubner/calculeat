import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'sv'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => i18n.changeLanguage('sv')}
        className={`fi fi-se rounded-sm transition-opacity ${current === 'sv' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        style={{ width: '1.5rem', height: '1.125rem', backgroundSize: 'cover' }}
        aria-label="Svenska"
        title="Svenska"
      />
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`fi fi-gb rounded-sm transition-opacity ${current === 'en' ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
        style={{ width: '1.5rem', height: '1.125rem', backgroundSize: 'cover' }}
        aria-label="English"
        title="English"
      />
    </div>
  )
}
