const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

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

function extractEntries(dec, streamId) {
  const entries = [];
  const lines = dec.split(/\r?\n/);
  let inBT = false;
  let curX = 0, curY = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    const tmMatch = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) {
      curX = parseFloat(tmMatch[1]);
      curY = parseFloat(tmMatch[2]);
      continue;
    }

    const tjIdx = t.lastIndexOf('] TJ');
    if (tjIdx !== -1) {
      let start = tjIdx - 1;
      let depth = 0;
      while (start >= 0) {
        if (t[start] === ']') depth++;
        else if (t[start] === '[') {
          if (depth === 0) break;
          depth--;
        }
        start--;
      }
      if (start >= 0) {
        const tjContent = t.slice(start + 1, tjIdx);
        const text = decodeStr(parseTJ(tjContent));
        if (text.trim()) entries.push({ y: curY, x: curX, text: text.trim(), si: streamId });
      }
      continue;
    }

    const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
    if (tjS) {
      const text = decodeStr(tjS[1]);
      if (text.trim()) entries.push({ y: curY, x: curX, text: text.trim(), si: streamId });
    }
  }
  return entries;
}

// Parse main xref at 358689 (165 objects from offset table)
const entryStart = 358689;
const offsets = [];
for (let i = 0; i < 10214; i++) {
  const lineStart = entryStart + i * 20;
  const line = str.slice(lineStart, lineStart + 20);
  const offset = parseInt(line.slice(0, 10));
  const flag = line[17];
  if (flag === 'n' && offset > 0) offsets.push({ obj: i, offset });
}

// Also scan linearly for all FlateDecode streams (catches early pages streams 2-9)
const allEntries = [];
let streamCount = 0;

// First: scan linearly for page streams at beginning of file (obj 0-9 at small offsets)
let pos = 0;
let si = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const oh = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = oh.includes('FlateDecode');
  const isFont = oh.includes('/FontFile') || oh.includes('CIDFont') || oh.includes('/ToUnicode');
  const isImage = oh.includes('/Image');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  const data = buf.slice(ds, es);
  if (isFlate && !isFont && !isImage && data.length > 10) {
    try {
      const dec = zlib.inflateSync(data).toString('binary');
      if (dec.includes('BT') && (dec.match(/\(\d{5}\)/g) || []).length > 0) {
        const entries = extractEntries(dec, si);
        allEntries.push(...entries);
        streamCount++;
      }
    } catch (e) {}
  }
  pos = es + 9;
  si++;
}

// Second: scan via xref offsets for objects not found linearly
const processedRanges = new Set();
for (const { obj, offset } of offsets) {
  // Skip if already processed by linear scan
  const chunk = str.slice(offset, Math.min(offset + 3000, str.length));
  if (!chunk.includes('stream')) continue;
  const smIdx = chunk.indexOf('stream');
  const header = chunk.slice(0, smIdx);
  if (header.includes('/FontFile') || header.includes('CIDFont') || header.includes('/ToUnicode') || header.includes('/Image')) continue;
  if (!header.includes('FlateDecode')) continue;

  let ds = offset + smIdx + 6;
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;

  const esPos = str.indexOf('endstream', ds);
  if (esPos === -1) continue;

  const rangeKey = `${ds}-${esPos}`;
  if (processedRanges.has(rangeKey)) continue;
  processedRanges.add(rangeKey);

  try {
    const dec = zlib.inflateSync(buf.slice(ds, esPos)).toString('binary');
    if (!dec.includes('BT')) continue;
    const codes = (dec.match(/\(\d{5}\)/g) || []).filter(c => parseInt(c.slice(1, -1)) >= 1000);
    if (codes.length === 0) continue;

    const entries = extractEntries(dec, obj + 10000);
    allEntries.push(...entries);
    streamCount++;
  } catch (e) {}
}

console.log('Content streams processed:', streamCount);
console.log('Total text entries:', allEntries.length);

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

// Group by (si, rounded_y) to find rows
const buckets = new Map();
for (const e of allEntries) {
  const key = `${e.si}_${Math.round(e.y * 2) / 2}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(e);
}

const pdfMap = {};
for (const bucket of buckets.values()) {
  const sorted = bucket.sort((a, b) => a.x - b.x);
  const codeCell = sorted.find(c => codeRe.test(c.text));
  const descCell = sorted.find(c => c.x >= 240 && !codeRe.test(c.text) && !metRe.test(c.text) && c.text.length > 2);
  if (codeCell && descCell) {
    if (!pdfMap[codeCell.text]) {
      pdfMap[codeCell.text] = descCell.text;
    }
  }
}

console.log('PDF activities mapped:', Object.keys(pdfMap).length);

// Compare with EN locale
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

if (notInPDF.length > 0 && notInPDF.length < 50) {
  console.log('\nCodes not in PDF extract:', notInPDF.join(', '));
}

fs.writeFileSync('scripts/pdf_map.json', JSON.stringify(pdfMap, null, 2));
console.log('\nSaved scripts/pdf_map.json');
