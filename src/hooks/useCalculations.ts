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
  type CalorieRange,
  type MacroSplit,
} from '@/lib/calculations'

export interface CalculationResults {
  bmr: number | null
  tdee: number | null
  calorieGoal: CalorieRange | null
  macros: MacroSplit | null
  age: number | null
  bmi: number | null
  bmiCategory: 'undervikt' | 'normalvikt' | 'övervikt' | 'fetma' | null
  idealWeightRange: { min: number; max: number } | null
}

export function useCalculations(profile: UserProfile | null | undefined): CalculationResults {
  return useMemo(() => {
    if (!profile) {
      return {
        bmr: null,
        tdee: null,
        calorieGoal: null,
        macros: null,
        age: null,
        bmi: null,
        bmiCategory: null,
        idealWeightRange: null,
      }
    }

    try {
      // Beräkna ålder
      const age = profile.birth_date ? calculateAge(profile.birth_date) : null

      // Beräkna BMI
      const bmi =
        profile.weight_kg && profile.height_cm
          ? calculateBMI(profile.weight_kg, profile.height_cm)
          : null

      const bmiCategory = bmi ? getBMICategory(bmi) : null

      // Ideal vikt range
      const idealWeightRange = profile.height_cm
        ? calculateIdealWeightRange(profile.height_cm)
        : null

      // Beräkna BMR om vi har all nödvändig data
      let bmr: number | null = null
      if (profile.weight_kg && profile.height_cm && age && profile.gender && profile.bmr_formula) {
        bmr = calculateBMR(
          {
            weight: profile.weight_kg,
            height: profile.height_cm,
            age,
            gender: profile.gender,
            bodyFatPercentage: profile.body_fat_percentage || undefined,
          },
          profile.bmr_formula
        )
      }

      // Beräkna TDEE om vi har BMR och aktivitetsnivå
      let tdee: number | null = null
      if (bmr && profile.activity_level) {
        tdee = calculateTDEE(bmr, profile.activity_level)
      }

      // Beräkna kalorimål om vi har TDEE och mål
      let calorieGoal: CalorieRange | null = null
      if (tdee && profile.calorie_goal) {
        calorieGoal = calculateCalorieGoal({
          tdee,
          goal: profile.calorie_goal,
          bmr: bmr || undefined,
        })
      }

      // Beräkna makros om vi har kalorimål och vikt
      let macros: MacroSplit | null = null
      if (calorieGoal && profile.weight_kg && profile.calorie_goal) {
        macros = calculateMacros({
          calories: calorieGoal.target,
          weight: profile.weight_kg,
          goal: profile.calorie_goal,
        })
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
      }
    }
  }, [profile])
}
