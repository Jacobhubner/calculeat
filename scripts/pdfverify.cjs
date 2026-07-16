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

// Extract all streams, track page groups
// Each page's streams share the same coordinate space
const allStreams = [];
let pos = 0;
let streamIdx = 0;
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
      allStreams.push({ idx: streamIdx, data: dec });
    } catch (e) {}
  }
  pos = es + 9;
  streamIdx++;
}

console.log('Total streams:', allStreams.length);

// Extract all text entries with positions
// The PDF is tagged — each cell is a separate BT/ET block
// We collect ALL entries across ALL streams and group by y-coordinate
const allEntries = [];

for (const { idx, data } of allStreams) {
  const lines = data.split(/\r?\n/);
  let inBT = false;
  let curX = 0, curY = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    // Tm sets position
    const tmMatch = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) {
      curX = parseFloat(tmMatch[1]);
      curY = parseFloat(tmMatch[2]);
      continue;
    }

    // Find ] TJ anywhere (handles "Tc[(...)  ] TJ" and "[(...)  ] TJ")
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
        if (text.trim()) {
          allEntries.push({ y: curY, x: curX, text: text.trim(), si: idx });
        }
      }
      continue;
    }

    // Simple Tj
    const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
    if (tjS) {
      const text = decodeStr(tjS[1]);
      if (text.trim()) allEntries.push({ y: curY, x: curX, text: text.trim(), si: idx });
    }
  }
}

console.log('Total text entries:', allEntries.length);

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

// Build pdfMap: group by (si, round(y/1.5)*1.5) to match same-row cells
// Since each cell is in its own BT/ET but on the same page stream, same Y means same row
const pdfMap = {};

// Group by stream index and y bucket
const buckets = new Map();
for (const e of allEntries) {
  // Use 2-unit bucket to group entries on same visual row
  const key = `${e.si}_${Math.round(e.y * 2) / 2}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(e);
}

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

if (notInPDF.length > 0 && notInPDF.length < 20) {
  console.log('\nCodes not in PDF:', notInPDF.join(', '));
}

fs.writeFileSync('scripts/pdf_map.json', JSON.stringify(pdfMap, null, 2));
console.log('\nSaved scripts/pdf_map.json');
