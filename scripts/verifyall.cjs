// Full verification of all 1111 EN locale activities against PDF via MCID blocks
const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

// ── XRef offsets ────────────────────────────────────────────────────────────
const entryStart = 358689;
const offsets = [];
for (let i = 0; i < 10214; i++) {
  const lineStart = entryStart + i * 20;
  const line = str.slice(lineStart, lineStart + 20);
  const offset = parseInt(line.slice(0, 10));
  if (line[17] === 'n' && offset > 0) offsets.push({ obj: i, offset });
}

// ── F3 ToUnicode CMap ────────────────────────────────────────────────────────
function parseToUnicodeCMap(cmapText) {
  const map = new Map();
  for (const block of (cmapText.match(/\d+ beginbfchar([\s\S]*?)endbfchar/g) || [])) {
    for (const pair of (block.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [])) {
      const m = pair.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (m) map.set(parseInt(m[1], 16), String.fromCodePoint(parseInt(m[2], 16)));
    }
  }
  for (const block of (cmapText.match(/\d+ beginbfrange([\s\S]*?)endbfrange/g) || [])) {
    for (const line of block.split('\n')) {
      const arr = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]+)\]/);
      if (arr) {
        const s = parseInt(arr[1], 16), e = parseInt(arr[2], 16);
        const us = arr[3].match(/<([0-9A-Fa-f]+)>/g) || [];
        for (let i = s; i <= e && i - s < us.length; i++)
          map.set(i, String.fromCodePoint(parseInt(us[i-s].slice(1,-1), 16)));
        continue;
      }
      const rng = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (rng) {
        const s = parseInt(rng[1], 16), e = parseInt(rng[2], 16), d = parseInt(rng[3], 16);
        for (let i = s; i <= e; i++) map.set(i, String.fromCodePoint(d + (i - s)));
      }
    }
  }
  return map;
}

function loadCMap(objOffset) {
  const chunk = str.slice(objOffset, objOffset + 1000);
  const smIdx = chunk.indexOf('stream');
  if (smIdx === -1) return new Map();
  let ds = objOffset + smIdx + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = str.indexOf('endstream', ds);
  try { return parseToUnicodeCMap(zlib.inflateSync(buf.slice(ds, es)).toString('ascii')); }
  catch (e) { return new Map(); }
}

const f3CMap = loadCMap(223109);

// ── Text decoding ────────────────────────────────────────────────────────────
function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

function parseTJwithFont(s, cmap) {
  let r = '', i = 0;
  while (i < s.length) {
    if (s[i] === '(') {
      let j = i + 1;
      while (j < s.length) { if (s[j] === '\\') { j += 2; continue; } if (s[j] === ')') break; j++; }
      r += s.slice(i+1, j); i = j+1;
    } else if (s[i] === '<') {
      let j = i+1;
      while (j < s.length && s[j] !== '>') j++;
      const hex = s.slice(i+1, j);
      if (cmap) for (let k = 0; k+3 < hex.length; k += 4) r += cmap.get(parseInt(hex.slice(k,k+4),16)) || '';
      i = j+1;
    } else i++;
  }
  return r;
}

