import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import type { TapeMeasurements } from '@/lib/calculations/bodyComposition'
import { tapeLabels } from '@/lib/helpers/bodyCompositionHelpers'
import { tapeDescriptions } from '@/lib/constants/measurementDescriptions'
import { Info, Ruler, X } from 'lucide-react'

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
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{ title: string; description: string } | null>(
    null
  )

  const handleChange = (field: keyof TapeMeasurements, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onChange(field, numValue)
  }

  const handleInfoClick = (field: keyof TapeMeasurements) => {
    const description = tapeDescriptions[field as string]
    if (description) {
      setModalContent({
        title: tapeLabels[field as string],
        description,
      })
      setShowModal(true)
    }
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
    <>
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
                      <button
                        type="button"
                        onClick={() => handleInfoClick(field)}
                        className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                        aria-label={`Visa information om ${tapeLabels[field as string]}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
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

                  // Check if description contains special formatting (methods or gender-specific)
                  const hasMethodLabels = description.includes('Enligt ') || description.includes(':')
                  const hasMaleInstruction = description.includes('Män:')
                  const hasFemaleInstruction = description.includes('Kvinnor:')
                  const hasBulletPoints = description.includes('• ')

                  if (hasMethodLabels || hasMaleInstruction || hasFemaleInstruction || hasBulletPoints) {
                    type SectionType = 'text' | 'male' | 'female' | 'method' | 'both-genders'
                    const sections: Array<{ type: SectionType; title?: string; content: string }> = []
                    const lines = description.split('\n')
                    let currentSection: string[] = []
                    let currentType: SectionType = 'text'
                    let currentTitle: string | undefined

                    const pushCurrentSection = () => {
                      if (currentSection.length > 0) {
                        sections.push({
                          type: currentType,
                          title: currentTitle,
                          content: currentSection.join('\n').trim(),
                        })
                        currentSection = []
                        currentTitle = undefined
                      }
                    }

                    lines.forEach(line => {
                      const trimmedLine = line.trim()

                      // Check for method labels like "Enligt Casey Butt:", "U.S. Navy kroppsfettformel:", etc.
                      if (
                        trimmedLine.startsWith('Enligt ') ||
                        (trimmedLine.endsWith(':') &&
                          !trimmedLine.startsWith('•') &&
                          !trimmedLine.startsWith('Män:') &&
                          !trimmedLine.startsWith('Kvinnor:') &&
                          !trimmedLine.startsWith('Båda könen:'))
                      ) {
                        pushCurrentSection()
                        currentType = 'method'

                        // Check if there's content after the colon on the same line
                        const colonIndex = trimmedLine.indexOf(':')
                        if (colonIndex !== -1) {
                          currentTitle = trimmedLine.substring(0, colonIndex)
                          const contentAfterColon = trimmedLine.substring(colonIndex + 1).trim()
                          if (contentAfterColon) {
                            currentSection.push(contentAfterColon)
                          }
                        } else {
                          currentTitle = trimmedLine
                        }
                        return
                      }

                      // Check for gender-specific bullets
                      if (trimmedLine.startsWith('• Män:')) {
                        pushCurrentSection()
                        currentType = 'male'
                        currentSection.push(trimmedLine.replace('• Män:', '').trim())
                        return
                      }

                      if (trimmedLine.startsWith('• Kvinnor:')) {
                        pushCurrentSection()
                        currentType = 'female'
                        currentSection.push(trimmedLine.replace('• Kvinnor:', '').trim())
                        return
                      }

                      if (trimmedLine.startsWith('• Båda könen:')) {
                        pushCurrentSection()
                        currentType = 'both-genders'
                        currentSection.push(trimmedLine.replace('• Båda könen:', '').trim())
                        return
                      }

                      // Check for gender labels without bullets - keep as part of method section
                      if (trimmedLine.startsWith('Män:') || trimmedLine.startsWith('Kvinnor:') || trimmedLine.startsWith('Båda könen:')) {
                        // Add to current method section instead of creating new section
                        currentSection.push(line)
                        return
                      }

                      // Empty line - push section and reset to text
                      if (trimmedLine === '') {
                        pushCurrentSection()
                        currentType = 'text'
                        return
                      }

                      // Regular line - add to current section
                      currentSection.push(line)
                    })

                    pushCurrentSection()

                    return (
                      <div className="space-y-4">
                        {sections.map((section, idx) => {
                          if (section.type === 'male') {
                            return (
                              <div
                                key={idx}
                                className="bg-blue-50 border-blue-200 border rounded-lg p-4"
                              >
                                <p className="font-semibold text-blue-700 mb-2">👨 Män</p>
                                <p className="text-blue-900 leading-relaxed">{section.content}</p>
                              </div>
                            )
                          }

                          if (section.type === 'female') {
                            return (
                              <div
                                key={idx}
                                className="bg-pink-50 border-pink-200 border rounded-lg p-4"
                              >
                                <p className="font-semibold text-pink-700 mb-2">👩 Kvinnor</p>
                                <p className="text-pink-900 leading-relaxed">{section.content}</p>
                              </div>
                            )
                          }

                          if (section.type === 'both-genders') {
                            return (
                              <div
                                key={idx}
                                className="bg-purple-50 border-purple-200 border rounded-lg p-4"
                              >
                                <p className="font-semibold text-purple-700 mb-2">👥 Båda könen</p>
                                <p className="text-purple-900 leading-relaxed">{section.content}</p>
                              </div>
                            )
                          }

                          if (section.type === 'method' && section.title) {
                            return (
                              <div
                                key={idx}
                                className="bg-amber-50 border-amber-200 border rounded-lg p-4"
                              >
                                <p className="font-semibold text-amber-700 mb-2">📋 {section.title}</p>
                                {section.content && (
                                  <p className="text-amber-900 leading-relaxed whitespace-pre-line">
                                    {section.content}
                                  </p>
                                )}
                              </div>
                            )
                          }

                          // Regular text
                          return (
                            <p
                              key={idx}
                              className="text-neutral-700 leading-relaxed whitespace-pre-line"
                            >
                              {section.content}
                            </p>
                          )
                        })}
                      </div>
                    )
                  }

                  // No special formatting, just show normal text
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
