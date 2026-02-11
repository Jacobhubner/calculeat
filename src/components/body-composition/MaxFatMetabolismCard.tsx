interface MaxFatMetabolismCardProps {
  maxFatKcal: number | null
  percentOfTDEE: number | null
}

export function MaxFatMetabolismCard({ maxFatKcal, percentOfTDEE }: MaxFatMetabolismCardProps) {
  if (!maxFatKcal || !percentOfTDEE) {
    return null // Don't render if no data
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          <span className="text-orange-600">Maximum Fat Metabolism</span>
        </h3>
      </div>

      <div className="p-6">
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-baseline justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{maxFatKcal} kcal deficit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{percentOfTDEE}% of your TDEE</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            This represents the maximum rate at which your body can metabolize fat for energy
            (approximately 31 kcal/kg of fat mass per day). Exceeding this deficit may result in
            muscle loss.
          </p>
        </div>
      </div>
    </div>
  )
}
