import XLSX from 'xlsx';
import fs from 'fs';

// Category translations
const categoryTranslations = {
  'Bicycling': 'Cykling',
  'Conditioning Exercise': 'Konditionsträning',
  'Dancing': 'Dans',
  'Fishing & Hunting': 'Fiske & Jakt',
  'Fishing and Hunting': 'Fiske & Jakt',
  'Home Activities': 'Hemaktiviteter',
  'Home Repair': 'Hemreparation',
  'Inactivity': 'Inaktivitet',
  'Lawn & Garden': 'Trädgårdsarbete',
  'Lawn and Garden': 'Trädgårdsarbete',
  'Miscellaneous': 'Diverse',
  'Music Playing': 'Musicerande',
  'Occupation': 'Arbete',
  'Running': 'Löpning',
  'Self Care': 'Egenvård',
  'Sexual Activity': 'Sexuell aktivitet',
  'Sports': 'Sport',
  'Transportation': 'Transport',
  'Video Games': 'Videospel',
  'Walking': 'Promenad',
  'Water Activities': 'Vattenaktiviteter',
  'Winter Activities': 'Vinteraktiviteter',
  'Religious Activities': 'Religiösa aktiviteter',
  'Volunteer Activities': 'Volontärarbete'
};

// Common translation mappings (order matters - more specific first)
const translationMap = {
  // Prepositions and connectors
  'to work': 'till arbete',
  'to/from work': 'till/från arbete',
  'to/from': 'till/från',
  'or for': 'eller för',
  'for pleasure': 'för nöje',

  // Activity types
  'mountain biking': 'terrängcykling',
  'mountain': 'terrängcykling',
  'competitive racing': 'tävling',
  'racing': 'racing/tävling',

  // Activities
  'bicycling': 'cykling',
  'running': 'löpning',
  'walking': 'promenad',
  'swimming': 'simning',
  'dancing': 'dans',
  'conditioning': 'konditionsträning',
  'exercise': 'träning',
  'playing': 'spela',
  'fishing': 'fiske',
  'hunting': 'jakt',
  'gardening': 'trädgårdsarbete',
  'cleaning': 'städning',
  'cooking': 'matlagning',
  'sitting': 'sittande',
  'standing': 'stående',
  'sleeping': 'sovande',
  'lying': 'liggande',
  'resting': 'vilande',

  // Intensities and pace
  'very vigorous': 'mycket hög intensitet',
  'light effort': 'lätt ansträngning',
  'moderate effort': 'måttlig ansträngning',
  'vigorous effort': 'hög ansträngning',
  'light': 'lätt',
  'moderate': 'måttlig',
  'vigorous': 'hög',
  'slow pace': 'långsamt tempo',
  'moderate pace': 'måttligt tempo',
  'fast pace': 'snabbt tempo',
  'slow': 'långsam',
  'fast': 'snabb',
  'pace': 'tempo',

  // Context words
  'leisure': 'fritid',
  'competitive': 'tävlings-',
  'general': 'allmän',
  'self selected': 'självvalt',
  'self-selected': 'självvalt',

  // Locations
  'on dirt or farm road': 'på grus- eller lantväg',
  'uphill': 'uppförsbacke',
  'downhill': 'nedförsbacke',
  'stationary': 'stillastående',
  'indoor': 'inomhus',
  'outdoor': 'utomhus',

  // Common words
  'effort': 'ansträngning',
  'work': 'arbete',
  'easy': 'lätt',
  'hard': 'hårt'
};

// Convert mph to km/h
function convertSpeed(text) {
  // Pattern: number + optional decimal + "mph"
  text = text.replace(/(\d+\.?\d*)\s*mph/gi, (match, speed) => {
    const kmh = (parseFloat(speed) * 1.60934).toFixed(1);
    return `${kmh} km/h`;
  });

  // Pattern: "< number mph"
  text = text.replace(/<\s*(\d+\.?\d*)\s*mph/gi, (match, speed) => {
    const kmh = Math.round(parseFloat(speed) * 1.60934);
    return `<${kmh} km/h`;
  });

  // Pattern: "> number mph"
  text = text.replace(/>\s*(\d+\.?\d*)\s*mph/gi, (match, speed) => {
    const kmh = Math.round(parseFloat(speed) * 1.60934);
    return `>${kmh} km/h`;
  });

  // Pattern: "number-number mph"
  text = text.replace(/(\d+\.?\d*)-(\d+\.?\d*)\s*mph/gi, (match, low, high) => {
    const lowKmh = Math.round(parseFloat(low) * 1.60934);
    const highKmh = Math.round(parseFloat(high) * 1.60934);
    return `${lowKmh}-${highKmh} km/h`;
  });

  return text;
}

