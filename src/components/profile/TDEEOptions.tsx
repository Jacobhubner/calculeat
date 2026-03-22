/**
 * TDEEOptions - Visar två val för att ange TDEE
 * Val 1: Navigate till TDEE calculator
 * Val 2: Ange TDEE manuellt (inline)
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Edit3 } from 'lucide-react'
import ManualTDEEEntry from './ManualTDEEEntry'

import type { Gender } from '@/lib/types'

interface TDEEOptionsProps {
  initialWeight?: number
  height?: number
  birthDate?: string
  gender?: Gender | ''
  tdee?: number
  bodyFatPercentage?: number
  onTDEEChange: (data: {
    tdee: number
    bodyFat?: number
    baseline_bmr?: number
    weight_kg?: number
    tdee_source: string
    tdee_calculated_at: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot: any
    calorie_goal: string
    calories_min: number
    calories_max: number
    accumulated_at?: number
  }) => void
  onBeforeNavigate?: () => Promise<void>
}

export default function TDEEOptions({
  initialWeight,
  height: _height,
  birthDate: _birthDate,
  gender: _gender,
  tdee,
  bodyFatPercentage,
  onTDEEChange,
  onBeforeNavigate,
}: TDEEOptionsProps) {
  const { t } = useTranslation('profile')
  const navigate = useNavigate()
  const [showManualEntry, setShowManualEntry] = useState(false)

  const handleCalculateTDEE = async () => {
    // Save profile before navigating
    if (onBeforeNavigate) {
      await onBeforeNavigate()
    }
    navigate('/app/tools/tdee-calculator')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Calculate TDEE */}
        <Card className="border-2 border-primary-200 hover:border-primary-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary-600" />
              {t('tdeeOptions.calculateTitle')}
            </CardTitle>
            <CardDescription>{t('tdeeOptions.calculateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCalculateTDEE} className="w-full" size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              {t('tdeeOptions.calculateButton')}
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Manual TDEE Entry */}
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-blue-600" />
              {t('tdeeOptions.manualTitle')}
            </CardTitle>
            <CardDescription>{t('tdeeOptions.manualDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowManualEntry(!showManualEntry)}
              variant={showManualEntry ? 'secondary' : 'outline'}
              className="w-full"
              size="lg"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {showManualEntry ? t('tdeeOptions.hideForm') : t('tdeeOptions.showForm')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Form - shown inline when activated */}
      {showManualEntry && (
        <div className="mt-4">
          <ManualTDEEEntry
            initialWeight={initialWeight}
            tdee={tdee}
            bodyFatPercentage={bodyFatPercentage}
            onTDEEChange={onTDEEChange}
          />
        </div>
      )}
    </div>
  )
}
