const XLSX = require('xlsx');
const fs = require('fs');

// Read Excel file
const path = 'C:/Users/Jacob Hübner/Downloads/Project CalculEat Sheet.xlsx';
const workbook = XLSX.readFile(path);
const sheet = workbook.Sheets['Items'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Parse Excel data - skip recipes (column 0 has value)
const excelItems = new Map();
for (let i = 3; i < data.length; i++) {
  const row = data[i];
  const name = row[1];
  if (!name || name.toString().trim() === '' || row[0]) continue;

  excelItems.set(name.toString().trim(), {
    name: name.toString().trim(),
    amount: parseFloat(row[2]) || 100,
    unit: (row[3] || 'g').toString().trim(),
    calories: parseFloat(row[4]) || 0,
    fat: parseFloat(row[5]) || 0,
    carb: parseFloat(row[6]) || 0,
    protein: parseFloat(row[7]) || 0,
    kcalPerG: parseFloat(row[8]) || 0,
    category: (row[9] || '').toString().trim(),
    gPerUnit: parseFloat(row[10]) || 1,
    gPerPiece: row[16] ? parseFloat(row[16]) : null
  });
}

// Read database items from file (we'll create this separately)
const dbItemsRaw = fs.readFileSync('db_foods.json', 'utf-8');
const dbItems = JSON.parse(dbItemsRaw);

console.log('='.repeat(80));
console.log('FULLSTÄNDIG JÄMFÖRELSE: Excel vs Databas');
console.log('='.repeat(80));
console.log('');
console.log('Antal livsmedel i Excel (ej recept): ' + excelItems.size);
console.log('Antal livsmedel i Databas: ' + dbItems.length);
console.log('');

const errors = [];
const warnings = [];

dbItems.forEach(db => {
  const excel = excelItems.get(db.name);
  if (!excel) {
    warnings.push(`SAKNAS I EXCEL: ${db.name}`);
    return;
  }

  const dbCal = parseFloat(db.calories);
  const dbFat = parseFloat(db.fat_g);
  const dbCarb = parseFloat(db.carb_g);
  const dbProt = parseFloat(db.protein_g);
  const dbAmount = parseFloat(db.default_amount);
  const dbWeightGrams = parseFloat(db.weight_grams) || 100;

  // Excel values - normalize to per 100g for comparison
  let excelCalPer100g, excelFatPer100g, excelCarbPer100g, excelProtPer100g;

  if (excel.amount === 100 && (excel.unit === 'g' || excel.unit === 'ml')) {
    // Already per 100g/ml
    excelCalPer100g = excel.calories;
    excelFatPer100g = excel.fat;
    excelCarbPer100g = excel.carb;
    excelProtPer100g = excel.protein;
  } else {
    // Need to convert using gPerUnit
    const grams = excel.amount * excel.gPerUnit;
    if (grams === 0) {
      warnings.push(`${db.name}: Excel gPerUnit is 0, can't normalize`);
      return;
    }
    excelCalPer100g = (excel.calories / grams) * 100;
    excelFatPer100g = (excel.fat / grams) * 100;
    excelCarbPer100g = (excel.carb / grams) * 100;
    excelProtPer100g = (excel.protein / grams) * 100;
  }

  // DB values - already per weight_grams (usually 100g)
  const dbCalPer100g = (dbCal / dbWeightGrams) * 100;
  const dbFatPer100g = (dbFat / dbWeightGrams) * 100;
  const dbCarbPer100g = (dbCarb / dbWeightGrams) * 100;
  const dbProtPer100g = (dbProt / dbWeightGrams) * 100;

  // Compare
  const diffs = [];

  // Check unit mismatch
  if (excel.unit !== db.default_unit) {
    diffs.push(`unit: Excel=${excel.amount}${excel.unit} DB=${dbAmount}${db.default_unit}`);
  }

  // Check values per 100g
  if (Math.abs(excelCalPer100g - dbCalPer100g) > 2) {
    diffs.push(`kcal/100g: Excel=${excelCalPer100g.toFixed(1)} DB=${dbCalPer100g.toFixed(1)}`);
  }
  if (Math.abs(excelFatPer100g - dbFatPer100g) > 0.5) {
    diffs.push(`fat/100g: Excel=${excelFatPer100g.toFixed(2)} DB=${dbFatPer100g.toFixed(2)}`);
  }
  if (Math.abs(excelCarbPer100g - dbCarbPer100g) > 0.5) {
    diffs.push(`carb/100g: Excel=${excelCarbPer100g.toFixed(2)} DB=${dbCarbPer100g.toFixed(2)}`);
  }
  if (Math.abs(excelProtPer100g - dbProtPer100g) > 0.5) {
    diffs.push(`prot/100g: Excel=${excelProtPer100g.toFixed(2)} DB=${dbProtPer100g.toFixed(2)}`);
  }

  // Check color
  if (excel.category !== db.energy_density_color && excel.category && db.energy_density_color) {
    diffs.push(`color: Excel=${excel.category} DB=${db.energy_density_color}`);
  }

  // Check grams_per_piece
  if (excel.gPerPiece !== null && db.grams_per_piece) {
    const dbGpp = parseFloat(db.grams_per_piece);
    if (Math.abs(excel.gPerPiece - dbGpp) > 1) {
      diffs.push(`g/piece: Excel=${excel.gPerPiece} DB=${dbGpp}`);
    }
  }

  if (diffs.length > 0) {
    errors.push({
      name: db.name,
      excel: excel,
      db: db,
      diffs: diffs
    });
  }
});

// Check for items in Excel but not in DB
for (const [name, excel] of excelItems) {
  const db = dbItems.find(d => d.name === name);
  if (!db) {
    warnings.push(`SAKNAS I DATABAS: ${name}`);
  }
}

console.log('');
console.log('='.repeat(80));
console.log('FEL SOM MÅSTE ÅTGÄRDAS (' + errors.length + ' st):');
console.log('='.repeat(80));
console.log('');

errors.forEach((err, idx) => {
  console.log(`${idx + 1}. ${err.name}`);
  console.log(`   Excel: ${err.excel.amount} ${err.excel.unit} = ${err.excel.calories.toFixed(1)} kcal | F:${err.excel.fat.toFixed(2)} K:${err.excel.carb.toFixed(2)} P:${err.excel.protein.toFixed(2)} | ${err.excel.category}`);
  console.log(`   DB:    ${err.db.default_amount} ${err.db.default_unit} = ${err.db.calories} kcal | F:${err.db.fat_g} K:${err.db.carb_g} P:${err.db.protein_g} | ${err.db.energy_density_color}`);
  console.log(`   Skillnader: ${err.diffs.join(', ')}`);
  console.log('');
});

if (warnings.length > 0) {
  console.log('');
  console.log('='.repeat(80));
  console.log('VARNINGAR (' + warnings.length + ' st):');
  console.log('='.repeat(80));
  warnings.forEach(w => console.log('  - ' + w));
}

// Generate SQL update statements
console.log('');
console.log('='.repeat(80));
console.log('SQL UPPDATERINGAR FÖR ATT KORRIGERA:');
console.log('='.repeat(80));
console.log('');

const sqlStatements = [];

errors.forEach(err => {
  const excel = err.excel;

  // Calculate per 100g values from Excel
  let calPer100g, fatPer100g, carbPer100g, protPer100g;
  if (excel.amount === 100 && (excel.unit === 'g' || excel.unit === 'ml')) {
    calPer100g = excel.calories;
    fatPer100g = excel.fat;
    carbPer100g = excel.carb;
    protPer100g = excel.protein;
  } else {
    const grams = excel.amount * excel.gPerUnit;
    calPer100g = (excel.calories / grams) * 100;
    fatPer100g = (excel.fat / grams) * 100;
    carbPer100g = (excel.carb / grams) * 100;
    protPer100g = (excel.protein / grams) * 100;
  }

  const gppPart = excel.gPerPiece ? `, grams_per_piece = ${excel.gPerPiece}` : '';

  const sql = `UPDATE food_items SET default_amount = ${excel.amount}, default_unit = '${excel.unit}', calories = ${calPer100g.toFixed(2)}, fat_g = ${fatPer100g.toFixed(2)}, carb_g = ${carbPer100g.toFixed(2)}, protein_g = ${protPer100g.toFixed(2)}, energy_density_color = '${excel.category}', weight_grams = 100${gppPart} WHERE name = '${err.name.replace(/'/g, "''")}';`;

  sqlStatements.push(sql);

  console.log(`-- ${err.name}`);
  console.log(sql);
  console.log('');
});

// Write SQL to file
fs.writeFileSync('scripts/import-sql.txt', sqlStatements.join('\n\n'));
console.log('SQL skrivet till scripts/import-sql.txt');
