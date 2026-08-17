/**
 * Visar officiella recept vars ingredienser ändrats sedan receptet sparades.
 *
 * Panelen räknar inte om något själv. Omräkning görs genom att öppna receptet
 * i receptredigeraren och spara om — då går beräkningen genom exakt samma kod
 * som skapade receptet, i stället för en andra sanning i SQL som skulle kunna
 * driva ifrån.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDriftedRecipes } from '@/hooks/useRecipeDrift'

interface Props {
  enabled: boolean
}

export default function RecipeDriftPanel({ enabled }: Props) {
  const { t } = useTranslation('admin')
  const { data: drifted = [], isLoading } = useDriftedRecipes(enabled)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('drift.loading')}
      </div>
    )
  }

  if (drifted.length === 0) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg bg-success-50 px-3 py-2.5 dark:bg-success-900/25">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600 dark:text-success-400" />
        <p className="text-sm text-success-800 dark:text-success-300">{t('drift.none')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('drift.summary', { count: drifted.length })}
      </p>

      <ul className="space-y-2">
        {drifted.map(r => {
          // Nära noll betyder att livsmedlet ändrats men receptets totala
          // näring knappt påverkas — värt att skilja från en verklig avvikelse.
          const delta = r.delta_per_100g ?? 0
          const marginal = Math.abs(delta) < 1

          return (
            <li
              key={r.recipe_id}
              className="rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {r.recipe_name}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {t('drift.ingredientCount', {
                      drifted: r.drifted_ingredients,
                      total: r.total_ingredients,
                    })}
                  </p>
                </div>
                {/* Utan vikt går omräkningen inte att göra. Säg det rakt ut —
                    en tom ruta skulle läsas som "ingen avvikelse". */}
                {r.weights_missing ? (
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {t('drift.cannotCalculate')}
                  </span>
                ) : (
                  r.stored_per_100g != null &&
                  r.recalculated_per_100g != null && (
                    <span
                      className={
                        marginal
                          ? 'shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }
                    >
                      {r.stored_per_100g} → {r.recalculated_per_100g} kcal
                    </span>
                  )
                )}
              </div>

              {r.details && r.details.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {r.details.map(d => (
                    <li
                      key={d.ingredient}
                      className="text-xs text-neutral-500 dark:text-neutral-400"
                    >
                      {d.ingredient}: {d.was} → {d.now} kcal/100 g
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <div className="rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{t('drift.howToFix')}</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link to="/app/recipes">
            {t('drift.openRecipes')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
