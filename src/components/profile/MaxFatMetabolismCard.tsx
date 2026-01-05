/**
 * MaxFatMetabolismCard - Visa maximal fettmetabolism för aktiv profil
 * Visas under resultatkortet i sidopanelen
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import { Flame, Info, X } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { calculateFatFreeMass } from '@/lib/calculations/bodyComposition'
import { calculateMaxFatMetabolism } from '@/lib/calculations/ffmiCalculations'
import MaxFatMetabolismContent from '@/components/info/MaxFatMetabolismContent'

interface MaxFatMetabolismCardProps {
  profile: Profile | null
}

export default function MaxFatMetabolismCard({ profile }: MaxFatMetabolismCardProps) {
  const [showModal, setShowModal] = useState(false)

  if (!profile) return null

  const tdee = profile.tdee

  // Calculate max fat metabolism if we have body fat %, weight, and TDEE
  let maxFatMetabolism = null
  if (profile.body_fat_percentage && profile.weight_kg && tdee) {
    const leanBodyMass = calculateFatFreeMass(profile.weight_kg, profile.body_fat_percentage)
    maxFatMetabolism = calculateMaxFatMetabolism(leanBodyMass, profile.weight_kg, tdee)
  }

  // Don't show if we don't have the required data
  if (!maxFatMetabolism) return null

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-600" />
            Maximal fettmetabolism
          </CardTitle>
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Visa information om Maximal fettmetabolism"
          >
            <Info className="h-4 w-4 text-neutral-600" />
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-neutral-900">
              {maxFatMetabolism.practicalMax} kcal/dag
            </p>
            <p className="text-xs text-neutral-500">{maxFatMetabolism.percentOfTDEE}% av TDEE</p>
          </div>
        </CardContent>
      </Card>

      {/* Information Modal */}
      {showModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-primary-500 to-accent-500 text-white px-6 py-4 flex justify-between items-start rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold">Maximal fettmetabolism</h2>
                  <p className="text-sm text-white/90 mt-1">
                    Vetenskaplig bakgrund och praktisk tillämpning
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/90 hover:text-white transition-colors"
                  aria-label="Stäng modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <MaxFatMetabolismContent />
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 rounded-b-2xl">
                <Button onClick={() => setShowModal(false)} className="w-full">
                  Stäng
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
