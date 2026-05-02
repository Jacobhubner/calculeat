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

// Lazy load - public SEO pages
const TdeeKalkylatornPage = lazy(() => import('./pages/public/TdeeKalkylatornPage'))
const BmiKalkylatornPage = lazy(() => import('./pages/public/BmiKalkylatornPage'))
const KaloriberhovPage = lazy(() => import('./pages/public/KaloriberhovPage'))
const VadArTdeePage = lazy(() => import('./pages/public/VadArTdeePage'))
const KaloriBristPage = lazy(() => import('./pages/public/KaloriBristPage'))
const BulkOchCutPage = lazy(() => import('./pages/public/BulkOchCutPage'))
const OmOssPage = lazy(() => import('./pages/public/OmOssPage'))
const KaloriunderskottKalkylatornPage = lazy(
  () => import('./pages/public/KaloriunderskottKalkylatornPage')
)
const BulkKalkylatornPage = lazy(() => import('./pages/public/BulkKalkylatornPage'))
const CutKalkylatornPage = lazy(() => import('./pages/public/CutKalkylatornPage'))
const ProteinbehovKalkylatornPage = lazy(() => import('./pages/public/ProteinbehovKalkylatornPage'))
const ReverseDietPage = lazy(() => import('./pages/public/ReverseDietPage'))
const MyFitnessPalVsCalculEatPage = lazy(() => import('./pages/public/MyFitnessPalVsCalculEatPage'))
const BastaKaloriappenPage = lazy(() => import('./pages/public/BastaKaloriappenPage'))

// Lazy load - app pages (loaded on demand)
const IconDemo = lazy(() => import('./pages/IconDemo'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BodyCompositionPage = lazy(() => import('./pages/BodyCompositionPage'))
const BodyCompositionHubPage = lazy(() => import('./pages/BodyCompositionHubPage'))
const BodyCompositionCalculator = lazy(
  () => import('./components/tools/body-composition/BodyCompositionCalculator')
)
const FoodItemsPage = lazy(() => import('./pages/FoodItemsPage'))
const RecipesPage = lazy(() => import('./pages/RecipesPage'))
const SavedMealsPage = lazy(() => import('./pages/SavedMealsPage'))
const TodayPage = lazy(() => import('./pages/TodayPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const HistoryDayPage = lazy(() => import('./pages/HistoryDayPage'))
const ToolsPage = lazy(() => import('./pages/ToolsPage'))
const GeneticPotentialTool = lazy(
  () => import('./components/tools/genetic-potential/GeneticPotentialTool')
)
const METCalculatorTool = lazy(() => import('./components/tools/met-calculator/METCalculatorTool'))
const TDEECalculatorTool = lazy(
  () => import('./components/tools/tdee-calculator/TDEECalculatorTool')
)
const GoalCalculatorTool = lazy(
  () => import('./components/tools/goal-calculator/GoalCalculatorTool')
)
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SocialPage = lazy(() => import('./pages/SocialPage'))

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
                    <Route path="/artiklar/kaloribehov" element={<KaloriberhovPage />} />
                    <Route path="/artiklar/vad-ar-tdee" element={<VadArTdeePage />} />
                    <Route path="/artiklar/kaloribrist" element={<KaloriBristPage />} />
                    <Route path="/artiklar/bulk-och-cut" element={<BulkOchCutPage />} />
                    <Route path="/artiklar/reverse-diet" element={<ReverseDietPage />} />
                    <Route
                      path="/jamfor/myfitnesspal-vs-calculeat"
                      element={<MyFitnessPalVsCalculEatPage />}
                    />
                    <Route path="/basta-kaloriappen" element={<BastaKaloriappenPage />} />
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
