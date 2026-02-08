const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/Jacob Hübner/Downloads/Project CalculEat Sheet.xlsx');
const ws = wb.Sheets['Items'];
const data = XLSX.utils.sheet_to_json(ws);

// Skip header row and 'Ägg medium'
const items = data.slice(1).filter(row => row.__EMPTY_1 && row.__EMPTY_1 !== 'Ägg medium');

// Transform to database format
const transformed = items.map(row => {
  const name = row.__EMPTY_1;
  const default_amount = row.__EMPTY_2 || 100;
  const default_unit = row.__EMPTY_3 || 'g';
  const kcal_per_gram = row.__EMPTY_7 || 0;
  const energy_density_color = row.__EMPTY_8 || 'Green';
  const grams_per_unit = row.__EMPTY_9 || 1;
  const kcal_per_unit = row.__EMPTY_10 || 0;
  const fat_per_unit = row.__EMPTY_11 || 0;
  const carb_per_unit = row.__EMPTY_12 || 0;
  const protein_per_unit = row.__EMPTY_13 || 0;
  const ml_per_gram = row.__EMPTY_14 || null;
  const grams_per_piece = row.__EMPTY_15 || null;

  // Calculate per 100g values
  const calories = grams_per_unit > 0 ? (kcal_per_unit / grams_per_unit) * 100 : 0;
  const fat_g = grams_per_unit > 0 ? (fat_per_unit / grams_per_unit) * 100 : 0;
  const carb_g = grams_per_unit > 0 ? (carb_per_unit / grams_per_unit) * 100 : 0;
  const protein_g = grams_per_unit > 0 ? (protein_per_unit / grams_per_unit) * 100 : 0;

  // Determine serving_unit (if not g or ml)
  const serving_unit = (default_unit !== 'g' && default_unit !== 'ml') ? default_unit : null;

  return {
    name,
    default_amount,
    default_unit,
    calories: Math.round(calories * 100) / 100,
    fat_g: Math.round(fat_g * 100) / 100,
    carb_g: Math.round(carb_g * 100) / 100,
    protein_g: Math.round(protein_g * 100) / 100,
    kcal_per_gram: Math.round(kcal_per_gram * 100) / 100,
    energy_density_color,
    grams_per_unit: Math.round(grams_per_unit * 100) / 100,
    kcal_per_unit: Math.round(kcal_per_unit * 100) / 100,
    fat_per_unit: Math.round(fat_per_unit * 100) / 100,
    carb_per_unit: Math.round(carb_per_unit * 100) / 100,
    protein_per_unit: Math.round(protein_per_unit * 100) / 100,
    ml_per_gram,
    grams_per_piece,
    serving_unit
  };
});

const USER_ID = '1fa1ea69-74f8-4a16-9c91-496bfb5b406b';

// Generate SQL VALUES for batch insert
const escapeString = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
};

const values = transformed.map(item => {
  return `(
    '${USER_ID}',
    false,
    ${escapeString(item.name)},
    ${item.default_amount},
    ${escapeString(item.default_unit)},
    ${item.calories},
    ${item.fat_g},
    ${item.carb_g},
    ${item.protein_g},
    ${item.kcal_per_gram},
    'Solid',
    ${escapeString(item.energy_density_color)},
    ${item.grams_per_unit},
    ${item.kcal_per_unit},
    ${item.fat_per_unit},
    ${item.carb_per_unit},
    ${item.protein_per_unit},
    ${item.ml_per_gram === null ? 'NULL' : item.ml_per_gram},
    ${item.grams_per_piece === null ? 'NULL' : item.grams_per_piece},
    100,
    ${escapeString(item.serving_unit)}
  )`;
});

// Output as JSON for programmatic use
console.log(JSON.stringify(transformed));
