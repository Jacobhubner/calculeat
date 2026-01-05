import React from 'react'
import { BODY_FAT_CATEGORIES_ACE } from '../../lib/constants/bodyCompositionReferenceData'
import type { Gender } from '@/lib/types'

interface BodyFatReferenceTableProps {
  highlightedCategory?: string
  userBodyFat?: number | null
  gender?: Gender
}

// Helper function to determine if user's body fat falls within a category range
function isInRange(value: number, rangeStr: string): boolean {
  // Handle "≥ X%" format
  if (rangeStr.startsWith('≥')) {
    const threshold = parseFloat(rangeStr.replace('≥', '').replace('%', '').trim())
    return value >= threshold
  }

  // Handle "X–Y%" format
  if (rangeStr.includes('–')) {
    const [min, max] = rangeStr.split('–').map(v => parseFloat(v.replace('%', '').trim()))
    return value >= min && value <= max
  }

  return false
}

export function BodyFatReferenceTable({
  highlightedCategory,
  userBodyFat,
  gender,
}: BodyFatReferenceTableProps) {
  // Determine which category the user's body fat falls into
  const getUserCategory = (): string | null => {
    if (!userBodyFat || !gender) return null

    for (const row of BODY_FAT_CATEGORIES_ACE) {
      const rangeStr = gender === 'male' ? row.men : row.women
      if (isInRange(userBodyFat, rangeStr)) {
        return row.category
      }
    }

    return null
  }

  const userCategory = getUserCategory()
  const isMale = gender === 'male'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900">Kategori</th>
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900">Värde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {BODY_FAT_CATEGORIES_ACE.map((row, index) => {
              const isHighlightedByCategory =
                highlightedCategory &&
                row.category.toLowerCase().includes(highlightedCategory.toLowerCase())
              const isUserCategory = userCategory && row.category === userCategory
              const isFitness = row.category === 'Fitness (in shape)'
              const value = isMale ? row.men : row.women

              return (
                <tr
                  key={index}
                  className={`${
                    isHighlightedByCategory || isUserCategory
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                      : isFitness
                        ? 'bg-green-50'
                        : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-2 py-1.5 text-gray-900 font-medium">{row.category}</td>
                  <td className="px-2 py-1.5 text-gray-700">{value}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
        <p className="text-[10px] text-gray-600 italic">Källa: American Council on Exercise</p>
      </div>
    </div>
  )
}
