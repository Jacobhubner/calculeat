import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import LoginForm from '@/components/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { t } = useTranslation('auth')

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/CalculEat-logo.svg" alt="CalculEat Logo" className="h-16 object-contain" />
            </div>
            <p className="text-neutral-600">{t('login.subtitle')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('login.welcome')}</CardTitle>
              <CardDescription>{t('login.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-6 text-center text-sm">
                <Link to="/forgot-password" className="text-primary-600 hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <div className="mt-4 text-center text-sm text-neutral-600">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="text-primary-600 hover:underline font-medium">
                  {t('login.registerLink')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
