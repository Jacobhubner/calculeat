import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TapeMeasurements } from '@/lib/calculations/bodyComposition'
import { tapeLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { Ruler } from 'lucide-react'

interface TapeMeasurementsSectionProps {
  measurements: TapeMeasurements
  requiredFields: string[]
  onChange: (field: keyof TapeMeasurements, value: number | undefined) => void
}

// Validation ranges for tape measurements (cm)
const measurementRanges: Record<string, { min: number; max: number }> = {
  neck: { min: 20, max: 60 },
  waist: { min: 40, max: 200 },
  hip: { min: 50, max: 200 },
  wrist: { min: 10, max: 30 },
  forearm: { min: 15, max: 50 },
}

export default function TapeMeasurementsSection({
  measurements,
  requiredFields,
  onChange,
}: TapeMeasurementsSectionProps) {
  const handleChange = (field: keyof TapeMeasurements, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onChange(field, numValue)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary-600" />
          Måttbandsmätningar
        </CardTitle>
        <CardDescription>
          Mät omkrets på angivna ställen med måttband. Mät när du står avslappnad och andas normalt.
          Anges i centimeter (cm).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {requiredFields.map(field => {
            const typedField = field as keyof TapeMeasurements
            const range = measurementRanges[field]
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={`tape-${field}`}>
                  {tapeLabels[field]} <span className="text-neutral-500">(cm)</span>
                </Label>
                <Input
                  id={`tape-${field}`}
                  type="number"
                  min={range?.min}
                  max={range?.max}
                  step="0.1"
                  value={measurements[typedField] ?? ''}
                  onChange={e => handleChange(typedField, e.target.value)}
                  placeholder="0.0"
                  className="rounded-xl"
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
