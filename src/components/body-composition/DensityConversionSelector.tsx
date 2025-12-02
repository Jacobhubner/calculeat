import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlaskConical, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import MethodInfoModal from './MethodInfoModal'

interface DensityConversionSelectorProps {
  conversionMethod: 'siri' | 'brozek'
  onMethodChange: (method: 'siri' | 'brozek') => void
}

export default function DensityConversionSelector({
  conversionMethod,
  onMethodChange,
}: DensityConversionSelectorProps) {
  const [showInfo, setShowInfo] = useState<'siri' | 'brozek' | null>(null)

  return (
    <>
      <Card className="bg-gradient-to-br from-accent-50 to-primary-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary-600" />
            Konverteringsmetod
          </CardTitle>
          <CardDescription>
            Välj formel för att konvertera kroppsdensitet till fettprocent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Button
                type="button"
                variant={conversionMethod === 'siri' ? 'default' : 'outline'}
                className={cn(
                  'h-auto py-4 w-full flex flex-col items-center gap-2',
                  conversionMethod === 'siri' && 'bg-primary-600 hover:bg-primary-700'
                )}
                onClick={() => onMethodChange('siri')}
              >
                <span className="font-semibold">Siri</span>
                <span className="text-xs opacity-80">(Standard)</span>
              </Button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setShowInfo('siri')
                }}
                className="absolute -top-2 -right-2 bg-white border border-neutral-200 rounded-full p-1 hover:bg-neutral-50 shadow-sm"
                title="Visa information om Siri"
              >
                <Info className="h-3.5 w-3.5 text-primary-600" />
              </button>
            </div>

            <div className="relative">
              <Button
                type="button"
                variant={conversionMethod === 'brozek' ? 'default' : 'outline'}
                className={cn(
                  'h-auto py-4 w-full flex flex-col items-center gap-2',
                  conversionMethod === 'brozek' && 'bg-primary-600 hover:bg-primary-700'
                )}
                onClick={() => onMethodChange('brozek')}
              >
                <span className="font-semibold">Brozek</span>
                <span className="text-xs opacity-80">(Alternativ)</span>
              </Button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setShowInfo('brozek')
                }}
                className="absolute -top-2 -right-2 bg-white border border-neutral-200 rounded-full p-1 hover:bg-neutral-50 shadow-sm"
                title="Visa information om Brozek"
              >
                <Info className="h-3.5 w-3.5 text-primary-600" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Modal */}
      <MethodInfoModal
        method={showInfo}
        open={showInfo !== null}
        onClose={() => setShowInfo(null)}
      />
    </>
  )
}
