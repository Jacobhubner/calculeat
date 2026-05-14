import { useState } from 'react'

interface TableRow {
  range: string
  bf: string
  category: string
  desc: string
  ffmiMin: number
  ffmiMax: number | null
  bfMin: number | null
  bfMax: number | null
}

const MEN_ROWS: TableRow[] = [
  {
    range: 'Under 17',
    bf: 'Valfri',
    category: 'Mycket låg',
    desc: 'Kraftigt begränsad muskelmassa, möjlig undernäring eller sarkopeni',
    ffmiMin: 0,
    ffmiMax: 17,
    bfMin: null,
    bfMax: null,
  },
  {
    range: '17–18',
    bf: '10–18 %',
    category: 'Smal/Otränad',
    desc: 'Under genomsnittlig muskelmassa, stillasittande livsstil, "smal" kroppsbyggnad',
    ffmiMin: 17,
    ffmiMax: 18,
    bfMin: 10,
    bfMax: 18,
  },
  {
    range: '18–20',
    bf: '20–27 %',
    category: 'Genomsnittsbefolkning',
    desc: 'Normal muskelmassa för otränade män, hälsosam grundnivå',
    ffmiMin: 18,
    ffmiMax: 20,
    bfMin: 20,
    bfMax: 27,
  },
  {
    range: '19–21',
    bf: '25–40 %',
    category: 'Överviktig/Fetma',
    desc: 'Genomsnittlig muskelmassa men hög kroppsfettsnivå, "kraftig" eller "bred" kroppsbyggnad',
    ffmiMin: 19,
    ffmiMax: 21,
    bfMin: 25,
    bfMax: 40,
  },
  {
    range: '20–21',
    bf: '10–18 %',
    category: 'Atlet/Mellanliggande',
    desc: 'Över genomsnittlig muskelmassa, 2–3 års träning, ser tydligt tränad ut',
    ffmiMin: 20,
    ffmiMax: 22,
    bfMin: 10,
    bfMax: 18,
  },
  {
    range: '22–23',
    bf: '6–12 %',
    category: 'Avancerad naturlig',
    desc: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsliknande form',
    ffmiMin: 22,
    ffmiMax: 24,
    bfMin: 6,
    bfMax: 12,
  },
  {
    range: '24–25',
    bf: '8–20 %',
    category: 'Elit naturlig/Misstänkt',
    desc: 'Nära genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning',
    ffmiMin: 24,
    ffmiMax: 25,
    bfMin: 8,
    bfMax: 20,
  },
  {
    range: '25–27',
    bf: 'Valfri',
    category: 'Troligen dopad',
    desc: 'Över typiska naturliga gränser, genetisk extremvariant eller sannolik PED-användning',
    ffmiMin: 25,
    ffmiMax: 27,
    bfMin: null,
    bfMax: null,
  },
  {
    range: 'Över 27',
    bf: 'Valfri',
    category: 'Nästan säkert dopad',
    desc: 'Kräver prestationshöjande preparat i de allra flesta fall',
    ffmiMin: 27,
    ffmiMax: null,
    bfMin: null,
    bfMax: null,
  },
]

const WOMEN_ROWS: TableRow[] = [
  {
    range: 'Under 14',
    bf: 'Valfri',
    category: 'Mycket låg',
    desc: 'Kraftigt begränsad muskelmassa, möjliga hälsoproblem',
    ffmiMin: 0,
    ffmiMax: 14,
    bfMin: null,
    bfMax: null,
  },
  {
    range: '14–15',
    bf: '20–25 %',
    category: 'Smal/Otränad',
    desc: 'Under genomsnittlig muskelmassa, stillasittande, "smal" kroppsbyggnad',
    ffmiMin: 14,
    ffmiMax: 15,
    bfMin: 20,
    bfMax: 25,
  },
  {
    range: '14–17',
    bf: '22–35 %',
    category: 'Genomsnittsbefolkning',
    desc: 'Normal muskelmassa för otränade kvinnor',
    ffmiMin: 14,
    ffmiMax: 17,
    bfMin: 22,
    bfMax: 35,
  },
  {
    range: '15–18',
    bf: '30–45 %',
    category: 'Överviktig/Fetma',
    desc: 'Genomsnittlig muskelmassa men hög kroppsfettsnivå',
    ffmiMin: 15,
    ffmiMax: 18,
    bfMin: 30,
    bfMax: 45,
  },
  {
    range: '16–17',
    bf: '18–25 %',
    category: 'Atlet/Mellanliggande',
    desc: 'Över genomsnittlig muskelmassa, 2–3 års träning, atletisk kroppsbyggnad',
    ffmiMin: 16,
    ffmiMax: 17,
    bfMin: 18,
    bfMax: 25,
  },
  {
    range: '18–20',
    bf: '15–22 %',
    category: 'Avancerad naturlig',
    desc: 'Mycket välutvecklad fysik, 4–7 års träning, tävlingsnivå',
    ffmiMin: 18,
    ffmiMax: 20,
    bfMin: 15,
    bfMax: 22,
  },
  {
    range: '19–21',
    bf: '15–30 %',
    category: 'Elit naturlig/Misstänkt',
    desc: 'Närmar sig genetiskt tak, 8+ års träning eller möjlig prestationshöjande användning',
    ffmiMin: 19,
    ffmiMax: 21,
    bfMin: 15,
    bfMax: 30,
  },
  {
    range: '21–23',
    bf: 'Valfri',
    category: 'Troligen dopad',
    desc: 'Över typiska naturliga gränser för kvinnor',
    ffmiMin: 21,
    ffmiMax: 23,
    bfMin: null,
    bfMax: null,
  },
  {
    range: 'Över 23',
    bf: 'Valfri',
    category: 'Nästan säkert dopad',
    desc: 'Kräver prestationshöjande preparat i de allra flesta fall',
    ffmiMin: 23,
    ffmiMax: null,
    bfMin: null,
    bfMax: null,
  },
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
  const [showMale, setShowMale] = useState(gender !== 'female')
  const rows = showMale ? MEN_ROWS : WOMEN_ROWS

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => setShowMale(v => !v)}
          className="text-[10px] text-primary-600 hover:underline"
        >
          {showMale ? 'Visa kvinnors värden' : 'Visa mäns värden'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                FFMI
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Kroppsfett %
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                Beskrivning
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, i) => {
              const highlighted =
                userFFMI != null && userBodyFat != null && isMatch(row, userFFMI, userBodyFat)
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
                  <td className="px-3 py-2 text-neutral-800 whitespace-nowrap">{row.range}</td>
                  <td className="px-3 py-2 text-neutral-600 whitespace-nowrap">{row.bf}</td>
                  <td className="px-3 py-2 font-medium text-neutral-700 whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="px-3 py-2 text-neutral-500 hidden lg:table-cell">{row.desc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 px-3 py-2 border-t border-neutral-100">
        Källa:{' '}
        <a
          href="https://leanffmi.com/guides/ffmi/ffmi-interpretation-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-primary-500"
        >
          LeanFFMI.com — FFMI Interpretation Guide
        </a>
      </p>
    </div>
  )
}
