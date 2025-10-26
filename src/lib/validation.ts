import { z } from 'zod'

export const userProfileSchema = z.object({
  full_name: z.string().min(1, 'Namn är obligatoriskt').optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(20).max(300).optional(),
  bmr_formula: z.enum(['mifflin_st_jeor', 'harris_benedict', 'cunningham']).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
  calorie_goal: z.enum(['lose_weight', 'maintain_weight', 'gain_weight']).optional(),
})

export const signUpSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenord måste vara minst 6 tecken'),
  full_name: z.string().min(1, 'Namn är obligatoriskt'),
})

export const signInSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(1, 'Lösenord är obligatoriskt'),
})
