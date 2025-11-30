import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { BodyCompositionMethod } from '@/lib/calculations/bodyComposition'
import { methodCategories } from '@/lib/helpers/bodyCompositionHelpers'
import { Calculator } from 'lucide-react'

interface MethodSelectionCardProps {
  selectedMethod: BodyCompositionMethod | ''
  onMethodChange: (method: BodyCompositionMethod | '') => void
}

export default function MethodSelectionCard({
  selectedMethod,
  onMethodChange,
}: MethodSelectionCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary-50 to-accent-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          Välj beräkningsmetod
        </CardTitle>
        <CardDescription>
          Välj vilken metod du vill använda för att beräkna din kroppsfettsprocent. Olika metoder
          kräver olika mätningar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="method-select">Beräkningsmetod</Label>
          <Select
            id="method-select"
            value={selectedMethod}
            onChange={e => onMethodChange(e.target.value as BodyCompositionMethod | '')}
            className="w-full"
          >
            <option value="">Välj en metod...</option>

            {/* Caliper Methods */}
            <optgroup label={methodCategories.caliper.label}>
              {methodCategories.caliper.methods.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </optgroup>

            {/* Tape Methods */}
            <optgroup label={methodCategories.tape.label}>
              {methodCategories.tape.methods.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </optgroup>

            {/* Profile Methods */}
            <optgroup label={methodCategories.profile.label}>
              {methodCategories.profile.methods.map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
