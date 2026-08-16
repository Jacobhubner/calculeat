import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { shouldSkipScrollToTop } from '@/lib/utils/deepLinkScroll'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { queryClient } from './lib/react-query'
import { Toaster } from './components/ui/toast'
import { TooltipProvider } from './components/ui/tooltip'
import ErrorBoundary from './components/ErrorBoundary'
import { GlobalUpgradeModal } from './components/premium/GlobalUpgradeModal'
import { PublicSupportChat } from './components/support/PublicSupportChat'
import { PremiumGate } from './components/premium/PremiumGate'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { Skeleton } from './components/ui/skeleton'
import { ARTICLES } from './content/articles/registry'
import { getPageConfigByPath } from './lib/config/pages'

// Eager load - landing & auth pages (needed immediately)
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// Wraps lazy() to detect stale chunk errors after a new deploy on Vercel.
// When a hashed JS file no longer exists the server returns index.html
// (text/html), which triggers a "not a valid MIME type" error. We reload
// once — guarded by sessionStorage to avoid infinite loops.
function isChunkLoadError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? ''
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('is not a valid JavaScript MIME type') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  )
}

function lazyWithRetry<P extends object>(
  factory: () => Promise<{ default: React.ComponentType<P> }>
): React.LazyExoticComponent<React.ComponentType<P>> {
  return lazy(() =>
    factory()
      .then(mod => {
        // Successful load — reset guard so the next deploy can retry again
        sessionStorage.removeItem('chunk-reload')
        return mod
      })
      .catch(err => {
        if (isChunkLoadError(err) && !sessionStorage.getItem('chunk-reload')) {
          sessionStorage.setItem('chunk-reload', '1')
          window.location.reload()
          return new Promise<{ default: React.ComponentType<P> }>(() => {}) // never resolves — reload takes over
        }
        throw err
      })
  )
}

// Lazy load - public SEO pages
const TdeeKalkylatornPage = lazyWithRetry(() => import('./pages/public/TdeeKalkylatornPage'))
const BmiKalkylatornPage = lazyWithRetry(() => import('./pages/public/BmiKalkylatornPage'))

const KaloriunderskottKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/KaloriunderskottKalkylatornPage')
)
const BulkKalkylatornPage = lazyWithRetry(() => import('./pages/public/BulkKalkylatornPage'))
const CutKalkylatornPage = lazyWithRetry(() => import('./pages/public/CutKalkylatornPage'))
const ProteinbehovKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/ProteinbehovKalkylatornPage')
)

const IdealviktKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/IdealviktKalkylatornPage')
)
const KroppsfettKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/KroppsfettKalkylatornPage')
)
const FfmiKalkylatornPage = lazyWithRetry(() => import('./pages/public/FfmiKalkylatornPage'))
const BmrKalkylatornPage = lazyWithRetry(() => import('./pages/public/BmrKalkylatornPage'))

// Alla artiklar renderas av en generisk sida; innehåll + routes drivs av registryt
const ArticlePage = lazyWithRetry(() => import('./pages/public/ArticlePage'))

const MyFitnessPalVsCalculeatPage = lazyWithRetry(
  () => import('./pages/public/MyFitnessPalVsCalculeatPage')
)
const LifesumVsCalculeatPage = lazyWithRetry(() => import('./pages/public/LifesumVsCalculeatPage'))
const YazioVsCalculeatPage = lazyWithRetry(() => import('./pages/public/YazioVsCalculeatPage'))
const MacroFactorVsCalculeatPage = lazyWithRetry(
  () => import('./pages/public/MacroFactorVsCalculeatPage')
)
const BastaKaloriappenPage = lazyWithRetry(() => import('./pages/public/BastaKaloriappenPage'))
const BastaTdeeKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/BastaTdeeKalkylatornPage')
)
const OmOssPage = lazyWithRetry(() => import('./pages/public/OmOssPage'))
const PremiumPage = lazyWithRetry(() => import('./pages/public/PremiumPage'))
const LegalPage = lazyWithRetry(() => import('./pages/public/LegalPage'))

const KalkylatornHubPage = lazyWithRetry(() => import('./pages/public/KalkylatornHubPage'))
const ArtikelnHubPage = lazyWithRetry(() => import('./pages/public/ArtikelnHubPage'))

