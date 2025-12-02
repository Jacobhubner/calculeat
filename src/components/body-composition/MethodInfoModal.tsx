/**
 * MethodInfoModal - Modal för att visa information om beräkningsmetoder
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getMethodInfo, siriInfo, brozekInfo } from '@/lib/constants/methodInfo'
import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'
import { BookOpen, Calculator, AlertCircle } from 'lucide-react'

interface MethodInfoModalProps {
  method: BodyCompositionMethod | 'siri' | 'brozek' | null
  variation?: MethodVariation
  open: boolean
  onClose: () => void
}

export default function MethodInfoModal({
  method,
  variation,
  open,
  onClose,
}: MethodInfoModalProps) {
  if (!method) return null

  // Special handling for Siri and Brozek
  const info =
    method === 'siri'
      ? siriInfo
      : method === 'brozek'
        ? brozekInfo
        : getMethodInfo(method as BodyCompositionMethod, variation)

  if (!info) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary-600" />
            {info.title}
          </DialogTitle>
          {info.genderSpecific && info.genderSpecific !== 'both' && (
            <DialogDescription>
              {info.genderSpecific === 'male' ? '👨 Endast för män' : '👩 Endast för kvinnor'}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Beskrivning */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-neutral-900">
              <AlertCircle className="h-4 w-4" />
              Beskrivning
            </h4>
            <p className="text-sm text-neutral-700 leading-relaxed">{info.description}</p>
          </div>

          {/* Formel */}
          {info.formula && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-neutral-900">
                <Calculator className="h-4 w-4" />
                Formel
              </h4>
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
                <code className="text-xs md:text-sm text-neutral-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {info.formula}
                </code>
              </div>
            </div>
          )}

          {/* Krävda mätningar */}
          {info.requiredMeasurements && info.requiredMeasurements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-neutral-900">Krävda mätningar</h4>
              <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                {info.requiredMeasurements.map((measurement, index) => (
                  <li key={index}>{measurement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Returnerar densitet? */}
          {info.returnsDensity !== undefined && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-900">
                {info.returnsDensity ? (
                  <>
                    <span className="font-semibold">Returnerar kroppsdensitet</span> - Konverteras
                    sedan till kroppsfett% med Siri eller Brozek ekvationen.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Returnerar kroppsfett% direkt</span> - Ingen
                    densitetskonvertering behövs.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Anteckningar */}
          {info.notes && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <h4 className="font-semibold mb-1 text-amber-900 text-sm">Viktigt att veta</h4>
              <p className="text-sm text-amber-800 leading-relaxed">{info.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
