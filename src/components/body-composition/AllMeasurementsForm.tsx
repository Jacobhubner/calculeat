import { useTranslation } from 'react-i18next'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CaliperMeasurements, TapeMeasurements } from '@/lib/calculations/bodyComposition'
import { Info } from 'lucide-react'
import CaliperMeasurementsSection from './CaliperMeasurementsSection'
import TapeMeasurementsSection from './TapeMeasurementsSection'

interface AllMeasurementsFormProps {
  caliperMeasurements: CaliperMeasurements
  tapeMeasurements: TapeMeasurements
  onCaliperChange: (field: keyof CaliperMeasurements, value: number | undefined) => void
  onTapeChange: (field: keyof TapeMeasurements, value: number | undefined) => void
}

export default function AllMeasurementsForm({
  caliperMeasurements,
  tapeMeasurements,
  onCaliperChange,
  onTapeChange,
}: AllMeasurementsFormProps) {
  const { t } = useTranslation('body')
  return (
    <div className="space-y-6">
      <Card className="bg-primary-50 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary-600" />
            {t('allMeasurements.howItWorks')}
          </CardTitle>
          <CardDescription>{t('allMeasurements.description')}</CardDescription>
        </CardHeader>
      </Card>

      <CaliperMeasurementsSection
        measurements={caliperMeasurements}
        showAll={true}
        onChange={onCaliperChange}
      />

      <TapeMeasurementsSection
        measurements={tapeMeasurements}
        showAll={true}
        onChange={onTapeChange}
      />
    </div>
  )
}
