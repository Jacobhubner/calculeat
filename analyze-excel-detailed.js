import XLSX from 'xlsx'

// Read the Excel file
const filePath = 'C:\\Users\\Jacob Hübner\\Downloads\\Project CalculEat Sheet.xlsx'
const workbook = XLSX.readFile(filePath)

console.log('📊 Detailed Excel Analysis - New Item Sheet\n')

const sheetName = 'New Item'
const worksheet = workbook.Sheets[sheetName]

// Get the range
const range = XLSX.utils.decode_range(worksheet['!ref'])
console.log(`Sheet range: ${worksheet['!ref']}`)
console.log(`Rows: ${range.s.r} to ${range.e.r}`)
console.log(`Columns: ${range.s.c} to ${range.e.c}\n`)

// Read all cells
console.log('--- Cell-by-Cell Analysis ---\n')

for (let row = range.s.r; row <= Math.min(range.s.r + 30, range.e.r); row++) {
  const rowData = []
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
    const cell = worksheet[cellAddress]
    if (cell && cell.v !== undefined && cell.v !== '') {
      rowData.push(`${cellAddress}: ${cell.v}`)
    }
  }
  if (rowData.length > 0) {
    console.log(`Row ${row + 1}: ${rowData.join(' | ')}`)
  }
}

console.log('\n' + '='.repeat(80) + '\n')

// Try to extract structured data
console.log('--- Attempting to find data structure ---\n')

// Read with no header to see raw data
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

rawData.forEach((row, idx) => {
  if (row.some(cell => cell !== '')) {
    console.log(
      `Row ${idx + 1}:`,
      row.filter((cell, i) => cell !== '' || i < 10)
    )
  }
})
