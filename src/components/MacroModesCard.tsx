/**
 * Macro Modes Card Component (Kostläge)
 * Allows users to quickly apply predefined, evidence-based diet modes.
 * Skala: NNR (underhåll) → Viktminskning → Aktiv → Bulk → Cut.
 *
 * Uses pending changes - macros only saved when diskette clicked
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InfoModal } from '@/components/ui/InfoModal'
import { Target, TrendingUp, TrendingDown, Minus, Activity, ChevronDown, Info } from 'lucide-react'
import { applyMacroMode, type MacroModeId } from '@/lib/utils/macroModes'
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

interface ModeConfig {
  id: MacroModeId
  /** Visningsnamn — engelska "Mode"-namn som etablerad konvention */
  name: string
  icon: typeof Minus
  badgeClass?: string
  /** i18n-suffix: {id}Badge, {id}Desc, {id}Fat, {id}Protein, {id}Carbs */
  energyLabelKey: string
  requiresBodyFat?: boolean
  /** Veckoförändring visas endast där faktorer är belagda (bulk/cut) */
  weekly?: { labelKey: string; valueKey: string; minFactor: number; maxFactor: number }
  hasRef?: boolean
}

const MODES: ModeConfig[] = [
  { id: 'nnr', name: 'NNR Mode', icon: Minus, energyLabelKey: 'maintainWeight' },
  {
    id: 'weightloss',
    name: 'Weight Loss Mode',
    icon: TrendingDown,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    energyLabelKey: 'weightLossModerate',
    hasRef: true,
  },
  {
    id: 'active',
    name: 'Active Mode',
    icon: Activity,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    energyLabelKey: 'maintainWeight',
    hasRef: true,
  },
  {
    id: 'offseason',
    name: 'Off-Season Mode',
    icon: TrendingUp,
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    energyLabelKey: 'weightGain',
    weekly: {
      labelKey: 'weeklyGain',
      valueKey: 'weeklyGainValue',
      minFactor: 0.0025,
      maxFactor: 0.005,
    },
    hasRef: true,
  },
  {
    id: 'onseason',
    name: 'On-Season Mode',
    icon: TrendingDown,
    badgeClass: 'bg-success-50 text-success-700 border-success-200',
    energyLabelKey: 'weightLoss',
    requiresBodyFat: true,
    weekly: {
      labelKey: 'weeklyLoss',
      valueKey: 'weeklyLossValue',
      minFactor: 0.005,
      maxFactor: 0.01,
    },
    hasRef: true,
  },
]

