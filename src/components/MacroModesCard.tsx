/**
 * Macro Modes Card Component
 * Allows users to quickly apply predefined macro modes
 *
 * Uses pending changes - macros only saved when diskette clicked
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Target, TrendingUp, TrendingDown, Minus, ChevronDown, Info, X } from 'lucide-react'
import { usePreviewMacroMode } from '@/hooks/useMacroModes'
import { applyMacroMode } from '@/lib/utils/macroModes'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'
import type { Profile } from '@/lib/types'
import { useTranslation } from 'react-i18next'

interface MacroModesCardProps {
  profile: Profile
  onMacroModeApply: (macros: {
    fatMin: number
    fatMax: number
    carbMin: number
    carbMax: number
    proteinMin: number
    proteinMax: number
    caloriesMin: number
    caloriesMax: number
    calorieGoal: string
    deficitLevel: string | null
  }) => void
}

export default function MacroModesCard({ profile, onMacroModeApply }: MacroModesCardProps) {
  const { t } = useTranslation('profile')
  const [isOpen, setIsOpen] = useState(false)
  const [activeRef, setActiveRef] = useState<'offseason' | 'onseason' | null>(null)
  const nnrPreview = usePreviewMacroMode('nnr')
  const offseasonPreview = usePreviewMacroMode('offseason')

  // Function to calculate preview based on current profile (including pending changes)
  const calculatePreviewForProfile = (mode: 'nnr' | 'offseason' | 'onseason') => {
    if (!profile?.weight_kg || !profile?.tdee) return null
    if (mode === 'onseason' && !profile.body_fat_percentage) return null

    try {
      const ffm =
        profile.body_fat_percentage && profile.weight_kg
          ? calculateLeanMass(profile.weight_kg, profile.body_fat_percentage)
          : undefined

      const tempMacroMode = applyMacroMode(mode, {
        weight: profile.weight_kg,
        fatFreeMass: ffm,
        caloriesMin: profile.tdee,
        caloriesMax: profile.tdee,
      })

      const newCaloriesMin = profile.tdee * tempMacroMode.calorieMinMultiplier
      const newCaloriesMax = profile.tdee * tempMacroMode.calorieMaxMultiplier

      return applyMacroMode(mode, {
        weight: profile.weight_kg,
        fatFreeMass: ffm,
        caloriesMin: newCaloriesMin,
        caloriesMax: newCaloriesMax,
      })
    } catch {
      return null
    }
  }

  // Function to check if a preset already matches current profile settings
  const isModeActive = (mode: 'nnr' | 'offseason' | 'onseason'): boolean => {
    if (!profile) return false

    const preview = calculatePreviewForProfile(mode)
    if (!preview) return false

    // Compare macros with tolerance of 1% for rounding differences
    const tolerance = 1
    const matchesFat =
      Math.abs((profile.fat_min_percent ?? 0) - preview.fatMinPercent) <= tolerance &&
      Math.abs((profile.fat_max_percent ?? 0) - preview.fatMaxPercent) <= tolerance
    const matchesCarb =
      Math.abs((profile.carb_min_percent ?? 0) - preview.carbMinPercent) <= tolerance &&
      Math.abs((profile.carb_max_percent ?? 0) - preview.carbMaxPercent) <= tolerance
    const matchesProtein =
      Math.abs((profile.protein_min_percent ?? 0) - preview.proteinMinPercent) <= tolerance &&
      Math.abs((profile.protein_max_percent ?? 0) - preview.proteinMaxPercent) <= tolerance

    // Also compare calorie goal and calorie range
    const matchesCalorieGoal = profile.calorie_goal === preview.calorieGoal

    // Calculate expected calories from preview multipliers
    const expectedCaloriesMin = profile.tdee ? profile.tdee * preview.calorieMinMultiplier : 0
    const expectedCaloriesMax = profile.tdee ? profile.tdee * preview.calorieMaxMultiplier : 0

    const matchesCalories =
      Math.abs((profile.calories_min ?? 0) - expectedCaloriesMin) < 1 &&
      Math.abs((profile.calories_max ?? 0) - expectedCaloriesMax) < 1

    // Also check deficit level if applicable
    const matchesDeficitLevel = preview.deficitLevel
      ? profile.deficit_level === preview.deficitLevel
      : profile.deficit_level === null || profile.deficit_level === undefined

    return (
      matchesFat &&
      matchesCarb &&
      matchesProtein &&
      matchesCalorieGoal &&
      matchesCalories &&
      matchesDeficitLevel
    )
  }

  const handleApplyMode = (mode: 'nnr' | 'offseason' | 'onseason') => {
    if (!profile) return

    // Validate required data
    if (!profile.weight_kg) {
      return
    }

    if (!profile.tdee) {
      return
    }

    // Use body fat from profile
    const bodyFatPercentage = profile.body_fat_percentage

    if (mode === 'onseason' && !bodyFatPercentage) {
      return
    }

    // Calculate FFM (Fat Free Mass) if body fat percentage is available
    const ffm =
      bodyFatPercentage && profile.weight_kg
        ? calculateLeanMass(profile.weight_kg, bodyFatPercentage)
        : undefined

    // Calculate NEW calories_min/max from TDEE using macro mode multipliers
    const tempMacroMode = applyMacroMode(mode, {
      weight: profile.weight_kg,
      fatFreeMass: ffm,
      caloriesMin: profile.tdee,
      caloriesMax: profile.tdee,
    })

    // Apply multipliers to TDEE to get actual CalorieMin/Max
    const newCaloriesMin = profile.tdee * tempMacroMode.calorieMinMultiplier
    const newCaloriesMax = profile.tdee * tempMacroMode.calorieMaxMultiplier

    // Now calculate macro mode with CORRECT calories
    const macroMode = applyMacroMode(mode, {
      weight: profile.weight_kg,
      fatFreeMass: ffm,
      caloriesMin: newCaloriesMin,
      caloriesMax: newCaloriesMax,
    })

    // Apply via callback to pending changes
    onMacroModeApply({
      fatMin: macroMode.fatMinPercent,
      fatMax: macroMode.fatMaxPercent,
      carbMin: macroMode.carbMinPercent,
      carbMax: macroMode.carbMaxPercent,
      proteinMin: macroMode.proteinMinPercent,
      proteinMax: macroMode.proteinMaxPercent,
      caloriesMin: newCaloriesMin,
      caloriesMax: newCaloriesMax,
      calorieGoal: macroMode.calorieGoal,
      deficitLevel: macroMode.deficitLevel || null,
    })
  }

  const getModeIcon = (mode: 'nnr' | 'offseason' | 'onseason') => {
    switch (mode) {
      case 'nnr':
        return <Minus className="h-4 w-4" />
      case 'offseason':
        return <TrendingUp className="h-4 w-4" />
      case 'onseason':
        return <TrendingDown className="h-4 w-4" />
    }
  }

  // Check if we have required data
  const hasBodyFat = !!profile?.body_fat_percentage
  const weightKg = profile?.weight_kg
  const hasTdee = !!profile?.tdee

  // Allow applying modes if we have the required data
  const canApplyOnSeason = hasBodyFat && !!weightKg && hasTdee
  const canApplyAny = !!weightKg && hasTdee

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-lg leading-snug">
              <Target className="h-5 w-5 text-accent-600" />
              {t('macroModes.title')}
            </CardTitle>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {!canApplyAny && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{t('macroModes.missingData')}</p>
            </div>
          )}

          {/* NNR Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getModeIcon('nnr')}
                <span className="font-semibold">NNR Mode</span>
                <Badge variant="outline">{t('macroModes.nnrBadge')}</Badge>
              </div>
              <Button
                size="sm"
                variant={isModeActive('nnr') ? 'primary' : 'outline'}
                onClick={() => handleApplyMode('nnr')}
                disabled={!canApplyAny || isModeActive('nnr')}
              >
                {isModeActive('nnr') ? t('macroModes.active') : t('macroModes.apply')}
              </Button>
            </div>
            <p className="text-sm text-neutral-600">{t('macroModes.nnrDesc')}</p>
            {nnrPreview && (
              <div className="text-xs space-y-1.5 pl-6 mt-3">
                <div className="font-medium text-neutral-800">
                  <span className="text-neutral-600">{t('macroModes.energyGoalLabel')}</span>{' '}
                  {t('macroModes.maintainWeight')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.fatLabel')}</span>{' '}
                  {t('macroModes.nnrFat')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.proteinLabel')}</span>{' '}
                  {t('macroModes.nnrProtein')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.carbsLabel')}</span>{' '}
                  {t('macroModes.nnrCarbs')}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Off-Season Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getModeIcon('offseason')}
                <span className="font-semibold">Off-Season Mode</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {t('macroModes.offseasonBadge')}
                </Badge>
                <button
                  type="button"
                  onClick={() => setActiveRef('offseason')}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label={t('macroModes.showRefOffseason')}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                variant={isModeActive('offseason') ? 'primary' : 'outline'}
                onClick={() => handleApplyMode('offseason')}
                disabled={!canApplyAny || isModeActive('offseason')}
              >
                {isModeActive('offseason') ? t('macroModes.active') : t('macroModes.apply')}
              </Button>
            </div>
            <p className="text-sm text-neutral-600">{t('macroModes.offseasonDesc')}</p>
            {offseasonPreview && profile?.weight_kg && (
              <div className="text-xs space-y-1.5 pl-6 mt-3">
                <div className="font-medium text-neutral-800">
                  <span className="text-neutral-600">{t('macroModes.energyGoalLabel')}</span>{' '}
                  {t('macroModes.weightGain')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.weeklyGain')}</span>{' '}
                  {t('macroModes.weeklyGainValue', {
                    min: (profile.weight_kg * 0.0025).toFixed(2),
                    max: (profile.weight_kg * 0.005).toFixed(2),
                  })}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.fatLabel')}</span>{' '}
                  {t('macroModes.offseasonFat')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.proteinLabel')}</span>{' '}
                  {t('macroModes.offseasonProtein')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.carbsLabel')}</span>{' '}
                  {t('macroModes.offseasonCarbs')}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* On-Season Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getModeIcon('onseason')}
                <span className="font-semibold">On-Season Mode</span>
                <Badge
                  variant="outline"
                  className="bg-success-50 text-success-700 border-success-200"
                >
                  {t('macroModes.onseasonBadge')}
                </Badge>
                <button
                  type="button"
                  onClick={() => setActiveRef('onseason')}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label={t('macroModes.showRefOnseason')}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                variant={isModeActive('onseason') ? 'primary' : 'outline'}
                onClick={() => handleApplyMode('onseason')}
                disabled={!canApplyOnSeason || isModeActive('onseason')}
                className={
                  !canApplyOnSeason && !isModeActive('onseason')
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }
              >
                {isModeActive('onseason')
                  ? t('macroModes.active')
                  : !canApplyOnSeason
                    ? t('macroModes.requiresBodyFat')
                    : t('macroModes.apply')}
              </Button>
            </div>
            <p className="text-sm text-neutral-600">{t('macroModes.onseasonDesc')}</p>
            {!canApplyOnSeason && (
              <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                {t('macroModes.requiresBodyFatDesc')}
              </div>
            )}
            {profile?.weight_kg && (
              <div className="text-xs space-y-1.5 pl-6 mt-3">
                <div className="font-medium text-neutral-800">
                  <span className="text-neutral-600">{t('macroModes.energyGoalLabel')}</span>{' '}
                  {t('macroModes.weightLoss')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.weeklyLoss')}</span>{' '}
                  {t('macroModes.weeklyLossValue', {
                    min: (profile.weight_kg * 0.005).toFixed(2),
                    max: (profile.weight_kg * 0.01).toFixed(2),
                  })}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.fatLabel')}</span>{' '}
                  {t('macroModes.onseasonFat')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.proteinLabel')}</span>{' '}
                  {t('macroModes.onseasonProtein')}
                </div>
                <div className="text-neutral-700">
                  <span className="text-neutral-600">{t('macroModes.carbsLabel')}</span>{' '}
                  {t('macroModes.onseasonCarbs')}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="text-xs text-neutral-500 space-y-1">
            <p>
              💡 <strong>{t('macroModes.tipTitle')}</strong>
            </p>
            <p>• {t('macroModes.tipNnr')}</p>
            <p>• {t('macroModes.tipOffseason')}</p>
            <p>• {t('macroModes.tipOnseason')}</p>
          </div>
        </CardContent>
      )}
      {activeRef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setActiveRef(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                {activeRef === 'offseason'
                  ? t('macroModes.refOffseasonTitle')
                  : t('macroModes.refOnseasonTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setActiveRef(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
                aria-label={t('macroModes.closeRef')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              {activeRef === 'offseason'
                ? t('macroModes.refOffseasonText')
                : t('macroModes.refOnseasonText')}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
