import SiteHeader from '@/components/layout/SiteHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Apple, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Välkommen tillbaka! Här är din översikt.</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kalorier idag</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,450</div>
              <p className="text-xs text-muted-foreground">+180 från målet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">185g</div>
              <p className="text-xs text-muted-foreground">150g mål uppnått</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Träningspass</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Denna vecka</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivitet</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,234</div>
              <p className="text-xs text-muted-foreground">Steg idag</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nyligen loggade måltider</CardTitle>
              <CardDescription>Dina senaste inlägg</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-neutral-500">
                <Apple className="mx-auto mb-2 h-12 w-12" />
                <p>Inga måltider loggade ännu</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nästa träningspass</CardTitle>
              <CardDescription>Din planerade träning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-neutral-500">
                <Calendar className="mx-auto mb-2 h-12 w-12" />
                <p>Inga träningspass schemalagda</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-neutral-900">
            Fullständig dashboard funktionalitet kommer snart
          </p>
          <p className="mt-2 text-neutral-600">
            Vi arbetar på att implementera alla funktioner. Kom tillbaka snart!
          </p>
        </div>
      </main>
    </div>
  )
}
