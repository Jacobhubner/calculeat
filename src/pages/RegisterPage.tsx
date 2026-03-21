import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SignUpForm from '@/components/SignUpForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
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
            <p className="text-neutral-600">{t('register.subtitle')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('register.welcome')}</CardTitle>
              <CardDescription>{t('register.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm />
              <div className="mt-4 text-center text-sm text-neutral-600">
                {t('register.hasAccount')}{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-medium">
                  {t('register.loginLink')}
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
