import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BODY_FAT_CATEGORIES_ACE } from '../../lib/constants/bodyCompositionReferenceData'
import type { Gender } from '@/lib/types'

interface BodyFatReferenceTableProps {
  highlightedCategory?: string
  userBodyFat?: number | null
  gender?: Gender
  fullWidthImages?: boolean
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
  fullWidthImages = false,
}: BodyFatReferenceTableProps) {
  const [showMale, setShowMale] = useState(gender !== 'female')

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
  const [expanded, setExpanded] = useState(false)

  const maleInsights = [
    {
      range: '3–7%',
      text: 'Extremt lågt (tävlingsform). Väldigt tydlig muskeldefinition och vener. Svårt att bibehålla över tid.',
    },
    { range: '10–15%', text: 'Den klassiska "beach-kroppen". Magrutorna syns oftast tydligt här.' },
    {
      range: '20–25%',
      text: 'En normal och hälsosam nivå för de flesta män. Muskeldefinitionen är mindre tydlig, men kroppen ser proportionerlig ut.',
    },
    {
      range: '30% och uppåt',
      text: 'Indikerar övervikt där fettet ofta samlas runt midjan, vilket är kopplat till högre hälsorisker.',
    },
  ]

  const femaleInsights = [
    {
      range: '10–12%',
      text: 'Extremt lågt, ses oftast bara hos tävlande kroppsbyggare. Kan påverka hormonbalans och hälsa negativt.',
    },
    {
      range: '15–22%',
      text: '"Fit" eller idrottslig nivå. Muskeldefinition är ofta tydlig, särskilt i magregionen.',
    },
    {
      range: '25–35%',
      text: 'En hälsosam och normal nivå för de flesta kvinnor. Kroppen har naturliga kurvor och en sund energireserv.',
    },
    {
      range: '40% och uppåt',
      text: 'Klassas ofta som övervikt eller fetma, vilket kan öka risken för livsstilssjukdomar.',
    },
  ]

  const insights = showMale ? maleInsights : femaleInsights

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => setShowMale(v => !v)}
          className="text-[10px] text-primary-600 hover:underline"
        >
          Visa {showMale ? 'kvinnors' : 'mäns'} värden
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900">Kategori</th>
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900">
                {showMale ? 'Män' : 'Kvinnor'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {BODY_FAT_CATEGORIES_ACE.map((row, index) => {
              const isHighlightedByCategory =
                highlightedCategory &&
                row.category.toLowerCase().includes(highlightedCategory.toLowerCase())
              const isUserCategory = userCategory && row.category === userCategory
              const value = showMale ? row.men : row.women

              return (
                <tr
                  key={index}
                  className={`${
                    isHighlightedByCategory || isUserCategory
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
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

      {/* Expandable section: images + insights */}
      <div className="border-t border-gray-200">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>Vad betyder intervallen?</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div className="px-3 pb-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              {insights.map(({ range, text }) => (
                <div key={range} className="text-[11px]">
                  <span className="font-semibold text-gray-800">{range}:</span>{' '}
                  <span className="text-gray-600">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {showMale ? (
                <>
                  <img
                    src="/men BF.png"
                    alt="Kroppsfett visuell guide för män"
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                  <img
                    src="/men BF (2).png"
                    alt="Kroppsfett visuell guide för män 2"
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                </>
              ) : (
                <>
                  <img
                    src="/women BF.png"
                    alt="Kroppsfett visuell guide för kvinnor"
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                  <img
                    src="/women BF (2).png"
                    alt="Kroppsfett visuell guide för kvinnor 2"
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