export default function MacroModesCard({ profile, onMacroModeApply }: MacroModesCardProps) {
  const { t } = useTranslation('profile')
  const [isOpen, setIsOpen] = useState(false)
  const [activeRef, setActiveRef] = useState<MacroModeId | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  // Dynamiska nycklar per läge — samma konvention som övriga t-anrop i filen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = (key: string, opts?: Record<string, unknown>) => t(`macroModes.${key}` as any, opts)

  // Function to calculate preview based on current profile (including pending changes)
  const calculatePreviewForProfile = (mode: MacroModeId) => {
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
  const isModeActive = (mode: MacroModeId): boolean => {
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

  const handleApplyMode = (mode: MacroModeId) => {
    if (!profile?.weight_kg || !profile?.tdee) return

    const bodyFatPercentage = profile.body_fat_percentage
    if (mode === 'onseason' && !bodyFatPercentage) return

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

  // Check if we have required data
  const hasBodyFat = !!profile?.body_fat_percentage
  const weightKg = profile?.weight_kg
  const hasTdee = !!profile?.tdee
  const canApplyAny = !!weightKg && hasTdee

  const activeRefMode = activeRef ? MODES.find(m => m.id === activeRef) : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="w-full flex items-center justify-between gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center justify-between hover:opacity-70 transition-opacity"
            type="button"
          >
            <CardTitle className="flex items-center gap-2 text-lg leading-snug">
              <Target className="h-5 w-5 text-accent-600" />
              {t('macroModes.title')}
            </CardTitle>
            <ChevronDown
              className={`h-5 w-5 text-neutral-600 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="p-1 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors flex-shrink-0"
            aria-label={tm('infoAriaLabel')}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {!canApplyAny && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{t('macroModes.missingData')}</p>
            </div>
          )}

          {MODES.map((mode, index) => {
            const Icon = mode.icon
            const active = isModeActive(mode.id)
            const canApply = mode.requiresBodyFat ? canApplyAny && hasBodyFat : canApplyAny

            return (
              <div key={mode.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold">{mode.name}</span>
                      <Badge variant="outline" className={mode.badgeClass}>
                        {tm(`${mode.id}Badge`)}
                      </Badge>
                      {mode.hasRef && (
                        <button
                          type="button"
                          onClick={() => setActiveRef(mode.id)}
                          className="text-neutral-400 hover:text-primary-600 transition-colors"
                          aria-label={tm(`showRef`, { mode: mode.name })}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={active ? 'primary' : 'outline'}
                      onClick={() => handleApplyMode(mode.id)}
                      disabled={!canApply || active}
                      className={!canApply && !active ? 'opacity-40 cursor-not-allowed' : ''}
                    >
                      {active
                        ? t('macroModes.active')
                        : !canApply && mode.requiresBodyFat
                          ? t('macroModes.requiresBodyFat')
                          : t('macroModes.apply')}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-600">{tm(`${mode.id}Desc`)}</p>
                  {mode.requiresBodyFat && !canApply && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                      {t('macroModes.requiresBodyFatDesc')}
                    </div>
                  )}
                  {weightKg && (
                    <div className="text-xs space-y-1.5 pl-6 mt-3">
                      <div className="font-medium text-neutral-800">
                        <span className="text-neutral-600">{t('macroModes.energyGoalLabel')}</span>{' '}
                        {tm(mode.energyLabelKey)}
                      </div>
                      {mode.weekly && (
                        <div className="text-neutral-700">
                          <span className="text-neutral-600">{tm(mode.weekly.labelKey)}</span>{' '}
                          {tm(mode.weekly.valueKey, {
                            min: (weightKg * mode.weekly.minFactor).toFixed(2),
                            max: (weightKg * mode.weekly.maxFactor).toFixed(2),
                          })}
                        </div>
                      )}
                      <div className="text-neutral-700">
                        <span className="text-neutral-600">{t('macroModes.fatLabel')}</span>{' '}
                        {tm(`${mode.id}Fat`)}
                      </div>
                      <div className="text-neutral-700">
                        <span className="text-neutral-600">{t('macroModes.carbsLabel')}</span>{' '}
                        {tm(`${mode.id}Carbs`)}
                      </div>
                      <div className="text-neutral-700">
                        <span className="text-neutral-600">{t('macroModes.proteinLabel')}</span>{' '}
                        {tm(`${mode.id}Protein`)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <Separator />

          <div className="text-xs text-neutral-500 space-y-1">
            <p>
              💡 <strong>{t('macroModes.tipTitle')}</strong>
            </p>
            {MODES.map(mode => (
              <p key={mode.id}>• {tm(`tip_${mode.id}`)}</p>
            ))}
          </div>
        </CardContent>
      )}

      {/* Referenser — evidensbas per läge */}
      {activeRefMode && (
        <InfoModal
          open
          onClose={() => setActiveRef(null)}
          title={tm('refTitle', { mode: activeRefMode.name })}
          size="md"
        >
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
            {tm(`ref_${activeRefMode.id}`)}
          </p>
        </InfoModal>
      )}

      {/* Info om hela funktionen */}
      <InfoModal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        title={t('macroModes.title')}
        size="md"
      >
        <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{tm('infoBody')}</p>
      </InfoModal>
    </Card>
  )
}
