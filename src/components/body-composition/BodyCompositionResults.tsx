import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BodyCompositionMethod } from '@/lib/calculations/bodyComposition'
import { getCategoryGradient } from '@/lib/helpers/bodyCompositionHelpers'
import { Droplet, Gauge, Save, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BodyCompositionResultsProps {
  bodyDensity: number | null
  bodyFatPercentage: number
  category: {
    category: string
    color: string
    description: string
  }
  fatFreeMass: number
  fatMass: number
  selectedMethod: BodyCompositionMethod
  conversionMethod?: 'siri' | 'brozek'
  onSave: () => void
  isSaving: boolean
}

export default function BodyCompositionResults({
  bodyDensity,
  bodyFatPercentage,
  category,
  fatFreeMass,
  fatMass,
  selectedMethod,
  conversionMethod,
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
          <div className="text-4xl font-bold bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
            {bodyFatPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-neutral-600 mt-2">Metod: {selectedMethod}</p>
        </CardContent>
      </Card>

      {/* Category Card */}
      <Card className={cn('bg-gradient-to-br', getCategoryGradient(category.color))}>
        <CardHeader>
          <CardTitle>Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{category.category}</div>
          <p className="text-sm mt-1">{category.description}</p>
        </CardContent>
      </Card>

      {/* Additional Metrics Card */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-600" />
            Ytterligare mått
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-700">Fettfri massa (FFM):</span>
            <span className="font-bold text-green-700">{fatFreeMass.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-700">Fettmassa:</span>
            <span className="font-bold text-green-700">{fatMass.toFixed(1)} kg</span>
          </div>
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
