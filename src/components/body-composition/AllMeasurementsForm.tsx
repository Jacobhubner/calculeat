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
  return (
    <div className="space-y-6">
      <Card className="bg-primary-50 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary-600" />
            Hur fungerar detta?
          </CardTitle>
          <CardDescription>
            Fyll i alla mått du har tillgängliga nedan. Systemet kommer automatiskt att beräkna alla
            metoder som är möjliga baserat på dina mätningar och visa resultaten i en
            jämförelsetabell.
          </CardDescription>
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
