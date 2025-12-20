import fs from 'fs';

// Read the current data
const data = JSON.parse(fs.readFileSync('met-activities-swedish-improved.json', 'utf8'));

// Comprehensive translation dictionary
const translations = {
  // Common English words that should be Swedish
  ' and/or ': ' och/eller ',
  ' or ': ' eller ',
  ' and ': ' och ',
  'eller more': 'eller mer',
  ' with ': ' med ',
  ' without ': ' utan ',
  ' to ': ' till ',
  ' from ': ' från ',
  ' in ': ' i ',
  ' on ': ' på ',
  ' at ': ' vid ',
  ' by ': ' genom ',
  ' of ': ' av ',
  ' the ': ' ',
  ' very ': ' mycket ',
  ' only ': ' endast ',
  ' less than ': ' mindre än ',
  ' more than ': ' mer än ',
  ' than ': ' än ',
  ' for ': ' för ',
  ' from ': ' från ',

  // Activity-specific translations (order matters - specific before general)
  'Bench step': 'Stepbräda',
  'bench step': 'stepbräda',
  'step bench': 'stepbräda',
  'Aerobic': 'Aerobic',
  'step': 'steg',
  'inch': 'tum',
  'Ballet': 'Balett',
  'modern': 'modern',
  'jazz': 'jazz',
  'rehearsal': 'repetition',
  'class': 'klass',
  'performance': 'föreställning',
  'ethnic': 'etnisk',
  'cultural': 'kulturell',
  'Greek': 'grekisk',
  'Middle Eastern': 'mellanöstern',
  'hula': 'hula',
  'salsa': 'salsa',
  'merengue': 'merengue',
  'flamenco': 'flamenco',
  'belly': 'magdans',
  'swing': 'swing',

  // Technical terms
  'NaN kg': '0 kg',
  'combination': 'kombination',
  'pilates': 'pilates',
  'body': 'kropps',
  'movements': 'rörelser',
  'drumming': 'trummande',

  // Sports and activities
  'video game': 'videospel',
  'handheld controller': 'handhållen kontroller',
  'inactive': 'inaktiv',
  'motion sensing': 'rörelsekänslig',
  'using': 'använder',
  'upper body': 'överkropp',
  'total body': 'hela kroppen',
  'exergames': 'träningsspel',
  'workouts': 'träningspass',
  'virtual reality': 'virtuell verklighet',
  'fitness': 'fitness',

  // Work and occupation
  'Walk/run play': 'Gå/spring lek',
  'children': 'barn',
  'moderate': 'måttlig',
  'only active periods': 'endast aktiva perioder',
  'standing': 'stående',
  'childcare': 'barnomsorg',
  'pack boxes': 'packa lådor',
  'assemble': 'montera',
  'repair': 'reparera',
  'set up': 'ställa upp',
  'chairs': 'stolar',
  'furniture': 'möbler',
  'lifting': 'lyfta',
  'assembling': 'montera',
  'fast rate': 'snabb takt',
  'heavy work': 'tungt arbete',

  // General activities
  'Typing': 'Skriva',
  'electric': 'elektrisk',
  'manual': 'manuell',
  'computer': 'dator',
  'walking': 'promenad',
  'very slow': 'mycket långsam',
  'speed': 'hastighet',
  'not carrying': 'inte bära',
  'anything': 'någonting',
  'brisk': 'rask',
  'slowly': 'långsamt',
  'moderately': 'måttligt',
  'briskly': 'raskt',
  'objects': 'föremål',
  'pushing something': 'skjuta något',
  'for volunteer purposes': 'för volontärändamål',

  // E-bike specific
  'E-bike': 'El-cykel',
  'elassisterad': 'elassisterad',
  'electronic support': 'elektroniskt stöd',

  // Unicycling
  'Unicycling': 'Enhjuling',

  // Additional translations
  'concentric only': 'endast koncentrisk',
  'Upper body': 'Överkropp',
  'stillastående bicycle': 'stillastående cykel',
  'Airdyne': 'Airdyne',
  'arms only': 'endast armar',
  'small child': 'litet barn',
  'child weighing': 'barn som väger',
  'or more': 'eller mer',
  'sawing': 'såga',
  'hardwood': 'hårt trä',
  'planing': 'hyvla',
  'drilling wood': 'borra trä',
  'stacking wood': 'stapla ved',
  'carrying lumber': 'bära virke',
  'loading/unloading': 'lasta/lossa',
  'Digging': 'Gräva',
  'spading': 'spada',
  'filling garden': 'fylla trädgård',
  'composting': 'kompostera',
  'Weeding': 'Ogräsrensning',
  'cultivating garden': 'odla trädgård',
  'using hoe': 'använder hacka',
  'studying': 'studera',
  'including': 'inklusive',
  'reading': 'läsa',
  'writing': 'skriva',
  'lumber': 'virke',
  'involving': 'involverar',
  'workstation': 'arbetsstation',
  'desk': 'skrivbord',
  'or less': 'eller mindre',
  'less': 'mindre',
  'e.g.': 't.ex.',
  'machining': 'maskinbearbetning',
  'working sheet metal': 'arbeta med plåt',
  'machine fitter': 'maskinmontör',
  'operating lathe': 'operera svarv',
  'welding': 'svetsning',
  'talking': 'prata',
  'eating': 'äta',
  'only': 'endast',
  'rock climbing': 'klättring',
  'ascending': 'uppstigning',
  'traversing rock': 'traversera klippor',
  'low-to-måttlig': 'låg-till-måttlig',
  'difficulty': 'svårighet',
  'Machine tooling': 'Maskinbearbetning',
  'roller blading': 'rullskridsko',
  'in-line skridskoåkning': 'inlines',
  'rekreations tempo': 'rekreationstempo',
  'måttligt tempo': 'måttligt tempo',
  'snabbt tempo': 'snabbt tempo',
  'hoe': 'hacka',
  'no load': 'utan last',
  'grade': 'lutning',
  'måttlig-to-rask': 'måttlig-till-rask',
  'långsam-to-måttligt': 'långsam-till-måttlig',
  'level': 'plan',
  'firm surface': 'fast underlag',
  'very, mycket': 'mycket',
  'with a': 'med en',
  'walker': 'gånghjälp',
  'steg-to gait': 'steg-till-gång',
  'degree incline': 'graders lutning',
  'with/without': 'med/utan',
  'rifle': 'gevär',
  'måttlig-to-tung': 'måttlig-till-tung',
  'måttlig-to-rask': 'måttlig-till-rask',
  'manual labor': 'manuellt arbete',
  'maintenance': 'underhåll',
  'Climbing hills': 'Klättra backar',
  'lying down': 'liggande',
  'load': 'last',
  'very, mycket': 'mycket',
  'kneeling': 'knästående',
  'Horse grooming': 'Hästvård',
  'saddling tasks': 'sadlingsuppgifter',
  'Horse racing': 'Hästkapplöpning',
  'Horse riding': 'Ridning',
  'rifle exercises': 'gevärövningar',
  'Rifle exercises': 'Gevärövningar',
  'shooting': 'skytte',
  'lying down': 'liggande',
  'liggande down': 'liggande',
  'feeding': 'utfodra',
  'cleaning stalls': 'städa spiltor',
  'bathing': 'tvätta',
  'brushing': 'borsta',
  'clipping': 'klippa',
  'longeing': 'longera',
  'exercising horses': 'träna hästar',
  'städning stalls': 'städa spiltor',
  'exercises': 'övningar',
  'Getting ready': 'Förbereda sig',
  'bed': 'säng',
  'hauling water': 'hämta vatten',
  'fetching water': 'hämta vatten',
  'well': 'brunn',
  'stream': 'bäck',
  'animals': 'djur',
  'transportation': 'transport',
  'Farming': 'Jordbruk',
  'weight': 'vikt',
  'weights': 'vikter',
  'resistance training': 'styrketräning',
  'Resistance training': 'Styrketräning',
  'Resistance Training': 'Styrketräning',
  'weight training': 'viktträning',
  'Weight training': 'Viktträning',
  'circuit': 'cirkel',
  'reciprocol supersets': 'ömsesidiga supersets',
  'peripheral hear action': 'perifer hjärtaktivering',
  'Health club': 'Gym',
  'health club': 'gym',
  'gym/weight training': 'gym/viktträning',
  'combined in one visit': 'kombinerat i ett besök',
  'cardio-resistance': 'kardio-styrke',
  'passive': 'passiv',
  'kissing': 'kyssa',
  'hugging': 'krama',
  'Wash dishes': 'Diska',
  'wash dishes': 'diska',
  'clearing dishes': 'plocka undan disk',
  'table': 'bord',
  'wash car': 'tvätta bil',
  'clean garage': 'städa garage',
  'Serving food': 'Servera mat',
  'serving food': 'servera mat',
  'setting/städning table': 'duka/städa bord',
  'implied': 'innebär',
  'Counter terrorism': 'Kontraterrorism',
  'counter terrorism': 'kontraterrorism',
  'maneuvers': 'manövrer',
  'clearing building': 'rensa byggnad',
  'using': 'använda',
  'while': 'medan',
  'during': 'under',
  'some': 'vissa',
  'other': 'andra',
  'such as': 'såsom',
  'make': 'göra',
  'making': 'göra',
  'push': 'skjuta',
  'pushing': 'skjuta',
  'pushups': 'armhävningar',
  'pull': 'dra',
  'pulling': 'dra',
  'play': 'spela',
  'playing': 'spela',
  'walk': 'gå',
  'walking': 'gå',
  'talk': 'prata',
  'talking': 'prata',
  'work': 'arbete',
  'working': 'arbeta',
  'worker': 'arbetare',
  'worksite': 'arbetsplats',
  'workshop': 'verkstad',
  'workout': 'träningspass',
  'leaves': 'löv',
  'leave': 'lämna',
  'leaving': 'lämna',
  'keeper': 'vakt',
  'head': 'huvud',
  'room': 'rum',
  'show': 'visa',
  'ready': 'redo',
  'readying': 'förbereda',
  'stopping': 'stanna',
  'someone': 'någon',
  'something': 'något',
  'sidewalk': 'trottoar',
  'sidestroke': 'simsim',

  // Bike technical terms
  'seated': 'sittande',
  'hands on': 'händer på',
  'brake hoods': 'bromshandtag',
  'bar drops': 'droppstyren',
  'standing': 'stående',

  // Intensity and effort
  'very light': 'mycket lätt',
  'light': 'lätt',
  'moderate': 'måttlig',
  'vigorous': 'hög',
  'very vigorous': 'mycket hög',
  'high intensity': 'hög intensitet',
  'light effort': 'lätt ansträngning',
  'moderate effort': 'måttlig ansträngning',
  'vigorous effort': 'hög ansträngning',
  'high effort': 'hög ansträngning',

  // Cycling specific
  'racing': 'racing',
  'drafting': 'vinddragning',
  'not drafting': 'utan vinddragning',
  'eccentric only': 'endast excentrisk',
};

