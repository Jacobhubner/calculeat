import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

interface MacroEntry {
  currentG: number
  minG: number
  maxG: number
  currentPct: number
  minPct: number
  maxPct: number
}

interface MacroRangeBarProps {
  fat: MacroEntry
  carbs: MacroEntry
  protein: MacroEntry
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function gramStatusText(
  currentG: number,
  minG: number,
  maxG: number,
  t: TFunction<'today'>
): string {
  const c = Math.round(currentG)
  const mn = Math.round(minG)
  const mx = Math.round(maxG)
  if (c === 0) return t('macroBar.statusZero', { mn, mx })
  if (c < mn) return t('macroBar.statusUnder', { c, mn, mx, diff: mn - c })
  if (c > mx) return t('macroBar.statusOver', { c, mn, mx, diff: c - mx })
  return t('macroBar.statusWithin', { c, mn, mx, diff: mx - c })
}

function getMacroConfig(t: TFunction<'today'>) {
  return [
    { key: 'fat' as const, label: t('macroBar.fat'), color: '#f5c518' },
    { key: 'carbs' as const, label: t('macroBar.carbs'), color: '#fb923c' },
    { key: 'protein' as const, label: t('macroBar.protein'), color: '#f43f5e' },
  ]
}

function StatusBadge({
  currentPct,
  minPct,
  maxPct,
}: {
  currentPct: number
  minPct: number
  maxPct: number
}) {
  const { t } = useTranslation('today')
  if (currentPct === 0) return null

  if (currentPct < minPct) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        {t('macroBar.badgeUnder')}
      </span>
    )
  }
  if (currentPct > maxPct) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
        {t('macroBar.badgeOver')}
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
      {t('macroBar.badgeWithin')}
    </span>
  )
}

function MacroRow({ label, color, entry }: { label: string; color: string; entry: MacroEntry }) {
  const { t } = useTranslation('today')
  const { currentG, minG, maxG, currentPct, minPct, maxPct } = entry
  const pct = clamp(currentPct, 0, 100)
  const safeMin = clamp(minPct, 0, 100)
  const safeMax = clamp(maxPct, 0, 100)
  const bandWidth = Math.max(safeMax - safeMin, 0)

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-neutral-800">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentPct > 0 && (
            <span className="text-[11px] tabular-nums font-semibold" style={{ color }}>
              {currentPct}%
            </span>
          )}
          <span className="text-[11px] tabular-nums text-neutral-400">
            {Math.round(minPct)}–{Math.round(maxPct)}%
          </span>
          <StatusBadge currentPct={currentPct} minPct={minPct} maxPct={maxPct} />
        </div>
      </div>

      {/* Range bar */}
      <div className="relative h-4 rounded-full bg-neutral-200">
        {/* Intervallband — z-10 */}
        <div
          className="absolute inset-y-0 rounded-full z-10"
          style={{
            left: `${safeMin}%`,
            width: `${bandWidth}%`,
            backgroundColor: color,
            opacity: 0.35,
          }}
        />
        {/* Dagens punkt — z-20 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow z-20"
          style={{ left: `${pct}%`, backgroundColor: color }}
        />
      </div>

      {/* Gram-status */}
      <p className="text-[10px] text-neutral-400 tabular-nums">
        {gramStatusText(currentG, minG, maxG, t)}
      </p>
    </div>
  )
}

export function MacroRangeBar({ fat, carbs, protein }: MacroRangeBarProps) {
  const { t } = useTranslation('today')
  const dataMap = { fat, carbs, protein }

  return (
    <div className="space-y-4">
      {getMacroConfig(t).map(({ key, label, color }) => (
        <MacroRow key={key} label={label} color={color} entry={dataMap[key]} />
      ))}
    </div>
  )
}
