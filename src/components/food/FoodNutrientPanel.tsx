import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import { useFoodNutrients, useNutrientDefinitions } from '@/hooks/useFoodNutrients'
import type { FoodItem } from '@/hooks/useFoodItems'
import { SOURCE_BADGES } from '@/lib/constants/sourceBadges'
import { useTranslation } from 'react-i18next'


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
  const { t } = useTranslation('food')
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
  const tAny = t as (key: string) => string
  const colorLabel = foodItem?.energy_density_color
    ? tAny(`color.${foodItem.energy_density_color.toLowerCase()}`)
    : null

  if (!open || !foodItem) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Sticky gradient header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h2 className="text-2xl font-bold leading-snug">{foodItem.name}</h2>
                {sourceBadge && (
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-white/40 text-white bg-white/15 mt-1"
                  >
                    {sourceBadge.label}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-primary-100 mt-1 space-y-0.5">
                <p>
                  per {foodItem.reference_amount ?? 100} {foodItem.reference_unit ?? 'g'}
                </p>
                {foodItem.kcal_per_gram != null && colorLabel && (
                  <p>
                    {t('panel.energyDensity')} {Number(foodItem.kcal_per_gram).toFixed(2)} kcal/g
                    {' · '}
                    <span className="text-white">{colorLabel}</span>
                  </p>
                )}
                {foodItem.reference_unit === 'ml' && foodItem.density_g_per_ml != null && (
                  <p>{t('panel.density')} {Number(foodItem.density_g_per_ml).toFixed(2)} g/ml</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 shrink-0"
              aria-label={t('panel.close')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {isLoading && <p className="text-sm text-neutral-500 py-4">{t('panel.loading')}</p>}

            {!isLoading && totalNutrientCount === 0 && (
              <p className="text-sm text-neutral-500 py-4">
                {t('panel.noData')}
              </p>
            )}

            {!isLoading && totalNutrientCount > 0 && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-400">{t('panel.nutrientCount', { count: totalNutrientCount })}</p>

                {CATEGORY_ORDER.map((cat, catIdx) => {
                  const items = grouped?.[cat]
                  if (!items || items.length === 0) return null

                  return (
                    <div key={cat}>
                      {catIdx > 0 && <div className="border-t border-neutral-100 mb-4" />}
                      <div className="rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            {tAny(`panel.categories.${cat}`) || cat}
                          </h3>
                        </div>
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
                                  {isSub ? `${t('panel.varav')} ` : ''}
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

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              {t('panel.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

function formatAmount(value: number): string {
  if (value === 0) return '0'
  if (value >= 100) return Math.round(value).toString()
  if (value >= 10) return value.toFixed(1)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}
