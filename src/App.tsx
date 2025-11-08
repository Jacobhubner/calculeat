import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { queryClient } from './lib/react-query'
import { Toaster } from './components/ui/toast'
import { TooltipProvider } from './components/ui/tooltip'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import FeaturesPage from './pages/FeaturesPage'
import IconDemo from './pages/IconDemo'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import FoodItemsPage from './pages/FoodItemsPage'
import RecipesPage from './pages/RecipesPage'
import SavedMealsPage from './pages/SavedMealsPage'
import TodayPage from './pages/TodayPage'
import HistoryPage from './pages/HistoryPage'
import HistoryDayPage from './pages/HistoryDayPage'

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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
