import XLSX from 'xlsx'

const filePath = 'C:\\Users\\Jacob Hübner\\Downloads\\Project CalculEat Sheet.xlsx'
const workbook = XLSX.readFile(filePath)

console.log('📊 Complete Workbook Analysis\n')
console.log('='.repeat(80))

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n📋 Sheet: "${sheetName}"`)
  console.log('-'.repeat(80))

  const worksheet = workbook.Sheets[sheetName]
  const range = worksheet['!ref']

  console.log(`Range: ${range}`)

  // Get data as JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })

  console.log(`Total rows with data: ${jsonData.length}`)

  if (jsonData.length > 0) {
    console.log('\nColumns:', Object.keys(jsonData[0]).join(', '))
    console.log('\nFirst item:')
    console.log(JSON.stringify(jsonData[0], null, 2))

    if (jsonData.length > 1) {
      console.log('\nSecond item:')
      console.log(JSON.stringify(jsonData[1], null, 2))
    }
  }
})

// Special focus on "Items" sheet - this likely contains the food database
console.log('\n\n' + '='.repeat(80))
console.log('🔍 Detailed Analysis of "Items" Sheet (Food Database)')
console.log('='.repeat(80) + '\n')

if (workbook.SheetNames.includes('Items')) {
  const worksheet = workbook.Sheets['Items']
  const items = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Total food items: ${items.length}\n`)

  if (items.length > 0) {
    console.log('Available fields:')
    Object.keys(items[0]).forEach(key => {
      console.log(`  - ${key}`)
    })

    console.log('\n--- Sample Items (First 3) ---\n')
    items.slice(0, 3).forEach((item, idx) => {
      console.log(`Item ${idx + 1}:`)
      console.log(JSON.stringify(item, null, 2))
      console.log('')
    })
  }
}
