import * as XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read the Excel file
const excelPath = 'C:\\Users\\jahub\\Downloads\\Project CalculEat Sheet.xlsx'
const workbook = XLSX.readFile(excelPath)

console.log('Available sheets:', workbook.SheetNames)
console.log('\n=== ANALYZING PROFILE SHEET ===\n')

// Find profile sheet (might have different names)
const profileSheetNames = workbook.SheetNames.filter(
  name => name.toLowerCase().includes('profil') || name.toLowerCase().includes('profile')
)

if (profileSheetNames.length === 0) {
  console.log('No Profile sheet found. Available sheets:', workbook.SheetNames)
  process.exit(1)
}

// Analyze first profile sheet
const sheetName = profileSheetNames[0]
console.log(`Analyzing sheet: "${sheetName}"\n`)

const worksheet = workbook.Sheets[sheetName]
const range = XLSX.utils.decode_range(worksheet['!ref'])

console.log(`Sheet range: ${worksheet['!ref']}\n`)

// Function to get cell value
function getCellValue(cell) {
  const cellObj = worksheet[cell]
  if (!cellObj) return null
  return cellObj.v
}

// Look for the visual tables mentioned in screenshot
console.log('=== SEARCHING FOR VISUAL TABLES ===\n')

// Search for "Body fat %" table
console.log('--- Body Fat % Table ---')
for (let row = 1; row <= Math.min(range.e.r + 1, 100); row++) {
  for (let col = 0; col <= Math.min(range.e.c, 26); col++) {
    const cell = XLSX.utils.encode_cell({ r: row - 1, c: col })
    const value = getCellValue(cell)
    if (value && typeof value === 'string' && value.toLowerCase().includes('essential fat')) {
      console.log(`Found "Essential Fat" at ${cell}`)
      // Print surrounding area
      for (let r = row - 2; r < row + 8; r++) {
        let rowData = []
        for (let c = col - 1; c < col + 4; c++) {
          const scanCell = XLSX.utils.encode_cell({ r: r - 1, c })
          rowData.push(getCellValue(scanCell) || '')
        }
        console.log(`Row ${r}:`, rowData.join(' | '))
      }
      break
    }
  }
}

console.log('\n--- FFMI Table ---')
for (let row = 1; row <= Math.min(range.e.r + 1, 100); row++) {
  for (let col = 0; col <= Math.min(range.e.c, 26); col++) {
    const cell = XLSX.utils.encode_cell({ r: row - 1, c: col })
    const value = getCellValue(cell)
    if (
      value &&
      typeof value === 'string' &&
      (value.toLowerCase().includes('ffmi') || value.toLowerCase().includes('fat fri mass index'))
    ) {
      console.log(`Found FFMI reference at ${cell}: "${value}"`)
      // Print surrounding area
      for (let r = row - 2; r < row + 12; r++) {
        let rowData = []
        for (let c = col - 1; c < col + 6; c++) {
          const scanCell = XLSX.utils.encode_cell({ r: r - 1, c })
          rowData.push(getCellValue(scanCell) || '')
        }
        console.log(`Row ${r}:`, rowData.join(' | '))
      }
      break
    }
  }
}

console.log('\n--- Maximum Fat Metabolism ---')
for (let row = 1; row <= Math.min(range.e.r + 1, 100); row++) {
  for (let col = 0; col <= Math.min(range.e.c, 26); col++) {
    const cell = XLSX.utils.encode_cell({ r: row - 1, c: col })
    const value = getCellValue(cell)
    if (
      value &&
      typeof value === 'string' &&
      value.toLowerCase().includes('maximum fat metabolism')
    ) {
      console.log(`Found "Maximum Fat Metabolism" at ${cell}`)
      // Print surrounding cells
      for (let r = row - 1; r < row + 3; r++) {
        let rowData = []
        for (let c = col - 1; c < col + 4; c++) {
          const scanCell = XLSX.utils.encode_cell({ r: r - 1, c })
          const cellObj = worksheet[scanCell]
          if (cellObj) {
            rowData.push(`${scanCell}: ${cellObj.v}${cellObj.f ? ' [=' + cellObj.f + ']' : ''}`)
          }
        }
        console.log(rowData.join(' | '))
      }
      break
    }
  }
}

console.log('\n--- Lean Body Mass / FFMI Values ---')
for (let row = 1; row <= Math.min(range.e.r + 1, 100); row++) {
  for (let col = 0; col <= Math.min(range.e.c, 26); col++) {
    const cell = XLSX.utils.encode_cell({ r: row - 1, c: col })
    const value = getCellValue(cell)
    if (value && typeof value === 'string' && value.toLowerCase().includes('lean body mass')) {
      console.log(`Found "Lean Body Mass" at ${cell}`)
      // Print surrounding cells with formulas
      for (let r = row - 1; r < row + 3; r++) {
        let rowData = []
        for (let c = col - 1; c < col + 4; c++) {
          const scanCell = XLSX.utils.encode_cell({ r: r - 1, c })
          const cellObj = worksheet[scanCell]
          if (cellObj) {
            rowData.push(`${scanCell}: ${cellObj.v}${cellObj.f ? ' [=' + cellObj.f + ']' : ''}`)
          }
        }
        console.log(rowData.join(' | '))
      }
      break
    }
  }
}

console.log('\n=== DONE ===')