// Lazy load - app pages (loaded on demand)
const IconDemo = lazyWithRetry(() => import('./pages/IconDemo'))
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'))
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'))
const BodyCompositionPage = lazyWithRetry(() => import('./pages/BodyCompositionPage'))
const BodyCompositionHubPage = lazyWithRetry(() => import('./pages/BodyCompositionHubPage'))
const BodyCompositionCalculator = lazyWithRetry(
  () => import('./components/tools/body-composition/BodyCompositionCalculator')
)
const FoodHubPage = lazyWithRetry(() => import('./pages/FoodHubPage'))
const TodayPage = lazyWithRetry(() => import('./pages/TodayPage'))
const HistoryPage = lazyWithRetry(() => import('./pages/HistoryPage'))
const HistoryDayPage = lazyWithRetry(() => import('./pages/HistoryDayPage'))
const ToolsPage = lazyWithRetry(() => import('./pages/ToolsPage'))
const GeneticPotentialTool = lazyWithRetry(
  () => import('./components/tools/genetic-potential/GeneticPotentialTool')
)
const METCalculatorTool = lazyWithRetry(
  () => import('./components/tools/met-calculator/METCalculatorTool')
)
const TDEECalculatorTool = lazyWithRetry(
  () => import('./components/tools/tdee-calculator/TDEECalculatorTool')
)
const GoalCalculatorTool = lazyWithRetry(
  () => import('./components/tools/goal-calculator/GoalCalculatorTool')
)
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'))
const SocialPage = lazyWithRetry(() => import('./pages/SocialPage'))
const AdminSupportPage = lazyWithRetry(() => import('./pages/AdminSupportPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    // Hoppa över när URL:en pekar ut ett mål på sidan. Vissa vyer navigerar
    // hit med en parameter som säger vilken sektion som ska öppnas och
    // scrollas fram (t.ex. ?calibrate=open från Översikt). Utan undantaget
    // konkurrerar den här scrollen med sektionens egen och användaren
    // landar mitt i sidan.
    if (shouldSkipScrollToTop(search)) return

    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

// Synkar det globala i18n-språket med URL:en på URL-språkdrivna publika sidor.
// Publika SEO-sidor är URL-språkdrivna (/en/... = engelska, annars svenska)
// men LanguageSwitcher navigerar bara — inget anropar changeLanguage när man
// LANDAR på en /en/-URL (t.ex. via länk, delning eller sökmotor). Utan detta
// visar header/footer/globala UI-strängar svenska på engelska sidor.
//
// VIKTIGT: bara sidor som finns i PAGE_CONFIGS är URL-språkdrivna. App-sidor
// (/app) OCH auth-sidor (/login, /register, /forgot-password, ...) styrs av
// användarens val (i18n/localStorage) — där får LocaleSync ALDRIG tvinga ett
// språk, annars skrivs ett aktivt engelskt val över till svenska vid varje
// navigering dit.
function LocaleSync() {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  useEffect(() => {
    // Enbart konfigurerade publika sidor är URL-språkdrivna
    if (!getPageConfigByPath(pathname)) return
    const target = pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'sv'
    if (!i18n.language?.startsWith(target)) {
      i18n.changeLanguage(target)
    }
  }, [pathname, i18n])
  return null
}

// Supportchatt på publika sidor (gäster + inloggade). /app har redan
// SupportChatButton via DashboardLayout — undanta för att slippa dubblett.
function PublicSupportChatMount() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/app')) return null
  return <PublicSupportChat />
}

// Route-nivå-gate för genetisk potential med funktionsnamn i låsvyn
// (title kräver tools-namespacet, därav egen komponent)
function GatedGeneticPotential() {
  const { t } = useTranslation('tools')
  return (
    <PremiumGate feature="genetic_potential" title={t('geneticPotential.header.title')}>
      <GeneticPotentialTool />
    </PremiumGate>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PresenceProvider>
              <BrowserRouter>
                <ScrollToTop />
                <LocaleSync />
                <GlobalUpgradeModal />
                <PublicSupportChatMount />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/en" element={<HomePage />} />
                    <Route path="/features" element={<Navigate to="/" replace />} />
                    <Route path="/icon-demo" element={<IconDemo />} />
                    <Route
                      path="/login"
                      element={
                        <PublicOnlyRoute>
                          <LoginPage />
                        </PublicOnlyRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicOnlyRoute>
                          <RegisterPage />
                        </PublicOnlyRoute>
                      }
                    />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />

                    {/* Public SEO pages */}
                    <Route path="/kalkylatorer/tdee-kalkylator" element={<TdeeKalkylatornPage />} />
                    <Route
                      path="/en/calculators/tdee-calculator"
                      element={<TdeeKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/bmi-kalkylator" element={<BmiKalkylatornPage />} />
                    <Route path="/en/calculators/bmi-calculator" element={<BmiKalkylatornPage />} />
                    <Route
                      path="/kalkylatorer/kaloriunderskott"
                      element={<KaloriunderskottKalkylatornPage />}
                    />
                    <Route
                      path="/en/calculators/calorie-deficit-calculator"
                      element={<KaloriunderskottKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/bulk-kalkylator" element={<BulkKalkylatornPage />} />
                    <Route
                      path="/en/calculators/bulk-calculator"
                      element={<BulkKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/cut-kalkylator" element={<CutKalkylatornPage />} />
                    <Route path="/en/calculators/cut-calculator" element={<CutKalkylatornPage />} />
                    <Route
                      path="/kalkylatorer/proteinbehov"
                      element={<ProteinbehovKalkylatornPage />}
                    />
                    <Route
                      path="/en/calculators/protein-calculator"
                      element={<ProteinbehovKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/idealvikt" element={<IdealviktKalkylatornPage />} />
                    <Route
                      path="/en/calculators/ideal-weight-calculator"
                      element={<IdealviktKalkylatornPage />}
                    />
                    <Route
                      path="/kalkylatorer/kroppsfett"
                      element={<KroppsfettKalkylatornPage />}
                    />
                    <Route
                      path="/en/calculators/body-fat-calculator"
                      element={<KroppsfettKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/ffmi-kalkylator" element={<FfmiKalkylatornPage />} />
                    <Route
                      path="/en/calculators/ffmi-calculator"
                      element={<FfmiKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/bmr-kalkylator" element={<BmrKalkylatornPage />} />
                    <Route path="/en/calculators/bmr-calculator" element={<BmrKalkylatornPage />} />
                    {/* Artiklar — genereras från registryt, en <Route> per språk */}
                    {ARTICLES.flatMap(a =>
                      (['sv', 'en'] as const).map(lng => (
                        <Route
                          key={`${a.key}-${lng}`}
                          path={`/${a.paths[lng]}`}
                          element={<ArticlePage articleKey={a.key} />}
                        />
                      ))
                    )}
                    <Route
                      path="/jamfor/myfitnesspal-vs-calculeat"
                      element={<MyFitnessPalVsCalculeatPage />}
                    />
                    <Route
                      path="/en/compare/myfitnesspal-vs-calculeat"
                      element={<MyFitnessPalVsCalculeatPage />}
                    />
                    <Route
                      path="/jamfor/lifesum-vs-calculeat"
                      element={<LifesumVsCalculeatPage />}
                    />
                    <Route
                      path="/en/compare/lifesum-vs-calculeat"
                      element={<LifesumVsCalculeatPage />}
                    />
                    <Route path="/jamfor/yazio-vs-calculeat" element={<YazioVsCalculeatPage />} />
                    <Route
                      path="/en/compare/yazio-vs-calculeat"
                      element={<YazioVsCalculeatPage />}
                    />
                    <Route
                      path="/jamfor/macrofactor-vs-calculeat"
                      element={<MacroFactorVsCalculeatPage />}
                    />
                    <Route
                      path="/en/compare/macrofactor-vs-calculeat"
                      element={<MacroFactorVsCalculeatPage />}
                    />
                    <Route path="/basta-kaloriappen" element={<BastaKaloriappenPage />} />
                    <Route path="/en/compare/best-calorie-app" element={<BastaKaloriappenPage />} />
                    <Route path="/basta-tdee-kalkylatorn" element={<BastaTdeeKalkylatornPage />} />
                    <Route
                      path="/en/compare/best-tdee-calculator"
                      element={<BastaTdeeKalkylatornPage />}
                    />
                    <Route path="/om-oss" element={<OmOssPage />} />
                    <Route path="/en/about" element={<OmOssPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/en/premium" element={<PremiumPage />} />
                    <Route path="/villkor" element={<LegalPage pageKey="terms" />} />
                    <Route path="/en/terms" element={<LegalPage pageKey="terms" />} />
                    <Route path="/integritetspolicy" element={<LegalPage pageKey="privacy" />} />
                    <Route path="/en/privacy" element={<LegalPage pageKey="privacy" />} />
                    <Route path="/kalkylatorer" element={<KalkylatornHubPage />} />
                    <Route path="/en/calculators" element={<KalkylatornHubPage />} />
                    <Route path="/artiklar" element={<ArtikelnHubPage />} />
                    <Route path="/en/articles" element={<ArtikelnHubPage />} />

                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/body-composition"
                      element={
                        <ProtectedRoute>
                          <BodyCompositionPage />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<BodyCompositionHubPage />} />
                      <Route path="calculate" element={<BodyCompositionCalculator />} />
                      <Route path="genetic-potential" element={<GatedGeneticPotential />} />
                    </Route>
                    {/* Mat-ytan: tre flikar, tre bevarade URL:er (bokmärken/länkar
                        fortsätter fungera). Varje rutt renderar samma sida med
                        rätt aktiv flik. */}
                    <Route
                      path="/app/food-items"
                      element={
                        <ProtectedRoute>
                          <FoodHubPage tab="food" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/recipes"
                      element={
                        <ProtectedRoute>
                          <FoodHubPage tab="recipes" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/saved-meals"
                      element={
                        <ProtectedRoute>
                          <FoodHubPage tab="saved" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/today"
                      element={
                        <ProtectedRoute>
                          <TodayPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/history"
                      element={
                        <ProtectedRoute>
                          <HistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/history/:date"
                      element={
                        <ProtectedRoute>
                          <HistoryDayPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/tools"
                      element={
                        <ProtectedRoute>
                          <ToolsPage />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/app/tools/met-calculator" replace />} />
                      <Route path="met-calculator" element={<METCalculatorTool />} />
                      <Route path="tdee-calculator" element={<TDEECalculatorTool />} />
                      <Route path="goal-calculator" element={<GoalCalculatorTool />} />
                    </Route>
                    <Route
                      path="/app/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/social"
                      element={
                        <ProtectedRoute>
                          <SocialPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Bakåtkompatibilitet — redirect till /app/social */}
                    <Route
                      path="/app/invitations"
                      element={<Navigate to="/app/social" replace />}
                    />
                    <Route
                      path="/app/admin/support"
                      element={
                        <ProtectedRoute>
                          <AdminSupportPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </PresenceProvider>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
