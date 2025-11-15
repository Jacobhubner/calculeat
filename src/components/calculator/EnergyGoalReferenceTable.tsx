interface EnergyGoalReferenceTableProps {
  tdee: number
  selectedGoal: string
  selectedDeficit?: string
}

interface GoalRow {
  label: string
  percentage: string
  isSelected: boolean
}

export default function EnergyGoalReferenceTable({
  tdee,
  selectedGoal,
  selectedDeficit,
}: EnergyGoalReferenceTableProps) {
  // Calculate calorie differentials
  const maintainMin = Math.round(tdee * 0.97)
  const maintainMax = Math.round(tdee * 1.03)

  const gain10Min = Math.round(tdee * 1.1)
  const gain10Max = Math.round(tdee * 1.2)
  const gain10DiffMin = gain10Min - tdee
  const gain10DiffMax = gain10Max - tdee

  const loss10Min = Math.round(tdee * 0.85)
  const loss10Max = Math.round(tdee * 0.9)
  const loss10DiffMin = tdee - loss10Max
  const loss10DiffMax = tdee - loss10Min

  const loss20Min = Math.round(tdee * 0.75)
  const loss20Max = Math.round(tdee * 0.8)
  const loss20DiffMin = tdee - loss20Max
  const loss20DiffMax = tdee - loss20Min

  const loss25Min = Math.round(tdee * 0.7)
  const loss25Max = Math.round(tdee * 0.75)
  const loss25DiffMin = tdee - loss25Max
  const loss25DiffMax = tdee - loss25Min

  const customMin = Math.round(tdee * 0.97)
  const customMax = Math.round(tdee * 1.03)

  // Define goals with their selection status
  const goals: GoalRow[] = [
    {
      label: `Behåll vikt (±3%)`,
      percentage: `${maintainMin} - ${maintainMax} kcal (${tdee} kcal)`,
      isSelected: selectedGoal === 'Maintain weight',
    },
    {
      label: `Viktuppgång (10-20%)`,
      percentage: `${gain10Min} - ${gain10Max} kcal (⇧ ${gain10DiffMin} - ${gain10DiffMax} kcal)`,
      isSelected: selectedGoal === 'Weight gain',
    },
    {
      label: `Viktnedgång - Litet (10-15%)`,
      percentage: `${loss10Min} - ${loss10Max} kcal (⇩ ${loss10DiffMin} - ${loss10DiffMax} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '10-15%',
    },
    {
      label: `Viktnedgång - Måttligt (20-25%)`,
      percentage: `${loss20Min} - ${loss20Max} kcal (⇩ ${loss20DiffMin} - ${loss20DiffMax} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '20-25%',
    },
    {
      label: `Viktnedgång - Stort (25-30%)`,
      percentage: `${loss25Min} - ${loss25Max} kcal (⇩ ${loss25DiffMin} - ${loss25DiffMax} kcal)`,
      isSelected: selectedGoal === 'Weight loss' && selectedDeficit === '25-30%',
    },
    {
      label: `Anpassat TDEE (±3%)`,
      percentage: `${customMin} - ${customMax} kcal (${tdee} kcal)`,
      isSelected: selectedGoal === 'Custom TDEE',
    },
  ]

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3">
        <h4 className="text-sm font-semibold text-white">Energimål - Översikt</h4>
      </div>
      <div className="divide-y divide-neutral-200">
        {goals.map((goal, index) => (
          <div
            key={index}
            className={`px-4 py-3 transition-colors ${
              goal.isSelected
                ? 'bg-primary-50 border-l-4 border-l-primary-500'
                : 'bg-white hover:bg-neutral-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-sm font-medium ${
                  goal.isSelected ? 'text-primary-900' : 'text-neutral-700'
                }`}
              >
                {goal.label}
              </span>
              <span
                className={`text-sm ${goal.isSelected ? 'text-primary-700 font-semibold' : 'text-neutral-600'}`}
              >
                {goal.percentage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