// Convert min/mile to min/km
function convertPace(text) {
  text = text.replace(/(\d+\.?\d*)\s*min\/mile/gi, (match, pace) => {
    const minPerKm = (parseFloat(pace) / 1.60934).toFixed(1);
    return `${minPerKm} min/km`;
  });

  return text;
}

// Convert feet to meters
function convertFeet(text) {
  text = text.replace(/(\d+\.?\d*)\s*feet/gi, (match, feet) => {
    const meters = (parseFloat(feet) * 0.3048).toFixed(1);
    return `${meters} meter`;
  });

  return text;
}

// Convert yards to meters
function convertYards(text) {
  text = text.replace(/(\d+\.?\d*)\s*yards?/gi, (match, yards) => {
    const meters = (parseFloat(yards) * 0.9144).toFixed(1);
    return `${meters} meter`;
  });

  return text;
}

// Convert inches to cm
function convertInches(text) {
  text = text.replace(/(\d+\.?\d*)\s*inches?/gi, (match, inches) => {
    const cm = (parseFloat(inches) * 2.54).toFixed(1);
    return `${cm} cm`;
  });

  return text;
}

// Convert pounds to kg
function convertPounds(text) {
  text = text.replace(/(\d+\.?\d*)\s*lbs?|pounds?/gi, (match, pounds) => {
    const kg = (parseFloat(pounds) * 0.453592).toFixed(1);
    return `${kg} kg`;
  });

  return text;
}

// Translate activity description
function translateActivity(description) {
  let translated = description;

  // Apply unit conversions
  translated = convertSpeed(translated);
  translated = convertPace(translated);
  translated = convertFeet(translated);
  translated = convertYards(translated);
  translated = convertInches(translated);
  translated = convertPounds(translated);

  // Apply word-by-word translations (case-insensitive)
  Object.entries(translationMap).forEach(([eng, swe]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translated = translated.replace(regex, swe);
  });

  return translated;
}

// Determine intensity based on MET value
function getIntensity(met) {
  if (met < 3.0) return 'lätt';
  if (met < 6.0) return 'måttlig';
  if (met < 9.0) return 'hög';
  return 'mycket hög';
}

// Read Excel file
console.log('Läser Excel-fil...');
const workbook = XLSX.readFile('C:\\Users\\jahub\\Downloads\\Project CalculEat Sheet.xlsx');
const worksheet = workbook.Sheets['MET'];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

// Clean and translate data
console.log('Översätter och konverterar data...');
const translatedActivities = data
  .filter(row => {
    const code = String(row['Activity Code '] || '').trim();
    const met = String(row['MET Value '] || '').trim();
    const category = String(row['Major Heading '] || '').trim();
    const activity = String(row['Activity Description'] || '').trim();

    return code && met && category && activity &&
           !isNaN(parseFloat(met)) &&
           code.match(/^\d{5}$/);
  })
  .map(row => {
    const id = String(row['Activity Code ']).trim();
    const englishCategory = String(row['Major Heading ']).trim();
    const englishActivity = String(row['Activity Description']).trim();
    const met = parseFloat(row['MET Value ']);

    const category = categoryTranslations[englishCategory] || englishCategory;
    const activity = translateActivity(englishActivity);
    const intensity = getIntensity(met);

    return {
      id,
      category,
      activity,
      met,
      intensity
    };
  });

console.log(`\nÖversatta ${translatedActivities.length} aktiviteter`);

// Generate TypeScript code
console.log('Genererar TypeScript-kod...');
const tsLines = translatedActivities.map(item => {
  const escapedActivity = item.activity.replace(/'/g, "\\'");
  return `  { id: '${item.id}', category: '${item.category}', activity: '${escapedActivity}', met: ${item.met}, intensity: '${item.intensity}' },`;
});

fs.writeFileSync('met-activities-swedish.ts', tsLines.join('\n'));
console.log('TypeScript-kod sparad till: met-activities-swedish.ts');

// Also save as JSON for inspection
fs.writeFileSync('met-activities-swedish.json', JSON.stringify(translatedActivities, null, 2));
console.log('JSON-data sparad till: met-activities-swedish.json');

// Show some statistics
const categoryCount = {};
translatedActivities.forEach(item => {
  categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
});

console.log('\n=== STATISTIK ===');
console.log('Kategorier och antal aktiviteter:');
Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

console.log('\n=== EXEMPEL PÅ ÖVERSÄTTNINGAR ===');
console.log(translatedActivities.slice(0, 5).map(item =>
  `[${item.id}] ${item.category} - ${item.activity} (${item.met} MET, ${item.intensity})`
).join('\n'));

console.log('\n✓ Klart!');
