const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Jacob Hübner', 'Downloads', 'Project CalculEat Sheet.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  const todaySheet = workbook.Sheets['Today'];

  console.log('\n=== SECTION M11:X12 ===');
  for (let row = 10; row <= 14; row++) {
    const rowData = [];
    for (let col = 'K'.charCodeAt(0); col <= 'Y'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      rowData.push(cell ? String(cell.v).substring(0, 12) : '');
    }
    console.log(`Row ${row}: ${JSON.stringify(rowData)}`);
  }

  console.log('\n=== FORMULAS in M11:X12 ===');
  for (let row = 11; row <= 12; row++) {
    for (let col = 'M'.charCodeAt(0); col <= 'X'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell && cell.f) {
        console.log(`${cellRef}: ${cell.f}`);
      }
    }
  }

  console.log('\n=== CELL VALUES M11:X12 ===');
  for (let row = 11; row <= 12; row++) {
    for (let col = 'M'.charCodeAt(0); col <= 'X'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell) {
        console.log(`${cellRef}: value=${cell.v}, type=${cell.t}`);
      }
    }
  }

} catch (e) {
  console.error('Error:', e.message);
}
