/**
 * Custom hook för kalkyleringsar baserat på användarprofil
 */

import { useMemo } from 'react'
import type { UserProfile } from '@/lib/types'
import {
  calculateBMRWithFormula,
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
  bmiCategory: 'undervikt' | 'normalvikt' | 'övervikt' | 'fetma_1' | 'fetma_2' | 'fetma_3' | null
  idealWeightRange: { min: number; max: number } | null
  timeToGoal: string | null
}

export function useCalculations(profile: UserProfile | null | undefined): CalculationResults {
  // Debounce profile updates for live calculations (300ms delay)
  const debouncedProfile = useDebounce(profile, 300)

  return useMemo(() => {
    console.log('🟢 useCalculations running with profile:', {
      hasProfile: !!debouncedProfile,
      caloriesMin: debouncedProfile?.calories_min,
      caloriesMax: debouncedProfile?.calories_max,
      tdee: debouncedProfile?.tdee,
    })

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
        bmr = calculateBMRWithFormula(debouncedProfile.bmr_formula, {
          weight: debouncedProfile.weight_kg,
          height: debouncedProfile.height_cm,
          age,
          gender: debouncedProfile.gender,
          bodyFatPercentage: debouncedProfile.body_fat_percentage || undefined,
        })
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
        // If user has saved calories_min/max from a macro mode, use those
        // Otherwise calculate from TDEE using standard formulas
        if (debouncedProfile.calories_min && debouncedProfile.calories_max) {
          console.log('🟢 Using SAVED calories_min/max from macro mode')
          calorieGoal = {
            min: debouncedProfile.calories_min,
            max: debouncedProfile.calories_max,
            target: Math.round((debouncedProfile.calories_min + debouncedProfile.calories_max) / 2),
            weeklyChange: 0, // Will be recalculated if needed
          }
        } else {
          console.log('🟢 Calculating calories_min/max from TDEE')
          calorieGoal = calculateCalorieGoal({
            tdee,
            goal: debouncedProfile.calorie_goal,
            bmr: bmr || undefined,
          })
        }
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

        console.log('🟢 useCalculations - calculating macros with:', {
          hasCustomMacros,
          caloriesMin: calorieGoal.min,
          caloriesMax: calorieGoal.max,
          savedCaloriesMin: debouncedProfile.calories_min,
          savedCaloriesMax: debouncedProfile.calories_max,
          percentages: hasCustomMacros
            ? {
                fat: `${debouncedProfile.fat_min_percent}-${debouncedProfile.fat_max_percent}%`,
                carb: `${debouncedProfile.carb_min_percent}-${debouncedProfile.carb_max_percent}%`,
                protein: `${debouncedProfile.protein_min_percent}-${debouncedProfile.protein_max_percent}%`,
              }
            : 'auto',
        })

        macros = calculateMacros({
          calories: calorieGoal.target,
          weight: debouncedProfile.weight_kg,
          goal: debouncedProfile.calorie_goal,
          // ALWAYS use current CaloriesMin/Max from TDEE calculation (Google Sheets logic)
          // NEVER use saved calories_min/max - always recalculate from current TDEE
          caloriesMin: calorieGoal.min,
          caloriesMax: calorieGoal.max,
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

        console.log('🟢 useCalculations - calculated macros:', {
          fat: macros.fat.grams + 'g',
          carbs: macros.carbs.grams + 'g',
          protein: macros.protein.grams + 'g',
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
