import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableRow {
  ffmiMin: number
  ffmiMax: number | null
  bfMin: number | null
  bfMax: number | null
}

const MEN_ROWS: TableRow[] = [
  { ffmiMin: 0, ffmiMax: 17, bfMin: null, bfMax: null },
  { ffmiMin: 17, ffmiMax: 18, bfMin: 10, bfMax: 18 },
  { ffmiMin: 18, ffmiMax: 20, bfMin: 20, bfMax: 27 },
  { ffmiMin: 19, ffmiMax: 21, bfMin: 25, bfMax: 40 },
  { ffmiMin: 20, ffmiMax: 22, bfMin: 10, bfMax: 18 },
  { ffmiMin: 22, ffmiMax: 24, bfMin: 6, bfMax: 12 },
  { ffmiMin: 24, ffmiMax: 25, bfMin: 8, bfMax: 20 },
  { ffmiMin: 25, ffmiMax: 27, bfMin: null, bfMax: null },
  { ffmiMin: 27, ffmiMax: null, bfMin: null, bfMax: null },
]

const WOMEN_ROWS: TableRow[] = [
  { ffmiMin: 0, ffmiMax: 14, bfMin: null, bfMax: null },
  { ffmiMin: 14, ffmiMax: 15, bfMin: 20, bfMax: 25 },
  { ffmiMin: 14, ffmiMax: 17, bfMin: 22, bfMax: 35 },
  { ffmiMin: 15, ffmiMax: 18, bfMin: 30, bfMax: 45 },
  { ffmiMin: 16, ffmiMax: 17, bfMin: 18, bfMax: 25 },
  { ffmiMin: 18, ffmiMax: 20, bfMin: 15, bfMax: 22 },
  { ffmiMin: 19, ffmiMax: 21, bfMin: 15, bfMax: 30 },
  { ffmiMin: 21, ffmiMax: 23, bfMin: null, bfMax: null },
  { ffmiMin: 23, ffmiMax: null, bfMin: null, bfMax: null },
]

function isMatch(row: TableRow, ffmi: number, bf: number): boolean {
  const ffmiOk = ffmi >= row.ffmiMin && (row.ffmiMax === null || ffmi < row.ffmiMax)
  const bfOk = row.bfMin === null || (bf >= row.bfMin && (row.bfMax === null || bf < row.bfMax))
  return ffmiOk && bfOk
}

interface FFMIInterpretationTableProps {
  gender?: string
  userFFMI?: number | null
  userBodyFat?: number | null
}

export function FFMIInterpretationTable({
  gender,
  userFFMI,
  userBodyFat,
}: FFMIInterpretationTableProps) {
  const { t } = useTranslation('body')
  const [showMale, setShowMale] = useState(gender !== 'female')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const rows = showMale ? MEN_ROWS : WOMEN_ROWS
  const genderKey = showMale ? 'men' : 'women'

  const toggleRow = (i: number) => setExpandedRow(prev => (prev === i ? null : i))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setShowMale(v => !v)
            setExpandedRow(null)
          }}
          className="text-[10px] text-primary-600 hover:underline"
        >
          {showMale
            ? t('ffmiInterpretation.showWomensValues')
            : t('ffmiInterpretation.showMensValues')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('ffmiInterpretation.columnFFMI')}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('ffmiInterpretation.columnBodyFat')}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('ffmiInterpretation.columnCategory')}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                {t('ffmiInterpretation.columnDescription')}
              </th>
              {/* Expand toggle column — only on mobile */}
              <th className="px-2 py-2 lg:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, i) => {
              const highlighted =
                userFFMI != null && userBodyFat != null && isMatch(row, userFFMI, userBodyFat)
              const rowKey = `row${i}` as const
              const isExpanded = expandedRow === i
              const baseClass = highlighted
                ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                : i % 2 === 0
                  ? 'bg-white'
                  : 'bg-neutral-50/50'

              return (
                <>
                  <tr key={i} className={baseClass}>
                    <td className="px-3 py-2 text-neutral-800 whitespace-nowrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t(`ffmiInterpretation.${genderKey}.${rowKey}.range` as any)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t(`ffmiInterpretation.${genderKey}.${rowKey}.bf` as any)}
                    </td>
                    <td className="px-3 py-2 font-medium text-neutral-700 whitespace-nowrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t(`ffmiInterpretation.${genderKey}.${rowKey}.category` as any)}
                    </td>
                    <td className="px-3 py-2 text-neutral-500 hidden lg:table-cell">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t(`ffmiInterpretation.${genderKey}.${rowKey}.desc` as any)}
                    </td>
                    {/* Expand button — only on mobile */}
                    <td className="px-2 py-2 lg:hidden">
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        aria-label="Visa beskrivning"
                      >
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                        />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${i}-desc`} className={cn(baseClass, 'lg:hidden')}>
                      <td colSpan={4} className="px-3 pb-3 pt-0 text-xs text-neutral-500 italic">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t(`ffmiInterpretation.${genderKey}.${rowKey}.desc` as any)}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 px-3 py-2 border-t border-neutral-100">
        {t('ffmiInterpretation.sourceLabel')} {t('ffmiInterpretation.sourceLinkText')}
      </p>
    </div>
  )
}
