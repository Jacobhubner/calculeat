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
  calories_min: z.number().min(0).max(10000).optional(),
  calories_max: z.number().min(0).max(10000).optional(),
})

export const signUpSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenord måste vara minst 6 tecken'),
  profile_name: z
    .string()
    .min(2, 'Användarnamnet måste vara minst 2 tecken')
    .max(50, 'Användarnamnet får max vara 50 tecken')
    .regex(/^[a-zA-Z0-9_åäöÅÄÖ]+$/, 'Användarnamnet får bara innehålla bokstäver, siffror och _'),
})

export const signInSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(1, 'Lösenord är obligatoriskt'),
})

export const createFoodItemSchema = z
  .object({
    name: z.string().min(1, 'Namn är obligatoriskt').max(200, 'Namn får max vara 200 tecken'),
    default_amount: z.preprocess(
      val => (Number.isNaN(val) ? undefined : val),
      z
        .number({ invalid_type_error: 'Mängd måste vara ett nummer' })
        .positive('Mängd måste vara större än 0')
    ),
    default_unit: z
      .string()
      .min(1, 'Enhet är obligatorisk')
      .max(50, 'Enhet får max vara 50 tecken'),
    weight_grams: z.preprocess(
      val => (Number.isNaN(val) ? undefined : val),
      z
        .number({ invalid_type_error: 'Vikt måste vara ett nummer' })
        .positive('Vikt måste vara större än 0')
    ),
    calories: z.preprocess(
      val => (Number.isNaN(val) ? 0 : val),
      z
        .number({ invalid_type_error: 'Kalorier måste vara ett nummer' })
        .min(0, 'Kalorier måste vara 0 eller högre')
    ),
    fat_g: z.preprocess(
      val => (Number.isNaN(val) ? 0 : val),
      z
        .number({ invalid_type_error: 'Fett måste vara ett nummer' })
        .min(0, 'Fett måste vara 0 eller högre')
    ),
    carb_g: z.preprocess(
      val => (Number.isNaN(val) ? 0 : val),
      z
        .number({ invalid_type_error: 'Kolhydrater måste vara ett nummer' })
        .min(0, 'Kolhydrater måste vara 0 eller högre')
    ),
    protein_g: z.preprocess(
      val => (Number.isNaN(val) ? 0 : val),
      z
        .number({ invalid_type_error: 'Protein måste vara ett nummer' })
        .min(0, 'Protein måste vara 0 eller högre')
    ),
    food_type: z.enum(['Solid', 'Liquid', 'Soup']).default('Solid'),
    ml_per_gram: z.preprocess(
      val =>
        val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : val,
      z
        .number({ invalid_type_error: 'ml per gram måste vara ett nummer' })
        .positive('ml per gram måste vara större än 0')
        .optional()
    ),
    grams_per_piece: z.preprocess(
      val =>
        val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : val,
      z
        .number({ invalid_type_error: 'Gram per bit måste vara ett nummer' })
        .positive('Gram per bit måste vara större än 0')
        .optional()
    ),
    serving_unit: z.preprocess(
      val => (val === '' || (typeof val === 'string' && val.trim() === '') ? undefined : val),
      z.string().max(50, 'Serveringsenhet får max vara 50 tecken').optional()
    ),
  })
  .refine(
    data => {
      // Om enheten är g eller gram, ska weight_grams vara samma som default_amount
      const unit = data.default_unit.toLowerCase().trim()
      if (unit === 'g' || unit === 'gram') {
        return Math.abs(data.weight_grams - data.default_amount) < 0.01 // Tillåt minimal rundning
      }
      return true
    },
    {
      message: 'När enheten är gram ska vikt vara samma som mängd',
      path: ['weight_grams'],
    }
  )
