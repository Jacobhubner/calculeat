import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface MissingFieldAlertProps {
  /** Lista av saknade fält med deras läsbara namn */
  fields: string[]
  /** Valfritt meddelande att visa istället för standardmeddelandet */
  message?: string
  /** Om true, visa inte "Gå till Profil"-knappen */
  hideButton?: boolean
}

/**
 * Alert-komponent som visar saknade profilfält
 * Används för inline validering i verktyg
 *
 * @example
 * const missing = useMissingProfileData(['weight_kg', 'height_cm'])
 * if (missing.length > 0) {
 *   return <MissingFieldAlert fields={missing.map(f => f.label)} />
 * }
 */
export function MissingFieldAlert({ fields, message, hideButton = false }: MissingFieldAlertProps) {
  const { t } = useTranslation('tools')
  const navigate = useNavigate()

  if (fields.length === 0) return null

  const defaultMessage =
    fields.length === 1
      ? t('missingFieldAlert.single', { field: fields[0] })
      : t('missingFieldAlert.multiple', { fields: fields.join(', ') })

  return (
    <Alert variant="warning" className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 mt-0.5" />
      <div className="flex-1">
        <AlertDescription className="mb-3">{message || defaultMessage}</AlertDescription>
        {!hideButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/app/profile')}
            className="border-orange-300 hover:bg-orange-100"
          >
            {t('missingFieldAlert.goToProfile')}
          </Button>
        )}
      </div>
    </Alert>
  )
}

/**
 * Variant som använder useMissingProfileData direkt
 * @example
 * <MissingFieldAlertAuto requiredFields={['weight_kg', 'height_cm']} />
 */
export function MissingFieldAlertAuto({
  requiredFields,
  message,
  hideButton,
}: {
  requiredFields: Array<keyof import('@/lib/types').Profile>
  message?: string
  hideButton?: boolean
}) {
  const { useMissingProfileData } = require('@/hooks/useProfileData')
  const missing = useMissingProfileData(requiredFields)

  if (missing.length === 0) return null

  return (
    <MissingFieldAlert fields={missing.map((f: { label: string }) => f.label)} message={message} hideButton={hideButton} />
  )
}
