import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { WizardStepProps } from './types'

export default function WizardStep4SPA({ data, onUpdate }: WizardStepProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">SPA-faktor</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Spontaneous Physical Activity - dina omedvetna rörelser under dagen
        </p>
      </div>

      {/* Informationsruta - Expanderbar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
        >
          <div className="text-left">
            <h4 className="font-medium text-blue-900">Vad är SPA?</h4>
            {!isExpanded && (
              <p className="text-sm text-blue-800 mt-1">
                SPA (Spontaneous Physical Activity) är en delkomponent av...
              </p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-900 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-900 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-blue-800 mb-3">
              SPA (Spontaneous Physical Activity) är en delkomponent av NEAT (Non-Exercise Activity
              Thermogenesis) och representerar spontan fysisk aktivitet utöver viloomsättningen.
              Litteraturen visar att NEAT kan utgöra ca. 6–10 % av TDEE hos stillasittande
              individer, 15–30 % vid normal till hög vardagsaktivitet, och i extrema fall ≥50 % av
              TDEE (Levine, 2002, 2004, 2015).
            </p>
            <p className="text-sm text-blue-800 mb-3">
              SPA inkluderar omedvetna rörelser såsom fingertrummande, positionsbyten, muskeltonus
              och nervös energi. Vissa personer bränner mycket mer energi genom dessa rörelser än
              andra.
            </p>
            <div className="text-sm text-blue-800 mb-3">
              <p className="font-medium mb-2">SPA-faktor (modellering):</p>
              <ul className="space-y-1 ml-4">
                <li>
                  <strong>1,05 – Låg SPA:</strong> Mycket stillasittande, minimal spontan rörelse
                </li>
                <li>
                  <strong>1,10 – Normal SPA:</strong> Genomsnittlig spontan aktivitet
                  (standardvärde)
                </li>
                <li>
                  <strong>1,20 – Hög SPA:</strong> Mycket orolig, hög spontan rörelse
                </li>
              </ul>
            </div>
            <p className="text-xs text-blue-700 italic">
              Dessa faktorer är konservativa modelleringsvärden applicerade på BMR, baserade på
              NEAT-litteraturen (Levine, 2002, 2004, 2015).
            </p>
          </div>
        )}
      </div>

      {/* SPA Slider */}
      <div>
        <Label htmlFor="spa-factor">Välj din SPA-faktor</Label>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-neutral-600 font-medium">1.05</span>
          <input
            id="spa-factor"
            type="range"
            min="1.05"
            max="1.20"
            step="0.01"
            value={data.spaFactor}
            onChange={e =>
              onUpdate({
                spaFactor: parseFloat(e.target.value),
              })
            }
            className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-sm text-neutral-600 font-medium">1.20</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-3xl font-bold text-primary-600">{data.spaFactor.toFixed(2)}</span>
        </div>
      </div>

      {/* Tips-ruta */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
        <p className="text-sm text-neutral-700">
          <strong>Tips:</strong> De flesta bör använda 1.10 (normalvärde). Använd endast andra
          värden om du vet att du har ovanligt hög eller låg spontan aktivitet.
        </p>
      </div>
    </div>
  )
}
