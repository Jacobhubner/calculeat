import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/lib/types'
import QuickProfileInput from './QuickProfileInput'
import { useTranslation } from 'react-i18next'

interface MissingDataCardProps {
  title?: string
  description?: string
  missingFields: Array<{
    key: keyof Profile
    label: string
    type?: 'number' | 'date' | 'select'
    options?: Array<{ label: string; value: string }>
  }>
  onSave: (data: Partial<Profile>) => Promise<void>
}

export default function MissingDataCard({
  title,
  description,
  missingFields,
  onSave,
}: MissingDataCardProps) {
  const { t } = useTranslation('tools')
  const resolvedTitle = title ?? t('missingData.title')
  const resolvedDescription = description ?? t('missingData.description')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (missingFields.length === 0) return null

  const handleSave = async (fieldData: Partial<Profile>) => {
    setIsSaving(true)
    try {
      await onSave(fieldData)
      // Automatically collapse after successful save
      setIsExpanded(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-orange-900">{resolvedTitle}</CardTitle>
              <CardDescription className="text-orange-700 mt-1">{resolvedDescription}</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-700 hover:text-orange-900 hover:bg-orange-100"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {t('missingData.hide')}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {t('missingData.fill')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {missingFields.map(field => (
              <QuickProfileInput
                key={field.key}
                field={field.key}
                label={field.label}
                type={field.type}
                options={field.options}
                onSave={handleSave}
                disabled={isSaving}
              />
            ))}
          </div>
        </CardContent>
      )}

      {!isExpanded && (
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            {missingFields.map(field => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
