import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { translatePALSystem } from '@/lib/translations'
import type { PALSystem } from '@/lib/types'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import PALTableFAO from './PALTableFAO'
import PALTableDAMNRIPPED from './PALTableDAMNRIPPED'
import PALTableProPhysique from './PALTableProPhysique'
import PALTableFitnessStuff from './PALTableFitnessStuff'
import PALTableBasic from './PALTableBasic'
import PALTableActivityLevelWizard from './PALTableActivityLevelWizard'

interface PALTableContainerProps {
  system: PALSystem
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
  bmr?: number | null
  weight?: number | null
  tdee?: number | null
}

export default function PALTableContainer({
  system,
  register,
  watch,
  bmr,
  weight,
  tdee,
}: PALTableContainerProps) {
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
      case 'Beräkna din aktivitetsnivå':
        return (
          <PALTableActivityLevelWizard
            register={register}
            watch={watch}
            bmr={bmr}
            weight={weight}
            tdee={tdee}
          />
        )
      case 'Custom PAL': {
        const rawPAL = watch ? parseFloat(watch('custom_pal')) : NaN
        const customPALOutOfRange = !isNaN(rawPAL) && (rawPAL < 1.0 || rawPAL > 2.5)
        return register ? (
          <div className="space-y-2">
            <label htmlFor="custom_pal" className="block text-sm font-medium text-neutral-700">
              Anpassat PAL-värde <span className="text-red-600">*</span>
            </label>
            <input
              id="custom_pal"
              type="number"
              step={0.01}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('custom_pal', { valueAsNumber: true })}
            />
            <p className="text-xs text-neutral-500">
              Ange ditt eget PAL-värde om du vet det. Vanliga värden ligger mellan 1.2
              (stillasittande) och 2.5 (mycket aktiv).
            </p>
            {customPALOutOfRange && (
              <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-600 flex-shrink-0">⚠</span>
                <p className="text-sm text-amber-800">
                  Ovanligt PAL-värde — normalt intervall är 1.0–2.5
                </p>
              </div>
            )}
          </div>
        ) : null
      }
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
