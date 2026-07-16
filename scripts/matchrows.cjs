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
  const oh = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = oh.includes('FlateDecode');
  const isFont = oh.includes('/FontFile') || oh.includes('CIDFont') || oh.includes('/ToUnicode');
  const isImage = oh.includes('/Image');
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

// Extract positioned text from all streams
const allEntries = [];
for (let si = 0; si < allStreams.length; si++) {
  const stream = allStreams[si];
  const lines = stream.split('\n');
  let inBT = false, curX = 0, curY = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    const tmMatch = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) { curX = parseFloat(tmMatch[1]); curY = parseFloat(tmMatch[2]); continue; }

    // Find [...] TJ anywhere in line (may have prefix like "-0.009 Tc")
    const tjIdx = t.lastIndexOf('] TJ');
    if (tjIdx !== -1) {
      // Find matching [
      let start = tjIdx - 1;
      while (start >= 0 && t[start] !== '[') start--;
      if (start >= 0) {
        const tjContent = t.slice(start + 1, tjIdx);
        const text = decodeStr(parseTJ(tjContent));
        if (text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si });
      }
      continue;
    }
    const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
    if (tjS) {
      const text = decodeStr(tjS[1]);
      if (text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si });
    }
  }
}

console.log('Total entries:', allEntries.length);

// Build code→desc map
const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;
const pdfMap = {};

// Group by (si, y-bucket)
const buckets = {};
for (const e of allEntries) {
  const key = `${e.si}_${Math.round(e.y / 3) * 3}`;
  if (!buckets[key]) buckets[key] = [];
  buckets[key].push(e);
}

for (const bucket of Object.values(buckets)) {
  const sorted = bucket.sort((a, b) => a.x - b.x);
  const codeCell = sorted.find(c => codeRe.test(c.text));
  const descCell = sorted.find(c => c.x >= 240 && !codeRe.test(c.text) && !metRe.test(c.text) && c.text.length > 3);
  if (codeCell && descCell) {
    // Only record if we don't already have this code (first occurrence = first page)
    if (!pdfMap[codeCell.text]) {
      pdfMap[codeCell.text] = descCell.text;
    }
  }
}

console.log('PDF activities mapped:', Object.keys(pdfMap).length);

// Load EN locale
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
const enAct = enLocale.activities;
const norm = s => s.replace(/\s+/g, ' ').trim();

let matches = 0;
const mismatches = [];
const notInPDF = [];

for (const [code, enDesc] of Object.entries(enAct)) {
  const pdfDesc = pdfMap[code];
  if (!pdfDesc) { notInPDF.push(code); continue; }
  if (norm(enDesc) === norm(pdfDesc)) {
    matches++;
  } else {
    mismatches.push({ code, pdf: norm(pdfDesc), en: norm(enDesc) });
  }
}

console.log('\n=== RESULT ===');
console.log('Exact matches:', matches);
console.log('Mismatches:', mismatches.length);
console.log('Not in PDF extract:', notInPDF.length);

if (mismatches.length > 0) {
  console.log('\n=== ALL MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.code}:`);
    console.log(`  PDF: "${m.pdf}"`);
    console.log(`  EN:  "${m.en}"`);
  });
}

if (notInPDF.length > 0 && notInPDF.length < 100) {
  console.log('\nCodes not extracted from PDF:', notInPDF.join(', '));
}

fs.writeFileSync('scripts/pdf_map.json', JSON.stringify(pdfMap, null, 2));
