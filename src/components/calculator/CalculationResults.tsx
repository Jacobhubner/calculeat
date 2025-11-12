import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface CalculationResultsProps {
  profile: UserProfile | null
  bmr: number
  tdee: number
  calorieGoal: number
  timeToGoal?: string
}

export default function CalculationResults({
  profile,
  bmr,
  tdee,
  calorieGoal,
  timeToGoal,
}: CalculationResultsProps) {
  if (!profile) {
    return (
      <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100">
        <CardContent className="py-8 text-center">
          <p className="text-neutral-500">Fyll i dina uppgifter för att se beräkningar</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate macros (example ranges - adjust based on profile settings)
  const proteinMin = profile.protein_min_percent || 20
  const proteinMax = profile.protein_max_percent || 30
  const fatMin = profile.fat_min_percent || 20
  const fatMax = profile.fat_max_percent || 35
  const carbMin = profile.carb_min_percent || 35
  const carbMax = profile.carb_max_percent || 55

  const proteinGramsMin = Math.round((calorieGoal * (proteinMin / 100)) / 4)
  const proteinGramsMax = Math.round((calorieGoal * (proteinMax / 100)) / 4)
  const fatGramsMin = Math.round((calorieGoal * (fatMin / 100)) / 9)
  const fatGramsMax = Math.round((calorieGoal * (fatMax / 100)) / 9)
  const carbGramsMin = Math.round((calorieGoal * (carbMin / 100)) / 4)
  const carbGramsMax = Math.round((calorieGoal * (carbMax / 100)) / 4)

  // Determine goal icon
  const getGoalIcon = () => {
    if (profile.calorie_goal === 'Weight loss') {
      return <TrendingDown className="h-5 w-5 text-red-600" />
    } else if (profile.calorie_goal === 'Weight gain') {
      return <TrendingUp className="h-5 w-5 text-green-600" />
    }
    return <Minus className="h-5 w-5 text-blue-600" />
  }

  const getGoalText = () => {
    if (profile.calorie_goal === 'Weight loss') return 'Viktminskning'
    if (profile.calorie_goal === 'Weight gain') return 'Viktökning'
    return 'Vikthållning'
  }

  const getCalorieColor = () => {
    if (profile.calorie_goal === 'Weight loss') return 'text-red-600'
    if (profile.calorie_goal === 'Weight gain') return 'text-green-600'
    return 'text-blue-600'
  }

  return (
    <div className="space-y-4">
      {/* BMR Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            🔥 Basalomsättning (BMR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-700">{Math.round(bmr)}</div>
          <p className="text-xs text-purple-600 mt-1">kcal/dag</p>
        </CardContent>
      </Card>

      {/* TDEE Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            ⚡ Totalt energibehov (TDEE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">{Math.round(tdee)}</div>
          <p className="text-xs text-blue-600 mt-1">kcal/dag</p>
        </CardContent>
      </Card>

      {/* Calorie Goal Card */}
      <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {getGoalIcon()}
            {getGoalText()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getCalorieColor()}`}>{Math.round(calorieGoal)}</div>
          <p className="text-xs text-neutral-600 mt-1">kcal/dag</p>
          {profile.calorie_goal !== 'Maintain weight' && (
            <p className="text-xs text-neutral-500 mt-2">
              {profile.calorie_goal === 'Weight loss' ? 'Underskott' : 'Överskott'}:{' '}
              <span className="font-semibold">
                {Math.abs(Math.round(calorieGoal - tdee))} kcal/dag
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time to Goal Card */}
      {timeToGoal && profile.target_weight_kg && (
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">🎯 Tid till målvikt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{timeToGoal}</div>
            <p className="text-xs text-amber-600 mt-1">Målvikt: {profile.target_weight_kg} kg</p>
          </CardContent>
        </Card>
      )}

      {/* Macros Card */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🥗 Makrofördelning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-green-800">Protein</span>
              <span className="text-sm text-green-700">
                {proteinMin}% - {proteinMax}%
              </span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {proteinGramsMin} - {proteinGramsMax} g
            </div>
          </div>

          <Separator className="bg-green-300" />

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-green-800">Fett</span>
              <span className="text-sm text-green-700">
                {fatMin}% - {fatMax}%
              </span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {fatGramsMin} - {fatGramsMax} g
            </div>
          </div>

          <Separator className="bg-green-300" />

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-green-800">Kolhydrater</span>
              <span className="text-sm text-green-700">
                {carbMin}% - {carbMax}%
              </span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {carbGramsMin} - {carbGramsMax} g
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
