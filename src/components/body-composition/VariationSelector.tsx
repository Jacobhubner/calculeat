import { Label } from '@/components/ui/label'
import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'
import type { Gender } from '@/lib/types'
import { getMethodVariations } from '@/lib/helpers/bodyCompositionHelpers'

interface VariationSelectorProps {
  method: BodyCompositionMethod
  gender: Gender
  selectedVariation?: MethodVariation
  onChange: (variation: MethodVariation) => void
}

export default function VariationSelector({
  method,
  gender,
  selectedVariation,
  onChange,
}: VariationSelectorProps) {
  const variations = getMethodVariations(method, gender)

  // Don't show selector if method doesn't have variations
  if (variations.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="variation-select">Välj variation</Label>
      <select
        id="variation-select"
        value={selectedVariation || variations[0]}
        onChange={e => onChange(e.target.value as MethodVariation)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        {variations.map(variation => (
          <option key={variation} value={variation}>
            {variation}
          </option>
        ))}
      </select>
      <p className="text-xs text-neutral-500">
        Olika variationer använder olika kombinationer av mätningar och formler
      </p>
    </div>
  )
}
