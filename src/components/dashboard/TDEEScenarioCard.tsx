import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  bmr: number
  tdee: number
}

export function TDEEScenarioCard({ bmr, tdee }: Props) {
  const { t } = useTranslation('dashboard')

  // Scenario TDEEs (Fitness Stuff PAL values)
  const walkScenario = tdee + 210
  const standScenario = tdee + 385
  const mostActiveTdee = Math.round(bmr * 1.5 + 600)
  const leastActiveTdee = Math.round(bmr + 150)

  const dWalk = Math.round(walkScenario - tdee)
  const dStand = Math.round(standScenario - tdee)
  const dMost = Math.round(mostActiveTdee - tdee)
  const dLeast = Math.round(leastActiveTdee - tdee)

  const renderDelta = (d: number, atMaxKey?: string) => {
    const positive = d >= 0
    const arrow = positive ? '⇧' : '⇩'
    const colorClass = positive ? 'text-green-600' : 'text-red-500'
    return (
      <p className={`text-sm font-semibold ${colorClass}`}>
        {arrow} {Math.abs(d)} kcal
        {d === 0 && atMaxKey && (
          <span className="ml-1 text-xs font-normal text-neutral-500">{t(atMaxKey)}</span>
        )}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-neutral-600">
          {t('tdeeScenarios.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3 text-xs">
        <div>
          <p className="text-neutral-500">{t('tdeeScenarios.walk')}</p>
          {renderDelta(dWalk)}
        </div>
        <div>
          <p className="text-neutral-500">{t('tdeeScenarios.stand')}</p>
          {renderDelta(dStand)}
        </div>
        <div>
          <p className="text-neutral-500">{t('tdeeScenarios.mostActive')}</p>
          {renderDelta(dMost, 'tdeeScenarios.alreadyAtMax')}
        </div>
        <div>
          <p className="text-neutral-500">{t('tdeeScenarios.leastActive')}</p>
          {renderDelta(dLeast)}
        </div>
        <p className="text-xs text-neutral-400 italic text-right pt-0.5">
          {t('tdeeScenarios.source')}
        </p>
      </CardContent>
    </Card>
  )
}
