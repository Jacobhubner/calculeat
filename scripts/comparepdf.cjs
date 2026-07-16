const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');

function parseTJ(tjStr) {
  let result = '';
  let i = 0;
  while (i < tjStr.length) {
    if (tjStr[i] === '(') {
      let j = i + 1;
      while (j < tjStr.length) {
        if (tjStr[j] === '\\') { j += 2; continue; }
        if (tjStr[j] === ')') break;
        j++;
      }
      result += tjStr.slice(i + 1, j);
      i = j + 1;
    } else {
      i++;
    }
  }
  return result;
}

function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

// Decompress ALL FlateDecode streams
const allStreams = [];
let pos = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const objHeader = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = objHeader.includes('FlateDecode');
  const isFont = objHeader.includes('/FontFile') || objHeader.includes('CIDFont') || objHeader.includes('/ToUnicode');
  const isImage = objHeader.includes('/Image') || objHeader.includes('Subtype/Im') || objHeader.includes('Subtype /Im');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  const data = buf.slice(ds, es);
  if (isFlate && !isFont && !isImage && data.length > 10) {
    try {
      const dec = zlib.inflateSync(data).toString('binary');
      allStreams.push(dec);
    } catch(e) {}
  }
  pos = es + 9;
}

// Extract all text blocks from all streams
const allTexts = [];
for (const stream of allStreams) {
  const lines = stream.split('\n');
  let inBlock = false;
  let lineBuffer = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBlock = true; lineBuffer = []; continue; }
    if (t === 'ET') {
      inBlock = false;
      const texts = [];
      for (const l of lineBuffer) {
        const tjM = l.match(/^\[([^\]]*)\]\s*TJ$/);
        const tjS = l.match(/^\(([^)]*)\)\s*Tj$/);
        if (tjM) { const tx = decodeStr(parseTJ(tjM[1])); if (tx.trim()) texts.push(tx); }
        else if (tjS) { const tx = decodeStr(tjS[1]); if (tx.trim()) texts.push(tx); }
      }
      if (texts.length > 0) {
        const combined = texts.join('').trim();
        if (combined) allTexts.push(combined);
      }
      lineBuffer = [];
      continue;
    }
    if (inBlock) lineBuffer.push(t);
  }
}

// Build activity code→description map from PDF
// Pattern: code is 5 digits, description follows
// From the data we see: MET value block, then description block
// Let's identify description blocks: longer strings containing commas or specific words
const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

// Group into rows: category, code, met, description
const pdfActivities = {};
let i = 0;
while (i < allTexts.length) {
  // Look for a 5-digit code
  if (codeRe.test(allTexts[i])) {
    const code = allTexts[i];
    // Next should be MET value, then description
    if (i+1 < allTexts.length && metRe.test(allTexts[i+1])) {
      if (i+2 < allTexts.length) {
        const desc = allTexts[i+2];
        // Description should not be a code, MET value, or category-only string
        if (!codeRe.test(desc) && !metRe.test(desc) && desc.length > 3) {
          pdfActivities[code] = desc;
          i += 3;
          continue;
        }
      }
    }
    // Alternative: MET before code
    if (i > 0 && metRe.test(allTexts[i-1]) && i+1 < allTexts.length) {
      const desc = allTexts[i+1];
      if (!codeRe.test(desc) && !metRe.test(desc) && desc.length > 3) {
        pdfActivities[code] = desc;
        i += 2;
        continue;
      }
    }
  }
  i++;
}

console.log('PDF activities extracted:', Object.keys(pdfActivities).length);

// Load our EN locale
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
const enActivities = enLocale.activities;

// Compare
let matches = 0, mismatches = [], missing = [];
for (const [code, pdfDesc] of Object.entries(pdfActivities)) {
  const enDesc = enActivities[code];
  if (!enDesc) { missing.push({ code, pdfDesc }); continue; }
  // Normalize: trim, collapse spaces
  const norm = s => s.replace(/\s+/g, ' ').replace(/  +/g, ' ').trim();
  if (norm(enDesc) === norm(pdfDesc)) {
    matches++;
  } else {
    mismatches.push({ code, pdfDesc: norm(pdfDesc), enDesc: norm(enDesc) });
  }
}

console.log('\nMatches:', matches);
console.log('Mismatches:', mismatches.length);
console.log('Missing from en/met.json:', missing.length);

if (mismatches.length > 0) {
  console.log('\n=== MISMATCHES (PDF original vs our EN locale) ===');
  mismatches.forEach(m => {
    console.log(`\nCode: ${m.code}`);
    console.log(`  PDF:    ${m.pdfDesc}`);
    console.log(`  Our EN: ${m.enDesc}`);
  });
}
if (missing.length > 0) {
  console.log('\n=== MISSING ===');
  missing.forEach(m => console.log(`${m.code}: ${m.pdfDesc}`));
}

// Save comparison result
fs.writeFileSync('scripts/pdf_activities.json', JSON.stringify(pdfActivities, null, 2));
console.log('\nSaved', Object.keys(pdfActivities).length, 'PDF activities to scripts/pdf_activities.json');
