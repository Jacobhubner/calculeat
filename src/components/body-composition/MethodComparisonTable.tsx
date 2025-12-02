import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  formatMethodName,
  getCategoryGradient,
  type MethodComparisonResult,
} from '@/lib/helpers/bodyCompositionHelpers'
import { ArrowUpDown, Calculator, Save } from 'lucide-react'
import { useState } from 'react'

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

  const handleSort = (field: keyof MethodComparisonResult) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]

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
          <p className="text-lg font-medium text-neutral-700 mb-2">Inga beräkningsbara metoder</p>
          <p className="text-sm text-neutral-500 text-center max-w-md">
            Fyll i minst några mätningar för att se tillgängliga metoder. Försök börja med enkla
            måttbandsmätningar som midja och höft.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          Jämförelse av alla metoder
        </CardTitle>
        <CardDescription>
          {results.length} {results.length === 1 ? 'metod' : 'metoder'} kan beräknas baserat på dina
          mätningar. Klicka på kolumnrubriker för att sortera.
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
                    Mager Massa (kg)
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
              {sortedResults.map((result, index) => (
                <tr
                  key={`${result.method}-${result.variation || 'default'}-${index}`}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {formatMethodName(result.method, result.variation)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-neutral-700">
                    {result.bodyDensity ? result.bodyDensity.toFixed(4) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-neutral-900">
                    {result.bodyFatPercentage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryGradient(result.categoryColor)}`}
                    >
                      {result.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-neutral-700">
                    {result.leanBodyMass.toFixed(1)} kg
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-neutral-700">
                    {result.fatMass.toFixed(1)} kg
                  </td>
                  {onSaveResult && (
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => onSaveResult(result)}
                        disabled={isSaving}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {sortedResults.map((result, index) => (
            <div
              key={`${result.method}-${result.variation || 'default'}-${index}`}
              className="border border-neutral-200 rounded-xl p-4 space-y-3"
            >
              <div className="font-medium text-neutral-900 text-sm">
                {formatMethodName(result.method, result.variation)}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {result.bodyDensity && (
                  <div>
                    <div className="text-neutral-500 text-xs mb-1">Densitet</div>
                    <div className="text-neutral-700">{result.bodyDensity.toFixed(4)} g/cm³</div>
                  </div>
                )}
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Kroppsfett %</div>
                  <div className="font-medium text-neutral-900">
                    {result.bodyFatPercentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Kategori</div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryGradient(result.categoryColor)}`}
                  >
                    {result.category}
                  </span>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Mager Massa</div>
                  <div className="text-neutral-700">{result.leanBodyMass.toFixed(1)} kg</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Fettmassa</div>
                  <div className="text-neutral-700">{result.fatMass.toFixed(1)} kg</div>
                </div>
              </div>
              {onSaveResult && (
                <Button
                  onClick={() => onSaveResult(result)}
                  disabled={isSaving}
                  size="sm"
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  Spara till profil
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
