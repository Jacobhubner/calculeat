import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FoodItem = { label: string; icon: string }

/**
 * Nycklarna typades som `string`, vilket i18next-typerna inte godtar — därav
 * `t(key as any)` på fem ställen. ParseKeys härleds ur food-namespacet, så
 * typen följer med när översättningarna ändras.
 *
 * `*Items`-nycklarna pekar på arrayer och ingår därför inte i ParseKeys, som
 * bara listar strängnycklar. De typas separat mot JSON-strukturen.
 */
type FoodKey = ParseKeys<'food'>

type ItemsKey =
  | 'infoCards.green.solidItems'
  | 'infoCards.green.liquidItems'
  | 'infoCards.green.soupItems'
  | 'infoCards.yellow.solidItems'
  | 'infoCards.yellow.liquidItems'
  | 'infoCards.yellow.soupItems'
  | 'infoCards.orange.solidItems'
  | 'infoCards.orange.liquidItems'
  | 'infoCards.orange.soupItems'

function ColorCard({
  titleKey,
  subtitleKey,
  solidLabelKey,
  liquidLabelKey,
  soupLabelKey,
  solidItemsKey,
  liquidItemsKey,
  soupItemsKey,
  tipKey,
  gradient,
  border,
  emoji,
}: {
  titleKey: FoodKey
  subtitleKey: FoodKey
  solidLabelKey: FoodKey
  liquidLabelKey: FoodKey
  soupLabelKey: FoodKey
  solidItemsKey: ItemsKey
  liquidItemsKey: ItemsKey
  soupItemsKey: ItemsKey
  tipKey: FoodKey
  gradient: string
  border: string
  emoji: string
}) {
  const { t } = useTranslation('food')

  const items = (key: ItemsKey) =>
    t(key as FoodKey, { returnObjects: true }) as unknown as FoodItem[]

  return (
    <Card className={`${gradient} ${border}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{emoji}</span>
          {t(titleKey)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
        <p className="text-sm text-neutral-700 font-medium dark:text-neutral-200">
          {t(subtitleKey)}
        </p>
        {[
          { labelKey: solidLabelKey, itemsKey: solidItemsKey },
          { labelKey: liquidLabelKey, itemsKey: liquidItemsKey },
          { labelKey: soupLabelKey, itemsKey: soupItemsKey },
        ].map(({ labelKey, itemsKey }) => (
          <div key={labelKey}>
            <p className="font-semibold text-neutral-700 mb-1 dark:text-neutral-200">
              {t(labelKey)}
            </p>
            <ul className="space-y-0.5 pl-2">
              {items(itemsKey).map(({ label, icon }) => (
                <li key={label} className="flex gap-1.5 items-center">
                  <span className="w-4 text-center">{icon}</span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-neutral-500 pt-1 dark:text-neutral-400">{t(tipKey)}</p>
      </CardContent>
    </Card>
  )
}

export function EnergyDensityInfoCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ColorCard
        emoji="🟢"
        titleKey="infoCards.green.title"
        subtitleKey="infoCards.green.subtitle"
        solidLabelKey="infoCards.green.solidLabel"
        liquidLabelKey="infoCards.green.liquidLabel"
        soupLabelKey="infoCards.green.soupLabel"
        solidItemsKey="infoCards.green.solidItems"
        liquidItemsKey="infoCards.green.liquidItems"
        soupItemsKey="infoCards.green.soupItems"
        tipKey="infoCards.green.tip"
        gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/25 dark:to-green-900/40"
        border="border-green-200 dark:border-green-800"
      />
      <ColorCard
        emoji="🟡"
        titleKey="infoCards.yellow.title"
        subtitleKey="infoCards.yellow.subtitle"
        solidLabelKey="infoCards.yellow.solidLabel"
        liquidLabelKey="infoCards.yellow.liquidLabel"
        soupLabelKey="infoCards.yellow.soupLabel"
        solidItemsKey="infoCards.yellow.solidItems"
        liquidItemsKey="infoCards.yellow.liquidItems"
        soupItemsKey="infoCards.yellow.soupItems"
        tipKey="infoCards.yellow.tip"
        gradient="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/25 dark:to-yellow-900/40"
        border="border-yellow-200 dark:border-yellow-800"
      />
      <ColorCard
        emoji="🟠"
        titleKey="infoCards.orange.title"
        subtitleKey="infoCards.orange.subtitle"
        solidLabelKey="infoCards.orange.solidLabel"
        liquidLabelKey="infoCards.orange.liquidLabel"
        soupLabelKey="infoCards.orange.soupLabel"
        solidItemsKey="infoCards.orange.solidItems"
        liquidItemsKey="infoCards.orange.liquidItems"
        soupItemsKey="infoCards.orange.soupItems"
        tipKey="infoCards.orange.tip"
        gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/15 dark:to-orange-500/10"
        border="border-orange-200 dark:border-orange-800"
      />
    </div>
  )
}
