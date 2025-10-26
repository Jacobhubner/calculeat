import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import LoginForm from '@/components/LoginForm'
import { Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-neutral-900">CalculEat</h1>
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
