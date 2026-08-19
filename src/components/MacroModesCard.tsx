/**
 * Macro Modes Card Component (Kostläge)
 * Allows users to quickly apply predefined, evidence-based diet modes.
 * Skala: NNR (underhåll) → Viktminskning → Aktiv → Bulk → Cut.
 *
 * Uses pending changes - macros only saved when diskette clicked
 */

import { useState, useMemo } from 'react'
import { multipliersForDeficitLevel, deficitLevelIdFromLabel } from '@/lib/utils/deficitLevels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InfoModal } from '@/components/ui/InfoModal'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ChevronDown,
  Info,
  Lock,
} from 'lucide-react'
import {
  applyMacroMode,
  FREE_MACRO_MODES,
  MODE_CALORIE_MULTIPLIERS,
  type MacroModeId,
} from '@/lib/utils/macroModes'
import { useEntitlements } from '@/hooks/useEntitlements'
import { PremiumBadge } from '@/components/premium/PremiumBadge'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'
import { weeklyRateForCalories } from '@/lib/calculations/weeklyRate'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
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
  /** Visningsnamn hämtas via i18n: macroModes.{id}Name */
  icon: typeof Minus
  badgeClass?: string
  /** i18n-suffix: {id}Badge, {id}Desc, {id}Fat, {id}Protein, {id}Carbs */
  energyLabelKey: string
  requiresBodyFat?: boolean
  /**
   * Veckotakt visas för lägen som avviker från underhåll. Själva talet
   * HÄRLEDS ur lägets kalorimultiplikatorer — inga egna faktorer här, det
   * var så "Viktminskning" och "Deff" kunde visa olika takt trots identiskt
   * underskott.
   */
  weekly?: { labelKey: string; valueKey: string }
  hasRef?: boolean
}

const MODES: ModeConfig[] = [
  { id: 'nnr', icon: Minus, energyLabelKey: 'maintainWeight', hasRef: true },
  {
    id: 'weightloss',
    icon: TrendingDown,
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:border-rose-800',
    energyLabelKey: 'weightLossModerate',
    // Läget HETER viktminskning men saknade veckotakt — det enda av lägena
    // som inte berättade hur snabbt man går ner.
    weekly: { labelKey: 'weeklyLoss', valueKey: 'weeklyLossValue' },
    hasRef: true,
  },
  {
    id: 'active',
    icon: Activity,
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800',
    energyLabelKey: 'maintainWeight',
    hasRef: true,
  },
  {
    id: 'offseason',
    icon: TrendingUp,
    badgeClass:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800',
    energyLabelKey: 'weightGain',
    weekly: { labelKey: 'weeklyGain', valueKey: 'weeklyGainValue' },
    hasRef: true,
  },
  {
    id: 'onseason',
    icon: TrendingDown,
    badgeClass:
      'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/25 dark:text-success-300 dark:border-success-800',
    energyLabelKey: 'weightLoss',
    requiresBodyFat: true,
    weekly: { labelKey: 'weeklyLoss', valueKey: 'weeklyLossValue' },
    hasRef: true,
  },
]

