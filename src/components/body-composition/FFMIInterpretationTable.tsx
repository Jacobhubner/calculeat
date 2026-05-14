import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  const rows = showMale ? MEN_ROWS : WOMEN_ROWS
  const genderKey = showMale ? 'men' : 'women'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => setShowMale(v => !v)}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, i) => {
              const highlighted =
                userFFMI != null && userBodyFat != null && isMatch(row, userFFMI, userBodyFat)
              const rowKey = `row${i}` as const
              return (
                <tr
                  key={i}
                  className={
                    highlighted
                      ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                      : i % 2 === 0
                        ? 'bg-white'
                        : 'bg-neutral-50/50'
                  }
                >
                  <td className="px-3 py-2 text-neutral-800 whitespace-nowrap">
                    {t(`ffmiInterpretation.${genderKey}.${rowKey}.range`)}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">
                    {t(`ffmiInterpretation.${genderKey}.${rowKey}.bf`)}
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-700 whitespace-nowrap">
                    {t(`ffmiInterpretation.${genderKey}.${rowKey}.category`)}
                  </td>
                  <td className="px-3 py-2 text-neutral-500 hidden lg:table-cell">
                    {t(`ffmiInterpretation.${genderKey}.${rowKey}.desc`)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 px-3 py-2 border-t border-neutral-100">
        {t('ffmiInterpretation.sourceLabel')}{' '}
        <a
          href="https://leanffmi.com/guides/ffmi/ffmi-interpretation-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-primary-500"
        >
          {t('ffmiInterpretation.sourceLinkText')}
        </a>
      </p>
    </div>
  )
}
