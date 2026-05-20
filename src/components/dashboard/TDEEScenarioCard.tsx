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

  const dWalk = delta(walkScenario, tdee)
  const dStand = delta(standScenario, tdee)
  const dMost = delta(mostActiveTdee, tdee)
  const dLeast = delta(leastActiveTdee, tdee)

  const renderDelta = (d: number, atMaxKey?: string) => {
    const positive = d >= 0
    const arrow = positive ? '⇧' : '⇩'
    const colorClass = positive ? 'text-green-600' : 'text-red-500'
    return (
      <p className={`text-base font-semibold ${colorClass}`}>
        {arrow} {Math.abs(d)} kcal
        {d === 0 && atMaxKey && (
          <span className="ml-1 text-xs font-normal text-neutral-500">{t(atMaxKey)}</span>
        )}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('tdeeScenarios.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-0.5">
          <p className="text-neutral-600">{t('tdeeScenarios.walk')}</p>
          {renderDelta(dWalk)}
        </div>
        <div className="space-y-0.5">
          <p className="text-neutral-600">{t('tdeeScenarios.stand')}</p>
          {renderDelta(dStand)}
        </div>
        <div className="space-y-0.5">
          <p className="text-neutral-600">{t('tdeeScenarios.mostActive')}</p>
          {renderDelta(dMost, 'tdeeScenarios.alreadyAtMax')}
        </div>
        <div className="space-y-0.5">
          <p className="text-neutral-600">{t('tdeeScenarios.leastActive')}</p>
          {renderDelta(dLeast)}
        </div>
        <p className="text-xs text-neutral-400 italic text-right pt-1">
          {t('tdeeScenarios.source')}
        </p>
      </CardContent>
    </Card>
  )
}
