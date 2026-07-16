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
    } else { i++; }
  }
  return result;
}

function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

const allStreams = [];
let pos = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const objHeader = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = objHeader.includes('FlateDecode');
  const isFont = objHeader.includes('/FontFile') || objHeader.includes('CIDFont') || objHeader.includes('/ToUnicode');
  const isImage = objHeader.includes('/Image');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  const data = buf.slice(ds, es);
  if (isFlate && !isFont && !isImage && data.length > 10) {
    try { allStreams.push(zlib.inflateSync(data).toString('binary')); } catch(e) {}
  }
  pos = es + 9;
}

// Extract all positioned text
const allEntries = [];
for (let si = 0; si < allStreams.length; si++) {
  const stream = allStreams[si];
  const lines = stream.split('\n');
  let inBT = false;
  let curX = 0, curY = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    const tmMatch = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) { curX = parseFloat(tmMatch[1]); curY = parseFloat(tmMatch[2]); continue; }

    const tjM = t.match(/^\[([^\]]*)\]\s*TJ$/);
    const tjS = t.match(/^\(([^)]*)\)\s*Tj$/);
    let text = null;
    if (tjM) text = decodeStr(parseTJ(tjM[1]));
    else if (tjS) text = decodeStr(tjS[1]);
    if (text && text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si });
  }
}

// Sort by stream index, then y desc (top first), then x asc (left first)
allEntries.sort((a, b) => {
  if (a.si !== b.si) return a.si - b.si;
  if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
  return a.x - b.x;
});

// Now group entries into rows by y-position proximity
// Table columns (approximate x positions):
// Major Heading: x~48-100
// Activity Code: x~129-160
// MET Value: x~195-215
// Activity Description: x~248+

const CODE_X = 130;  // x where codes appear
const DESC_X = 240;  // x where descriptions appear
const MET_X = 190;   // x where MET values appear

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

// Build lookup: code -> description from PDF
const pdfMap = {};

// Group by stream and y-value, find rows where x~144 has a 5-digit code
// and x~248 has the description
for (let si = 0; si < allStreams.length; si++) {
  const streamEntries = allEntries.filter(e => e.si === si);

  // Group by y (within 3 units)
  const rows = [];
  for (const entry of streamEntries) {
    let found = false;
    for (const row of rows) {
      if (Math.abs(row.y - entry.y) <= 3) {
        row.cells.push(entry);
        found = true;
        break;
      }
    }
    if (!found) rows.push({ y: entry.y, cells: [entry] });
  }

  for (const row of rows) {
    const cells = row.cells.sort((a, b) => a.x - b.x);
    // Find code cell (x between 120-170, 5 digits)
    const codeCell = cells.find(c => c.x >= 120 && c.x <= 170 && codeRe.test(c.text));
    // Find description cell (x >= 240)
    const descCell = cells.find(c => c.x >= 240);
    if (codeCell && descCell && descCell.text.length > 3 && !metRe.test(descCell.text) && !codeRe.test(descCell.text)) {
      pdfMap[codeCell.text] = descCell.text;
    }
  }
}

console.log('PDF activities found:', Object.keys(pdfMap).length);

// Show first 20
const entries = Object.entries(pdfMap).slice(0, 20);
entries.forEach(([code, desc]) => console.log(`${code}: ${desc}`));

// Load our EN locale
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
const enActivities = enLocale.activities;

const norm = s => s.replace(/\s+/g, ' ').replace(/  +/g, ' ').trim();

let matches = 0;
const mismatches = [];
const notInPDF = [];

for (const [code, enDesc] of Object.entries(enActivities)) {
  const pdfDesc = pdfMap[code];
  if (!pdfDesc) { notInPDF.push(code); continue; }
  if (norm(enDesc) === norm(pdfDesc)) {
    matches++;
  } else {
    mismatches.push({ code, pdf: norm(pdfDesc), en: norm(enDesc) });
  }
}

console.log('\n--- COMPARISON ---');
console.log('Matches:', matches);
console.log('Mismatches:', mismatches.length);
console.log('EN codes not found in PDF:', notInPDF.length);

if (mismatches.length > 0) {
  console.log('\n=== MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.code}:`);
    console.log(`  PDF: ${m.pdf}`);
    console.log(`  EN:  ${m.en}`);
  });
}

// Save PDF map for reference
fs.writeFileSync('scripts/pdf_map.json', JSON.stringify(pdfMap, null, 2));
