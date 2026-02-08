const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Jacob Hübner', 'Downloads', 'Project CalculEat Sheet.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);

  const todaySheet = workbook.Sheets['Today'];
  if (!todaySheet) {
    console.log('Today sheet not found. Available sheets:', workbook.SheetNames);
    process.exit(1);
  }

  console.log('\n=== SECTION N5:T8 (Kaloritäthet/Color categories) ===');
  // Read cells N5 to T8
  const section1Rows = [];
  for (let row = 5; row <= 8; row++) {
    const rowData = [];
    for (let col = 'N'.charCodeAt(0); col <= 'T'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      rowData.push(cell ? cell.v : '');
    }
    section1Rows.push(`Row ${row}: ${JSON.stringify(rowData)}`);
  }
  section1Rows.forEach(r => console.log(r));

  console.log('\n=== SECTION R23:U27 (Meal breakdown) ===');
  // Read cells R23 to U27
  const section2Rows = [];
  for (let row = 23; row <= 27; row++) {
    const rowData = [];
    for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      rowData.push(cell ? cell.v : '');
    }
    section2Rows.push(`Row ${row}: ${JSON.stringify(rowData)}`);
  }
  section2Rows.forEach(r => console.log(r));

  console.log('\n=== HEADERS ROW 4 (N-T columns) ===');
  const headerRow = [];
  for (let col = 'N'.charCodeAt(0); col <= 'T'.charCodeAt(0); col++) {
    const cellRef = String.fromCharCode(col) + '4';
    const cell = todaySheet[cellRef];
    headerRow.push(cell ? cell.v : '');
  }
  console.log('Row 4:', JSON.stringify(headerRow));

  console.log('\n=== HEADERS ROW 22 (R-U columns) ===');
  const headerRow22 = [];
  for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
    const cellRef = String.fromCharCode(col) + '22';
    const cell = todaySheet[cellRef];
    headerRow22.push(cell ? cell.v : '');
  }
  console.log('Row 22:', JSON.stringify(headerRow22));

  // Also check nearby cells for context
  console.log('\n=== CONTEXT: Rows around N5:T8 ===');
  for (let row = 3; row <= 9; row++) {
    const rowData = [];
    for (let col = 'L'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      rowData.push(cell ? String(cell.v).substring(0, 15) : '');
    }
    console.log(`Row ${row}: ${JSON.stringify(rowData)}`);
  }

  console.log('\n=== CONTEXT: Rows around R23:U27 ===');
  for (let row = 21; row <= 28; row++) {
    const rowData = [];
    for (let col = 'P'.charCodeAt(0); col <= 'V'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      rowData.push(cell ? String(cell.v).substring(0, 15) : '');
    }
    console.log(`Row ${row}: ${JSON.stringify(rowData)}`);
  }

  // Check formulas
  console.log('\n=== FORMULAS in N5:T8 ===');
  for (let row = 5; row <= 8; row++) {
    for (let col = 'N'.charCodeAt(0); col <= 'T'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell && cell.f) {
        console.log(`${cellRef}: ${cell.f}`);
      }
    }
  }

  console.log('\n=== FORMULAS in R23:U27 ===');
  for (let row = 23; row <= 27; row++) {
    for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell && cell.f) {
        console.log(`${cellRef}: ${cell.f}`);
      }
    }
  }

} catch (e) {
  console.error('Error:', e.message);
}
