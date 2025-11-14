import { AlertCircle, Calendar, Clock } from 'lucide-react'
import type { Gender } from '@/lib/types'

interface BodyFatGoalCalculationProps {
  currentWeight: number
  currentBodyFatPercentage: number
  targetBodyFatPercentage: number
  gender?: Gender
  tdee?: number
  calorieIntake?: number
}

export default function BodyFatGoalCalculation({
  currentWeight,
  currentBodyFatPercentage,
  targetBodyFatPercentage,
  gender,
  tdee,
  calorieIntake,
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

  // Calculate time to reach target (based on Excel formula H16:M18)
  // Formula: (weight_change_kg × 7700 kcal/kg) / daily_deficit
  const hasTimeCalculation = tdee && calorieIntake && tdee !== calorieIntake
  let daysToGoalMin = 0
  let daysToGoalMax = 0
  let estimatedDate: Date | null = null

  if (hasTimeCalculation && weightChange !== 0) {
    const dailyDeficit = Math.abs(tdee - calorieIntake)
    const totalCaloriesNeeded = Math.abs(weightChange) * 7700 // 7700 kcal per kg body weight

    // Calculate range (min and max based on ±10% variance)
    const daysAverage = totalCaloriesNeeded / dailyDeficit
    daysToGoalMin = Math.round(daysAverage * 0.9)
    daysToGoalMax = Math.round(daysAverage * 1.1)

    // Calculate estimated date (average of min and max)
    const avgDays = (daysToGoalMin + daysToGoalMax) / 2
    estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + avgDays)
  }

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

      {/* Time to reach target - only show if TDEE and calorie intake available */}
      {hasTimeCalculation && weightChange !== 0 && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Days to goal */}
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-xs text-neutral-600 mb-1">
                <Clock className="h-4 w-4" />
                <span>Tid till mål</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {daysToGoalMin} – {daysToGoalMax} dagar
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                ≈ {Math.round((daysToGoalMin + daysToGoalMax) / 2 / 7)} veckor
              </div>
            </div>

            {/* Estimated date */}
            {estimatedDate && (
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Uppskattat datum</span>
                </div>
                <div className="text-lg font-bold text-cyan-600">
                  {estimatedDate.toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-600 bg-blue-50 p-2 rounded border border-blue-100">
            💡 <strong>Tidsberäkning baserad på:</strong> TDEE {tdee} kcal, Intag {calorieIntake}{' '}
            kcal, Dagligt {weightChange > 0 ? 'överskott' : 'underskott'}{' '}
            {Math.abs(tdee! - calorieIntake!)} kcal
          </div>
        </div>
      )}

      {/* Note about assumptions */}
      <div className="mt-3 text-xs text-neutral-500 italic">
        <strong>OBS:</strong> Denna beräkning antar att du behåller all fettfri massa (muskler, ben,
        organ). I verkligheten kan viss muskelmassa förloras under viktnedgång eller vinnas under
        viktuppgång. Tidsberäkningar är uppskattningar baserade på genomsnittliga värden.
      </div>
    </div>
  )
}
