/**
 * BasicProfileForm - Förenklad profilform när TDEE redan finns
 * Innehåller endast: kroppsfettprocent, energimål-visning
 * UTAN BMR/PAL-val och beräkningslogik
 *
 * Använder pending changes - inget sparas förrän disketten klickas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Weight, Target } from 'lucide-react'
import type { Profile } from '@/lib/types'
import EnergyGoalReferenceTable from '../calculator/EnergyGoalReferenceTable'

interface BasicProfileFormProps {
  profile: Profile
  // Callbacks for pending changes
  onBodyFatChange: (bodyFat: number | undefined) => void
  onGoalChange: (goal: string) => void
  onDeficitChange: (deficit: string | null) => void
}

export default function BasicProfileForm({
  profile,
  onBodyFatChange,
  onGoalChange,
  onDeficitChange,
}: BasicProfileFormProps) {
  const [bodyFat, setBodyFat] = useState(profile.body_fat_percentage?.toString() || '')

  // Update local state when profile changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBodyFat(profile.body_fat_percentage?.toString() || '')
  }, [profile.id, profile.body_fat_percentage])

  const handleBodyFatBlur = () => {
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined

    // Validation
    if (bodyFatNum && (isNaN(bodyFatNum) || bodyFatNum < 0 || bodyFatNum > 100)) {
      // Reset to profile value on invalid input
      setBodyFat(profile.body_fat_percentage?.toString() || '')
      return
    }

    // Only call callback if value actually changed
    if (bodyFatNum !== profile.body_fat_percentage) {
      onBodyFatChange(bodyFatNum)
    }
  }

  return (
    <div className="space-y-4">
      {/* Body Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5 text-primary-600" />
            Kroppssammansättning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Body Fat Percentage */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kroppsfettprocent (valfri)
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              onBlur={handleBodyFatBlur}
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="15"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Krävs för vissa BMR-formler om du vill omberäkna TDEE
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Goal Reference Table - Interactive */}
      {profile.tdee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              Energimål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnergyGoalReferenceTable
              tdee={profile.tdee}
              selectedGoal={profile.calorie_goal || 'Maintain weight'}
              selectedDeficit={profile.deficit_level || ''}
              onGoalSelect={goal => {
                // handleGoalChange already sets deficit_level to null for non-Weight loss goals
                onGoalChange(goal)
              }}
              onDeficitSelect={deficit => {
                // Only update deficit if it's a valid deficit level (not empty)
                if (!deficit) return
                onDeficitChange(deficit)
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
