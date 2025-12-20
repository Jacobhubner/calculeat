import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('C:\\Users\\jahub\\Downloads\\Project CalculEat Sheet.xlsx');

// Get the MET sheet
const sheetName = 'MET';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.log('Available sheets:', workbook.SheetNames);
  console.log('MET sheet not found!');
  process.exit(1);
}

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('Total rows in MET sheet:', data.length);
console.log('\nFirst 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));

console.log('\nColumn names:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}

// Save full data to a JSON file for inspection
fs.writeFileSync('met-data-from-excel.json', JSON.stringify(data, null, 2));
console.log('\nFull data saved to met-data-from-excel.json');
