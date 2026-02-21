import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useFoodNutrients, useNutrientDefinitions } from '@/hooks/useFoodNutrients'
import type { FoodItem, FoodSource } from '@/hooks/useFoodItems'

const SOURCE_BADGES: Record<FoodSource, { label: string; className: string }> = {
  user: { label: 'Min', className: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
  manual: {
    label: 'CalculEat',
    className: 'bg-primary-100 text-primary-700 border-primary-400 font-semibold',
  },
  livsmedelsverket: { label: 'SLV', className: 'bg-blue-700 text-white border-blue-800' },
  usda: { label: 'USDA', className: 'bg-amber-100 text-amber-800 border-amber-400' },
}

const COLOR_INDICATORS: Record<string, { label: string; className: string }> = {
  Green: { label: 'Grön', className: 'text-green-600' },
  Yellow: { label: 'Gul', className: 'text-yellow-600' },
  Orange: { label: 'Orange', className: 'text-orange-600' },
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'Makronäringsämnen',
  vitamin: 'Vitaminer',
  mineral: 'Mineraler',
}

const CATEGORY_ORDER = ['macro', 'vitamin', 'mineral']

interface FoodNutrientPanelProps {
  foodItem: FoodItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FoodNutrientPanel({ foodItem, open, onOpenChange }: FoodNutrientPanelProps) {
  const { data: nutrients, isLoading: nutrientsLoading } = useFoodNutrients(
    open ? (foodItem?.id ?? null) : null
  )
  const { data: definitions, isLoading: defsLoading } = useNutrientDefinitions()

  const grouped = useMemo(() => {
    if (!nutrients || !definitions) return null

    const defMap = new Map(definitions.map(d => [d.nutrient_code, d]))

    const enriched = nutrients
      .map(fn => {
        const def = defMap.get(fn.nutrient_code)
        if (!def) return null
        return { ...fn, definition: def }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const groups: Record<string, Array<(typeof enriched)[number]>> = {}

    for (const item of enriched) {
      const cat = item.definition.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }

    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.definition.sort_order - b.definition.sort_order)
    }

    return groups
  }, [nutrients, definitions])

  const totalNutrientCount = nutrients?.length ?? 0
  const isLoading = nutrientsLoading || defsLoading
  const sourceBadge = foodItem ? SOURCE_BADGES[foodItem.source] : null
  const colorInfo = foodItem?.energy_density_color
    ? COLOR_INDICATORS[foodItem.energy_density_color]
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg pr-2">{foodItem?.name ?? 'Näringsvärden'}</DialogTitle>
            {sourceBadge && (
              <Badge variant="outline" className={`shrink-0 text-xs ${sourceBadge.className}`}>
                {sourceBadge.label}
              </Badge>
            )}
          </div>

          {/* Reference + density info */}
          <div className="text-sm text-neutral-500 mt-1 space-y-0.5">
            <p>
              per {foodItem?.reference_amount ?? 100} {foodItem?.reference_unit ?? 'g'}
            </p>
            {foodItem?.kcal_per_gram != null && colorInfo && (
              <p className={colorInfo.className}>
                Energitäthet: {Number(foodItem.kcal_per_gram).toFixed(2)} kcal/g
                {' · '}
                {colorInfo.label}
              </p>
            )}
            {foodItem?.reference_unit === 'ml' && foodItem?.density_g_per_ml != null && (
              <p>Densitet: {Number(foodItem.density_g_per_ml).toFixed(2)} g/ml</p>
            )}
          </div>
        </DialogHeader>

        {isLoading && <p className="text-sm text-neutral-500 py-4">Laddar näringsvärden...</p>}

        {!isLoading && totalNutrientCount === 0 && (
          <p className="text-sm text-neutral-500 py-4">
            Inga detaljerade näringsvärden tillgängliga.
          </p>
        )}

        {!isLoading && totalNutrientCount > 0 && (
          <>
            <p className="text-xs text-neutral-400 mb-2">{totalNutrientCount} näringsvärden</p>

            {CATEGORY_ORDER.map((cat, catIdx) => {
              const items = grouped?.[cat]
              if (!items || items.length === 0) return null

              return (
                <div key={cat}>
                  {catIdx > 0 && <div className="border-t border-neutral-100 my-3" />}
                  <h3 className="font-semibold text-sm text-neutral-700 mb-2">
                    {CATEGORY_LABELS[cat] || cat}
                  </h3>
                  <div className="space-y-1">
                    {items.map(item => (
                      <div key={item.nutrient_code} className="flex justify-between text-sm">
                        <span className="text-neutral-600">{item.definition.display_name_sv}</span>
                        <span className="font-medium tabular-nums">
                          {formatAmount(item.amount)} {item.definition.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatAmount(value: number): string {
  if (value === 0) return '0'
  if (value >= 100) return Math.round(value).toString()
  if (value >= 10) return value.toFixed(1)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}
