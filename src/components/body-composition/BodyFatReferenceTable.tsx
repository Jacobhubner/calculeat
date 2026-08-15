import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BODY_FAT_CATEGORIES_ACE } from '../../lib/constants/bodyCompositionReferenceData'
import type { Gender } from '@/lib/types'

interface BodyFatReferenceTableProps {
  highlightedCategory?: string
  userBodyFat?: number | null
  gender?: Gender
  fullWidthImages?: boolean
  /** true = "Vad betyder intervallen?" (med bilderna) öppen från start */
  defaultExpanded?: boolean
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
  defaultExpanded = false,
}: BodyFatReferenceTableProps) {
  const { t } = useTranslation('body')
  const [showMale, setShowMale] = useState(gender !== 'female')

  useEffect(() => {
    setShowMale(gender !== 'female')
  }, [gender])

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
  const [expanded, setExpanded] = useState(defaultExpanded)

  const maleInsights = [
    {
      range: t('refTable.maleInsights.range1.range'),
      text: t('refTable.maleInsights.range1.text'),
    },
    {
      range: t('refTable.maleInsights.range2.range'),
      text: t('refTable.maleInsights.range2.text'),
    },
    {
      range: t('refTable.maleInsights.range3.range'),
      text: t('refTable.maleInsights.range3.text'),
    },
    {
      range: t('refTable.maleInsights.range4.range'),
      text: t('refTable.maleInsights.range4.text'),
    },
  ]

  const femaleInsights = [
    {
      range: t('refTable.femaleInsights.range1.range'),
      text: t('refTable.femaleInsights.range1.text'),
    },
    {
      range: t('refTable.femaleInsights.range2.range'),
      text: t('refTable.femaleInsights.range2.text'),
    },
    {
      range: t('refTable.femaleInsights.range3.range'),
      text: t('refTable.femaleInsights.range3.text'),
    },
    {
      range: t('refTable.femaleInsights.range4.range'),
      text: t('refTable.femaleInsights.range4.text'),
    },
  ]

  const insights = showMale ? maleInsights : femaleInsights

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-neutral-850 dark:border-neutral-700 overflow-hidden">
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => setShowMale(v => !v)}
          className="text-[10px] text-primary-600 hover:underline dark:text-primary-300"
        >
          {showMale ? t('refTable.showWomensValues') : t('refTable.showMensValues')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900 dark:text-neutral-100">
                {t('refTable.category')}
              </th>
              <th className="px-2 py-1.5 text-left font-semibold text-gray-900 dark:text-neutral-100">
                {showMale ? t('refTable.men') : t('refTable.women')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
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
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold dark:bg-blue-500/20 dark:border-l-blue-400'
                      : 'bg-white dark:bg-neutral-850'
                  } hover:bg-gray-50 transition-colors dark:hover:bg-neutral-800`}
                >
                  <td className="px-2 py-1.5 text-gray-900 font-medium dark:text-neutral-100">
                    {t(`refTable.bodyFatCategories.${row.category}`, {
                      defaultValue: row.category,
                    })}
                  </td>
                  <td className="px-2 py-1.5 text-gray-700 dark:text-neutral-300">{value}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
        <p className="text-[10px] text-gray-600 italic dark:text-neutral-400">
          {t('refTable.source')}
        </p>
      </div>

      {/* Expandable section: images + insights */}
      <div className="border-t border-gray-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors dark:hover:bg-neutral-800"
        >
          <span>{t('refTable.whatDoRangesMean')}</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div className="px-3 pb-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              {insights.map(({ range, text }) => (
                <div key={range} className="text-[11px]">
                  <span className="font-semibold text-gray-800 dark:text-neutral-200">
                    {range}:
                  </span>{' '}
                  <span className="text-gray-600 dark:text-neutral-400">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {showMale ? (
                <>
                  <img
                    src="/men BF.png"
                    alt={t('refTable.altMenBF1')}
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                  <img
                    src="/men BF (2).png"
                    alt={t('refTable.altMenBF2')}
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                </>
              ) : (
                <>
                  <img
                    src="/women BF.png"
                    alt={t('refTable.altWomenBF1')}
                    className={fullWidthImages ? 'w-full rounded' : 'w-3/4 rounded mx-auto'}
                  />
                  <img
                    src="/women BF (2).png"
                    alt={t('refTable.altWomenBF2')}
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
