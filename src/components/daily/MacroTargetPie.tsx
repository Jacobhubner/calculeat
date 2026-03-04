import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { NutrientStatus } from '@/lib/calculations/dailySummary'

interface MacroTargetPieProps {
  fat: NutrientStatus
  carbs: NutrientStatus
  protein: NutrientStatus
  fatMinPercent?: number
  fatMaxPercent?: number
  carbMinPercent?: number
  carbMaxPercent?: number
  proteinMinPercent?: number
  proteinMaxPercent?: number
}

// Inline hex required — SVG stroke can't use Tailwind classes
const COLORS = {
  protein: { fill: '#16a34a', light: '#dcfce7' }, // primary-600 / primary-100
  carbs: { fill: '#ea580c', light: '#ffedd5' }, // accent-600  / accent-100
  fat: { fill: '#38bdf8', light: '#e0f2fe' }, // sky-400     / sky-100
  placeholder: '#e5e7eb', // neutral-200
}

const STATUS_COLOR: Record<NutrientStatus['status'], string> = {
  under: 'text-sky-600',
  within: 'text-success-600',
  over: 'text-error-600',
}

const STATUS_RING: Record<NutrientStatus['status'], string> = {
  under: 'ring-sky-400',
  within: 'ring-success-500',
  over: 'ring-error-500',
}

interface ArcSegment {
  color: string
  fraction: number
}

/**
 * Build strokeDasharray/strokeDashoffset for a single arc segment.
 * startFraction and fraction are values in [0, 1].
 */
function arcProps(startFraction: number, fraction: number, circumference: number) {
  const dashLength = Math.max(0, fraction * circumference - 2) // 2px gap
  const offset = circumference * (1 - startFraction)
  return {
    strokeDasharray: `${dashLength} ${circumference}`,
    strokeDashoffset: offset,
  }
}

function buildSegments(energy: { protein: number; carbs: number; fat: number }): ArcSegment[] {
  const total = energy.protein + energy.carbs + energy.fat
  if (total <= 0) return []
  return [
    { color: COLORS.protein.fill, fraction: energy.protein / total },
    { color: COLORS.carbs.fill, fraction: energy.carbs / total },
    { color: COLORS.fat.fill, fraction: energy.fat / total },
  ]
}

