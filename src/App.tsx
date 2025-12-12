import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { queryClient } from './lib/react-query'
import { Toaster } from './components/ui/toast'
import { TooltipProvider } from './components/ui/tooltip'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import HomePage from './pages/HomePage'
import FeaturesPage from './pages/FeaturesPage'
import IconDemo from './pages/IconDemo'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import BodyCompositionPage from './pages/BodyCompositionPage'
import FoodItemsPage from './pages/FoodItemsPage'
import RecipesPage from './pages/RecipesPage'
import SavedMealsPage from './pages/SavedMealsPage'
import TodayPage from './pages/TodayPage'
import HistoryPage from './pages/HistoryPage'
import HistoryDayPage from './pages/HistoryDayPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ToolsPage from './pages/ToolsPage'
import BodyCompositionTool from './components/tools/body-composition/BodyCompositionTool'
import GeneticPotentialTool from './components/tools/genetic-potential/GeneticPotentialTool'
import METCalculatorTool from './components/tools/met-calculator/METCalculatorTool'
import TDEECalculatorTool from './components/tools/tdee-calculator/TDEECalculatorTool'
import GoalCalculatorTool from './components/tools/goal-calculator/GoalCalculatorTool'
import MacroOptimizerTool from './components/tools/macro-optimizer/MacroOptimizerTool'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/features" element={<FeaturesPage />} />
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
                />
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
                  <Route index element={<Navigate to="/app/tools/body-composition" replace />} />
                  <Route path="body-composition" element={<BodyCompositionTool />} />
                  <Route path="genetic-potential" element={<GeneticPotentialTool />} />
                  <Route path="met-calculator" element={<METCalculatorTool />} />
                  <Route path="tdee-calculator" element={<TDEECalculatorTool />} />
                  <Route path="goal-calculator" element={<GoalCalculatorTool />} />
                  <Route path="macro-optimizer" element={<MacroOptimizerTool />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
