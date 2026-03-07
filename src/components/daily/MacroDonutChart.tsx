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

const MACROS = ['protein', 'carbs', 'fat'] as const
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

// ── Hjälpfunktioner ───────────────────────────────────────────────────────────

function buildSegments(
  fracs: number[],
  r: number
): Array<{ dasharray: string; dashoffset: number }> {
  const circ = 2 * Math.PI * r
  const GAP = 3
  let cum = 0
  return fracs.map(frac => {
    const len = Math.max(0, frac * circ - GAP)
    const dasharray = `${len} ${circ - len}`
    const dashoffset = circ - cum * circ
    cum += frac
    return { dasharray, dashoffset }
  })
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
      <div className="relative h-3 rounded-full overflow-hidden bg-neutral-100">
        {intervals.map(({ key }, i) => (
          <div
            key={`solid-${key}`}
            className="absolute inset-y-0"
            style={{
              left: `${positions[i]}%`,
              width: `${mids[i] * scale}%`,
              backgroundColor: MACRO_COLORS[key],
            }}
          />
        ))}
        {intervals.map(({ key, min, max }, i) => {
          const halfSpan = ((max - min) / 2) * scale
          const solidStart = positions[i]
          const solidEnd = solidStart + mids[i] * scale
          return (
            <div
              key={`ext-${key}`}
              className="absolute inset-y-0"
              style={{
                left: `${Math.max(0, solidStart - halfSpan)}%`,
                width: `${Math.min(100, solidEnd + halfSpan) - Math.max(0, solidStart - halfSpan)}%`,
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

// ── Idag-paj ──────────────────────────────────────────────────────────────────

const R = 42
const STROKE = 16
const SIZE = 120
const CX = SIZE / 2
const CY = SIZE / 2

function TodayPie({ fracs, isEmpty }: { fracs: number[]; isEmpty: boolean }) {
  const segs = isEmpty ? [] : buildSegments(fracs, R)
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="96"
      height="96"
      aria-label="Idag"
      className="flex-shrink-0"
    >
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={COLORS.track} strokeWidth={STROKE} />
      {isEmpty ? (
        <>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={COLORS.placeholder}
            strokeWidth={STROKE}
          />
          <text
            x={CX}
            y={CY + 4}
            textAnchor="middle"
            fontSize="8"
            fill="#94a3b8"
            fontFamily="inherit"
          >
            Inget loggat
          </text>
        </>
      ) : (
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {segs.map((seg, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={MACRO_COLORS[MACROS[i]]}
              strokeWidth={STROKE}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              strokeLinecap="butt"
            />
          ))}
        </g>
      )}
    </svg>
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
    { key: 'protein' as MacroKey, min: proteinMinPct ?? 0, max: proteinMaxPct ?? 0 },
    { key: 'carbs' as MacroKey, min: carbsMinPct ?? 0, max: carbsMaxPct ?? 0 },
    { key: 'fat' as MacroKey, min: fatMinPct ?? 0, max: fatMaxPct ?? 0 },
  ]

  const proteinKcal = proteinG * 4
  const carbsKcal = carbsG * 4
  const fatKcal = fatG * 9
  const totalKcal = proteinKcal + carbsKcal + fatKcal
  const todayFracs =
    totalKcal > 0
      ? [proteinKcal / totalKcal, carbsKcal / totalKcal, fatKcal / totalKcal]
      : [0, 0, 0]
  const todayPcts: Record<MacroKey, string> = {
    protein: totalKcal > 0 ? `${Math.round((proteinKcal / totalKcal) * 100)}%` : '–',
    carbs: totalKcal > 0 ? `${Math.round((carbsKcal / totalKcal) * 100)}%` : '–',
    fat: totalKcal > 0 ? `${Math.round((fatKcal / totalKcal) * 100)}%` : '–',
  }

  return (
    <div className="space-y-4 pb-2">
      <GoalBarsV2 intervals={intervals} isEmpty={!hasInterval} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Idag
        </p>
        <div className="flex items-center gap-3">
          <TodayPie fracs={todayFracs} isEmpty={totalKcal === 0} />
          <div className="flex flex-col gap-2">
            {MACROS.map(key => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MACRO_COLORS[key] }}
                />
                <span className="text-[10px] text-neutral-500 w-9">{MACRO_LABELS[key]}</span>
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ color: MACRO_COLORS[key] }}
                >
                  {todayPcts[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
