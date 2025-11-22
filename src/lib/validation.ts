import { z } from 'zod'

export const userProfileSchema = z.object({
  profile_name: z.string().min(1, 'Profilnamn är obligatoriskt').max(100),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Kön är obligatoriskt för att beräkna resultat' }),
  }),
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(20).max(300).optional(),

  // BMR & TDEE
  bmr_formula: z
    .enum([
      'Mifflin-St Jeor equation',
      'Cunningham equation',
      'Oxford/Henry equation',
      'Schofield equation',
      'Revised Harris-Benedict equation',
      'Original Harris-Benedict equation',
      'MacroFactor standard equation',
      'MacroFactor FFM equation',
      'MacroFactor athlete equation',
      'Fitness Stuff Podcast equation',
    ])
    .optional(),

  pal_system: z
    .enum([
      'FAO/WHO/UNU based PAL values',
      'DAMNRIPPED PAL values',
      'Pro Physique PAL values',
      'Fitness Stuff PAL values',
      'Basic internet PAL values',
      'Custom PAL',
    ])
    .optional(),

  activity_level: z
    .enum(['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Extremely active'])
    .optional(),

  intensity_level: z.enum(['None', 'Light', 'Moderate', 'Difficult', 'Intense']).optional(),

  training_frequency_per_week: z.number().min(0).max(14).optional(),
  training_duration_minutes: z.number().min(0).max(300).optional(),

  daily_steps: z
    .enum([
      '3 000 – 4 999 steps/day',
      '5 000 – 6 999 steps/day',
      '7 000 – 8 999 steps/day',
      '9 000 – 10 999 steps/day',
      '11 000 – 12 999 steps/day',
      '≥ 13 000 steps/day',
    ])
    .optional(),

  custom_pal: z.number().min(1.0).max(3.0).optional(),

  // Body composition
  body_fat_percentage: z.number().min(0).max(100).optional(),
  body_composition_method: z
    .enum([
      'Jackson/Pollock 3 Caliper Method (Male)',
      'Jackson/Pollock 3 Caliper Method (Female)',
      'Jackson/Pollock 4 Caliper Method',
      'Jackson/Pollock 7 Caliper Method',
      'Durnin/Womersley Caliper Method',
      'Parillo Caliper Method',
      'Covert Bailey Measuring Tape Method',
      'U.S. Navy Body Fat Formula',
      'YMCA Measuring Tape Method',
      'Modified YMCA Measuring Tape Method',
      'Heritage BMI to Body Fat Method',
      'Reversed Cunningham equation',
    ])
    .optional(),

  // Energy goals
  calorie_goal: z.enum(['Maintain weight', 'Weight loss', 'Weight gain', 'Custom TDEE']).optional(),
  deficit_level: z.enum(['10-15%', '20-25%', '25-30%']).optional(),
  custom_tdee: z.number().min(500).max(10000).optional(),
})

export const signUpSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenord måste vara minst 6 tecken'),
  profile_name: z.string().min(1, 'Profilnamn är obligatoriskt'),
})

export const signInSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(1, 'Lösenord är obligatoriskt'),
})
