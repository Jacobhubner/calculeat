import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

const isDev = import.meta.env.DEV

export const i18nReady = i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'sv',
    supportedLngs: ['sv', 'en'],
    // Maps en-US, en-GB → 'en'; sv-SE → 'sv'
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    // Namespaces that must be available before first render.
    // 'onboarding' and 'dashboard' are needed immediately on login —
    // before any lazy HTTP fetch has time to complete.
    ns: ['common', 'onboarding', 'dashboard'],
    // Ensure init() Promise waits for HttpBackend to finish fetching all
    // namespace JSON files before resolving. Without this, initAsync:true
    // (the default in i18next v25) makes init() resolve immediately and
    // React mounts before translations are available.
    initAsync: false,
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        // Respect HTTP cache headers (ETag / max-age) so JSON files are not
        // re-fetched on every navigation after the first load
        cache: 'default',
      },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18n_language',
    },
    // ── Development helpers ─────────────────────────────────────────────────
    // Log a console warning for every missing translation key so nothing
    // slips through during the migration. Disabled in production.
    saveMissing: isDev,
    missingKeyHandler: isDev
      ? (_lngs, ns, key) => {
          console.warn(`[i18n] Missing key: ${ns}:${key}`)
        }
      : undefined,
    // Never fall back silently to null / empty string – show the key instead
    returnNull: false,
    returnEmptyString: false,
  })

export default i18n
