import { useTranslation } from 'react-i18next'

interface EnergyGoalReferenceTableProps {
  tdee: number
  selectedGoal: string
  selectedDeficit?: string
  onGoalSelect: (goal: string) => void
  onDeficitSelect: (deficit: string) => void
}

interface GoalRow {
  label: string
  percentage: string
  description?: string
  isSelected: boolean
  isSubItem?: boolean
  goalValue: string
  deficitValue?: string
}

export default function EnergyGoalReferenceTable({
  tdee,
  selectedGoal,
  selectedDeficit,
  onGoalSelect,
  onDeficitSelect,
}: EnergyGoalReferenceTableProps) {
  const { t } = useTranslation('tools')

  if (!tdee || tdee <= 0 || !isFinite(tdee)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{t('energyGoalTable.invalidTdee')}</p>
      </div>
    )
  }

  const maintainMin = tdee * 0.97
  const maintainMax = tdee * 1.03

  const gain10Min = tdee * 1.1
  const gain10Max = tdee * 1.2
  const gain10DiffMin = gain10Min - tdee
  const gain10DiffMax = gain10Max - tdee

  const loss10Min = tdee * 0.85
  const loss10Max = tdee * 0.9
  const loss10DiffMin = tdee - loss10Max
  const loss10DiffMax = tdee - loss10Min

  const loss20Min = tdee * 0.75
  const loss20Max = tdee * 0.8
  const loss20DiffMin = tdee - loss20Max
  const loss20DiffMax = tdee - loss20Min

  const loss25Min = tdee * 0.7
  const loss25Max = tdee * 0.75
  const loss25DiffMin = tdee - loss25Max
  const loss25DiffMax = tdee - loss25Min

  const gain10KgMin = ((gain10DiffMin * 7) / 7700).toFixed(2)
  const gain10KgMax = ((gain10DiffMax * 7) / 7700).toFixed(2)
  const loss10KgMin = ((loss10DiffMin * 7) / 7700).toFixed(2)
  const loss10KgMax = ((loss10DiffMax * 7) / 7700).toFixed(2)
  const loss20KgMin = ((loss20DiffMin * 7) / 7700).toFixed(2)
  const loss20KgMax = ((loss20DiffMax * 7) / 7700).toFixed(2)
  const loss25KgMin = ((loss25DiffMin * 7) / 7700).toFixed(2)
  const loss25KgMax = ((loss25DiffMax * 7) / 7700).toFixed(2)

  const goals: GoalRow[] = [
    {
      label: t('energyGoalTable.maintainLabel'),
      percentage: `${Math.round(maintainMin)} - ${Math.round(maintainMax)} kcal (${Math.round(tdee)} kcal)`,
      description: t('energyGoalTable.maintainDesc'),
      isSelected: selectedGoal === 'Maintain weight',
      goalValue: 'Maintain weight',
    },
    {
      label: t('energyGoalTable.gainLabel'),
      percentage: `${Math.round(gain10Min)} - ${Math.round(gain10Max)} kcal (⇧ ${Math.round(gain10DiffMin)} - ${Math.round(gain10DiffMax)} kcal)`,
      description: t('energyGoalTable.gainDesc', { kgMin: gain10KgMin, kgMax: gain10KgMax }),
      isSelected: selectedGoal === 'Weight gain',
      goalValue: 'Weight gain',
    },
    {
      label: t('energyGoalTable.lossHeader'),
      percentage: '',
      isSelected: false,
      goalValue: '',
    },
    {
      label: t('energyGoalTable.lossCautiousLabel'),
      percentage: `${Math.round(loss10Min)} - ${Math.round(loss10Max)} kcal (⇩ ${Math.round(loss10DiffMin)} - ${Math.round(loss10DiffMax)} kcal)`,
      description: t('energyGoalTable.lossCautiousDesc', {
        kgMin: loss10KgMin,
        kgMax: loss10KgMax,
      }),
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '10-15%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '10-15%',
    },
    {
      label: t('energyGoalTable.lossNormalLabel'),
      percentage: `${Math.round(loss20Min)} - ${Math.round(loss20Max)} kcal (⇩ ${Math.round(loss20DiffMin)} - ${Math.round(loss20DiffMax)} kcal)`,
      description: t('energyGoalTable.lossNormalDesc', { kgMin: loss20KgMin, kgMax: loss20KgMax }),
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '20-25%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '20-25%',
    },
    {
      label: t('energyGoalTable.lossAggressiveLabel'),
      percentage: `${Math.round(loss25Min)} - ${Math.round(loss25Max)} kcal (⇩ ${Math.round(loss25DiffMin)} - ${Math.round(loss25DiffMax)} kcal)`,
      description: t('energyGoalTable.lossAggressiveDesc', {
        kgMin: loss25KgMin,
        kgMax: loss25KgMax,
      }),
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '25-30%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '25-30%',
    },
  ]

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3">
        <h4 className="text-sm font-semibold text-white">{t('energyGoalTable.title')}</h4>
      </div>
      <div className="divide-y divide-neutral-200">
        {goals.map((goal, index) => {
          const handleClick = () => {
            if (!goal.goalValue) return

            if (goal.isSubItem && goal.deficitValue) {
              onGoalSelect('Weight loss')
              onDeficitSelect(goal.deficitValue)
            } else {
              onGoalSelect(goal.goalValue)
              if (goal.goalValue !== 'Weight loss') {
                onDeficitSelect('')
              }
            }
          }

          return (
            <div
              key={index}
              onClick={handleClick}
              className={`transition-colors ${
                goal.isSelected
                  ? 'bg-primary-50 border-l-4 border-l-primary-500'
                  : 'bg-white hover:bg-neutral-50'
              } ${goal.isSubItem ? 'pl-8 pr-4 py-2' : 'px-4 py-3'} ${
                goal.goalValue ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span
                    className={`text-sm ${
                      goal.isSelected
                        ? 'font-semibold text-primary-900'
                        : goal.isSubItem
                          ? 'font-normal text-neutral-600'
                          : 'font-medium text-neutral-700'
                    }`}
                  >
                    {goal.isSubItem && <span className="mr-2 text-neutral-400">•</span>}
                    {goal.label}
                  </span>
                  {goal.description && (
                    <p className="text-xs text-neutral-500 mt-1 ml-4">{goal.description}</p>
                  )}
                </div>
                {goal.percentage && (
                  <span
                    className={`text-sm ml-4 ${goal.isSelected ? 'text-primary-700 font-semibold' : 'text-neutral-600'}`}
                  >
                    {goal.percentage}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
