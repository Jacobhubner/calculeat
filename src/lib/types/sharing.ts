export interface FoodItemSnapshot {
  name: string
  calories: number
  fat_g: number
  carb_g: number
  protein_g: number
  reference_unit: 'g' | 'ml'
  reference_amount: number
  default_amount: number
  default_unit: string
  food_type: 'Solid' | 'Liquid' | 'Soup'
  ml_per_gram: number | null
  grams_per_piece: number | null
  serving_unit: string | null
  density_g_per_ml: number | null
  notes: string | null
  brand: string | null
  barcode: string | null
  weight_grams: number | null
  // true = globalt SLV/USDA-objekt — länka till original, kopiera inte
  is_global: boolean
  // sätts om is_global=true
  original_food_item_id: string | null
}

export interface RecipeIngredientSnapshot {
  amount: number
  unit: string
  weight_grams: number | null
  ingredient_order: number
  food_item_snapshot: FoodItemSnapshot
}

export interface RecipeSnapshot {
  name: string
  servings: number
  total_weight_grams: number | null
  food_item_snapshot: FoodItemSnapshot | null
  ingredients: RecipeIngredientSnapshot[]
}

export type ItemType = 'food_item' | 'recipe' | 'food_list'

export interface FoodListSnapshot {
  items: FoodItemSnapshot[]
  item_count: number
}

export interface PendingInvitation {
  id: string
  item_type: ItemType
  sender_name: string
  created_at: string
  expires_at: string
  item_name: string
  item_preview: {
    calories?: string
    fat_g?: string
    carb_g?: string
    protein_g?: string
    brand?: string
    servings?: string
    ingredient_count?: number
    item_count?: number
  }
}