// Function to translate text
function translateText(text) {
  let translated = text;

  // Sort translations by length (longest first) to handle "Bench step" before "step"
  const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);

  // Apply all translations
  sortedTranslations.forEach(([eng, swe]) => {
    // Case-insensitive replacement with word boundaries
    // Only add word boundaries if the pattern starts/ends with word characters
    const escaped = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startsWithWord = /^\w/.test(eng);
    const endsWithWord = /\w$/.test(eng);
    const pattern = (startsWithWord ? '\\b' : '') + escaped + (endsWithWord ? '\\b' : '');
    const regex = new RegExp(pattern, 'gi');
    translated = translated.replace(regex, swe);
  });

  // Clean up multiple spaces
  translated = translated.replace(/\s+/g, ' ').trim();

  // Fix specific patterns
  translated = translated.replace(/(\d+)\s*–\s*(\d+)\s*tum/g, '$1-$2 tum');
  translated = translated.replace(/(\d+)\s*till\s*(\d+)\s*(km\/h|watt|tum)/g, '$1-$2 $3');
  translated = translated.replace(/mindre än\s*(\d+)/g, '<$1');
  translated = translated.replace(/mer än\s*(\d+)/g, '>$1');

  // Fix hyphenated intensity patterns
  translated = translated.replace(/måttlig-to-hög/g, 'måttlig-till-hög');
  translated = translated.replace(/måttlig-to-rask/g, 'måttlig-till-rask');
  translated = translated.replace(/lätt-to-måttlig/g, 'lätt-till-måttlig');
  translated = translated.replace(/lätt-to- måttlig/g, 'lätt-till-måttlig');
  translated = translated.replace(/låg-to-måttlig/g, 'låg-till-måttlig');

  // Fix duplicate words
  translated = translated.replace(/träning träning/g, 'träning');
  translated = translated.replace(/\s+/g, ' ').trim();

  return translated;
}

