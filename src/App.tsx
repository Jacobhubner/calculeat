import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { queryClient } from './lib/react-query'
import { Toaster } from './components/ui/toast'
import { TooltipProvider } from './components/ui/tooltip'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { Skeleton } from './components/ui/skeleton'

// Eager load - landing & auth pages (needed immediately)
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// Wraps lazy() to detect stale chunk errors after a new deploy on Vercel.
// When a hashed JS file no longer exists the server returns index.html
// (text/html), which triggers a "not a valid MIME type" error. We reload
// once — guarded by sessionStorage to avoid infinite loops.
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch(err => {
      const reloaded = sessionStorage.getItem('chunk-reload')
      if (!reloaded) {
        sessionStorage.setItem('chunk-reload', '1')
        window.location.reload()
        return new Promise(() => {}) // never resolves — reload takes over
      }
      throw err
    })
  )
}

// Lazy load - public SEO pages
const TdeeKalkylatornPage = lazyWithRetry(() => import('./pages/public/TdeeKalkylatornPage'))
const BmiKalkylatornPage = lazyWithRetry(() => import('./pages/public/BmiKalkylatornPage'))
const KaloriberhovPage = lazyWithRetry(() => import('./pages/public/KaloriberhovPage'))
const VadArTdeePage = lazyWithRetry(() => import('./pages/public/VadArTdeePage'))
const KaloriBristPage = lazyWithRetry(() => import('./pages/public/KaloriBristPage'))
const BulkOchCutPage = lazyWithRetry(() => import('./pages/public/BulkOchCutPage'))
const OmOssPage = lazyWithRetry(() => import('./pages/public/OmOssPage'))
const KaloriunderskottKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/KaloriunderskottKalkylatornPage')
)
const BulkKalkylatornPage = lazyWithRetry(() => import('./pages/public/BulkKalkylatornPage'))
const CutKalkylatornPage = lazyWithRetry(() => import('./pages/public/CutKalkylatornPage'))
const ProteinbehovKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/ProteinbehovKalkylatornPage')
)
const ReverseDietPage = lazyWithRetry(() => import('./pages/public/ReverseDietPage'))
const MyFitnessPalVsCalculEatPage = lazyWithRetry(
  () => import('./pages/public/MyFitnessPalVsCalculEatPage')
)
const BastaKaloriappenPage = lazyWithRetry(() => import('./pages/public/BastaKaloriappenPage'))
const BastaTdeeKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/BastaTdeeKalkylatornPage')
)
const IdealviktKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/IdealviktKalkylatornPage')
)
const KroppsfettKalkylatornPage = lazyWithRetry(
  () => import('./pages/public/KroppsfettKalkylatornPage')
)
const FfmiKalkylatornPage = lazyWithRetry(() => import('./pages/public/FfmiKalkylatornPage'))
const BmrKalkylatornPage = lazyWithRetry(() => import('./pages/public/BmrKalkylatornPage'))
const VadArBmrPage = lazyWithRetry(() => import('./pages/public/VadArBmrPage'))
const BmrVsTdeePage = lazyWithRetry(() => import('./pages/public/BmrVsTdeePage'))
const BmrVsRmrPage = lazyWithRetry(() => import('./pages/public/BmrVsRmrPage'))
const BmiVsKroppsfettPage = lazyWithRetry(() => import('./pages/public/BmiVsKroppsfettPage'))
const VadArFfmiPage = lazyWithRetry(() => import('./pages/public/VadArFfmiPage'))
const VadArPalOchMetPage = lazyWithRetry(() => import('./pages/public/VadArPalOchMetPage'))
const LifesumVsCalculEatPage = lazyWithRetry(() => import('./pages/public/LifesumVsCalculEatPage'))
const YazioVsCalculEatPage = lazyWithRetry(() => import('./pages/public/YazioVsCalculEatPage'))
const MacroFactorVsCalculEatPage = lazyWithRetry(
  () => import('./pages/public/MacroFactorVsCalculEatPage')
)
const KalkylatornHubPage = lazyWithRetry(() => import('./pages/public/KalkylatornHubPage'))
const ArtikelnHubPage = lazyWithRetry(() => import('./pages/public/ArtikelnHubPage'))
const LbmVsFfmPage = lazyWithRetry(() => import('./pages/public/LbmVsFfmPage'))
const HurMatarManKroppsfettPage = lazyWithRetry(
  () => import('./pages/public/HurMatarManKroppsfettPage')
)

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
const FoodItemsPage = lazyWithRetry(() => import('./pages/FoodItemsPage'))
const RecipesPage = lazyWithRetry(() => import('./pages/RecipesPage'))
const SavedMealsPage = lazyWithRetry(() => import('./pages/SavedMealsPage'))
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

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
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
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
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
                    <Route path="/kalkylatorer/bmi-kalkylator" element={<BmiKalkylatornPage />} />
                    <Route
                      path="/kalkylatorer/kaloriunderskott"
                      element={<KaloriunderskottKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/bulk-kalkylator" element={<BulkKalkylatornPage />} />
                    <Route path="/kalkylatorer/cut-kalkylator" element={<CutKalkylatornPage />} />
                    <Route
                      path="/kalkylatorer/proteinbehov"
                      element={<ProteinbehovKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/idealvikt" element={<IdealviktKalkylatornPage />} />
                    <Route
                      path="/kalkylatorer/kroppsfett"
                      element={<KroppsfettKalkylatornPage />}
                    />
                    <Route path="/kalkylatorer/ffmi-kalkylator" element={<FfmiKalkylatornPage />} />
                    <Route path="/kalkylatorer/bmr-kalkylator" element={<BmrKalkylatornPage />} />
                    <Route path="/artiklar/kaloribehov" element={<KaloriberhovPage />} />
                    <Route path="/artiklar/vad-ar-tdee" element={<VadArTdeePage />} />
                    <Route path="/artiklar/kaloribrist" element={<KaloriBristPage />} />
                    <Route path="/artiklar/bulk-och-cut" element={<BulkOchCutPage />} />
                    <Route path="/artiklar/reverse-diet" element={<ReverseDietPage />} />
                    <Route path="/artiklar/vad-ar-bmr" element={<VadArBmrPage />} />
                    <Route path="/artiklar/bmr-vs-rmr" element={<BmrVsRmrPage />} />
                    <Route path="/artiklar/bmr-vs-tdee" element={<BmrVsTdeePage />} />
                    <Route path="/artiklar/bmi-vs-kroppsfett" element={<BmiVsKroppsfettPage />} />
                    <Route path="/artiklar/vad-ar-ffmi" element={<VadArFfmiPage />} />
                    <Route path="/artiklar/vad-ar-pal-och-met" element={<VadArPalOchMetPage />} />
                    <Route path="/artiklar/lbm-vs-ffm" element={<LbmVsFfmPage />} />
                    <Route
                      path="/artiklar/hur-mater-man-kroppsfett"
                      element={<HurMatarManKroppsfettPage />}
                    />
                    <Route
                      path="/jamfor/myfitnesspal-vs-calculeat"
                      element={<MyFitnessPalVsCalculEatPage />}
                    />
                    <Route
                      path="/jamfor/lifesum-vs-calculeat"
                      element={<LifesumVsCalculEatPage />}
                    />
                    <Route path="/jamfor/yazio-vs-calculeat" element={<YazioVsCalculEatPage />} />
                    <Route
                      path="/jamfor/macrofactor-vs-calculeat"
                      element={<MacroFactorVsCalculEatPage />}
                    />
                    <Route path="/basta-kaloriappen" element={<BastaKaloriappenPage />} />
                    <Route path="/basta-tdee-kalkylatorn" element={<BastaTdeeKalkylatornPage />} />
                    <Route path="/kalkylatorer" element={<KalkylatornHubPage />} />
                    <Route path="/artiklar" element={<ArtikelnHubPage />} />
                    <Route path="/om-oss" element={<OmOssPage />} />

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
                      <Route path="genetic-potential" element={<GeneticPotentialTool />} />
                    </Route>
                    <Route
                      path="/app/food-items"
                      element={
                        <ProtectedRoute>
                          <FoodItemsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/recipes"
                      element={
                        <ProtectedRoute>
                          <RecipesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/app/saved-meals"
                      element={
                        <ProtectedRoute>
                          <SavedMealsPage />
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