export const MacroTargetPie = memo(function MacroTargetPie({
  fat,
  carbs,
  protein,
  fatMinPercent,
  fatMaxPercent,
  carbMinPercent,
  carbMaxPercent,
  proteinMinPercent,
  proteinMaxPercent,
}: MacroTargetPieProps) {
  // Energy from each macro (kcal)
  const proteinKcal = protein.current * 4
  const carbsKcal = carbs.current * 4
  const fatKcal = fat.current * 9
  const totalKcal = proteinKcal + carbsKcal + fatKcal

  // Outer ring — actual intake (r=82, strokeWidth=20)
  const outerR = 82
  const outerCirc = 2 * Math.PI * outerR
  const outerSegments = buildSegments({ protein: proteinKcal, carbs: carbsKcal, fat: fatKcal })

  // Inner ring — target ranges (r=58, strokeWidth=10), shown only if percent props exist
  const innerR = 58
  const innerCirc = 2 * Math.PI * innerR
  const hasInner =
    fatMinPercent != null &&
    fatMaxPercent != null &&
    carbMinPercent != null &&
    carbMaxPercent != null &&
    proteinMinPercent != null &&
    proteinMaxPercent != null

  // Build inner segments from midpoint of each range
  const innerSegments: ArcSegment[] = hasInner
    ? buildSegments({
        protein: (proteinMinPercent! + proteinMaxPercent!) / 2,
        carbs: (carbMinPercent! + carbMaxPercent!) / 2,
        fat: (fatMinPercent! + fatMaxPercent!) / 2,
      })
    : []

  const svgSize = 200
  const cx = 100
  const cy = 100

  const macroRows: {
    key: 'protein' | 'carbs' | 'fat'
    label: string
    status: NutrientStatus
    minPercent?: number
    maxPercent?: number
    fillColor: string
    lightColor: string
  }[] = [
    {
      key: 'protein',
      label: 'Protein',
      status: protein,
      minPercent: proteinMinPercent,
      maxPercent: proteinMaxPercent,
      fillColor: COLORS.protein.fill,
      lightColor: COLORS.protein.light,
    },
    {
      key: 'carbs',
      label: 'Kolhydrater',
      status: carbs,
      minPercent: carbMinPercent,
      maxPercent: carbMaxPercent,
      fillColor: COLORS.carbs.fill,
      lightColor: COLORS.carbs.light,
    },
    {
      key: 'fat',
      label: 'Fett',
      status: fat,
      minPercent: fatMinPercent,
      maxPercent: fatMaxPercent,
      fillColor: COLORS.fat.fill,
      lightColor: COLORS.fat.light,
    },
  ]

  return (
    <div className="space-y-4">
      {/* SVG donut */}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          width="100%"
          style={{ maxWidth: 200 }}
          className="transform -rotate-90"
        >
          {totalKcal === 0 ? (
            /* Placeholder ring when nothing logged */
            <>
              <circle
                cx={cx}
                cy={cy}
                r={outerR}
                stroke={COLORS.placeholder}
                strokeWidth={20}
                fill="none"
              />
              {hasInner && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerR}
                  stroke={COLORS.placeholder}
                  strokeWidth={10}
                  fill="none"
                />
              )}
            </>
          ) : (
            <>
              {/* Outer ring — actual intake */}
              {
                outerSegments.reduce<{ els: React.ReactNode[]; start: number }>(
                  (acc, seg) => {
                    const props = arcProps(acc.start, seg.fraction, outerCirc)
                    acc.els.push(
                      <circle
                        key={acc.start}
                        cx={cx}
                        cy={cy}
                        r={outerR}
                        stroke={seg.color}
                        strokeWidth={20}
                        fill="none"
                        strokeLinecap="butt"
                        {...props}
                      />
                    )
                    acc.start += seg.fraction
                    return acc
                  },
                  { els: [], start: 0 }
                ).els
              }

              {/* Inner ring — target midpoints */}
              {hasInner &&
                innerSegments.reduce<{ els: React.ReactNode[]; start: number }>(
                  (acc, seg) => {
                    const props = arcProps(acc.start, seg.fraction, innerCirc)
                    acc.els.push(
                      <circle
                        key={acc.start}
                        cx={cx}
                        cy={cy}
                        r={innerR}
                        stroke={seg.color}
                        strokeWidth={10}
                        fill="none"
                        strokeLinecap="butt"
                        opacity={0.35}
                        {...props}
                      />
                    )
                    acc.start += seg.fraction
                    return acc
                  },
                  { els: [], start: 0 }
                ).els}
            </>
          )}

          {/* Center text — rendered unrotated via transform */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="700"
            fill="#171717"
            transform={`rotate(90, ${cx}, ${cy})`}
          >
            {totalKcal > 0 ? Math.round(totalKcal) : '–'}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#737373"
            transform={`rotate(90, ${cx}, ${cy})`}
          >
            {(() => {
              const t = protein.min * 4 + carbs.min * 4 + fat.min * 9
              return t > 0 ? `av ~${Math.round(t)} kcal` : 'kcal loggat'
            })()}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {macroRows.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-2">
            {/* Left: color dot (makrofärg) + statusring + name + optional % range */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1',
                  STATUS_RING[row.status.status]
                )}
                style={{ backgroundColor: row.fillColor }}
              />
              <div className="min-w-0">
                <span className="text-sm font-medium text-neutral-700">{row.label}</span>
                {row.minPercent != null && row.maxPercent != null && (
                  <span className="text-[10px] text-neutral-400 ml-1">
                    {Math.round(row.minPercent)}–{Math.round(row.maxPercent)}%
                  </span>
                )}
              </div>
            </div>

            {/* Right: current / min–max + displayText */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutral-500 tabular-nums">
                {Math.round(row.status.current)}g / {Math.round(row.status.min)}–
                {Math.round(row.status.max)}g
              </span>
              <span className={cn('text-xs font-medium', STATUS_COLOR[row.status.status])}>
                {row.status.displayText}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
