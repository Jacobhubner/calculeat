import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPALSystemDescription, translatePALSystem } from '@/lib/translations'
import type { PALSystem } from '@/lib/types'
import PALTableFAO from './PALTableFAO'
import PALTableDAMNRIPPED from './PALTableDAMNRIPPED'
import PALTableProPhysique from './PALTableProPhysique'
import PALTableFitnessStuff from './PALTableFitnessStuff'
import PALTableBasic from './PALTableBasic'

interface PALTableContainerProps {
  system: PALSystem
}

export default function PALTableContainer({ system }: PALTableContainerProps) {
  const renderTable = () => {
    switch (system) {
      case 'FAO/WHO/UNU based PAL values':
        return <PALTableFAO />
      case 'DAMNRIPPED PAL values':
        return <PALTableDAMNRIPPED />
      case 'Pro Physique PAL values':
        return <PALTableProPhysique />
      case 'Fitness Stuff PAL values':
        return <PALTableFitnessStuff />
      case 'Basic internet PAL values':
        return <PALTableBasic />
      case 'Custom PAL':
        return (
          <div className="p-4 text-center text-sm text-neutral-600">
            <p>Ange ditt eget PAL-värde i fältet nedan (1.0 - 3.0)</p>
          </div>
        )
      default:
        return null
    }
  }

  const description = getPALSystemDescription(system)

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          📊 {translatePALSystem(system)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderTable()}

        {description && (
          <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
