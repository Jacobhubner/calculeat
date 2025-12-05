import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  formatMethodName,
  getCategoryGradient,
  type MethodComparisonResult,
} from '@/lib/helpers/bodyCompositionHelpers'
import { ArrowUpDown, Calculator, Save, Info } from 'lucide-react'
import { useState } from 'react'
import MethodInfoModal from './MethodInfoModal'

interface MethodComparisonTableProps {
  results: MethodComparisonResult[]
  onSaveResult?: (result: MethodComparisonResult) => void
  isSaving?: boolean
}

export default function MethodComparisonTable({
  results,
  onSaveResult,
  isSaving,
}: MethodComparisonTableProps) {
  const [sortBy, setSortBy] = useState<keyof MethodComparisonResult>('bodyFatPercentage')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showInfoFor, setShowInfoFor] = useState<{
    method: string
    variation?: string
  } | null>(null)

  const handleSort = (field: keyof MethodComparisonResult) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    // Primary sort: Available methods before unavailable
    const aAvailable = a.isAvailable !== false
    const bAvailable = b.isAvailable !== false

    if (aAvailable !== bAvailable) {
      return aAvailable ? -1 : 1 // Available first
    }

    // Secondary sort: User's chosen sort column
    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  if (results.length === 0) {
    return (
      <Card className="bg-neutral-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calculator className="h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">Laddar metoder...</p>
          <p className="text-sm text-neutral-500 text-center max-w-md">
            Vänligen vänta medan alla beräkningsmetoder laddas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary-600" />
            Jämförelse av alla metoder
          </CardTitle>
          <CardDescription>
            {results.length} {results.length === 1 ? 'metod' : 'metoder'} visas nedan.{' '}
            {results.filter(r => r.isAvailable).length} av dessa kan beräknas baserat på dina
            mätningar. Fyll i fler mätningar för att aktivera fler metoder. Klicka på kolumnrubriker
            för att sortera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4">
                    <button
                      onClick={() => handleSort('method')}
                      className="flex items-center gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors"
                    >
                      Metod
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <button
                      onClick={() => handleSort('bodyDensity')}
                      className="flex items-center justify-end gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors w-full"
                    >
                      Densitet (g/cm³)
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <button
                      onClick={() => handleSort('bodyFatPercentage')}
                      className="flex items-center justify-end gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors w-full"
                    >
                      Kroppsfett %
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4">
                    <button
                      onClick={() => handleSort('category')}
                      className="flex items-center gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors"
                    >
                      Kategori
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <button
                      onClick={() => handleSort('leanBodyMass')}
                      className="flex items-center justify-end gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors w-full"
                    >
                      Fettfri Massa (FFM) (kg)
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <button
                      onClick={() => handleSort('fatMass')}
                      className="flex items-center justify-end gap-1 font-medium text-neutral-700 hover:text-primary-600 transition-colors w-full"
                    >
                      Fettmassa (kg)
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  {onSaveResult && (
                    <th className="text-center py-3 px-4">
                      <span className="font-medium text-neutral-700">Åtgärd</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result, index) => {
                  const isUnavailable = result.isAvailable === false
                  const rowClass = isUnavailable
                    ? 'border-b border-neutral-100 bg-neutral-100 opacity-60'
                    : 'border-b border-neutral-100 hover:bg-neutral-50 transition-colors'
                  const textClass = isUnavailable ? 'text-neutral-400' : 'text-neutral-700'

                  return (
                    <tr
                      key={`${result.method}-${result.variation || 'default'}-${index}`}
                      className={rowClass}
                    >
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={textClass}>
                            {formatMethodName(result.method, result.variation)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowInfoFor({ method: result.method, variation: result.variation })
                            }
                            className="text-primary-600 hover:text-primary-700 transition-colors"
                            title="Visa information om metoden"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                          {isUnavailable &&
                            result.missingFields &&
                            result.missingFields.length > 0 && (
                              <span
                                className="text-xs text-neutral-500 italic"
                                title={`Saknade fält: ${result.missingFields.join(', ')}`}
                              >
                                (Saknas: {result.missingFields.join(', ')})
                              </span>
                            )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right text-sm ${textClass}`}>
                        {isUnavailable
                          ? '-'
                          : result.bodyDensity
                            ? result.bodyDensity.toFixed(4)
                            : '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right text-sm font-medium ${isUnavailable ? textClass : 'text-neutral-900'}`}
                      >
                        {isUnavailable ? '-' : `${result.bodyFatPercentage.toFixed(1)}%`}
                      </td>
                      <td className="py-3 px-4">
                        {isUnavailable ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 text-neutral-400">
                            -
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryGradient(result.categoryColor)}`}
                          >
                            {result.category}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right text-sm ${textClass}`}>
                        {isUnavailable ? '-' : `${result.leanBodyMass.toFixed(1)} kg`}
                      </td>
                      <td className={`py-3 px-4 text-right text-sm ${textClass}`}>
                        {isUnavailable ? '-' : `${result.fatMass.toFixed(1)} kg`}
                      </td>
                      {onSaveResult && (
                        <td className="py-3 px-4 text-center">
                          <Button
                            onClick={() => onSaveResult(result)}
                            disabled={isSaving || isUnavailable}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Spara
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {sortedResults.map((result, index) => {
              const isUnavailable = result.isAvailable === false
              const cardClass = isUnavailable
                ? 'border border-neutral-200 rounded-xl p-4 space-y-3 bg-neutral-100 opacity-60'
                : 'border border-neutral-200 rounded-xl p-4 space-y-3'
              const textClass = isUnavailable ? 'text-neutral-400' : 'text-neutral-700'

              return (
                <div
                  key={`${result.method}-${result.variation || 'default'}-${index}`}
                  className={cardClass}
                >
                  <div
                    className={`font-medium text-sm ${isUnavailable ? 'text-neutral-400' : 'text-neutral-900'}`}
                  >
                    {formatMethodName(result.method, result.variation)}
                    {isUnavailable && result.missingFields && result.missingFields.length > 0 && (
                      <div className="text-xs text-neutral-500 italic mt-1">
                        Saknas: {result.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {!isUnavailable && result.bodyDensity && (
                      <div>
                        <div className="text-neutral-500 text-xs mb-1">Densitet</div>
                        <div className={textClass}>{result.bodyDensity.toFixed(4)} g/cm³</div>
                      </div>
                    )}
                    <div>
                      <div className="text-neutral-500 text-xs mb-1">Kroppsfett %</div>
                      <div
                        className={`font-medium ${isUnavailable ? textClass : 'text-neutral-900'}`}
                      >
                        {isUnavailable ? '-' : `${result.bodyFatPercentage.toFixed(1)}%`}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-xs mb-1">Kategori</div>
                      {isUnavailable ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-neutral-200 text-neutral-400">
                          -
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryGradient(result.categoryColor)}`}
                        >
                          {result.category}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-neutral-500 text-xs mb-1">Fettfri Massa (FFM)</div>
                      <div className={textClass}>
                        {isUnavailable ? '-' : `${result.leanBodyMass.toFixed(1)} kg`}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-xs mb-1">Fettmassa</div>
                      <div className={textClass}>
                        {isUnavailable ? '-' : `${result.fatMass.toFixed(1)} kg`}
                      </div>
                    </div>
                  </div>
                  {onSaveResult && (
                    <Button
                      onClick={() => onSaveResult(result)}
                      disabled={isSaving || isUnavailable}
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Spara till profil
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Modal */}
      {showInfoFor && (
        <MethodInfoModal
          method={showInfoFor.method}
          variation={showInfoFor.variation}
          open={showInfoFor !== null}
          onClose={() => setShowInfoFor(null)}
        />
      )}
    </>
  )
}
