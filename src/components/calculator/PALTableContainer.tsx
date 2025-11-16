import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translatePALSystem } from '@/lib/translations'
import type { PALSystem } from '@/lib/types'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import PALTableFAO from './PALTableFAO'
import PALTableDAMNRIPPED from './PALTableDAMNRIPPED'
import PALTableProPhysique from './PALTableProPhysique'
import PALTableFitnessStuff from './PALTableFitnessStuff'
import PALTableBasic from './PALTableBasic'

interface PALTableContainerProps {
  system: PALSystem
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableContainer({ system, register, watch }: PALTableContainerProps) {
  const renderTable = () => {
    switch (system) {
      case 'FAO/WHO/UNU based PAL values':
        return <PALTableFAO register={register} watch={watch} />
      case 'DAMNRIPPED PAL values':
        return <PALTableDAMNRIPPED register={register} watch={watch} />
      case 'Pro Physique PAL values':
        return <PALTableProPhysique register={register} watch={watch} />
      case 'Fitness Stuff PAL values':
        return <PALTableFitnessStuff register={register} watch={watch} />
      case 'Basic internet PAL values':
        return <PALTableBasic register={register} watch={watch} />
      case 'Custom PAL':
        return register ? (
          <div className="space-y-2">
            <label htmlFor="custom_pal" className="block text-sm font-medium text-neutral-700">
              Anpassat PAL-värde (1.0 - 3.0) <span className="text-red-600">*</span>
            </label>
            <input
              id="custom_pal"
              type="number"
              min={1.0}
              max={3.0}
              step={0.1}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('custom_pal', { valueAsNumber: true })}
            />
            <p className="text-xs text-neutral-500">
              Ange ditt eget PAL-värde om du vet det. Vanliga värden ligger mellan 1.2
              (stillasittande) och 2.5 (mycket aktiv).
            </p>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-neutral-600">
            <p>Ange ditt eget PAL-värde i fältet nedan (1.0 - 3.0)</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          📊 {translatePALSystem(system)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{renderTable()}</CardContent>
    </Card>
  )
}
