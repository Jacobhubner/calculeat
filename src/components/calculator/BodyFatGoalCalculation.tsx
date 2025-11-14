import { AlertCircle } from 'lucide-react'
import type { Gender } from '@/lib/types'

interface BodyFatGoalCalculationProps {
  currentWeight: number
  currentBodyFatPercentage: number
  targetBodyFatPercentage: number
  gender?: Gender
}

export default function BodyFatGoalCalculation({
  currentWeight,
  currentBodyFatPercentage,
  targetBodyFatPercentage,
  gender,
}: BodyFatGoalCalculationProps) {
  // Calculate lean mass (fat-free mass)
  const leanMass = currentWeight * (1 - currentBodyFatPercentage / 100)

  // Calculate target weight to achieve target body fat percentage
  const targetWeight = leanMass / (1 - targetBodyFatPercentage / 100)

  // Calculate weight change needed
  const weightChange = targetWeight - currentWeight
  const weightChangeAbs = Math.abs(weightChange)

  // Check if target is realistic
  const minHealthyBF = gender === 'male' ? 5 : 12
  const isUnrealistic = targetBodyFatPercentage < minHealthyBF

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
      <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Kroppsfettmål Beräkning
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div className="bg-white p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-neutral-600 mb-1">Fettfri massa</div>
          <div className="text-xl font-bold text-blue-600">{leanMass.toFixed(1)} kg</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-neutral-600 mb-1">
            Målvikt vid {targetBodyFatPercentage}%
          </div>
          <div className="text-xl font-bold text-cyan-600">{targetWeight.toFixed(1)} kg</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-neutral-600 mb-1">Viktförändring</div>
          <div
            className={`text-xl font-bold ${weightChange > 0 ? 'text-green-600' : 'text-orange-600'}`}
          >
            {weightChange > 0 ? '+' : ''}
            {weightChange.toFixed(1)} kg
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-sm text-neutral-700 bg-white p-3 rounded-lg border border-blue-100">
        {weightChange > 0 ? (
          <p>
            <span className="font-semibold">För att nå {targetBodyFatPercentage}% kroppsfett</span>{' '}
            behöver du <span className="font-semibold text-green-600">öka</span> din vikt med{' '}
            <span className="font-semibold">{weightChangeAbs.toFixed(1)} kg</span> (bygga
            muskelmassa utan att öka kroppsfett).
          </p>
        ) : (
          <p>
            <span className="font-semibold">För att nå {targetBodyFatPercentage}% kroppsfett</span>{' '}
            behöver du <span className="font-semibold text-orange-600">minska</span> din vikt med{' '}
            <span className="font-semibold">{weightChangeAbs.toFixed(1)} kg</span> (förlora
            kroppsfett medan du behåller muskelmassa).
          </p>
        )}
      </div>

      {/* Warning for unrealistic targets */}
      {isUnrealistic && (
        <div className="mt-3 flex gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Varning: Mycket lågt kroppsfett</p>
            <p>
              Ett kroppsfett under {minHealthyBF}% {gender === 'male' ? 'för män' : 'för kvinnor'}{' '}
              kan vara ohälsosamt och påverka hormonbalans, immunförsvar och prestation. Överväg ett
              mer realistiskt mål.
            </p>
          </div>
        </div>
      )}

      {/* Note about assumptions */}
      <div className="mt-3 text-xs text-neutral-500 italic">
        <strong>OBS:</strong> Denna beräkning antar att du behåller all fettfri massa (muskler, ben,
        organ). I verkligheten kan viss muskelmassa förloras under viktnedgång eller vinnas under
        viktuppgång.
      </div>
    </div>
  )
}
