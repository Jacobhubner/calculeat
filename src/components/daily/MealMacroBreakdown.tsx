import { cn } from '@/lib/utils'

interface MealMacroBreakdownProps {
  fat: number
  carbs: number
  protein: number
  totalWeight: number // gram
  className?: string
}

/**
 * Displays macro breakdown for a meal (Excel R23:U27 style)
 * Two rows with separate stacked bars - ALL GRAM-BASED (not calorie-based!):
 *
 * Weight row (R24:T24): macro_grams / total_food_weight
 *   - Shows what % of total food weight is each macro
 *   - Sum ≠ 100% (rest is water, fiber, etc.)
 *
 * Macros row (R26:T26): macro_grams / total_macro_grams
 *   - Shows what % of macro grams is each macro
 *   - Sum = 100%
 *
 * Excel formulas:
 *   R24: =IFERROR(SUM(I22:J31)/SUM(Q22:Q31),"")  // fat_grams / total_weight
 *   R26: =IFERROR(SUM(I22:J31)/SUM(I22:N31),"")  // fat_grams / total_macro_grams
 */
export function MealMacroBreakdown({
  fat,
  carbs,
  protein,
  totalWeight,
  className,
}: MealMacroBreakdownProps) {
  // Total macro grams (NOT calories - Excel uses gram-based calculation)
  const totalMacroGrams = fat + carbs + protein

  // Early return if no macros
  if (totalMacroGrams === 0) return null

  // Weight row (R24:T24): macro_grams / total_food_weight
  // Excel formula: =IFERROR(SUM(fat_grams)/SUM(total_weight),"")
  // Sum will NOT be 100% (rest is water, fiber, minerals, etc.)
  const fatWeightPercent = totalWeight > 0 ? (fat / totalWeight) * 100 : 0
  const carbWeightPercent = totalWeight > 0 ? (carbs / totalWeight) * 100 : 0
  const proteinWeightPercent = totalWeight > 0 ? (protein / totalWeight) * 100 : 0

  // Macros row (R26:T26): macro_grams / total_macro_grams
  // Excel formula: =IFERROR(SUM(fat_grams)/SUM(all_macro_grams),"")
  // IMPORTANT: This is GRAM-BASED, not calorie-based!
  // Sum will always be 100%
  const fatMacroPercent = (fat / totalMacroGrams) * 100
  const carbMacroPercent = (carbs / totalMacroGrams) * 100
  const proteinMacroPercent = (protein / totalMacroGrams) * 100

  return (
    <div className={cn('mt-3 pt-2 border-t border-neutral-100', className)}>
      {/* Table header */}
      <div className="grid grid-cols-4 gap-1 text-[10px] text-neutral-400 mb-1">
        <div></div>
        <div className="text-center font-medium text-yellow-600">Fett</div>
        <div className="text-center font-medium text-blue-600">Kolh</div>
        <div className="text-center font-medium text-red-600">Prot</div>
      </div>

      {/* Weight row (percentage of total food weight) */}
      {totalWeight > 0 && (
        <>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-neutral-500 mb-0.5">
            <div className="text-neutral-400">Vikt</div>
            <div className="text-center font-mono">{fatWeightPercent.toFixed(1)}%</div>
            <div className="text-center font-mono">{carbWeightPercent.toFixed(1)}%</div>
            <div className="text-center font-mono">{proteinWeightPercent.toFixed(1)}%</div>
          </div>
          {/* Weight stacked bar */}
          <div className="h-1.5 flex rounded-full overflow-hidden mb-2">
            {fatWeightPercent > 0 && (
              <div
                className="bg-yellow-400"
                style={{ width: `${fatWeightPercent}%` }}
                title={`Fett: ${fatWeightPercent.toFixed(1)}%`}
              />
            )}
            {carbWeightPercent > 0 && (
              <div
                className="bg-blue-400"
                style={{ width: `${carbWeightPercent}%` }}
                title={`Kolhydrater: ${carbWeightPercent.toFixed(1)}%`}
              />
            )}
            {proteinWeightPercent > 0 && (
              <div
                className="bg-red-400"
                style={{ width: `${proteinWeightPercent}%` }}
                title={`Protein: ${proteinWeightPercent.toFixed(1)}%`}
              />
            )}
          </div>
        </>
      )}

      {/* Macros row (percentage of total macro calories) */}
      <div className="grid grid-cols-4 gap-1 text-[10px] text-neutral-500 mb-0.5">
        <div className="text-neutral-400">Makro</div>
        <div className="text-center font-mono text-yellow-600">{fatMacroPercent.toFixed(1)}%</div>
        <div className="text-center font-mono text-blue-600">{carbMacroPercent.toFixed(1)}%</div>
        <div className="text-center font-mono text-red-600">{proteinMacroPercent.toFixed(1)}%</div>
      </div>
      {/* Macros stacked bar */}
      <div className="h-1.5 flex rounded-full overflow-hidden">
        {fatMacroPercent > 0 && (
          <div
            className="bg-yellow-400"
            style={{ width: `${fatMacroPercent}%` }}
            title={`Fett: ${fatMacroPercent.toFixed(1)}%`}
          />
        )}
        {carbMacroPercent > 0 && (
          <div
            className="bg-blue-400"
            style={{ width: `${carbMacroPercent}%` }}
            title={`Kolhydrater: ${carbMacroPercent.toFixed(1)}%`}
          />
        )}
        {proteinMacroPercent > 0 && (
          <div
            className="bg-red-400"
            style={{ width: `${proteinMacroPercent}%` }}
            title={`Protein: ${proteinMacroPercent.toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  )
}
