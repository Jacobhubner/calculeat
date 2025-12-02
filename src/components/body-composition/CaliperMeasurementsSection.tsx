import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CaliperMeasurements } from '@/lib/calculations/bodyComposition'
import { caliperLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { Ruler } from 'lucide-react'

interface CaliperMeasurementsSectionProps {
  measurements: CaliperMeasurements
  requiredFields?: string[]
  showAll?: boolean // For Workflow 2: show all fields
  onChange: (field: keyof CaliperMeasurements, value: number | undefined) => void
}

export default function CaliperMeasurementsSection({
  measurements,
  requiredFields = [],
  showAll = false,
  onChange,
}: CaliperMeasurementsSectionProps) {
  const handleChange = (field: keyof CaliperMeasurements, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onChange(field, numValue)
  }

  // All possible caliper fields
  const allFields: Array<keyof CaliperMeasurements> = [
    'chest',
    'abdominal',
    'thigh',
    'tricep',
    'subscapular',
    'suprailiac',
    'midaxillary',
    'bicep',
    'lowerBack',
    'calf',
  ]

  const fieldsToShow = showAll ? allFields : (requiredFields as Array<keyof CaliperMeasurements>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary-600" />
          Kalipermätningar
        </CardTitle>
        <CardDescription>
          Mät hudveck med kaliper på angivna ställen. Mät tre gånger och använd medelvärdet. Anges i
          millimeter (mm).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fieldsToShow.map(field => {
            const isRequired = requiredFields.includes(field as string)
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={`caliper-${field}`}>
                  {caliperLabels[field as string]} <span className="text-neutral-500">(mm)</span>
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={`caliper-${field}`}
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={measurements[field] ?? ''}
                  onChange={e => handleChange(field, e.target.value)}
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
