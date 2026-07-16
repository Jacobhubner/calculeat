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

// pageGroup is assigned externally to group streams from the same physical page
function extractEntries(dec, streamId, pageGroup) {
  const entries = [];
  // Normalize: when ']' ends a line and next non-empty line starts with 'TJ', join them
  const normalized = dec.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
  const lines = normalized.split(/\r?\n/);
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
        if (text.trim()) entries.push({ y: curY, x: curX, text: text.trim(), si: streamId, pg: pageGroup });
      }
      continue;
    }

    const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
    if (tjS) {
      const text = decodeStr(tjS[1]);
      if (text.trim()) entries.push({ y: curY, x: curX, text: text.trim(), si: streamId, pg: pageGroup });
    }
  }
  return entries;
}

// Collect all candidate streams with their byte ranges, then assign page groups
// based on byte proximity (streams within 100 bytes of each other share a page group)
const streamInfos = []; // { ds, es, dec }
const processedRanges = new Set();

function collectStream(ds, es) {
  const key = `${ds}-${es}`;
  if (processedRanges.has(key)) return;
  processedRanges.add(key);
  try {
    const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
    if (!dec.includes('BT')) return;
    const codes = (dec.match(/\(\d{5}\)/g) || []).filter(c => parseInt(c.slice(1, -1)) >= 1000);
    if (codes.length === 0) return;
    streamInfos.push({ ds, es, dec });
  } catch (e) {}
}

// Linear scan
let pos = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const objPos = str.lastIndexOf(' obj', sm);
  const lookStart = objPos > 0 ? objPos : Math.max(0, sm - 800);
  const oh = buf.slice(lookStart, sm).toString('binary');
  const isFlate = oh.includes('FlateDecode');
  const isFont = oh.includes('/FontFile') || oh.includes('CIDFont') || oh.includes('/ToUnicode');
  const isImage = oh.includes('/Image');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  if (isFlate && !isFont && !isImage) collectStream(ds, es);
  pos = es + 9;
}

// XRef-based scan
const entryStart = 358689;
for (let i = 0; i < 10214; i++) {
  const lineStart = entryStart + i * 20;
  const line = str.slice(lineStart, lineStart + 20);
  const offset = parseInt(line.slice(0, 10));
  const flag = line[17];
  if (flag !== 'n' || offset <= 0) continue;
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
  collectStream(ds, esPos);
}

// Sort streams by byte position
streamInfos.sort((a, b) => a.ds - b.ds);

// Group streams into pages (streams within 200 bytes of each other share a page)
// Then stitch adjacent streams in the same page group together before extracting
// This handles cross-stream TJ splits
const pages = []; // [ [stream1, stream2, ...], [...], ... ]
let lastEs2 = -1;
for (const info of streamInfos) {
  if (lastEs2 >= 0 && info.ds - lastEs2 <= 200) {
    pages[pages.length - 1].push(info);
  } else {
    pages.push([info]);
  }
  lastEs2 = info.es;
}

const allEntries = [];
for (let pg = 0; pg < pages.length; pg++) {
  const pageStreams = pages[pg];
  // Stitch: concatenate decoded content with a newline separator
  const stitched = pageStreams.map(s => s.dec).join('\n');
  const entries = extractEntries(stitched, pg * 100, pg);
  allEntries.push(...entries);
}

console.log('Total text entries:', allEntries.length);

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

// Group streams into pages: consecutive streams with overlapping Y ranges share a page.
// Sort allEntries by si then by position to assign page groups.
// Strategy: assign a page ID based on when Y resets (a new stream starting at high Y
// after processing low Y means a new page). Use stream index ranges.

// Simpler approach: assign page by grouping consecutive si values that have overlapping Y ranges.
// Since pages are ~27-600 Y range and all streams on same page share this range,
// consecutive streams with max(Y) > 400 likely belong to the same page until a reset.

// Group entries by page group and match codes to descriptions within the same page
const byPage = new Map();
for (const e of allEntries) {
  if (!byPage.has(e.pg)) byPage.set(e.pg, []);
  byPage.get(e.pg).push(e);
}

const pdfMap = {};

for (const [pg, pageEntries] of byPage) {
  const codeEntries = pageEntries.filter(e => codeRe.test(e.text));
  const descEntries = pageEntries.filter(e =>
    e.x >= 240 && !codeRe.test(e.text) && !metRe.test(e.text) && e.text.length > 1
  );

  for (const codeEntry of codeEntries) {
    if (pdfMap[codeEntry.text]) continue;
    const targetY = codeEntry.y;

    // Find all desc entries within 2 units in Y
    const rowDescs = descEntries.filter(e => Math.abs(e.y - targetY) <= 2);
    if (rowDescs.length === 0) continue;

    rowDescs.sort((a, b) => a.x - b.x);
    const fullDesc = rowDescs.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    if (fullDesc.length > 2) {
      pdfMap[codeEntry.text] = fullDesc;
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
