export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type BMRFormula = 'mifflin_st_jeor' | 'harris_benedict' | 'cunningham'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type CalorieGoal = 'lose_weight' | 'maintain_weight' | 'gain_weight'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number
  bmr_formula?: BMRFormula
  activity_level?: ActivityLevel
  body_fat_percentage?: number
  bmr?: number
  tdee?: number
  calorie_goal?: CalorieGoal
  calories_min?: number
  calories_max?: number
  created_at?: string
  updated_at?: string
}

export interface UserProfileFormData {
  full_name?: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number
  bmr_formula?: BMRFormula
  activity_level?: ActivityLevel
  body_fat_percentage?: number
  calorie_goal?: CalorieGoal
}
