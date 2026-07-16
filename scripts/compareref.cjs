// Compare EN locale against reference text file (tab-separated)
const fs = require('fs');

// Read reference file - try UTF-16 LE (Windows Notepad default), fallback to UTF-8
let raw;
const buf = fs.readFileSync('C:/Users/jahub/Desktop/Ny(tt) Textdokument.txt');
// Check for BOM
if (buf[0] === 0xFF && buf[1] === 0xFE) {
  raw = buf.toString('utf16le');
} else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  raw = buf.toString('utf8').slice(1); // strip BOM
} else {
  raw = buf.toString('utf8');
}

const lines = raw.split(/\r?\n/);
const refMap = {};
let skipped = 0;

for (const line of lines) {
  const parts = line.split('\t');
  if (parts.length < 4) { skipped++; continue; }
  const code = parts[1].trim();
  const desc = parts[3].trim().replace(/\t$/, '').trimEnd();
  if (!/^\d{5}$/.test(code)) { skipped++; continue; }
  refMap[code] = desc;
}

console.log('Reference entries parsed:', Object.keys(refMap).length);
console.log('Lines skipped (header/empty):', skipped);

const en = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
const enAct = en.activities;

console.log('EN locale entries:', Object.keys(enAct).length);

// Compare
const matches = [];
const diffs = [];
const onlyInRef = [];
const onlyInEN = [];

for (const [code, refDesc] of Object.entries(refMap)) {
  if (!enAct[code]) { onlyInRef.push(code); continue; }
  if (refDesc === enAct[code]) {
    matches.push(code);
  } else {
    diffs.push({ code, ref: refDesc, en: enAct[code] });
  }
}

for (const code of Object.keys(enAct)) {
  if (!refMap[code]) onlyInEN.push(code);
}

console.log('\n=== RESULT ===');
console.log('Exact matches:', matches.length);
console.log('Differences:', diffs.length);
console.log('Only in reference (not in EN):', onlyInRef.length);
console.log('Only in EN (not in reference):', onlyInEN.length);

if (diffs.length > 0) {
  console.log('\n=== DIFFERENCES ===');
  for (const d of diffs) {
    console.log('\n' + d.code + ':');
    console.log('  REF: ' + d.ref);
    console.log('  EN:  ' + d.en);
    // Show first differing byte
    for (let i = 0; i < Math.max(d.ref.length, d.en.length); i++) {
      if (d.ref[i] !== d.en[i]) {
        console.log('  First diff at pos ' + i + ': REF=U+' + (d.ref.codePointAt(i)||0).toString(16).padStart(4,'0') + ' EN=U+' + (d.en.codePointAt(i)||0).toString(16).padStart(4,'0'));
        break;
      }
    }
  }
}

if (onlyInRef.length > 0) console.log('\nOnly in reference:', onlyInRef.join(', '));
if (onlyInEN.length > 0) console.log('Only in EN:', onlyInEN.join(', '));
