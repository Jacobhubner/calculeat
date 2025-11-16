import DashboardLayout from '@/components/layout/DashboardLayout'
import UserProfileForm from '@/components/UserProfileForm'
import MacroModesCard from '@/components/MacroModesCard'
import { User } from 'lucide-react'

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

      <div className="space-y-8">
        {/* Main Profile Form */}
        <UserProfileForm />

        {/* Macro Modes Card */}
        <MacroModesCard />
      </div>
    </DashboardLayout>
  )
}
