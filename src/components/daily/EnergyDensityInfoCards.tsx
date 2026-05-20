import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FoodItem = { label: string; icon: string }

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
  titleKey: string
  subtitleKey: string
  solidLabelKey: string
  liquidLabelKey: string
  soupLabelKey: string
  solidItemsKey: string
  liquidItemsKey: string
  soupItemsKey: string
  tipKey: string
  gradient: string
  border: string
  emoji: string
}) {
  const { t } = useTranslation('food')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (key: string) => t(key as any, { returnObjects: true }) as FoodItem[]

  return (
    <Card className={`${gradient} ${border}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{emoji}</span>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t(titleKey as any)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-neutral-600">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p className="text-sm text-neutral-700 font-medium">{t(subtitleKey as any)}</p>
        {[
          { labelKey: solidLabelKey, itemsKey: solidItemsKey },
          { labelKey: liquidLabelKey, itemsKey: liquidItemsKey },
          { labelKey: soupLabelKey, itemsKey: soupItemsKey },
        ].map(({ labelKey, itemsKey }) => (
          <div key={labelKey}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <p className="font-semibold text-neutral-700 mb-1">{t(labelKey as any)}</p>
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
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p className="text-neutral-500 pt-1">{t(tipKey as any)}</p>
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
        gradient="bg-gradient-to-br from-green-50 to-green-100"
        border="border-green-200"
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
        gradient="bg-gradient-to-br from-yellow-50 to-yellow-100"
        border="border-yellow-200"
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
        gradient="bg-gradient-to-br from-orange-50 to-orange-100"
        border="border-orange-200"
      />
    </div>
  )
}
