import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Calculator } from 'lucide-react'
import { TDEESourceBadge } from './TDEESourceBadge'
import { useTDEEStatus } from '@/hooks'
import type { UserProfile } from '@/lib/types'

interface TDEEStatusCardProps {
  profile: UserProfile
}

export function TDEEStatusCard({ profile }: TDEEStatusCardProps) {
  const navigate = useNavigate()
  const statusInfo = useTDEEStatus(profile)

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Okänt datum'
    const date = new Date(dateString)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) return 'Idag'
    if (daysDiff === 1) return 'Igår'
    if (daysDiff < 7) return `${daysDiff} dagar sedan`
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} veckor sedan`
    return `${Math.floor(daysDiff / 30)} månader sedan`
  }

  // Get calculation method description
  const getCalculationMethod = () => {
    const snapshot = profile.tdee_calculation_snapshot
    if (!snapshot) return 'Okänd metod'

    const parts: string[] = []
    if (snapshot.bmr_formula) {
      // Shorten formula names
      const shortFormula = snapshot.bmr_formula
        .replace(' equation', '')
        .replace('Mifflin-St Jeor', 'Mifflin')
        .replace('Harris-Benedict', 'H-B')
      parts.push(shortFormula)
    }
    if (snapshot.pal_system) {
      const shortPAL = snapshot.pal_system
        .replace(' PAL values', '')
        .replace('FAO/WHO/UNU based', 'FAO/WHO')
      parts.push(shortPAL)
    }
    return parts.join(' + ') || 'Okänd metod'
  }

  // Get parameters summary
  const getParametersSummary = () => {
    const snapshot = profile.tdee_calculation_snapshot
    if (!snapshot) return null

    const parts: string[] = []
    if (snapshot.weight_kg) parts.push(`${snapshot.weight_kg} kg`)
    if (snapshot.activity_level) parts.push(snapshot.activity_level)
    return parts.join(', ')
  }

  // Missing TDEE
  if (statusInfo.status === 'missing') {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">TDEE & Energibehov</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du har inte beräknat ditt TDEE ännu. TDEE används för att beräkna personliga
              kaloriintervall och makrofördelning.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/app/tools/tdee-calculator')} className="w-full">
            <Calculator className="mr-2 h-4 w-4" />
            Beräkna TDEE
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Has TDEE
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">TDEE & Energibehov</CardTitle>
          <TDEESourceBadge statusInfo={statusInfo} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outdated Warning */}
        {statusInfo.shouldUpdate && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{statusInfo.message}</AlertDescription>
          </Alert>
        )}

        {/* TDEE Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-neutral-600 mb-1">BMR</p>
            <p className="text-2xl font-bold text-blue-700">{Math.round(profile.bmr || 0)}</p>
            <p className="text-xs text-neutral-500 mt-1">kcal</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-neutral-600 mb-1">TDEE</p>
            <p className="text-2xl font-bold text-green-700">{Math.round(profile.tdee || 0)}</p>
            <p className="text-xs text-neutral-500 mt-1">kcal</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-neutral-600 mb-1">Kalorimål</p>
            <p className="text-lg font-bold text-orange-700">
              {Math.round(profile.calories_min || 0)}-{Math.round(profile.calories_max || 0)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">kcal</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-600">📊 Beräknad:</span>
            <span className="font-medium">{formatDate(profile.tdee_calculated_at)}</span>
            {statusInfo.daysOld !== undefined && statusInfo.daysOld > 0 && (
              <span className="text-neutral-500">({statusInfo.daysOld} dagar)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600">🔬 Metod:</span>
            <span className="font-medium">{getCalculationMethod()}</span>
          </div>
          {getParametersSummary() && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">⚖️ Baserad på:</span>
              <span className="font-medium">{getParametersSummary()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant={statusInfo.shouldUpdate ? 'default' : 'outline'}
            onClick={() => navigate('/app/tools/tdee-calculator')}
            className="flex-1"
          >
            <Calculator className="mr-2 h-4 w-4" />
            {statusInfo.shouldUpdate ? 'Uppdatera TDEE' : 'Beräkna om'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
