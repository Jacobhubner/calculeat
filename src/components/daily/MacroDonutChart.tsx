import { memo } from 'react'

interface MacroDonutChartProps {
  proteinG: number
  carbsG: number
  fatG: number
  proteinMinPct?: number
  proteinMaxPct?: number
  carbsMinPct?: number
  carbsMaxPct?: number
  fatMinPct?: number
  fatMaxPct?: number
}

const COLORS = {
  protein: '#22d3ee', // cyan-400
  carbs: '#f59e0b', // amber-500
  fat: '#f43f5e', // rose-500
  placeholder: '#e5e7eb',
  track: '#1e293b',
}

const MACROS = ['fat', 'carbs', 'protein'] as const
type MacroKey = (typeof MACROS)[number]

const MACRO_LABELS: Record<MacroKey, string> = {
  protein: 'Protein',
  carbs: 'Kolh.',
  fat: 'Fett',
}

const MACRO_COLORS: Record<MacroKey, string> = {
  protein: COLORS.protein,
  carbs: COLORS.carbs,
  fat: COLORS.fat,
}

// ── Mål-intervall bar — mittpunktsbaserad (0–100-skala) ──────────────────────
// Solid = mittpunkt per makro, extensions = ±halvt intervall, brackets = min→max

function GoalBarsV2({
  intervals,
  isEmpty,
}: {
  intervals: Array<{ key: MacroKey; min: number; max: number }>
  isEmpty: boolean
}) {
  if (isEmpty) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Mål</p>
        <p className="text-[10px] text-neutral-400">Inga mål satta</p>
      </div>
    )
  }

  // Fasta djup: protein=10, kolh=24, fett=10
  const DEPTHS = [10, 24, 10]

  const mids = intervals.map(({ min, max }) => (min + max) / 2)
  const totalMid = mids.reduce((s, m) => s + m, 0)
  const scale = totalMid > 0 ? 100 / totalMid : 1
  const positions = mids.map((_, i) => mids.slice(0, i).reduce((s, m) => s + m * scale, 0))

  const bracketRanges = intervals.map(({ min, max }, i) => {
    const halfSpan = ((max - min) / 2) * scale
    const solidStart = positions[i]
    const solidEnd = solidStart + mids[i] * scale
    return {
      bLeft: Math.max(0, solidStart - halfSpan),
      bRight: Math.min(100, solidEnd + halfSpan),
      depth: DEPTHS[i],
    }
  })

  return (
    <div className="space-y-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
        Mål
      </p>

      {/* Labels ovanför baren */}
      <div className="relative mb-1" style={{ height: '14px' }}>
        {intervals.map(({ key, min, max }, i) => {
          const { bLeft, bRight } = bracketRanges[i]
          const mid = (bLeft + bRight) / 2
          const color = MACRO_COLORS[key]
          return (
            <div
              key={`label-${key}`}
              className="absolute flex items-center gap-0.5 -translate-x-1/2"
              style={{ left: `${mid}%`, top: '0' }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                {MACRO_LABELS[key]}
              </span>
              <span className="text-[9px] tabular-nums whitespace-nowrap" style={{ color }}>
                {Math.round(min)}–{Math.round(max)}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Bar */}
      <div className="relative h-5 rounded-full overflow-hidden bg-neutral-100">
        {intervals.map(({ key }, i) => {
          const solidW = mids[i] * scale
          return (
            <div
              key={`solid-${key}`}
              className="absolute inset-y-0 flex items-center justify-center"
              style={{
                left: `${positions[i]}%`,
                width: `${solidW}%`,
                backgroundColor: MACRO_COLORS[key],
              }}
            >
              {solidW > 8 && (
                <span
                  className="text-[9px] font-bold tabular-nums whitespace-nowrap"
                  style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {Math.round(mids[i])}%
                </span>
              )}
            </div>
          )
        })}
        {intervals.map(({ key }, i) => {
          const { bLeft, bRight } = bracketRanges[i]
          return (
            <div
              key={`ext-${key}`}
              className="absolute inset-y-0"
              style={{
                left: `${bLeft}%`,
                width: `${bRight - bLeft}%`,
                backgroundColor: MACRO_COLORS[key],
                opacity: 0.35,
              }}
            />
          )
        })}
      </div>

      {/* Bracket-linjer under baren */}
      <div className="relative mt-1" style={{ height: '26px' }}>
        {intervals.map(({ key }, i) => {
          const { bLeft, bRight, depth } = bracketRanges[i]
          const color = MACRO_COLORS[key]
          return (
            <div key={`bracket-${key}`}>
              <div
                className="absolute"
                style={{
                  left: `${bLeft}%`,
                  top: '0',
                  width: '1.5px',
                  height: `${depth}px`,
                  backgroundColor: color,
                }}
              />
              <div
                className="absolute"
                style={{
                  left: `${bLeft}%`,
                  top: `${depth - 1}px`,
                  width: `${bRight - bLeft}%`,
                  height: '1.5px',
                  backgroundColor: color,
                }}
              />
              <div
                className="absolute"
                style={{
                  left: `${bRight}%`,
                  top: '0',
                  width: '1.5px',
                  height: `${depth}px`,
                  backgroundColor: color,
                  transform: 'translateX(-1.5px)',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Idag-bar med inline procent ───────────────────────────────────────────────

function TodayBarInline({
  fracs,
  pcts,
  isEmpty,
}: {
  fracs: number[]
  pcts: Record<MacroKey, string>
  isEmpty: boolean
}) {
  const positions = MACROS.map((_, i) => fracs.slice(0, i).reduce((s, f) => s + f, 0))

  return (
    <div className="space-y-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
        Idag
      </p>
      {/* Bar med procent inuti */}
      <div className="relative h-5 rounded-full overflow-hidden bg-neutral-100">
        {!isEmpty &&
          MACROS.map((key, i) => (
            <div
              key={`inline-seg-${key}`}
              className="absolute inset-y-0 flex items-center justify-center"
              style={{
                left: `${positions[i] * 100}%`,
                width: `${fracs[i] * 100}%`,
                backgroundColor: MACRO_COLORS[key],
              }}
            >
              {fracs[i] > 0.08 && (
                <span className="text-[9px] font-bold text-white tabular-nums">{pcts[key]}</span>
              )}
            </div>
          ))}
      </div>
      {/* Namn under baren */}
      <div className="relative mt-1" style={{ height: '12px' }}>
        {!isEmpty &&
          MACROS.map((key, i) => {
            const mid = (positions[i] + fracs[i] / 2) * 100
            return (
              <span
                key={`inline-label-${key}`}
                className="absolute text-[8px] text-neutral-400 -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${mid}%` }}
              >
                {MACRO_LABELS[key]}
              </span>
            )
          })}
      </div>
    </div>
  )
}

// ── Huvud-komponent ───────────────────────────────────────────────────────────

export const MacroDonutChart = memo(function MacroDonutChart({
  proteinG,
  carbsG,
  fatG,
  proteinMinPct,
  proteinMaxPct,
  carbsMinPct,
  carbsMaxPct,
  fatMinPct,
  fatMaxPct,
}: MacroDonutChartProps) {
  const hasInterval =
    proteinMinPct != null &&
    proteinMaxPct != null &&
    carbsMinPct != null &&
    carbsMaxPct != null &&
    fatMinPct != null &&
    fatMaxPct != null

  const intervals = [
    { key: 'fat' as MacroKey, min: fatMinPct ?? 0, max: fatMaxPct ?? 0 },
    { key: 'carbs' as MacroKey, min: carbsMinPct ?? 0, max: carbsMaxPct ?? 0 },
    { key: 'protein' as MacroKey, min: proteinMinPct ?? 0, max: proteinMaxPct ?? 0 },
  ]

  const proteinKcal = proteinG * 4
  const carbsKcal = carbsG * 4
  const fatKcal = fatG * 9
  const totalKcal = proteinKcal + carbsKcal + fatKcal
  const todayFracs =
    totalKcal > 0
      ? [fatKcal / totalKcal, carbsKcal / totalKcal, proteinKcal / totalKcal]
      : [0, 0, 0]
  const todayPcts: Record<MacroKey, string> = {
    protein: totalKcal > 0 ? `${Math.round((proteinKcal / totalKcal) * 100)}%` : '–',
    carbs: totalKcal > 0 ? `${Math.round((carbsKcal / totalKcal) * 100)}%` : '–',
    fat: totalKcal > 0 ? `${Math.round((fatKcal / totalKcal) * 100)}%` : '–',
  }

  return (
    <div className="space-y-4 pb-2">
      <GoalBarsV2 intervals={intervals} isEmpty={!hasInterval} />
      <TodayBarInline fracs={todayFracs} pcts={todayPcts} isEmpty={totalKcal === 0} />
    </div>
  )
})
