const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

// ── ToUnicode CMap decoder ──────────────────────────────────────────────────
function parseToUnicodeCMap(cmapText) {
  const map = new Map();

  // bfchar: <src> <dst>
  const bfcharBlocks = cmapText.match(/\d+ beginbfchar([\s\S]*?)endbfchar/g) || [];
  for (const block of bfcharBlocks) {
    const pairs = block.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const pair of pairs) {
      const m = pair.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (m) map.set(parseInt(m[1], 16), String.fromCodePoint(parseInt(m[2], 16)));
    }
  }

  // bfrange: <start> <end> <dstStart>  OR  <start> <end> [<d1> <d2> ...]
  const bfrangeBlocks = cmapText.match(/\d+ beginbfrange([\s\S]*?)endbfrange/g) || [];
  for (const block of bfrangeBlocks) {
    const lines = block.split('\n');
    for (const line of lines) {
      // Array form: <start> <end> [<u1> <u2> ...]
      const arrMatch = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]+)\]/);
      if (arrMatch) {
        const start = parseInt(arrMatch[1], 16);
        const end = parseInt(arrMatch[2], 16);
        const uStrs = arrMatch[3].match(/<([0-9A-Fa-f]+)>/g) || [];
        for (let i = start; i <= end && i - start < uStrs.length; i++) {
          const u = parseInt(uStrs[i - start].slice(1, -1), 16);
          map.set(i, String.fromCodePoint(u));
        }
        continue;
      }
      // Scalar form: <start> <end> <dstStart>
      const rngMatch = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (rngMatch) {
        const start = parseInt(rngMatch[1], 16);
        const end = parseInt(rngMatch[2], 16);
        const dstStart = parseInt(rngMatch[3], 16);
        for (let i = start; i <= end; i++) {
          map.set(i, String.fromCodePoint(dstStart + (i - start)));
        }
      }
    }
  }

  return map;
}

function decodeHexGlyphs(hexStr, cmap) {
  // hexStr is like "0004011E018C017D010F015D011003550003..."
  // Each glyph ID is 4 hex digits (2 bytes)
  let result = '';
  for (let i = 0; i + 3 < hexStr.length; i += 4) {
    const gid = parseInt(hexStr.slice(i, i + 4), 16);
    result += cmap.get(gid) || '';
  }
  return result;
}

// Load the ToUnicode CMap for font F3 (obj 56, offset 223109)
function loadCMap(objOffset) {
  const chunk = str.slice(objOffset, objOffset + 1000);
  const smIdx = chunk.indexOf('stream');
  if (smIdx === -1) return new Map();
  let ds = objOffset + smIdx + 6;
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = str.indexOf('endstream', ds);
  try {
    const dec = zlib.inflateSync(buf.slice(ds, es)).toString('ascii');
    return parseToUnicodeCMap(dec);
  } catch (e) { return new Map(); }
}

const f3CMap = loadCMap(223109);
console.log('F3 CMap entries:', f3CMap.size);

// ── PDF text extraction ────────────────────────────────────────────────────
function parseTJ(tjStr, cmap) {
  let result = '';
  let i = 0;
  while (i < tjStr.length) {
    if (tjStr[i] === '(') {
      // ASCII string literal
      let j = i + 1;
      while (j < tjStr.length) {
        if (tjStr[j] === '\\') { j += 2; continue; }
        if (tjStr[j] === ')') break;
        j++;
      }
      result += tjStr.slice(i + 1, j);
      i = j + 1;
    } else if (tjStr[i] === '<') {
      // Hex string — decode via CMap if provided
      let j = i + 1;
      while (j < tjStr.length && tjStr[j] !== '>') j++;
      const hexStr = tjStr.slice(i + 1, j);
      if (cmap) {
        result += decodeHexGlyphs(hexStr, cmap);
      }
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

function extractEntries(dec, streamId, pageGroup) {
  const entries = [];
  const normalized = dec.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
  const lines = normalized.split(/\r?\n/);
  let inBT = false;
  let curX = 0, curY = 0;
  let curFont = 'F2'; // default font

  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    // Track font changes: "/F3 9.96 Tf"
    const tfMatch = t.match(/\/(F\d+)\s+[\d.]+\s+Tf$/);
    if (tfMatch) { curFont = tfMatch[1]; continue; }

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
        // Use CMap for F3, null for F2 (ASCII)
        const cmap = curFont === 'F3' ? f3CMap : null;
        const rawText = parseTJ(tjContent, cmap);
        const text = decodeStr(rawText);
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

// ── Stream collection ──────────────────────────────────────────────────────
const streamInfos = [];
const processedRanges = new Set();

function collectStream(ds, es) {
  const key = `${ds}-${es}`;
  if (processedRanges.has(key)) return;
  processedRanges.add(key);
  try {
    const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
    if (!dec.includes('BT')) return;
    const codes = (dec.match(/\(\d{5}\)/g) || []).filter(c => parseInt(c.slice(1, -1)) >= 1000);
    const hexCodes = (dec.match(/<[0-9A-Fa-f]{4,}>/g) || []);
    if (codes.length === 0 && hexCodes.length === 0) return;
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

// XRef scan
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

// Sort and group into pages
streamInfos.sort((a, b) => a.ds - b.ds);
const pages = [];
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
  const stitched = pages[pg].map(s => s.dec).join('\n');
  const entries = extractEntries(stitched, pg * 100, pg);
  allEntries.push(...entries);
}

console.log('Total text entries:', allEntries.length);

// ── Code-to-description matching ──────────────────────────────────────────
const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;

const byPage = new Map();
for (const e of allEntries) {
  if (!byPage.has(e.pg)) byPage.set(e.pg, []);
  byPage.get(e.pg).push(e);
}

const pdfMap = {};
for (const pageEntries of byPage.values()) {
  const codeEntries = pageEntries.filter(e => codeRe.test(e.text));
  const descEntries = pageEntries.filter(e =>
    e.x >= 240 && !codeRe.test(e.text) && !metRe.test(e.text) && e.text.length > 1
  );

  for (const codeEntry of codeEntries) {
    if (pdfMap[codeEntry.text]) continue;
    const cy = codeEntry.y;
    // Description cells can be offset up to 10 units above OR below the code's Y
    // (tall multi-line rows have their text baseline above the code baseline)
    const rowDescs = descEntries.filter(e => e.y >= cy - 2 && e.y <= cy + 10);
    if (rowDescs.length === 0) continue;
    // Find the desc cluster closest to the code Y
    rowDescs.sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
    const bestY = rowDescs[0].y;
    const cluster = rowDescs.filter(e => Math.abs(e.y - bestY) <= 2);
    cluster.sort((a, b) => a.x - b.x);
    const fullDesc = cluster.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    if (fullDesc.length > 2) pdfMap[codeEntry.text] = fullDesc;
  }
}

console.log('PDF activities mapped:', Object.keys(pdfMap).length);

// ── Compare with EN locale ────────────────────────────────────────────────
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
