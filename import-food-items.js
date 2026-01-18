import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  console.error('Need VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Read the Excel file
const filePath = 'C:\\Users\\Jacob Hübner\\Downloads\\Project CalculEat Sheet.xlsx'
const workbook = XLSX.readFile(filePath)
const worksheet = workbook.Sheets['Items']

// Convert to JSON (skip header row)
const rawData = XLSX.utils.sheet_to_json(worksheet)

console.log('📊 Food Items Import\n')
console.log('='.repeat(80))
console.log(`Found ${rawData.length} items in Excel file\n`)

// Map Excel columns to database columns
const foodItems = rawData
  .filter(row => row.__EMPTY_1 && row.__EMPTY_1 !== 'Name') // Must have a name and not be header
  .map(row => {
    const name = row.__EMPTY_1
    const defaultAmount = row.__EMPTY_2 || 100
    const defaultUnit = row.__EMPTY_3 || 'g'
    const calories = row.__EMPTY_4 || 0
    const fatG = row.__EMPTY_5 || 0
    const carbG = row['Items 🥕'] || 0
    const proteinG = row.__EMPTY_6 || 0
    const kcalPerGram = row.__EMPTY_7 || 0
    const energyDensityColor = row.__EMPTY_8 || 'Yellow' // "Green", "Yellow", or "Orange"
    const isRecipe = row.__EMPTY ? true : false // Recipe column has value if it's a recipe

    // Determine food_type based on ml/g column
    let foodType = 'Solid'
    if (row.__EMPTY_14) {
      // Has ml/g value, it's a liquid
      foodType = 'Liquid'
    }

    return {
      name,
      default_amount: defaultAmount,
      default_unit: defaultUnit,
      calories,
      protein_g: proteinG,
      carb_g: carbG,
      fat_g: fatG,
      kcal_per_gram: kcalPerGram,
      energy_density_color: energyDensityColor,
      food_type: foodType,
      is_recipe: isRecipe,
    }
  })

console.log(`Prepared ${foodItems.length} food items for import\n`)

// Preview first 3 items
console.log('--- Preview (First 3 Items) ---\n')
foodItems.slice(0, 3).forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.name}`)
  console.log(`   ${item.default_amount} ${item.default_unit} | ${item.calories} kcal`)
  console.log(`   P: ${item.protein_g}g | C: ${item.carb_g}g | F: ${item.fat_g}g`)
  console.log(`   Type: ${item.energy_density_color} | Recipe: ${item.is_recipe}`)
  console.log('')
})

console.log('='.repeat(80))
console.log('\n🚀 Starting import to Supabase...\n')

// Get a user from auth.users (we'll use the first one found)
const {
  data: { users },
  error: userError,
} = await supabase.auth.admin.listUsers()

if (userError || !users || users.length === 0) {
  console.error('❌ No users found in database.')
  console.error('You need to have at least one user registered.')
  process.exit(1)
}

const userId = users[0].id
console.log(`✅ Using user ID: ${userId} (${users[0].email})\n`)

// Import items in batches
const batchSize = 50
let successCount = 0
let errorCount = 0

for (let i = 0; i < foodItems.length; i += batchSize) {
  const batch = foodItems.slice(i, i + batchSize)
  const batchNumber = Math.floor(i / batchSize) + 1
  const totalBatches = Math.ceil(foodItems.length / batchSize)

  console.log(`Importing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`)

  // Add user_id to each item
  const itemsWithUserId = batch.map(item => ({
    ...item,
    user_id: userId,
  }))

  const { data, error } = await supabase.from('food_items').insert(itemsWithUserId).select()

  if (error) {
    console.error(`❌ Error in batch ${batchNumber}:`, error.message)
    errorCount += batch.length
  } else {
    console.log(`✅ Batch ${batchNumber} imported successfully (${data.length} items)`)
    successCount += data.length
  }
}

console.log('\n' + '='.repeat(80))
console.log('📊 Import Summary\n')
console.log(`✅ Successfully imported: ${successCount} items`)
console.log(`❌ Failed: ${errorCount} items`)
console.log(`📦 Total processed: ${foodItems.length} items`)
console.log('\n✨ Import complete!')
