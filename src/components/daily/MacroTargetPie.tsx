import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { NutrientStatus } from '@/lib/calculations/dailySummary'

interface MacroGoal {
  grams: number // midpoint
  gramsMin: number
  gramsMax: number
  percentage: number // midpoint %
}

interface MacroTargetPieProps {
  // Faktiskt intag från log
  fat: NutrientStatus
  carbs: NutrientStatus
  protein: NutrientStatus
  totalLoggedKcal: number // direkt från log, ej Atwater

  // Profilmål — beräknade direkt från profil, ej snapshot
  fatGoal?: MacroGoal
  carbGoal?: MacroGoal
  proteinGoal?: MacroGoal
  targetKcal?: number // profilmål midpoint (min+max)/2
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

function arcProps(startFraction: number, fraction: number, circumference: number) {
  const dashLength = Math.max(0, fraction * circumference - 2)
  const offset = circumference * (1 - startFraction)
  return {
    strokeDasharray: `${dashLength} ${circumference}`,
    strokeDashoffset: offset,
  }
}

function buildSegmentsFromGrams(protein: number, carbs: number, fat: number): ArcSegment[] {
  // Use energy (kcal) as weights for visual proportion
  const proteinKcal = protein * 4
  const carbsKcal = carbs * 4
  const fatKcal = fat * 9
  const total = proteinKcal + carbsKcal + fatKcal
  if (total <= 0) return []
  return [
    { color: COLORS.protein.fill, fraction: proteinKcal / total },
    { color: COLORS.carbs.fill, fraction: carbsKcal / total },
    { color: COLORS.fat.fill, fraction: fatKcal / total },
  ]
}

function renderSegments(
  segments: ArcSegment[],
  r: number,
  circumference: number,
  cx: number,
  cy: number,
  strokeWidth: number,
  opacity?: number
): React.ReactNode[] {
  return segments.reduce<{ els: React.ReactNode[]; start: number }>(
    (acc, seg) => {
      const props = arcProps(acc.start, seg.fraction, circumference)
      acc.els.push(
        <circle
          key={acc.start}
          cx={cx}
          cy={cy}
          r={r}
          stroke={seg.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="butt"
          opacity={opacity}
          {...props}
        />
      )
      acc.start += seg.fraction
      return acc
    },
    { els: [], start: 0 }
  ).els
}

export const MacroTargetPie = memo(function MacroTargetPie({
  fat,
  carbs,
  protein,
  totalLoggedKcal,
  fatGoal,
  carbGoal,
  proteinGoal,
  targetKcal,
}: MacroTargetPieProps) {
  const hasGoals = fatGoal != null && carbGoal != null && proteinGoal != null

  // Outer ring — faktiskt loggat intag (gram → energiandel)
  const outerR = 82
  const outerCirc = 2 * Math.PI * outerR
  const outerSegments = buildSegmentsFromGrams(protein.current, carbs.current, fat.current)

  // Inner ring — profilmål (gram midpoint → energiandel)
  const innerR = 58
  const innerCirc = 2 * Math.PI * innerR
  const innerSegments = hasGoals
    ? buildSegmentsFromGrams(proteinGoal!.grams, carbGoal!.grams, fatGoal!.grams)
    : []

  const svgSize = 200
  const cx = 100
  const cy = 100

  const macroRows: {
    key: 'protein' | 'carbs' | 'fat'
    label: string
    status: NutrientStatus
    goal?: MacroGoal
    fillColor: string
  }[] = [
    {
      key: 'protein',
      label: 'Protein',
      status: protein,
      goal: proteinGoal,
      fillColor: COLORS.protein.fill,
    },
    {
      key: 'carbs',
      label: 'Kolhydrater',
      status: carbs,
      goal: carbGoal,
      fillColor: COLORS.carbs.fill,
    },
    { key: 'fat', label: 'Fett', status: fat, goal: fatGoal, fillColor: COLORS.fat.fill },
  ]

  const hasAnyIntake = totalLoggedKcal > 0

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
          {/* Inner ring — alltid synlig om mål finns (visar målfördelning) */}
          {hasGoals && innerSegments.length > 0 ? (
            renderSegments(innerSegments, innerR, innerCirc, cx, cy, 12, 0.4)
          ) : hasGoals ? (
            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              stroke={COLORS.placeholder}
              strokeWidth={12}
              fill="none"
              opacity={0.4}
            />
          ) : null}

          {/* Outer ring — faktiskt intag, placeholder om inget loggat */}
          {hasAnyIntake && outerSegments.length > 0 ? (
            renderSegments(outerSegments, outerR, outerCirc, cx, cy, 20)
          ) : (
            <circle
              cx={cx}
              cy={cy}
              r={outerR}
              stroke={COLORS.placeholder}
              strokeWidth={20}
              fill="none"
            />
          )}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="700"
            fill="#171717"
            transform={`rotate(90, ${cx}, ${cy})`}
          >
            {Math.round(totalLoggedKcal)}
          </text>
          <text
            x={cx}
            y={cy + 9}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#737373"
            transform={`rotate(90, ${cx}, ${cy})`}
          >
            {targetKcal != null && targetKcal > 0
              ? `av ~${Math.round(targetKcal)} kcal`
              : 'kcal loggat'}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {macroRows.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-2">
            {/* Left: färgpunkt med statusring + namn + % */}
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
                {row.goal != null && (
                  <span className="text-[10px] text-neutral-400 ml-1">{row.goal.percentage}%</span>
                )}
              </div>
            </div>

            {/* Right: Xg loggat / min–max g + displayText */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutral-500 tabular-nums">
                {Math.round(row.status.current)}g
                {row.goal != null && (
                  <>
                    {' '}
                    / {row.goal.gramsMin}–{row.goal.gramsMax}g
                  </>
                )}
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
