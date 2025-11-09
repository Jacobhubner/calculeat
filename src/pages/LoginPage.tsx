import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import LoginForm from '@/components/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.png"
                alt="CalculEat Logo"
                className="h-20 w-20 object-contain -mr-3"
                style={{ imageRendering: '-webkit-optimize-contrast', mixBlendMode: 'multiply' }}
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                CalculEat
              </h1>
            </div>
            <p className="text-neutral-600">Logga in på ditt konto</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Välkommen tillbaka</CardTitle>
              <CardDescription>Logga in för att fortsätta till din dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-6 text-center text-sm">
                <Link to="/forgot-password" className="text-primary-600 hover:underline">
                  Glömt ditt lösenord?
                </Link>
              </div>
              <div className="mt-4 text-center text-sm text-neutral-600">
                Har du inget konto?{' '}
                <Link to="/register" className="text-primary-600 hover:underline font-medium">
                  Skapa ett här
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
