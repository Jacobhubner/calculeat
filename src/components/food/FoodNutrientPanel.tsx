import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useFoodNutrients, useNutrientDefinitions } from '@/hooks/useFoodNutrients'
import type { FoodItem } from '@/hooks/useFoodItems'
import { SOURCE_BADGES } from '@/lib/constants/sourceBadges'

const COLOR_INDICATORS: Record<string, { label: string; className: string }> = {
  Green: { label: 'Grön', className: 'text-success-600' },
  Yellow: { label: 'Gul', className: 'text-warning-600' },
  Orange: { label: 'Orange', className: 'text-accent-600' },
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'Makronäringsämnen',
  vitamin: 'Vitaminer',
  mineral: 'Mineraler',
}

const CATEGORY_ORDER = ['macro', 'vitamin', 'mineral']

// Koder som ska visas indenterade med "varav"-prefix under sin förälder
const SUB_NUTRIENT_CODES = new Set([
  'saturated_fat',
  'monounsaturated_fat',
  'polyunsaturated_fat',
  'sugars',
  'fiber',
])

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
    if (!definitions || !foodItem) return null

    const defMap = new Map(definitions.map(d => [d.nutrient_code, d]))

    // Start with food_nutrients rows (authoritative — SLV, USDA, scanned)
    const dbRows = (nutrients ?? [])
      .map(fn => {
        const def = defMap.get(fn.nutrient_code)
        if (!def) return null
        return { nutrient_code: fn.nutrient_code, amount: fn.amount, definition: def }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const dbCodes = new Set(dbRows.map(r => r.nutrient_code))

    // Synthetic rows from food_items columns — only if NOT already in food_nutrients
    type SyntheticRow = {
      nutrient_code: string
      amount: number
      definition: (typeof definitions)[number]
    }
    const synthetic: SyntheticRow[] = []

    const addSynthetic = (code: string, value: number | null | undefined) => {
      if (value == null || isNaN(value) || dbCodes.has(code)) return
      const def = defMap.get(code)
      if (def) synthetic.push({ nutrient_code: code, amount: value, definition: def })
    }

    addSynthetic('energy_kcal', foodItem.calories)
    addSynthetic('fat', foodItem.fat_g)
    addSynthetic('carbohydrates', foodItem.carb_g)
    addSynthetic('protein', foodItem.protein_g)

    const all = [...dbRows, ...synthetic]

    const groups: Record<string, typeof all> = {}
    for (const item of all) {
      const cat = item.definition.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.definition.sort_order - b.definition.sort_order)
    }

    return groups
  }, [nutrients, definitions, foodItem])

  const totalNutrientCount = useMemo(() => {
    if (!grouped) return 0
    return Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
  }, [grouped])

  const isLoading = nutrientsLoading || defsLoading
  const sourceBadge = foodItem ? SOURCE_BADGES[foodItem.source] : null
  const colorInfo = foodItem?.energy_density_color
    ? COLOR_INDICATORS[foodItem.energy_density_color]
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Gradient header — sticky */}
        <div className="shrink-0 bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="text-white text-lg font-bold pr-2 leading-snug">
                {foodItem?.name ?? 'Näringsvärden'}
              </DialogTitle>
              {sourceBadge && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs border-white/40 text-white bg-white/15"
                >
                  {sourceBadge.label}
                </Badge>
              )}
            </div>
            <div className="text-sm text-primary-100 mt-1 space-y-0.5">
              <p>
                per {foodItem?.reference_amount ?? 100} {foodItem?.reference_unit ?? 'g'}
              </p>
              {foodItem?.kcal_per_gram != null && colorInfo && (
                <p className="text-primary-100">
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
        </div>

        {/* Body — scrollbar */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && <p className="text-sm text-neutral-500 py-4">Laddar näringsvärden...</p>}

          {!isLoading && totalNutrientCount === 0 && (
            <p className="text-sm text-neutral-500 py-4">
              Inga detaljerade näringsvärden tillgängliga.
            </p>
          )}

          {!isLoading && totalNutrientCount > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">{totalNutrientCount} näringsvärden</p>

              {CATEGORY_ORDER.map((cat, catIdx) => {
                const items = grouped?.[cat]
                if (!items || items.length === 0) return null

                return (
                  <div key={cat}>
                    {catIdx > 0 && <div className="border-t border-neutral-100 mb-4" />}
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                      {/* Kategorirubriken */}
                      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                          {CATEGORY_LABELS[cat] || cat}
                        </h3>
                      </div>
                      {/* Rader */}
                      <div className="divide-y divide-neutral-100">
                        {items.map(item => {
                          const isSub = SUB_NUTRIENT_CODES.has(item.nutrient_code)
                          return (
                            <div
                              key={item.nutrient_code}
                              className={`flex justify-between items-center px-4 py-2.5 ${isSub ? 'pl-8 bg-neutral-50/50' : 'bg-white'}`}
                            >
                              <span
                                className={`text-sm ${isSub ? 'text-neutral-400' : 'text-neutral-700'}`}
                              >
                                {isSub ? 'varav ' : ''}
                                {item.definition.display_name_sv}
                              </span>
                              <span
                                className={`text-sm tabular-nums ml-4 ${isSub ? 'text-neutral-400' : 'font-semibold text-neutral-900'}`}
                              >
                                {formatAmount(item.amount)}{' '}
                                <span className="font-normal text-neutral-400 text-xs">
                                  {item.definition.unit}
                                </span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
