import DashboardLayout from '@/components/layout/DashboardLayout'
import { Activity } from 'lucide-react'

export default function BodyCompositionPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary-600" />
          Kroppssammansättning
        </h1>
        <p className="text-neutral-600">
          Beräkna din kroppsfettsprocent och använd makrokonverteraren för att planera dina
          måltider.
        </p>
      </div>

      {/* Body Composition Tools */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Placeholder for Body Composition Tools */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">Kroppssammansättningsverktyg kommer snart...</p>
          <p className="text-sm text-neutral-500 mt-2">
            Här kommer du kunna beräkna din kroppsfettsprocent med 12 olika metoder, använda
            makrokonverterare och se bildgalleri för olika kroppsfettnivåer.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
