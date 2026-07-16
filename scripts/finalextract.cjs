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

// Extract all positioned text - handle inline Tc before TJ
const allEntries = [];
for (let si = 0; si < allStreams.length; si++) {
  const stream = allStreams[si];
  const lines = stream.split('\n');
  let inBT = false;
  let curX = 0, curY = 0;
  let pendingTm = false;

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    // Tm: sets position
    const tmMatch = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) { curX = parseFloat(tmMatch[1]); curY = parseFloat(tmMatch[2]); continue; }

    // TJ: may have prefix like "-0.00972 Tc[(01010)] TJ"
    // or just "[(text)] TJ"
    // Find the [...] TJ pattern anywhere in the line
    const tjIdx = t.lastIndexOf('] TJ');
    if (tjIdx !== -1) {
      // Find the matching opening [
      let start = tjIdx - 1;
      let depth = 0;
      while (start >= 0) {
        if (t[start] === ']') depth++;
        if (t[start] === '[') {
          if (depth === 0) break;
          depth--;
        }
        start--;
      }
      if (start >= 0) {
        const tjContent = t.slice(start + 1, tjIdx);
        const text = decodeStr(parseTJ(tjContent));
        if (text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si });
      }
      continue;
    }

    // Tj (simple string)
    const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
    if (tjS) {
      const text = decodeStr(tjS[1]);
      if (text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si });
    }
  }
}

console.log('Total text entries:', allEntries.length);

// Check if codes now appear
const codes = allEntries.filter(e => /^\d{5}$/.test(e.text));
console.log('5-digit codes found:', codes.length);
console.log('First 10 codes:', codes.slice(0, 10).map(e => `${e.text} (y=${e.y.toFixed(1)}, x=${e.x.toFixed(1)}, si=${e.si})`));

// Build code→description map
// Sort all entries: by stream, then by y desc, then x asc
allEntries.sort((a, b) => {
  if (a.si !== b.si) return a.si - b.si;
  if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
  return a.x - b.x;
});

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;
const pdfMap = {};

// Group by stream+y to find rows
for (let si = 0; si < allStreams.length; si++) {
  const streamEntries = allEntries.filter(e => e.si === si);
  // Group by y-proximity (within 3 units)
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
    const codeCell = cells.find(c => codeRe.test(c.text));
    const descCell = cells.find(c => c.x >= 240 && !codeRe.test(c.text) && !metRe.test(c.text) && c.text.length > 3);
    if (codeCell && descCell) {
      pdfMap[codeCell.text] = descCell.text;
    }
  }
}

console.log('\nPDF activities mapped:', Object.keys(pdfMap).length);
console.log('First 10:', Object.entries(pdfMap).slice(0, 10).map(([c,d]) => `${c}: ${d}`));

// Load EN locale and compare
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

console.log('\n=== COMPARISON RESULT ===');
console.log('Exact matches:', matches);
console.log('Mismatches:', mismatches.length);
console.log('EN codes not in PDF:', notInPDF.length);

if (mismatches.length > 0) {
  console.log('\n=== ALL MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.code}:`);
    console.log(`  PDF: ${m.pdf}`);
    console.log(`  EN:  ${m.en}`);
  });
}

fs.writeFileSync('scripts/pdf_map.json', JSON.stringify(pdfMap, null, 2));
console.log('\nSaved pdf_map.json');
