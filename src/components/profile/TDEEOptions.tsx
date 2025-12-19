/**
 * TDEEOptions - Visar två val för att ange TDEE
 * Val 1: Navigate till TDEE calculator
 * Val 2: Ange TDEE manuellt (inline)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Edit3 } from 'lucide-react'
import ManualTDEEEntry from './ManualTDEEEntry'

interface TDEEOptionsProps {
  profileId: string
  initialWeight?: number
  onManualTDEESuccess?: () => void
}

export default function TDEEOptions({ profileId, initialWeight, onManualTDEESuccess }: TDEEOptionsProps) {
  const navigate = useNavigate()
  const [showManualEntry, setShowManualEntry] = useState(false)

  const handleCalculateTDEE = () => {
    navigate('/app/tools/tdee-calculator')
  }

  const handleManualSuccess = () => {
    setShowManualEntry(false)
    onManualTDEESuccess?.()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Calculate TDEE */}
        <Card className="border-2 border-primary-200 hover:border-primary-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary-600" />
              Beräkna TDEE
            </CardTitle>
            <CardDescription>
              Använd vår kalkylator för att beräkna ditt TDEE baserat på aktivitetsnivå och träning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCalculateTDEE}
              className="w-full"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Gå till TDEE-kalkylator
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Manual TDEE Entry */}
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Ange TDEE manuellt
            </CardTitle>
            <CardDescription>
              Ange ditt TDEE om du redan känner till det från en annan källa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowManualEntry(!showManualEntry)}
              variant={showManualEntry ? 'secondary' : 'default'}
              className="w-full"
              size="lg"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {showManualEntry ? 'Dölj formulär' : 'Visa formulär'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Manual Entry Form - shown inline when activated */}
      {showManualEntry && (
        <div className="mt-4">
          <ManualTDEEEntry
            profileId={profileId}
            initialWeight={initialWeight}
            onSuccess={handleManualSuccess}
          />
        </div>
      )}
    </div>
  )
}
