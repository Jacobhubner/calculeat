/**
 * Custom hook för kalkyleringsar baserat på användarprofil
 */

import { useMemo } from 'react'
import type { UserProfile } from '@/lib/types'
import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoal,
  calculateMacros,
  calculateAge,
  calculateBMI,
  getBMICategory,
  calculateIdealWeightRange,
  calculateTimeToGoal,
  type CalorieRange,
  type MacroSplit,
} from '@/lib/calculations'
import { useDebounce } from './useDebounce'

export interface CalculationResults {
  bmr: number | null
  tdee: number | null
  calorieGoal: CalorieRange | null
  macros: MacroSplit | null
  age: number | null
  bmi: number | null
  bmiCategory: 'undervikt' | 'normalvikt' | 'övervikt' | 'fetma' | null
  idealWeightRange: { min: number; max: number } | null
  timeToGoal: string | null
}

export function useCalculations(profile: UserProfile | null | undefined): CalculationResults {
  // Debounce profile updates for live calculations (300ms delay)
  const debouncedProfile = useDebounce(profile, 300)

  return useMemo(() => {
    if (!debouncedProfile) {
      return {
        bmr: null,
        tdee: null,
        calorieGoal: null,
        macros: null,
        age: null,
        bmi: null,
        bmiCategory: null,
        idealWeightRange: null,
        timeToGoal: null,
      }
    }

    try {
      // Beräkna ålder
      const age = debouncedProfile.birth_date ? calculateAge(debouncedProfile.birth_date) : null

      // Beräkna BMI
      const bmi =
        debouncedProfile.weight_kg && debouncedProfile.height_cm
          ? calculateBMI(debouncedProfile.weight_kg, debouncedProfile.height_cm)
          : null

      const bmiCategory = bmi ? getBMICategory(bmi) : null

      // Ideal vikt range
      const idealWeightRange = debouncedProfile.height_cm
        ? calculateIdealWeightRange(debouncedProfile.height_cm)
        : null

      // Beräkna BMR om vi har all nödvändig data
      let bmr: number | null = null
      if (
        debouncedProfile.weight_kg &&
        debouncedProfile.height_cm &&
        age &&
        debouncedProfile.gender &&
        debouncedProfile.bmr_formula
      ) {
        bmr = calculateBMR(
          {
            weight: debouncedProfile.weight_kg,
            height: debouncedProfile.height_cm,
            age,
            gender: debouncedProfile.gender,
            bodyFatPercentage: debouncedProfile.body_fat_percentage || undefined,
          },
          debouncedProfile.bmr_formula
        )
      }

      // Beräkna TDEE om vi har BMR och PAL-system
      let tdee: number | null = null
      if (bmr && debouncedProfile.pal_system && debouncedProfile.gender) {
        // För vissa PAL-system behövs activity_level
        const requiresActivityLevel = [
          'FAO/WHO/UNU based PAL values',
          'DAMNRIPPED PAL values',
          'Pro Physique PAL values',
          'Basic internet PAL values',
        ].includes(debouncedProfile.pal_system)

        const hasActivityLevel = debouncedProfile.activity_level
        const isCustomPAL = debouncedProfile.pal_system === 'Custom PAL'
        const isFitnessStuff = debouncedProfile.pal_system === 'Fitness Stuff PAL values'

        if (
          (requiresActivityLevel && hasActivityLevel) ||
          (isCustomPAL && debouncedProfile.custom_pal) ||
          isFitnessStuff
        ) {
          tdee = calculateTDEE({
            bmr,
            palSystem: debouncedProfile.pal_system,
            activityLevel: debouncedProfile.activity_level || 'Sedentary',
            gender: debouncedProfile.gender,
            intensityLevel: debouncedProfile.intensity_level,
            trainingFrequencyPerWeek: debouncedProfile.training_frequency_per_week,
            trainingDurationMinutes: debouncedProfile.training_duration_minutes,
            dailySteps: debouncedProfile.daily_steps,
            customPAL: debouncedProfile.custom_pal,
          })
        }
      }

      // Beräkna kalorimål om vi har TDEE och mål
      let calorieGoal: CalorieRange | null = null
      if (tdee && debouncedProfile.calorie_goal) {
        calorieGoal = calculateCalorieGoal({
          tdee,
          goal: debouncedProfile.calorie_goal,
          bmr: bmr || undefined,
          deficitLevel: debouncedProfile.deficit_level,
        })
      }

      // Beräkna makros om vi har kalorimål och vikt
      let macros: MacroSplit | null = null
      if (calorieGoal && debouncedProfile.weight_kg && debouncedProfile.calorie_goal) {
        // Check if profile has custom macro percentages (from macro modes like NNR)
        const hasCustomMacros =
          debouncedProfile.protein_min_percent != null &&
          debouncedProfile.protein_max_percent != null &&
          debouncedProfile.fat_min_percent != null &&
          debouncedProfile.fat_max_percent != null &&
          debouncedProfile.carb_min_percent != null &&
          debouncedProfile.carb_max_percent != null

        macros = calculateMacros({
          calories: calorieGoal.target,
          weight: debouncedProfile.weight_kg,
          goal: debouncedProfile.calorie_goal,
          // When custom macros exist, use SAVED calories_min/max from profile
          // (not recalculated from TDEE) to match the calorie values the macro percentages were based on
          caloriesMin:
            hasCustomMacros && debouncedProfile.calories_min
              ? debouncedProfile.calories_min
              : calorieGoal.min,
          caloriesMax:
            hasCustomMacros && debouncedProfile.calories_max
              ? debouncedProfile.calories_max
              : calorieGoal.max,
          customMacros: hasCustomMacros
            ? {
                proteinMinPercent: debouncedProfile.protein_min_percent!,
                proteinMaxPercent: debouncedProfile.protein_max_percent!,
                fatMinPercent: debouncedProfile.fat_min_percent!,
                fatMaxPercent: debouncedProfile.fat_max_percent!,
                carbMinPercent: debouncedProfile.carb_min_percent!,
                carbMaxPercent: debouncedProfile.carb_max_percent!,
              }
            : undefined,
        })
      }

      // Beräkna tid till målvikt
      let timeToGoal: string | null = null
      if (
        debouncedProfile.target_weight_kg &&
        debouncedProfile.weight_kg &&
        calorieGoal &&
        calorieGoal.weeklyChange !== 0
      ) {
        const timeCalc = calculateTimeToGoal(
          debouncedProfile.weight_kg,
          debouncedProfile.target_weight_kg,
          calorieGoal.weeklyChange
        )

        if (timeCalc.weeks > 0) {
          if (timeCalc.months >= 1) {
            timeToGoal = `${timeCalc.months} månader (${timeCalc.weeks} veckor)`
          } else {
            timeToGoal = `${timeCalc.weeks} veckor`
          }
        }
      }

      return {
        bmr,
        tdee,
        calorieGoal,
        macros,
        age,
        bmi,
        bmiCategory,
        idealWeightRange,
        timeToGoal,
      }
    } catch (error) {
      console.error('Fel vid beräkningar:', error)
      return {
        bmr: null,
        tdee: null,
        calorieGoal: null,
        macros: null,
        age: null,
        bmi: null,
        bmiCategory: null,
        idealWeightRange: null,
        timeToGoal: null,
      }
    }
  }, [debouncedProfile])
}
