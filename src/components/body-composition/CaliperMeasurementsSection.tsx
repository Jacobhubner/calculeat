import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import type { CaliperMeasurements } from '@/lib/calculations/bodyComposition'
import { caliperLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { caliperDescriptions } from '@/lib/constants/measurementDescriptions'
import { Info, Ruler, X } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{ title: string; description: string } | null>(
    null
  )

  const handleChange = (field: keyof CaliperMeasurements, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onChange(field, numValue)
  }

  const handleInfoClick = (field: keyof CaliperMeasurements) => {
    const description = caliperDescriptions[field as string]
    if (description) {
      setModalContent({
        title: caliperLabels[field as string],
        description,
      })
      setShowModal(true)
    }
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
    <>
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
                      <button
                        type="button"
                        onClick={() => handleInfoClick(field)}
                        className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                        aria-label={`Visa information om ${caliperLabels[field as string]}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
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

      {/* Information Modal */}
      {showModal && modalContent && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-br from-primary-500 to-accent-500 text-white px-6 py-4 flex justify-between items-start rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold">{modalContent.title}</h2>
                  <p className="text-sm text-white/90 mt-1">Mätinstruktion</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/90 hover:text-white transition-colors"
                  aria-label="Stäng modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                {(() => {
                  const description = modalContent.description

                  // Check if description contains gender-specific instructions
                  const hasMaleInstruction = description.includes('Män:')
                  const hasFemaleInstruction = description.includes('Kvinnor:')

                  if (hasMaleInstruction || hasFemaleInstruction) {
                    // Split by gender labels and format nicely
                    const parts = description.split(/\n\n(?=Män:|Kvinnor:)/)

                    return (
                      <div className="space-y-4">
                        {parts.map((part, idx) => {
                          const isMale = part.trim().startsWith('Män:')
                          const isFemale = part.trim().startsWith('Kvinnor:')

                          if (isMale || isFemale) {
                            const label = isMale ? 'Män' : 'Kvinnor'
                            const content = part.replace(/^(Män|Kvinnor):\s*/, '').trim()
                            const bgColor = isMale ? 'bg-blue-50' : 'bg-pink-50'
                            const borderColor = isMale ? 'border-blue-200' : 'border-pink-200'
                            const textColor = isMale ? 'text-blue-900' : 'text-pink-900'
                            const labelColor = isMale ? 'text-blue-700' : 'text-pink-700'

                            const emoji = isMale ? '👨' : '👩'
                            return (
                              <div
                                key={idx}
                                className={`${bgColor} ${borderColor} border rounded-lg p-4`}
                              >
                                <p className={`font-semibold ${labelColor} mb-2`}>
                                  {emoji} {label}
                                </p>
                                <p className={`${textColor} leading-relaxed`}>
                                  {content}
                                </p>
                              </div>
                            )
                          }

                          return (
                            <p key={idx} className="text-neutral-700 leading-relaxed">
                              {part.trim()}
                            </p>
                          )
                        })}
                      </div>
                    )
                  }

                  // No gender-specific instructions, just show normal text
                  return (
                    <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                      {description}
                    </p>
                  )
                })()}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 rounded-b-2xl">
                <Button onClick={() => setShowModal(false)} className="w-full">
                  Stäng
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
