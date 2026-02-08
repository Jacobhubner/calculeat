const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Jacob Hübner', 'Downloads', 'Project CalculEat Sheet.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n=== SHEET NAMES ===');
  console.log(workbook.SheetNames);

  // Read the Today sheet
  const todaySheet = workbook.Sheets['Today'];
  if (todaySheet) {
    console.log('\n=== TODAY SHEET DATA ===');
    const data = XLSX.utils.sheet_to_json(todaySheet, { header: 1, defval: '' });
    data.forEach((row, i) => {
      if (row.some(cell => cell !== '')) {
        console.log(`Row ${i}: ${JSON.stringify(row)}`);
      }
    });

    // Also get the range to understand structure
    console.log('\n=== SHEET RANGE ===');
    console.log('Range:', todaySheet['!ref']);

    // Get merged cells if any
    if (todaySheet['!merges']) {
      console.log('\n=== MERGED CELLS ===');
      console.log(JSON.stringify(todaySheet['!merges'], null, 2));
    }
  } else {
    console.log('Today sheet not found. Available sheets:', workbook.SheetNames);
  }
} catch (e) {
  console.error('Error:', e.message);
}
