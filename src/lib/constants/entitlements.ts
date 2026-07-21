/**
 * Premium-entitlements — klientspegel av get_plan_limits() i databasen.
 *
 * KÄLLORDNING (håll alltid i synk, se docs/PREMIUM_SPEC.md):
 *   1. docs/PREMIUM_SPEC.md  — beslutad matris
 *   2. get_plan_limits()     — SQL, enforcement
 *   3. denna fil             — UI (räknare, gates, badges)
 */

export type Plan = 'free' | 'premium' | 'founder'

/** -1 = obegränsat */
export const UNLIMITED = -1

export interface PlanLimits {
  saved_meals: number
  recipes: number
  recipe_images: boolean
  history_days: number
  csv_export: boolean
  advanced_trends: boolean
  period_stats: boolean
  all_tdee_formulas: boolean
  calibrations_per_quarter: number
  advanced_body_comp: boolean
  genetic_potential: boolean
  owned_shared_lists: number
  label_scans_per_month: number
  food_suggestions: boolean
  all_diet_modes: boolean
  /** Full tillgång till receptbanken (premium_only-recept). Gratis ser dem blurrade. */
  recipe_bank_full: boolean
}

export const FREE_LIMITS: PlanLimits = {
  saved_meals: 10,
  recipes: 3,
  recipe_images: false,
  history_days: 30,
  csv_export: false,
  advanced_trends: false,
  period_stats: false,
  all_tdee_formulas: false,
  calibrations_per_quarter: 1,
  advanced_body_comp: false,
  genetic_potential: false,
  owned_shared_lists: 1,
  label_scans_per_month: 5,
  food_suggestions: false,
  all_diet_modes: false,
  recipe_bank_full: false,
}

export const PREMIUM_LIMITS: PlanLimits = {
  saved_meals: UNLIMITED,
  recipes: UNLIMITED,
  recipe_images: true,
  history_days: UNLIMITED,
  csv_export: true,
  advanced_trends: true,
  period_stats: true,
  all_tdee_formulas: true,
  calibrations_per_quarter: UNLIMITED,
  advanced_body_comp: true,
  genetic_potential: true,
  owned_shared_lists: UNLIMITED,
  label_scans_per_month: UNLIMITED,
  food_suggestions: true,
  all_diet_modes: true,
  recipe_bank_full: true,
}

export interface Entitlements {
  plan: Plan
  limits: PlanLimits
  /** 'off' = soft launch (alla behandlas som founder), 'on' = hard launch */
  enforcement: 'off' | 'on'
}

/**
 * Fallback när get_my_entitlements inte kan nås (RPC ej deployad,
 * offline, race vid inloggning). Motsvarar soft launch-läget i DB —
 * fail-open i UI:t; servertriggarna är ändå sista försvarslinjen.
 */
export const SOFT_LAUNCH_ENTITLEMENTS: Entitlements = {
  plan: 'founder',
  limits: PREMIUM_LIMITS,
  enforcement: 'off',
}

/**
 * Kroppskompositionsmetoder som ingår i gratisnivån (se docs/PREMIUM_SPEC.md).
 * Övriga metoder kräver `advanced_body_comp`.
 */
export const FREE_BODY_COMP_METHODS: readonly string[] = [
  'U.S. Navy Body Fat Formula',
  'Heritage BMI to Body Fat Method',
]

/**
 * BMR-formler och PAL-system som ingår i gratisnivån ("ett beräkningsläge",
 * se docs/PREMIUM_SPEC.md). Övriga kräver `all_tdee_formulas`.
 */
export const FREE_BMR_FORMULAS: readonly string[] = ['Mifflin-St Jeor equation']

/**
 * BMR-formler vars EKVATIONSTEXT är publik (står i SEO-artiklarnas FAQ:
 * Mifflin i vad-ar-bmr, Cunningham i lbm-vs-ffm) och därför aldrig låses
 * i appens info-modaler — det som är publikt på hemsidan är gratis i appen
 * (beslut 2026-07-18). Gäller VISNINGEN av ekvationen; att ANVÄNDA
 * formeln i kalkylatorn styrs separat av FREE_BMR_FORMULAS.
 */
export const PUBLIC_EQUATION_BMR_FORMULAS: readonly string[] = [
  'Mifflin-St Jeor equation',
  'Cunningham equation',
]

export const FREE_PAL_SYSTEMS: readonly string[] = ['Basic internet PAL values', 'Custom PAL']

/** Kvot-nycklar som servertriggarna kan kasta för */
export type PremiumLimitKey = keyof PlanLimits

const PREMIUM_LIMIT_PREFIX = 'PREMIUM_LIMIT_REACHED:'

/**
 * Mappar ett fel från Supabase (P0001 från kvot-trigger) till limit-nyckeln,
 * eller null om felet inte är en premiumkvot. Används för att öppna
 * UpgradeModal istället för generisk feltoast.
 */
export function parsePremiumLimitError(error: unknown): PremiumLimitKey | null {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown })?.message === 'string'
          ? (error as { message: string }).message
          : null
  if (!message) return null
  const idx = message.indexOf(PREMIUM_LIMIT_PREFIX)
  if (idx === -1) return null
  const key = message.slice(idx + PREMIUM_LIMIT_PREFIX.length).trim()
  return key ? (key as PremiumLimitKey) : null
}
