import { cn } from '@/lib/utils'
import {
  getEnergyDensityColor,
  getEnergyDensityLabel,
  getEnergyDensityColorClass,
} from '@/lib/calculations/dailySummary'

interface EnergyDensityIndicatorProps {
  density: number
  showLabel?: boolean
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Visual indicator for energy density (kcal/gram)
 * Displays as a colored bar with optional label
 */
export function EnergyDensityIndicator({
  density,
  showLabel = true,
  showValue = true,
  size = 'md',
  className,
}: EnergyDensityIndicatorProps) {
  const color = getEnergyDensityColor(density)
  const label = getEnergyDensityLabel(density)

  // Calculate bar width (0-3 kcal/g mapped to 0-100%)
  const barWidth = Math.min((density / 3) * 100, 100)

  const sizeClasses = {
    sm: { bar: 'h-1.5', text: 'text-sm', gap: 'gap-2' },
    md: { bar: 'h-2', text: 'text-sm', gap: 'gap-2' },
    lg: { bar: 'h-3', text: 'text-base', gap: 'gap-2' },
  }

  const content = (
    <div className={cn('space-y-1', className)}>
      <div className={cn('flex items-center justify-between', sizeClasses[size].gap)}>
        <span className={cn('font-medium text-neutral-700', sizeClasses[size].text)}>
          Energitäthet
        </span>
        <div className="flex items-center gap-2">
          {showValue && (
            <span className={cn('font-semibold text-neutral-900', sizeClasses[size].text)}>
              {density.toFixed(1)} kcal/g
            </span>
          )}
          {showLabel && (
            <span
              className={cn(
                'font-medium',
                sizeClasses[size].text,
                color === 'cyan' && 'text-cyan-600',
                color === 'green' && 'text-green-600',
                color === 'yellow' && 'text-yellow-600',
                color === 'orange' && 'text-orange-600',
                color === 'red' && 'text-red-600',
                color === 'neutral' && 'text-neutral-400'
              )}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Color scale bar */}
      <div className="relative">
        {/* Background scale showing all zones */}
        <div
          className={cn('flex rounded-full overflow-hidden bg-neutral-100', sizeClasses[size].bar)}
        >
          {/* Cyan zone: 0-0.5 (16.7%) */}
          <div className="bg-cyan-200" style={{ width: '16.7%' }} />
          {/* Green zone: 0.5-1.0 (16.7%) */}
          <div className="bg-green-200" style={{ width: '16.7%' }} />
          {/* Yellow zone: 1.0-2.0 (33.3%) */}
          <div className="bg-yellow-200" style={{ width: '33.3%' }} />
          {/* Orange zone: 2.0-2.5 (16.7%) */}
          <div className="bg-orange-200" style={{ width: '16.6%' }} />
          {/* Red zone: 2.5-3.0 (16.7%) */}
          <div className="bg-red-200" style={{ width: '16.7%' }} />
        </div>

        {/* Current value indicator */}
        {density > 0 && (
          <div
            className="absolute top-0 h-full transition-all duration-300"
            style={{ left: `${barWidth}%` }}
          >
            <div
              className={cn(
                'w-1 h-full rounded-full shadow-sm',
                getEnergyDensityColorClass(density)
              )}
            />
          </div>
        )}
      </div>
    </div>
  )

  return content
}

interface EnergyDensityCompactProps {
  density: number
  className?: string
}

/**
 * Compact energy density display for sidebar/cards
 */
export function EnergyDensityCompact({ density, className }: EnergyDensityCompactProps) {
  const color = getEnergyDensityColor(density)
  const label = getEnergyDensityLabel(density)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          color === 'cyan' && 'bg-cyan-500',
          color === 'green' && 'bg-green-500',
          color === 'yellow' && 'bg-yellow-500',
          color === 'orange' && 'bg-orange-500',
          color === 'red' && 'bg-red-500',
          color === 'neutral' && 'bg-neutral-300'
        )}
      />
      <span className="text-sm text-neutral-600">
        {density > 0 ? `${density.toFixed(1)} kcal/g` : 'Ingen data'}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          color === 'cyan' && 'text-cyan-600',
          color === 'green' && 'text-green-600',
          color === 'yellow' && 'text-yellow-600',
          color === 'orange' && 'text-orange-600',
          color === 'red' && 'text-red-600',
          color === 'neutral' && 'text-neutral-400'
        )}
      >
        ({label})
      </span>
    </div>
  )
}

interface EnergyDensityLegendProps {
  className?: string
}

/**
 * Legend showing energy density color scale
 */
export function EnergyDensityLegend({ className }: EnergyDensityLegendProps) {
  const zones = [
    { color: 'bg-cyan-400', label: '< 0.5', desc: 'Mycket låg' },
    { color: 'bg-green-400', label: '0.5-1.0', desc: 'Låg (optimalt)' },
    { color: 'bg-yellow-400', label: '1.0-2.0', desc: 'Medel' },
    { color: 'bg-orange-400', label: '2.0-2.5', desc: 'Hög' },
    { color: 'bg-red-400', label: '> 2.5', desc: 'Mycket hög' },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Energitäthet (kcal/g)
      </p>
      <div className="grid grid-cols-5 gap-1">
        {zones.map(zone => (
          <div key={zone.label} className="text-center">
            <div className={cn('h-2 rounded-sm mb-1', zone.color)} />
            <p className="text-xs text-neutral-600">{zone.label}</p>
            <p className="text-xs text-neutral-400">{zone.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
