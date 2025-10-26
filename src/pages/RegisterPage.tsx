import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import SignUpForm from '@/components/SignUpForm'
import { Dumbbell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
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
            <p className="text-neutral-600">Skapa ditt konto</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kom igång med CalculEat</CardTitle>
              <CardDescription>
                Skapa ett konto för att börja spåra din kost och träning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm />
              <div className="mt-4 text-center text-sm text-neutral-600">
                Har du redan ett konto?{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-medium">
                  Logga in här
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
