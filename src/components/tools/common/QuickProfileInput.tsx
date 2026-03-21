import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface QuickProfileInputProps {
  field: keyof Profile
  label: string
  type?: 'number' | 'date' | 'select' | 'text'
  options?: Array<{ value: string; label: string }>
  onSave: (data: Partial<Profile>) => Promise<void>
  disabled?: boolean
}

export default function QuickProfileInput({
  field,
  label,
  type = 'number',
  options,
  onSave,
  disabled = false,
}: QuickProfileInputProps) {
  const { t } = useTranslation('tools')
  const [value, setValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!value) {
      toast.error(t('quickProfile.errors.emptyValue'))
      return
    }

    setIsSaving(true)
    try {
      // Convert value to appropriate type
      let convertedValue: string | number | Date = value
      if (type === 'number') {
        convertedValue = parseFloat(value)
        if (isNaN(convertedValue)) {
          toast.error(t('quickProfile.errors.invalidNumber'))
          return
        }
        if (convertedValue <= 0) {
          toast.error(t('quickProfile.errors.mustBePositive'))
          return
        }
      }

      await onSave({ [field]: convertedValue })

      setSaved(true)
      toast.success(t('quickProfile.successSaved', { label }))

      // Reset saved state after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving field:', error)
      toast.error(t('quickProfile.errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !isSaving) {
      handleSave()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor={`quick-${field}`} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {type === 'select' && options ? (
          <Select
            id={`quick-${field}`}
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={disabled || isSaving}
            className="mt-1"
          >
            <option value="">{t('quickProfile.select')}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id={`quick-${field}`}
            type={type}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSaving}
            placeholder={t('quickProfile.placeholder', { label: label.toLowerCase() })}
            className="mt-1"
          />
        )}
      </div>
      <Button
        onClick={handleSave}
        disabled={disabled || isSaving || !value || saved}
        size="sm"
        className="mb-0.5"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            {t('quickProfile.saving')}
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            {t('quickProfile.saved')}
          </>
        ) : (
          t('quickProfile.save')
        )}
      </Button>
    </div>
  )
}
