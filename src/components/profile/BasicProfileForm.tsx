/**
 * BasicProfileForm - Förenklad profilform när TDEE redan finns
 * Innehåller endast: kroppsfettprocent, energimål-visning
 * UTAN BMR/PAL-val och beräkningslogik
 *
 * Använder pending changes - inget sparas förrän disketten klickas
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Weight, Target, Info } from 'lucide-react'
import type { Profile } from '@/lib/types'
import EnergyGoalReferenceTable from '../calculator/EnergyGoalReferenceTable'

interface BasicProfileFormProps {
  profile: Profile
  // Callbacks for pending changes
  onBodyFatChange: (bodyFat: number | undefined) => void
  onGoalChange: (goal: string) => void
  onDeficitChange: (deficit: string | null) => void
  onColorBalanceChange: (enabled: boolean) => void
}

export default function BasicProfileForm({
  profile,
  onBodyFatChange,
  onGoalChange,
  onDeficitChange,
  onColorBalanceChange,
}: BasicProfileFormProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('profile')
  const [bodyFat, setBodyFat] = useState(profile.body_fat_percentage?.toString() || '')
  const [colorInfoOpen, setColorInfoOpen] = useState(false)

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
            {t('bodyComposition.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Body Fat Percentage */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('bodyComposition.bodyFatLabel')}
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              onBlur={handleBodyFatBlur}
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder=""
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t('bodyComposition.bodyFatHint')}{' '}
              <button
                type="button"
                onClick={() => navigate('/app/body-composition')}
                className="text-primary-600 hover:underline"
              >
                {t('bodyComposition.goToBodyComp')}
              </button>
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
              {t('energyGoal.title')}
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

            {/* Energy density indicator toggle */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={profile.show_energy_density ?? false}
                    onChange={e => onColorBalanceChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-neutral-800">
                      {t('goals.showColorBalance')}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      {t('goals.showColorBalanceDesc')}
                    </span>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => setColorInfoOpen(true)}
                  className="shrink-0 mt-0.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={t('goals.showColorBalanceInfoTitle')}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Dialog open={colorInfoOpen} onOpenChange={setColorInfoOpen}>
              <DialogContent aria-describedby={undefined} className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{t('goals.showColorBalanceInfoTitle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-neutral-600 leading-relaxed">
                    {t('goals.showColorBalanceInfoBody')}
                  </p>
                  <div>
                    <p className="font-semibold text-neutral-800 mb-1">
                      {t('goals.showColorBalanceWhenTitle')}
                    </p>
                    <p className="text-neutral-600 leading-relaxed">
                      {t('goals.showColorBalanceWhenBody')}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800 mb-2">
                      {t('goals.showColorBalanceTargetsTitle')}
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-neutral-700">{t('goals.showColorBalanceGreenTarget')}</p>
                      <p className="text-neutral-700">{t('goals.showColorBalanceYellowTarget')}</p>
                      <p className="text-neutral-700">{t('goals.showColorBalanceOrangeTarget')}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setColorInfoOpen(false)} className="w-full">
                    {t('goals.showColorBalanceClose')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
