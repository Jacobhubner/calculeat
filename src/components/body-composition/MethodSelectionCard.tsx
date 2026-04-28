import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { BodyCompositionMethod } from '@/lib/calculations/bodyComposition'
import {
  methodCategories,
  methodNameTranslations,
  filterMethodsByGender,
} from '@/lib/helpers/bodyCompositionHelpers'
import type { Gender } from '@/lib/types'
import { Calculator, Info } from 'lucide-react'
import MethodInfoModal from './MethodInfoModal'

interface MethodSelectionCardProps {
  selectedMethod: BodyCompositionMethod | ''
  onMethodChange: (method: BodyCompositionMethod | '') => void
  gender?: Gender
}

export default function MethodSelectionCard({
  selectedMethod,
  onMethodChange,
  gender,
}: MethodSelectionCardProps) {
  const { t } = useTranslation('body')
  const [showInfo, setShowInfo] = useState(false)

  const methodNameKeyMap: Record<string, string> = {
    'Jackson/Pollock 3 Caliper Method (Male)': 'jp3male',
    'Jackson/Pollock 3 Caliper Method (Female)': 'jp3female',
    'Jackson/Pollock 4 Caliper Method': 'jp4',
    'Jackson/Pollock 7 Caliper Method': 'jp7',
    'Durnin/Womersley Caliper Method': 'durnin',
    'Parillo Caliper Method': 'parillo',
    'Covert Bailey Measuring Tape Method': 'covertBailey',
    'U.S. Navy Body Fat Formula': 'usNavy',
    'YMCA Measuring Tape Method': 'ymca',
    'Modified YMCA Measuring Tape Method': 'ymcaModified',
    'Heritage BMI to Body Fat Method': 'heritage',
    'Reversed Cunningham equation': 'cunningham',
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary-50 to-accent-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary-600" />
            {t('methodSelection.title')}
          </CardTitle>
          <CardDescription>{t('methodSelection.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="method-select">{t('methodSelection.label')}</Label>
                <Select
                  id="method-select"
                  value={selectedMethod}
                  onChange={e => onMethodChange(e.target.value as BodyCompositionMethod | '')}
                  className="w-full"
                >
                  <option value="">{t('methodSelection.placeholder')}</option>

                  {/* Caliper Methods */}
                  <optgroup
                    label={t('methodCategories.caliper', {
                      defaultValue: methodCategories.caliper.label,
                    })}
                  >
                    {filterMethodsByGender(methodCategories.caliper.methods, gender).map(method => (
                      <option key={method} value={method}>
                        {t(`methodNames.${methodNameKeyMap[method]}`, {
                          defaultValue: methodNameTranslations[method],
                        })}
                      </option>
                    ))}
                  </optgroup>

                  {/* Tape Methods */}
                  <optgroup
                    label={t('methodCategories.tape', {
                      defaultValue: methodCategories.tape.label,
                    })}
                  >
                    {filterMethodsByGender(methodCategories.tape.methods, gender).map(method => (
                      <option key={method} value={method}>
                        {t(`methodNames.${methodNameKeyMap[method]}`, {
                          defaultValue: methodNameTranslations[method],
                        })}
                      </option>
                    ))}
                  </optgroup>

                  {/* Profile Methods */}
                  <optgroup
                    label={t('methodCategories.profile', {
                      defaultValue: methodCategories.profile.label,
                    })}
                  >
                    {filterMethodsByGender(methodCategories.profile.methods, gender).map(method => (
                      <option key={method} value={method}>
                        {t(`methodNames.${methodNameKeyMap[method]}`, {
                          defaultValue: methodNameTranslations[method],
                        })}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </div>

              {/* Info button - only show when method is selected */}
              {selectedMethod && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInfo(true)}
                  className="flex items-center gap-1.5"
                  title={t('methodSelection.showInfo')}
                >
                  <Info className="h-4 w-4" />
                  {t('methodSelection.infoButton')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Modal */}
      <MethodInfoModal
        method={selectedMethod || null}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </>
  )
}
