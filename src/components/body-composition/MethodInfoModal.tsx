/**
 * MethodInfoModal - Modal för att visa information om beräkningsmetoder
 */

import { X } from 'lucide-react'
import { getMethodInfo, siriInfo, brozekInfo } from '@/lib/constants/methodInfo'
import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

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
  if (!open || !method) return null

  // Special handling for Siri and Brozek
  const info =
    method === 'siri'
      ? siriInfo
      : method === 'brozek'
        ? brozekInfo
        : getMethodInfo(method as BodyCompositionMethod, variation)

  if (!info) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{info.title}</h2>
              {info.year && <p className="text-primary-100 mt-1 text-sm">{info.year}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Stäng"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Beskrivning */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Beskrivning</h3>
              <div className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {info.description}
              </div>
            </div>

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

            {/* Denna metod är bättre för */}
            {info.betterFor && info.betterFor.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  Denna metod är bättre för:
                </h3>
                <ul className="space-y-2">
                  {info.betterFor.map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <span className="text-neutral-700 flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Viktigt att veta (för Siri och Brozek) */}
            {info.pros && info.pros.length > 0 && !info.betterFor && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">Viktigt att veta</h3>
                <ul className="space-y-2">
                  {info.pros.map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-amber-600 font-bold mt-1">•</span>
                      <span className="text-amber-900 flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Referenser */}
            {info.references && info.references.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">Referenser</h3>
                <div className="space-y-3">
                  {info.references.map((ref, index) => (
                    <div
                      key={index}
                      className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200"
                    >
                      {ref.startsWith('http') ? (
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 hover:underline break-all"
                        >
                          {ref}
                        </a>
                      ) : (
                        <p className="leading-relaxed">{ref}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anteckningar (fallback för äldre metoder som inte använder nya strukturen) */}
            {info.notes && !info.pros && !info.cons && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <h4 className="font-semibold mb-1 text-amber-900 text-sm">Viktigt att veta</h4>
                <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
                  {info.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
            <Button onClick={onClose} className="w-full">
              Stäng
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
