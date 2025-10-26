import { useState } from 'react'
import SiteHeader from '@/components/layout/SiteHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import UserProfileForm from '@/components/UserProfileForm'
import LoginForm from '@/components/LoginForm'
import SignUpForm from '@/components/SignUpForm'
import { Button } from '@/components/ui/button'
import { Activity, Apple, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <SiteHeader />
        <main className="container mx-auto px-4 py-20 md:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>{showSignUp ? 'Skapa konto' : 'Logga in'}</CardTitle>
                <CardDescription>
                  {showSignUp
                    ? 'Skapa ett konto för att komma igång med CalculEat'
                    : 'Logga in på ditt CalculEat-konto'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showSignUp ? <SignUpForm /> : <LoginForm />}
                <div className="mt-4 text-center text-sm">
                  {showSignUp ? (
                    <>
                      Har du redan ett konto?{' '}
                      <button
                        onClick={() => setShowSignUp(false)}
                        className="text-primary-600 hover:underline"
                      >
                        Logga in
                      </button>
                    </>
                  ) : (
                    <>
                      Har du inget konto?{' '}
                      <button
                        onClick={() => setShowSignUp(true)}
                        className="text-primary-600 hover:underline"
                      >
                        Skapa konto
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Hej {profile?.full_name || 'där'}! 👋
            </h1>
            <p className="text-neutral-600">Välkommen till din dashboard</p>
          </div>
          <Button variant="ghost" onClick={() => signOut()}>
            Logga ut
          </Button>
        </div>

        {/* Quick Stats */}
        {profile && (profile.weight_kg || profile.height_cm) && (
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vikt</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.weight_kg || '-'} kg</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Längd</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.height_cm || '-'} cm</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TDEE</CardTitle>
                <Apple className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.tdee || '-'}</div>
                <p className="text-xs text-muted-foreground">kalorier/dag</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Din profil</CardTitle>
            <CardDescription>
              Uppdatera din personliga information och inställningar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
