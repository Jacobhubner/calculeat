// For each of the 15 truncated codes, find the exact description in the PDF
// by locating the code's MCID and then finding the next description-column cell
const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

const entryStart = 358689;
const offsets = [];
for (let i = 0; i < 10214; i++) {
  const lineStart = entryStart + i * 20;
  const line = str.slice(lineStart, lineStart + 20);
  const offset = parseInt(line.slice(0, 10));
  const flag = line[17];
  if (flag === 'n' && offset > 0) offsets.push({ obj: i, offset });
}

function getStreamDec(obj) {
  const o = offsets.find(x => x.obj === obj);
  if (!o) return null;
  const chunk = str.slice(o.offset, o.offset + 500);
  const smIdx = chunk.indexOf('stream');
  if (smIdx === -1) return null;
  let ds = o.offset + smIdx + 6;
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = str.indexOf('endstream', ds);
  try { return zlib.inflateSync(buf.slice(ds, es)).toString('binary'); } catch (e) { return null; }
}

function parseTJfull(s) {
  let r = '', i = 0;
  while (i < s.length) {
    if (s[i] === '(') {
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === ')') break;
        j++;
      }
      r += s.slice(i + 1, j); i = j + 1;
    } else i++;
  }
  return r;
}

function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

// Strategy: find the MCID block containing the code, note its MCID number,
// then find the next few MCIDs at x>=240 and collect their text.
// Each cell = one BDC...EMC block identified by MCID.

// Load F3 CMap
function parseToUnicodeCMap(cmapText) {
  const map = new Map();
  const bfcharBlocks = cmapText.match(/\d+ beginbfchar([\s\S]*?)endbfchar/g) || [];
  for (const block of bfcharBlocks) {
    const pairs = block.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const pair of pairs) {
      const m = pair.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (m) map.set(parseInt(m[1], 16), String.fromCodePoint(parseInt(m[2], 16)));
    }
  }
  const bfrangeBlocks = cmapText.match(/\d+ beginbfrange([\s\S]*?)endbfrange/g) || [];
  for (const block of bfrangeBlocks) {
    for (const line of block.split('\n')) {
      const arrMatch = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]+)\]/);
      if (arrMatch) {
        const start = parseInt(arrMatch[1], 16), end = parseInt(arrMatch[2], 16);
        const uStrs = arrMatch[3].match(/<([0-9A-Fa-f]+)>/g) || [];
        for (let i = start; i <= end && i - start < uStrs.length; i++)
          map.set(i, String.fromCodePoint(parseInt(uStrs[i-start].slice(1,-1), 16)));
        continue;
      }
      const rng = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (rng) {
        const start = parseInt(rng[1], 16), end = parseInt(rng[2], 16), dst = parseInt(rng[3], 16);
        for (let i = start; i <= end; i++) map.set(i, String.fromCodePoint(dst + (i - start)));
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
  if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = str.indexOf('endstream', ds);
  try { return parseToUnicodeCMap(zlib.inflateSync(buf.slice(ds, es)).toString('ascii')); } catch (e) { return new Map(); }
}

const f3CMap = loadCMap(223109);

function decodeHex(hexStr, cmap) {
  let r = '';
  for (let i = 0; i + 3 < hexStr.length; i += 4)
    r += cmap.get(parseInt(hexStr.slice(i, i+4), 16)) || '';
  return r;
}

function parseTJwithFont(s, cmap) {
  let r = '', i = 0;
  while (i < s.length) {
    if (s[i] === '(') {
      let j = i + 1;
      while (j < s.length) { if (s[j] === '\\') { j += 2; continue; } if (s[j] === ')') break; j++; }
      r += s.slice(i + 1, j); i = j + 1;
    } else if (s[i] === '<') {
      let j = i + 1;
      while (j < s.length && s[j] !== '>') j++;
      if (cmap) r += decodeHex(s.slice(i+1, j), cmap);
      i = j + 1;
    } else i++;
  }
  return r;
}

function extractTextFromBlock(content) {
  // Extract ALL TJ/Tj text from a block (may contain multiple BT/ET segments, fonts F2 and F3)
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
      let start = tjIdx - 1, depth = 0;
      while (start >= 0) {
        if (t[start] === ']') depth++;
        else if (t[start] === '[') { if (depth === 0) break; depth--; }
        start--;
      }
      if (start >= 0) {
        const text = decodeStr(parseTJwithFont(t.slice(start + 1, tjIdx), cmap));
        if (text.trim()) parts.push(text.trim());
      }
    } else {
      const tjS = t.match(/\(([^)]*)\)\s*Tj$/);
      if (tjS) { const text = decodeStr(tjS[1]); if (text.trim()) parts.push(text.trim()); }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function extractAllCells(d) {
  const cells = [];
  // Find all BDC blocks: "MCID N>> BDC ... EMC"
  const bdcRe = /\/P\s*<<\/MCID\s+(\d+)>>\s*BDC([\s\S]*?)EMC/g;
  let m;
  while ((m = bdcRe.exec(d)) !== null) {
    const mcid = parseInt(m[1]);
    const content = m[2];
    // Extract first Tm position (for x)
    const tmM = content.match(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/);
    const x = tmM ? parseFloat(tmM[1]) : -1;
    const y = tmM ? parseFloat(tmM[2]) : -1;
    // Extract ALL text in this MCID block (handles multi-BT segments)
    const text = extractTextFromBlock(content);
    cells.push({ mcid, x, y, text });
  }
  return cells;
}

const codes = ['11126','11146','11192','11266','11600','11610','11765','15135','02050','03039','03060','05050','05090','05146'];
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));

for (const code of codes) {
  for (const { obj } of offsets) {
    const d = getStreamDec(obj);
    if (!d || !d.includes('(' + code + ')')) continue;

    const cells = extractAllCells(d);
    // Find the cell with this code
    const codeCell = cells.find(c => c.text === code);
    if (!codeCell) break;

    // The description cell follows the MET cell (code+1 or code+2 MCID)
    // Description is at x>=240
    const descCells = cells.filter(c =>
      c.mcid > codeCell.mcid &&
      c.mcid <= codeCell.mcid + 4 &&
      c.x >= 240 &&
      c.text.length > 2
    );

    if (descCells.length === 0) {
      console.log(code + ': no desc cells found near mcid ' + codeCell.mcid);
      break;
    }

    // Collect all text from desc cells (may span 2 rows for tall cells)
    const full = descCells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
    const en = enLocale.activities[code];
    const match = full === en ? 'MATCH' : 'DIFF';
    console.log('\n' + code + ' [' + match + ']');
    console.log('  PDF: ' + full);
    if (match === 'DIFF') {
      console.log('  EN:  ' + en);
    }
    break;
  }
}
