import DashboardLayout from '@/components/layout/DashboardLayout'
import UserProfileForm from '@/components/UserProfileForm'
import MacroModesCard from '@/components/MacroModesCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Activity, Target } from 'lucide-react'

export default function ProfilePage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          <User className="h-8 w-8 text-primary-600" />
          Min Profil
        </h1>
        <p className="text-neutral-600">
          Hantera din profil och personliga inställningar. Fyll i din information för att få
          personliga beräkningar och rekommendationer.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          <UserProfileForm />

          {/* Macro Modes Card */}
          <MacroModesCard />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* BMR Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" />
                Om BMR-formler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <div>
                <p className="font-semibold text-neutral-900 mb-1">Mifflin-St Jeor</p>
                <p>Mest noggrann för allmänheten. Rekommenderas som standard.</p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-neutral-900 mb-1">Cunningham</p>
                <p>För dig med känd kroppsfettprocent. Mycket noggrann.</p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-neutral-900 mb-1">MacroFactor</p>
                <p>Modern formel baserad på ny forskning.</p>
              </div>
            </CardContent>
          </Card>

          {/* PAL Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-600" />
                Om PAL-system
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <div>
                <p className="font-semibold text-neutral-900 mb-1">FAO/WHO/UNU</p>
                <p>Vetenskapligt validerad standard. Enkel och pålitlig.</p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-neutral-900 mb-1">DAMNRIPPED</p>
                <p>Mest omfattande. Inkluderar träningsintensitet.</p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold text-neutral-900 mb-1">Pro Physique</p>
                <p>För seriösa idrottare. Exakta träningsuppgifter.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700">
              <p>• Väg dig på morgonen före frukost för mest konsistenta resultat</p>
              <p>• Uppdatera din vikt regelbundet (1 gång per vecka)</p>
              <p>• Använd Cunningham-formeln om du vet din kroppsfettprocent</p>
              <p>• Välj DAMNRIPPED PAL för mest exakta TDEE-beräkningar</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