export default function MacroModesCard({ profile, onMacroModeApply }: MacroModesCardProps) {
  const { t } = useTranslation('profile')
  const { limits } = useEntitlements()
  const [isOpen, setIsOpen] = useState(false)
  const [activeRef, setActiveRef] = useState<MacroModeId | null>(null)
  // Delad store i stället för lokal state: den bär limitKey vidare till
  // trackConversion('paywall_shown'), så vi kan se VILKEN gräns som utlöste
  // betalväggen. Med lokal UpgradeModal loggades metadata som null.
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const showUpgrade = () => openUpgradeModal('all_diet_modes')

  // Kostlägen: allmänhetslägena (NNR + Weight Loss) alltid gratis,
  // atletlägena (Active, Off-/On-Season) premium (all_diet_modes, se PREMIUM_SPEC)
  const isLocked = (id: MacroModeId) => !FREE_MACRO_MODES.includes(id) && !limits.all_diet_modes

  // Dynamiska nycklar per läge — samma konvention som övriga t-anrop i filen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = (key: string, opts?: Record<string, unknown>) => t(`macroModes.${key}` as any, opts)

  /**
   * Veckotakt per läge, HÄRLEDD ur lägets kaloriunderskott.
   *
   * Tidigare räknades den ur egna konstanter i % av kroppsvikt, oberoende av
   * underskottet. Då visade "Viktminskning" 0,23–0,46 kg/v och "Deff"
   * 0,46–0,68 kg/v trots att båda är 20–25 % underskott, och båda motsade
   * Energimål-kortet. Nu kan talen inte glida isär.
   */
  const weeklyRates = useMemo(() => {
    const out: Partial<Record<MacroModeId, { min: number; max: number }>> = {}
    const tdee = profile?.tdee
    if (!tdee) return out
    for (const mode of MODES) {
      if (!mode.weekly) continue
      const mult = MODE_CALORIE_MULTIPLIERS[mode.id]
      const rate = weeklyRateForCalories({
        tdee,
        caloriesMin: tdee * mult.min,
        caloriesMax: tdee * mult.max,
        weightKg: profile?.weight_kg ?? 0,
      })
      // Viktuppgång ger negativ "förlust" — visa som positivt belopp eftersom
      // etiketten (Viktuppgång/Viktminskning) bär riktningen. Math.abs kastar
      // om ordningen vid uppgång, så sortera om efter beloppen.
      const a = Math.abs(rate.kgMin)
      const b = Math.abs(rate.kgMax)
      out[mode.id] = { min: Math.min(a, b), max: Math.max(a, b) }
    }
    return out
  }, [profile?.tdee, profile?.weight_kg])

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

    /**
     * Kalorierna jämförs mot den nivå profilen FAKTISKT står på, inte mot
     * kostlägets egen multiplikator.
     *
     * Bakgrund: sedan perioder fick ett underskottsdjup (2026-08-18) kan
     * profilen stå på 0,85–0,90 eller 0,70–0,75 medan kostläget är samma.
     * Lägesdefinitionen är MAKROFÖRDELNINGEN — djupet är en egen axel. Jämförde
     * vi mot lägets hårdkodade 0,75–0,80 skulle varje användare som valt
     * försiktigt eller snabbt se ALLA kostlägen som omarkerade, trots att
     * fördelningen stämmer exakt.
     */
    const levelMultipliers = profile.deficit_level
      ? multipliersForDeficitLevel(deficitLevelIdFromLabel(profile.deficit_level) ?? 'normal')
      : null
    const useLevel = !!(preview.deficitLevel && levelMultipliers)
    const minMult = useLevel ? levelMultipliers!.min : preview.calorieMinMultiplier
    const maxMult = useLevel ? levelMultipliers!.max : preview.calorieMaxMultiplier

    const expectedCaloriesMin = profile.tdee ? profile.tdee * minMult : 0
    const expectedCaloriesMax = profile.tdee ? profile.tdee * maxMult : 0

    const matchesCalories =
      Math.abs((profile.calories_min ?? 0) - expectedCaloriesMin) < 1 &&
      Math.abs((profile.calories_max ?? 0) - expectedCaloriesMax) < 1

    /**
     * Underskottslägen kräver bara att profilen HAR ett djup, inte vilket.
     * Lägen utan djup (underhåll, bulk) kräver fortfarande att kolumnen är
     * tom — annars skulle ett kvarglömt värde se ut som ett giltigt underhåll.
     */
    const matchesDeficitLevel = preview.deficitLevel
      ? !!profile.deficit_level
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <CardTitle className="flex items-center gap-2 text-lg leading-snug">
            <Target className="h-5 w-5 text-accent-600 dark:text-accent-300" />
            {t('macroModes.title')}
          </CardTitle>
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
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/25 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {t('macroModes.missingData')}
              </p>
            </div>
          )}

          {MODES.map((mode, index) => {
            const Icon = mode.icon
            const active = isModeActive(mode.id)
            const canApply = mode.requiresBodyFat ? canApplyAny && hasBodyFat : canApplyAny
            const locked = isLocked(mode.id)

            return (
              <div key={mode.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold">{tm(`${mode.id}Name`)}</span>
                      <Badge variant="outline" className={mode.badgeClass}>
                        {tm(`${mode.id}Badge`)}
                      </Badge>
                      {locked && <PremiumBadge />}
                      {mode.hasRef && (
                        <button
                          type="button"
                          onClick={() => (locked ? showUpgrade() : setActiveRef(mode.id))}
                          className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0 dark:text-neutral-500"
                          aria-label={tm(`showRef`, { mode: tm(`${mode.id}Name`) })}
                        >
                          {locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Info className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={active ? 'primary' : 'outline'}
                      onClick={() => (locked ? showUpgrade() : handleApplyMode(mode.id))}
                      disabled={active || (!locked && !canApply)}
                      className={cn(
                        'flex-shrink-0',
                        !locked && !canApply && !active ? 'opacity-40 cursor-not-allowed' : ''
                      )}
                    >
                      {locked && !active && <Lock className="mr-1 h-3 w-3" aria-hidden="true" />}
                      {active
                        ? t('macroModes.active')
                        : !locked && !canApply && mode.requiresBodyFat
                          ? t('macroModes.requiresBodyFat')
                          : t('macroModes.apply')}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {tm(`${mode.id}Desc`)}
                  </p>
                  {!locked && mode.requiresBodyFat && !canApply && (
                    <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-800">
                      {t('macroModes.requiresBodyFatDesc')}
                    </div>
                  )}
                  {weightKg && (
                    <div
                      className={`text-xs space-y-1.5 pl-6 mt-3 ${
                        locked ? 'blur-sm select-none cursor-pointer' : ''
                      }`}
                      aria-hidden={locked || undefined}
                      onClick={locked ? () => showUpgrade() : undefined}
                    >
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {t('macroModes.energyGoalLabel')}
                        </span>{' '}
                        {tm(mode.energyLabelKey)}
                      </div>
                      {mode.weekly && weeklyRates[mode.id] && (
                        <div className="text-neutral-700 dark:text-neutral-200">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {tm(mode.weekly.labelKey)}
                          </span>{' '}
                          {tm(mode.weekly.valueKey, {
                            min: weeklyRates[mode.id]!.min.toFixed(2),
                            max: weeklyRates[mode.id]!.max.toFixed(2),
                          })}
                        </div>
                      )}
                      <div className="text-neutral-700 dark:text-neutral-200">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {t('macroModes.fatLabel')}
                        </span>{' '}
                        {tm(`${mode.id}Fat`)}
                      </div>
                      <div className="text-neutral-700 dark:text-neutral-200">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {t('macroModes.carbsLabel')}
                        </span>{' '}
                        {tm(`${mode.id}Carbs`)}
                      </div>
                      <div className="text-neutral-700 dark:text-neutral-200">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {t('macroModes.proteinLabel')}
                        </span>{' '}
                        {tm(`${mode.id}Protein`)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      )}

      {/* Referenser — evidensbas per läge */}
      {activeRefMode && (
        <InfoModal
          open
          onClose={() => setActiveRef(null)}
          title={tm('refTitle', { mode: tm(`${activeRefMode.id}Name`) })}
          size="md"
        >
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line dark:text-neutral-200">
            {tm(`ref_${activeRefMode.id}`)}
          </p>
        </InfoModal>
      )}

      {/* UpgradeModal renderas globalt (GlobalUpgradeModal i App.tsx) och
          öppnas via storen ovan — den bär limitKey till konverteringsmätningen. */}
    </Card>
  )
}
