const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Jacob Hübner', 'Downloads', 'Project CalculEat Sheet.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  const todaySheet = workbook.Sheets['Today'];

  console.log('\n' + '='.repeat(80));
  console.log('ANALYS AV CELLOMRÅDE R23:U27 PÅ BLADET "Today"');
  console.log('='.repeat(80));

  // First, let's see the broader context - rows 20-30, columns P-V
  console.log('\n### KONTEXT: Område P20:V30 ###\n');

  for (let row = 20; row <= 30; row++) {
    const rowData = [];
    for (let col = 'P'.charCodeAt(0); col <= 'V'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      const value = cell ? (cell.v !== undefined ? String(cell.v).substring(0, 15) : 'EMPTY') : '';
      rowData.push(value.padEnd(16));
    }
    console.log(`Row ${row}: ${rowData.join('| ')}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('### DETALJERAD ANALYS AV R23:U27 ###');
  console.log('='.repeat(80));

  // Detailed analysis of R23:U27
  for (let row = 23; row <= 27; row++) {
    console.log(`\n--- ROW ${row} ---`);
    for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];

      console.log(`\n  ${cellRef}:`);
      if (cell) {
        console.log(`    Värde (v): ${cell.v}`);
        console.log(`    Typ (t): ${cell.t}`);
        if (cell.f) {
          console.log(`    Formel (f): ${cell.f}`);
        }
        if (cell.w) {
          console.log(`    Formaterat (w): ${cell.w}`);
        }
      } else {
        console.log(`    [TOM CELL]`);
      }
    }
  }

  // Now let's look at the headers (row 22 or earlier)
  console.log('\n' + '='.repeat(80));
  console.log('### RUBRIKER (rad 21-22) ###');
  console.log('='.repeat(80));

  for (let row = 21; row <= 22; row++) {
    console.log(`\n--- ROW ${row} ---`);
    for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell) {
        console.log(`  ${cellRef}: "${cell.v}" (typ: ${cell.t})`);
      }
    }
  }

  // Let's also check what R23:U27 depends on - look for referenced cells
  console.log('\n' + '='.repeat(80));
  console.log('### BEROENDEN - Refererade celler ###');
  console.log('='.repeat(80));

  // Common referenced cells from formulas
  const referencedCells = new Set();

  for (let row = 23; row <= 27; row++) {
    for (let col = 'R'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell && cell.f) {
        // Extract cell references from formula
        const matches = cell.f.match(/[A-Z]+[0-9]+/g);
        if (matches) {
          matches.forEach(ref => referencedCells.add(ref));
        }
      }
    }
  }

  console.log('\nRefererade celler från formler i R23:U27:');
  const sortedRefs = Array.from(referencedCells).sort();

  for (const ref of sortedRefs) {
    const cell = todaySheet[ref];
    if (cell) {
      console.log(`  ${ref}: värde=${cell.v}, typ=${cell.t}${cell.f ? ', formel=' + cell.f : ''}`);
    } else {
      console.log(`  ${ref}: [TOM]`);
    }
  }

  // Let's also look at meal-related data
  console.log('\n' + '='.repeat(80));
  console.log('### MÅLTIDSDATA (kontextuella värden) ###');
  console.log('='.repeat(80));

  // Check common meal columns (usually around columns like G, H, I for macros)
  console.log('\n--- Kolla rad 23-27 för alla kolumner A-U ---');

  for (let row = 23; row <= 27; row++) {
    console.log(`\nRow ${row}:`);
    for (let col = 'A'.charCodeAt(0); col <= 'U'.charCodeAt(0); col++) {
      const cellRef = String.fromCharCode(col) + row;
      const cell = todaySheet[cellRef];
      if (cell && cell.v !== undefined && cell.v !== '') {
        const formula = cell.f ? ` [f: ${cell.f}]` : '';
        console.log(`  ${cellRef}: ${cell.v}${formula}`);
      }
    }
  }

  // Check what's in the meal name column
  console.log('\n' + '='.repeat(80));
  console.log('### STRUKTUR - Hitta måltidsnamn och summor ###');
  console.log('='.repeat(80));

  // Look for "Frukost", "Lunch", etc.
  for (let row = 1; row <= 50; row++) {
    const cellA = todaySheet['A' + row];
    const cellB = todaySheet['B' + row];
    if (cellA && cellA.v) {
      const val = String(cellA.v).toLowerCase();
      if (val.includes('frukost') || val.includes('lunch') || val.includes('middag') ||
          val.includes('mellanmål') || val.includes('måltid') || val.includes('meal') ||
          val.includes('weight') || val.includes('macros') || val.includes('vikt')) {
        console.log(`  A${row}: "${cellA.v}"`);
      }
    }
    if (cellB && cellB.v) {
      const val = String(cellB.v).toLowerCase();
      if (val.includes('frukost') || val.includes('lunch') || val.includes('middag') ||
          val.includes('mellanmål') || val.includes('måltid') || val.includes('meal') ||
          val.includes('weight') || val.includes('macros') || val.includes('vikt')) {
        console.log(`  B${row}: "${cellB.v}"`);
      }
    }
  }

} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
