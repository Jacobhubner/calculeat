import fs from 'fs';

// Read the current translated data
const data = JSON.parse(fs.readFileSync('met-activities-swedish.json', 'utf8'));

// Enhanced translation mappings
const betterTranslations = {
  // Fix remaining English terms
  'pleasure': 'nöje',
  'or for': 'eller för',
  ' or ': ' eller ',
  ' and ': ' och ',
  ' with ': ' med ',
  ' to ': ' till ',
  ' from ': ' från ',
  ' in ': ' i ',
  ' on ': ' på ',
  ' at ': ' vid ',
  'self': 'själv',
  'selected': 'vald',
  'self-selected': 'självvald',
  'self selected': 'självvald',
  'child care': 'barnomsorg',
  'carrying': 'bärande',
  'pushing': 'skjutande',
  'pulling': 'dragande',
  'loading': 'lastande',
  'unloading': 'lossande',
  'moderate-to-vigorous': 'måttlig-till-hög',
  'moderate-to-hög': 'måttlig-till-hög',
  'light-to-moderate': 'lätt-till-måttlig',
  'very light': 'mycket lätt',
  'very fast': 'mycket snabb',
  'very slow': 'mycket långsam',

  // Technical terms
  'electrically assisted': 'elassisterad',
  'electronic support': 'elektroniskt stöd',
  'brake hoods': 'bromshandtag',
  'bar drops': 'nederkrokar',
  'seated': 'sittande',
  'standing': 'stående',
  'hands': 'händer',
  'eccentric only': 'endast excentrisk',
  'watts': 'watt',
  'rpm': 'rpm',
  'drafting': 'vinddragning',
  'not vinddragning': 'utan vinddragning',
  'not drafting': 'utan vinddragning',
  'inch': 'tum',
  'step': 'steg',
  'rehearsal': 'repetition',
  'class': 'klass',
  'performance': 'föreställning',
  'e.g.': 't.ex.',
  'ethnic': 'etnisk',
  'cultural': 'kulturell',
  'dance': 'dans',
  'combination': 'kombination',
  'movements': 'rörelser',
  'drumming': 'trummande',
  'Greek': 'grekisk',
  'Middle Eastern': 'mellanöstern',
  'belly': 'magdans',
  'swing': 'swing',

  // Better Swedish translations
  'general': 'allmän',
  'heavy': 'tung',
  'major': 'större',
  'minor': 'mindre',
  'active': 'aktiv',
  'passive': 'passiv',
  'competitive': 'tävlings',
  'recreational': 'rekreations',
  'training': 'träning',
  'practice': 'övning',
  'game': 'spel/match',
  'match': 'match',
  'high': 'hög',
  'intensity': 'intensitet',

  // Specific activities
  'rope jumping': 'hopprep',
  'weight lifting': 'tyngdlyftning',
  'circuit training': 'cirkelträning',
  'stretching': 'stretching',
  'yoga': 'yoga',
  'pilates': 'pilates',
  'rowing': 'rodd',
  'elliptical trainer': 'crosstrainer',
  'stair-treadmill': 'trappmaskin',
  'treadmill': 'löpband',

  // Home activities
  'mopping': 'moppa',
  'sweeping': 'sopa',
  'vacuuming': 'dammsuga',
  'ironing': 'stryka',
  'laundry': 'tvätt',
  'washing dishes': 'diska',
  'food preparation': 'matlagning',
  'making bed': 'bädda',

  // Work activities
  'carpentry': 'snickeri',
  'masonry': 'murning',
  'plumbing': 'VVS',
  'painting': 'målning',
  'roofing': 'takläggning',

  // Sports
  'basketball': 'basket',
  'football': 'amerikansk fotboll',
  'soccer': 'fotboll',
  'volleyball': 'volleyboll',
  'tennis': 'tennis',
  'badminton': 'badminton',
  'golf': 'golf',
  'bowling': 'bowling',
  'boxing': 'boxning',
  'wrestling': 'brottning',
  'martial arts': 'kampsport',

  // Winter activities
  'skiing': 'skidåkning',
  'snowboarding': 'snowboard',
  'skating': 'skridskoåkning',
  'sledding': 'pulkaåkning',
  'snowshoeing': 'snöskovandring',

  // Water activities
  'kayaking': 'kajakpaddling',
  'canoeing': 'kanotpaddling',
  'sailing': 'segling',
  'surfing': 'surfing',
  'snorkeling': 'snorkling',
  'scuba diving': 'dyk ning',
  'water polo': 'vattenpolo',
  'water aerobics': 'vattengymnastik',
};

// Function to improve translation
function improveTranslation(text) {
  let improved = text;

  // Apply all better translations
  Object.entries(betterTranslations).forEach(([eng, swe]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    improved = improved.replace(regex, swe);
  });

  // Clean up multiple spaces
  improved = improved.replace(/\s+/g, ' ').trim();

  // Fix common patterns
  improved = improved.replace(/självvald självvald/g, 'självvald');
  improved = improved.replace(/måttlig tempo/g, 'måttligt tempo');
  improved = improved.replace(/lätt tempo/g, 'lätt tempo');
  improved = improved.replace(/hög tempo/g, 'högt tempo');

  return improved;
}

// Improve all translations
console.log('Förbättrar översättningar...');
const improved = data.map(activity => ({
  ...activity,
  activity: improveTranslation(activity.activity)
}));

// Find activities that still have English words
const stillEnglish = improved.filter(a =>
  /\b(the|and|or|for|with|from|to|in|on|at|by|of)\b/i.test(a.activity) &&
  !a.activity.includes('Taylor Code') &&
  !a.activity.includes('MET')
);

console.log(`\nAktiviteter som fortfarande har engelska ord: ${stillEnglish.length}`);
if (stillEnglish.length > 0) {
  console.log('\nExempel:');
  stillEnglish.slice(0, 10).forEach(a => {
    console.log(`  [${a.id}] ${a.activity}`);
  });
}

// Save improved translations
fs.writeFileSync('met-activities-swedish-improved.json', JSON.stringify(improved, null, 2));
console.log('\n✓ Förbättrade översättningar sparade till met-activities-swedish-improved.json');

// Generate TypeScript
const tsLines = improved.map(item => {
  const escapedActivity = item.activity.replace(/'/g, "\\'");
  return `  { id: '${item.id}', category: '${item.category}', activity: '${escapedActivity}', met: ${item.met}, intensity: '${item.intensity}' },`;
});

fs.writeFileSync('met-activities-swedish-improved.ts', tsLines.join('\n'));
console.log('✓ TypeScript-kod sparad till met-activities-swedish-improved.ts');

console.log('\nStatistik:');
console.log(`  Totalt aktiviteter: ${improved.length}`);
console.log(`  Aktiviteter med kvarvarande engelska: ${stillEnglish.length} (${(stillEnglish.length/improved.length*100).toFixed(1)}%)`);
