import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CaliperMeasurements } from '@/lib/calculations/bodyComposition'
import { caliperLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { caliperDescriptions } from '@/lib/constants/measurementDescriptions'
import { Info, Ruler } from 'lucide-react'

interface CaliperMeasurementsSectionProps {
  measurements: CaliperMeasurements
  requiredFields?: string[]
  showAll?: boolean // For Workflow 2: show all fields
  onChange: (field: keyof CaliperMeasurements, value: number | undefined) => void
}

// Validation range for caliper measurements (mm)
const CALIPER_MIN = 0
const CALIPER_MAX = 100

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

  // Check if a value is outside the valid range
  const isInvalid = (field: keyof CaliperMeasurements) => {
    const value = measurements[field]
    if (value === undefined || value === null) return false
    return value < CALIPER_MIN || value > CALIPER_MAX
  }

  // Get validation error message
  const getErrorMessage = () => {
    return `Måste vara mellan ${CALIPER_MIN} och ${CALIPER_MAX} mm`
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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary-600" />
            Kalipermätningar
          </CardTitle>
          <CardDescription>
            Hudvecksmätningar utförs på kroppens högra sida. Se till att hudvecket greppas korrekt
            med tumme och pekfinger, utan att dra med muskelvävnad. Kalipern ska placeras vinkelrätt
            mot hudvecket, cirka 1 cm från fingrarna, och avläsningen ska göras efter 1–2 sekunder
            när trycket stabiliserats. Ta varje hudveck minst två gånger och använd medelvärdet. Om
            skillnaden &gt;1–2 mm, mät även en tredje gång. Anges i millimeter (mm).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldsToShow.map(field => {
              const isRequired = requiredFields.includes(field as string)
              const invalid = isInvalid(field)
              const description = caliperDescriptions[field as string]
              return (
                <div key={field} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`caliper-${field}`}>
                      {caliperLabels[field as string]}{' '}
                      <span className="text-neutral-500">(mm)</span>
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-line">
                          {description}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Input
                    id={`caliper-${field}`}
                    type="number"
                    min={CALIPER_MIN}
                    max={CALIPER_MAX}
                    step="0.5"
                    value={measurements[field] ?? ''}
                    onChange={e => handleChange(field, e.target.value)}
                    placeholder="0.0"
                    className={
                      invalid
                        ? 'rounded-xl border-red-500 focus-visible:ring-red-500'
                        : 'rounded-xl'
                    }
                  />
                  {invalid && <p className="text-sm text-red-500">{getErrorMessage()}</p>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
