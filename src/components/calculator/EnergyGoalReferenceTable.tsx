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
  // Calculate calorie differentials (NO ROUNDING - keep exact decimals for calculations)
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

  // Define all goals with their selection status (always show all options)
  // Round values only when displaying (keep calculations precise)
  const goals: GoalRow[] = [
    {
      label: `Behåll vikt (±3%)`,
      percentage: `${Math.round(maintainMin)} - ${Math.round(maintainMax)} kcal (${Math.round(tdee)} kcal)`,
      isSelected: selectedGoal === 'Maintain weight',
      goalValue: 'Maintain weight',
    },
    {
      label: `Viktuppgång (10-20%)`,
      percentage: `${Math.round(gain10Min)} - ${Math.round(gain10Max)} kcal (⇧ ${Math.round(gain10DiffMin)} - ${Math.round(gain10DiffMax)} kcal)`,
      isSelected: selectedGoal === 'Weight gain',
      goalValue: 'Weight gain',
    },
    {
      label: `Viktnedgång`,
      percentage: '',
      isSelected: false,
      goalValue: '',
    },
    {
      label: `Försiktigt (10-15%)`,
      percentage: `${Math.round(loss10Min)} - ${Math.round(loss10Max)} kcal (⇩ ${Math.round(loss10DiffMin)} - ${Math.round(loss10DiffMax)} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '10-15%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '10-15%',
    },
    {
      label: `Normalt (20-25%)`,
      percentage: `${Math.round(loss20Min)} - ${Math.round(loss20Max)} kcal (⇩ ${Math.round(loss20DiffMin)} - ${Math.round(loss20DiffMax)} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '20-25%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '20-25%',
    },
    {
      label: `Aggressivt (25-30%)`,
      percentage: `${Math.round(loss25Min)} - ${Math.round(loss25Max)} kcal (⇩ ${Math.round(loss25DiffMin)} - ${Math.round(loss25DiffMax)} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '25-30%',
      isSubItem: true,
      goalValue: 'Weight loss',
      deficitValue: '25-30%',
    },
    {
      label: `Anpassat TDEE (±3%)`,
      percentage: '',
      isSelected: selectedGoal === 'Custom TDEE',
      goalValue: 'Custom TDEE',
    },
  ]

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3">
        <h4 className="text-sm font-semibold text-white">Energimål - Översikt</h4>
      </div>
      <div className="divide-y divide-neutral-200">
        {goals.map((goal, index) => {
          const handleClick = () => {
            if (!goal.goalValue) return // Skip "Viktnedgång" header

            if (goal.isSubItem && goal.deficitValue) {
              // Clicking a weight loss sub-item
              onGoalSelect('Weight loss')
              onDeficitSelect(goal.deficitValue)
            } else {
              // Clicking a main goal
              onGoalSelect(goal.goalValue)
              if (goal.goalValue !== 'Weight loss') {
                onDeficitSelect('') // Clear deficit if not weight loss
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
                {goal.percentage && (
                  <span
                    className={`text-sm ${goal.isSelected ? 'text-primary-700 font-semibold' : 'text-neutral-600'}`}
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
