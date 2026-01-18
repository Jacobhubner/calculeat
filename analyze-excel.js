import XLSX from 'xlsx'
import path from 'path'

// Read the Excel file
const filePath = 'C:\\Users\\Jacob Hübner\\Downloads\\Project CalculEat Sheet.xlsx'
const workbook = XLSX.readFile(filePath)

console.log('📊 Excel File Analysis\n')
console.log('Available sheets:', workbook.SheetNames.join(', '))
console.log('\n' + '='.repeat(80) + '\n')

// Analyze the "New Item" sheet
const sheetName = 'New Item'
if (workbook.SheetNames.includes(sheetName)) {
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON with header row
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  console.log(`📋 Sheet: "${sheetName}"\n`)
  console.log(`Total rows: ${data.length}`)

  if (data.length > 0) {
    console.log('\n--- Headers (First Row) ---')
    console.log(data[0])

    console.log('\n--- Sample Data (First 5 rows) ---')
    data.slice(0, Math.min(6, data.length)).forEach((row, idx) => {
      console.log(`Row ${idx}:`, row)
    })

    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('\n--- Data as JSON (First 3 items) ---')
    console.log(JSON.stringify(jsonData.slice(0, 3), null, 2))

    console.log(`\n--- Total items in sheet: ${jsonData.length} ---`)

    // Analyze columns
    if (jsonData.length > 0) {
      console.log('\n--- Column Names ---')
      Object.keys(jsonData[0]).forEach(key => {
        console.log(`- ${key}`)
      })
    }
  }
} else {
  console.log(`❌ Sheet "${sheetName}" not found!`)
}

console.log('\n' + '='.repeat(80))
