/**
 * ATHistoryCard - Visa historik över Adaptive Thermogenesis
 * Visar hur metabolismen har anpassat sig över tid
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'
import { useATHistory } from '@/hooks'
import { calculateATPercent } from '@/lib/calculations/adaptiveThermogenesis'

interface ATHistoryCardProps {
  profileId: string
  baselineBMR?: number | null
  currentAccumulatedAT?: number
}

export default function ATHistoryCard({ profileId, baselineBMR, currentAccumulatedAT = 0 }: ATHistoryCardProps) {
  const { data: atHistory, isLoading } = useATHistory(profileId)

  // Don't show if no baseline_bmr (AT not enabled)
  if (!baselineBMR) return null

  const atPercent = calculateATPercent(currentAccumulatedAT, baselineBMR)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          Metabolisk Anpassning (AT)
        </CardTitle>
        <CardDescription>Hur din metabolism har anpassat sig över tid</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-neutral-500">Laddar historik...</div>
        ) : atHistory && atHistory.length > 0 ? (
          <div className="space-y-4">
            {/* Simple list view - can be replaced with chart later */}
            <div className="space-y-2">
              {atHistory.slice(-10).reverse().map(entry => {
                const entryPercent = calculateATPercent(entry.accumulated_at, entry.baseline_bmr)
                return (
                  <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        {new Date(entry.calculation_date).toLocaleDateString('sv-SE')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Balans: {entry.calorie_balance_7d > 0 ? '+' : ''}
                        {Math.round(entry.calorie_balance_7d)} kcal/vecka
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold flex items-center gap-1 ${
                          entry.accumulated_at < 0
                            ? 'text-blue-600'
                            : entry.accumulated_at > 0
                              ? 'text-orange-600'
                              : 'text-neutral-600'
                        }`}
                      >
                        {entry.accumulated_at < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : entry.accumulated_at > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : null}
                        {entry.accumulated_at > 0 ? '+' : ''}
                        {Math.round(entry.accumulated_at)} kcal
                      </p>
                      <p className="text-xs text-neutral-500">
                        {entryPercent > 0 ? '+' : ''}
                        {entryPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current status summary */}
            <div className={`p-3 rounded-lg ${currentAccumulatedAT < 0 ? 'bg-blue-50' : currentAccumulatedAT > 0 ? 'bg-orange-50' : 'bg-neutral-50'}`}>
              <p className="text-sm font-semibold mb-1">
                Nuvarande anpassning: {currentAccumulatedAT > 0 ? '+' : ''}
                {Math.round(currentAccumulatedAT)} kcal/dag ({atPercent > 0 ? '+' : ''}
                {atPercent.toFixed(1)}%)
              </p>
              <p className="text-xs text-neutral-600">
                {currentAccumulatedAT < 0
                  ? 'Din metabolism har sänkts för att spara energi vid kaloriunderskott'
                  : currentAccumulatedAT > 0
                    ? 'Din metabolism har ökat vid kaloriöverskott'
                    : 'Din metabolism är i balans'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* No history yet */}
            <div className="p-4 rounded-lg bg-neutral-50 text-center">
              <p className="text-sm text-neutral-600 mb-2">Ingen AT-historik ännu</p>
              <p className="text-xs text-neutral-500">
                AT-beräkningar körs automatiskt dagligen baserat på din kaloribalans. Data kommer att visas här när
                systemet har samlat tillräckligt med data.
              </p>
            </div>

            {/* Current AT status (if available) */}
            {currentAccumulatedAT !== 0 && (
              <div className={`p-3 rounded-lg ${currentAccumulatedAT < 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-sm font-semibold mb-1">
                  Nuvarande anpassning: {currentAccumulatedAT > 0 ? '+' : ''}
                  {Math.round(currentAccumulatedAT)} kcal/dag ({atPercent > 0 ? '+' : ''}
                  {atPercent.toFixed(1)}%)
                </p>
                <p className="text-xs text-neutral-600">
                  {currentAccumulatedAT < 0
                    ? 'Din metabolism har sänkts för att spara energi vid kaloriunderskott'
                    : 'Din metabolism har ökat vid kaloriöverskott'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