function extractTextFromBlock(content) {
  const normalized = content.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
  const lines = normalized.split(/\r?\n/);
  let inBT = false, curFont = 'F2';
  const parts = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === 'BT') { inBT = true; continue; }
    if (t === 'ET') { inBT = false; continue; }
    if (!inBT) continue;
    const tfM = t.match(/\/(F\d+)\s+[\d.]+\s+Tf$/);
    if (tfM) { curFont = tfM[1]; continue; }
    const cmap = curFont === 'F3' ? f3CMap : null;
    const tjIdx = t.lastIndexOf('] TJ');
    if (tjIdx !== -1) {
      let start = tjIdx-1, depth = 0;
      while (start >= 0) {
        if (t[start] === ']') depth++;
        else if (t[start] === '[') { if (depth === 0) break; depth--; }
        start--;
      }
      if (start >= 0) {
        const text = decodeStr(parseTJwithFont(t.slice(start+1, tjIdx), cmap));
        if (text.trim()) parts.push(text.trim());
      }
    } else {
      const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
      if (tjS) { const text = decodeStr(tjS[1]); if (text.trim()) parts.push(text.trim()); }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// ── Stream loading ────────────────────────────────────────────────────────────
const streamCache = new Map();
function getStreamDec(obj) {
  if (streamCache.has(obj)) return streamCache.get(obj);
  const o = offsets.find(x => x.obj === obj);
  if (!o) return null;
  const chunk = str.slice(o.offset, Math.min(o.offset + 500, str.length));
  const smIdx = chunk.indexOf('stream');
  if (smIdx === -1) return null;
  const hdr = chunk.slice(0, smIdx);
  if (!hdr.includes('FlateDecode') || hdr.includes('FontFile') || hdr.includes('CIDFont') ||
      hdr.includes('ToUnicode') || hdr.includes('/Image')) return null;
  let ds = o.offset + smIdx + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = str.indexOf('endstream', ds);
  if (es === -1) return null;
  try {
    const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
    streamCache.set(obj, dec);
    return dec;
  } catch (e) { return null; }
}

// Also scan linearly for early page streams
const linearStreams = [];
{
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
    if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
    else if (buf[ds] === 10) ds += 1;
    const es = buf.indexOf('endstream', ds);
    if (es === -1) { pos = sm + 6; continue; }
    if (isFlate && !isFont && !isImage) {
      try {
        const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
        if (dec.includes('BT')) linearStreams.push(dec);
      } catch (e) {}
    }
    pos = es + 9;
  }
}

// ── MCID cell extraction from a stream ────────────────────────────────────────
function extractCells(dec) {
  const cells = [];
  const bdcRe = /\/P\s*<<\/MCID\s+(\d+)>>\s*BDC([\s\S]*?)EMC/g;
  let m;
  while ((m = bdcRe.exec(dec)) !== null) {
    const mcid = parseInt(m[1]);
    const content = m[2];
    const tmM = content.match(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/);
    const x = tmM ? parseFloat(tmM[1]) : -1;
    const y = tmM ? parseFloat(tmM[2]) : -1;
    const text = extractTextFromBlock(content);
    cells.push({ mcid, x, y, text });
  }
  return cells;
}

// ── Build pdfMap via MCID matching ────────────────────────────────────────────
// For each obj stream, extract cells, find code cells, then look for desc in
// the next few MCIDs at x >= 240
const pdfMap = {};

function processDecForMap(dec) {
  const cells = extractCells(dec);
  for (const codeCell of cells) {
    if (!/^\d{5}$/.test(codeCell.text)) continue;
    if (pdfMap[codeCell.text]) continue;
    // Description cell: next MCIDs at x >= 240 with substantial text
    const descCells = cells.filter(c =>
      c.mcid > codeCell.mcid &&
      c.mcid <= codeCell.mcid + 5 &&
      c.x >= 240 &&
      c.text.length > 2 &&
      !/^\d+(\.\d+)?$/.test(c.text)
    );
    if (descCells.length === 0) continue;
    const full = descCells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    if (full.length > 2) pdfMap[codeCell.text] = full;
  }
}

// Process all xref content streams
for (const { obj } of offsets) {
  const dec = getStreamDec(obj);
  if (dec) processDecForMap(dec);
}

// Process linear streams (early pages)
for (const dec of linearStreams) processDecForMap(dec);

console.log('PDF activities mapped:', Object.keys(pdfMap).length);

// ── Compare with EN locale ────────────────────────────────────────────────────
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
console.log('Total EN activities:', Object.keys(enAct).length);
console.log('Exact matches:', matches);
console.log('Mismatches:', mismatches.length);
console.log('Not extracted from PDF:', notInPDF.length);

if (mismatches.length > 0) {
  console.log('\n=== MISMATCHES ===');
  mismatches.forEach(m => {
    console.log(`\n${m.code}:`);
    console.log(`  PDF: "${m.pdf}"`);
    console.log(`  EN:  "${m.en}"`);
  });
}

if (notInPDF.length > 0) {
  console.log('\nNot extracted:', notInPDF.join(', '));
}
