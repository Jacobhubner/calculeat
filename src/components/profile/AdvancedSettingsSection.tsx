/**
 * AdvancedSettingsSection - Kollapsbar sektion för avancerade inställningar
 * Innehåller BasicInfoFields
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, ChevronDown } from 'lucide-react'
import BasicInfoFields from './BasicInfoFields'
import type { Gender } from '@/lib/types'

interface AdvancedSettingsSectionProps {
  // BasicInfoFields props
  birthDate?: string
  gender?: Gender | ''
  height?: number
  initialWeight?: number
  onBirthDateChange: (birthDate: string) => void
  onGenderChange: (gender: Gender | '') => void
  onHeightChange: (height: number | undefined) => void
  onInitialWeightChange: (weight: number | undefined) => void
  locked: boolean
  showLockNotice: boolean
}

export default function AdvancedSettingsSection({
  birthDate,
  gender,
  height,
  initialWeight,
  onBirthDateChange,
  onGenderChange,
  onHeightChange,
  onInitialWeightChange,
  locked,
  showLockNotice,
}: AdvancedSettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(false) // Stängd som default

  return (
    <Card className="border-2 border-neutral-300">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-neutral-600" />
            Avancerade inställningar
          </CardTitle>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          <BasicInfoFields
            birthDate={birthDate}
            gender={gender}
            height={height}
            initialWeight={initialWeight}
            onBirthDateChange={onBirthDateChange}
            onGenderChange={onGenderChange}
            onHeightChange={onHeightChange}
            onInitialWeightChange={onInitialWeightChange}
            locked={locked}
            showLockNotice={showLockNotice}
          />
        </CardContent>
      )}
    </Card>
  )
}
