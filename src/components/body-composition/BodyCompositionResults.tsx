import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BodyCompositionMethod } from '@/lib/calculations/bodyComposition'
import { Droplet, Gauge, Save } from 'lucide-react'

interface BodyCompositionResultsProps {
  bodyDensity: number | null
  bodyFatPercentage: number
  selectedMethod: BodyCompositionMethod
  conversionMethod?: 'siri' | 'brozek'
  isEstimatedBMR?: boolean
  onSave: () => void
  isSaving: boolean
}

export default function BodyCompositionResults({
  bodyDensity,
  bodyFatPercentage,
  selectedMethod,
  conversionMethod,
  isEstimatedBMR,
  onSave,
  isSaving,
}: BodyCompositionResultsProps) {
  return (
    <div className="space-y-4">
      {/* Body Density Card - Only for density-based methods */}
      {bodyDensity && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-600" />
              Kroppsdensitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{bodyDensity.toFixed(4)}</div>
            <p className="text-sm text-blue-600 mt-1">
              g/cm³ (med {conversionMethod === 'siri' ? 'Siri' : 'Brozek'}-ekvationen)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Body Fat % Card */}
      <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary-600" />
            Kroppsfett
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="text-4xl font-bold"
            style={{
              color: '#FFB800',
              textShadow:
                '0 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(255,184,0,0.6), 0 0 15px rgba(255,215,0,0.4), 2px 2px 0 rgba(218,165,32,0.5)',
              WebkitTextStroke: '0.5px rgba(184,134,11,0.4)',
            }}
          >
            {bodyFatPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-neutral-600 mt-2">Metod: {selectedMethod}</p>
          {isEstimatedBMR && selectedMethod === 'Reversed Cunningham equation' && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
              ℹ️ Baserat på uppskattat RMR från Mifflin-St Jeor-ekvationen
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={onSave} disabled={isSaving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Sparar...' : 'Spara till profil'}
      </Button>
    </div>
  )
}
