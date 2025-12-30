import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TapeMeasurements } from '@/lib/calculations/bodyComposition'
import { tapeLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { tapeDescriptions } from '@/lib/constants/measurementDescriptions'
import { Info, Ruler } from 'lucide-react'

interface TapeMeasurementsSectionProps {
  measurements: TapeMeasurements
  requiredFields?: string[]
  showAll?: boolean // For Workflow 2: show all fields
  onChange: (field: keyof TapeMeasurements, value: number | undefined) => void
}

// Validation ranges for tape measurements (cm)
const measurementRanges: Record<string, { min: number; max: number }> = {
  neck: { min: 20, max: 60 },
  waist: { min: 40, max: 200 },
  hip: { min: 50, max: 200 },
  wrist: { min: 10, max: 30 },
  ankle: { min: 15, max: 40 },
  forearm: { min: 15, max: 50 },
  thighCirc: { min: 30, max: 100 },
  calfCirc: { min: 20, max: 70 },
}

export default function TapeMeasurementsSection({
  measurements,
  requiredFields = [],
  showAll = false,
  onChange,
}: TapeMeasurementsSectionProps) {
  const handleChange = (field: keyof TapeMeasurements, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onChange(field, numValue)
  }

  // Check if a value is outside the valid range
  const isInvalid = (field: keyof TapeMeasurements) => {
    const value = measurements[field]
    if (value === undefined || value === null) return false

    const range = measurementRanges[field as string]
    if (!range) return false

    return value < range.min || value > range.max
  }

  // Get validation error message
  const getErrorMessage = (field: keyof TapeMeasurements) => {
    const range = measurementRanges[field as string]
    if (!range) return ''
    return `Måste vara mellan ${range.min} och ${range.max} cm`
  }

  // All possible tape fields
  const allFields: Array<keyof TapeMeasurements> = [
    'neck',
    'waist',
    'hip',
    'wrist',
    'ankle',
    'forearm',
    'thighCirc',
    'calfCirc',
  ]

  const fieldsToShow = showAll ? allFields : (requiredFields as Array<keyof TapeMeasurements>)

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary-600" />
            Måttbandsmätningar
          </CardTitle>
          <CardDescription>
            Mät omkrets på angivna ställen med måttband. Mät när du står avslappnad och andas
            normalt. Se till att måttbandet inte sitter för hårt eller för löst och att det ligger
            plant mot huden. Anges i centimeter (cm).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldsToShow.map(field => {
              const range = measurementRanges[field as string]
              const isRequired = requiredFields.includes(field as string)
              const invalid = isInvalid(field)
              const description = tapeDescriptions[field as string]
              return (
                <div key={field} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`tape-${field}`}>
                      {tapeLabels[field as string]} <span className="text-neutral-500">(cm)</span>
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
                    id={`tape-${field}`}
                    type="number"
                    min={range?.min}
                    max={range?.max}
                    step="0.1"
                    value={measurements[field] ?? ''}
                    onChange={e => handleChange(field, e.target.value)}
                    placeholder="0.0"
                    className={
                      invalid
                        ? 'rounded-xl border-red-500 focus-visible:ring-red-500'
                        : 'rounded-xl'
                    }
                  />
                  {invalid && <p className="text-sm text-red-500">{getErrorMessage(field)}</p>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