// Translate all activities
console.log('Översätter alla aktiviteter...');
const fullyTranslated = data.map(activity => ({
  ...activity,
  activity: translateText(activity.activity)
}));

// Find remaining English words
const englishPattern = /\b(or|and|with|without|to|from|in|on|at|by|of|the|very|only|less|than|more)\b/i;
const stillEnglish = fullyTranslated.filter(a =>
  englishPattern.test(a.activity) &&
  !a.activity.includes('Taylor Code')
);

console.log(`\nAktiviteter kvar med engelska: ${stillEnglish.length} (${(stillEnglish.length/fullyTranslated.length*100).toFixed(1)}%)`);

if (stillEnglish.length > 0) {
  console.log('\nExempel på kvarvarande:');
  stillEnglish.slice(0, 10).forEach(a => {
    console.log(`  [${a.id}] ${a.activity}`);
  });
}

// Save final version
fs.writeFileSync('met-activities-final.json', JSON.stringify(fullyTranslated, null, 2));
console.log('\n✓ Sparad till met-activities-final.json');

// Generate TypeScript
const tsLines = fullyTranslated.map(item => {
  const escapedActivity = item.activity.replace(/'/g, "\\'");
  return `  { id: '${item.id}', category: '${item.category}', activity: '${escapedActivity}', met: ${item.met}, intensity: '${item.intensity}' },`;
});

fs.writeFileSync('met-activities-final.ts', tsLines.join('\n'));
console.log('✓ TypeScript-kod sparad till met-activities-final.ts');

console.log(`\n✅ Totalt: ${fullyTranslated.length} aktiviteter översatta`);
