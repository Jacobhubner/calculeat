// Direct check: is EN locale for 01010 identical to PDF?
// Extract desc from PDF using precise Y-coordinate approach (single row only)
const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

function parseTJfull(s) {
  let r = '', i = 0;
  while (i < s.length) {
    if (s[i] === '(') {
      let j = i + 1;
      while (j < s.length) { if (s[j] === '\\') { j += 2; continue; } if (s[j] === ')') break; j++; }
      r += s.slice(i+1, j); i = j+1;
    } else i++;
  }
  return r;
}

// Collect all content streams in order
const allStreams = [];
let pos = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const objPos = str.lastIndexOf(' obj', sm);
  const lookStart = objPos > 0 ? objPos : Math.max(0, sm - 800);
  const oh = buf.slice(lookStart, sm).toString('binary');
  const isFlate = oh.includes('FlateDecode') && !oh.includes('/FontFile') && !oh.includes('CIDFont') && !oh.includes('/ToUnicode') && !oh.includes('/Image');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  if (isFlate) {
    try {
      const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
      if (dec.includes('BT')) allStreams.push({ ds, dec });
    } catch(e) {}
  }
  pos = es + 9;
}

// Find 01010
const codeStreamIdx = allStreams.findIndex(s => s.dec.includes('(01010)'));
console.log('01010 in stream index:', codeStreamIdx);

// Stitch: prev stream tail + current + next for Y-coordinate approach
const stitch = allStreams.slice(Math.max(0, codeStreamIdx - 1), codeStreamIdx + 3).map(s => s.dec).join('\n');
const normalized = stitch.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');

// Find Y of 01010
const p = normalized.indexOf('(01010)');
const before = normalized.slice(0, p);
const tmMatches = [...before.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)];
const lastTm = tmMatches[tmMatches.length-1];
const codeY = parseFloat(lastTm[2]);
console.log('Code Y:', codeY);

// Gather desc at x>=240, SAME Y (strict: within 2 units)
const lines = normalized.split(/\r?\n/);
let inBT = false, curX = 0, curY = 0;
const descParts = [];
for (const line of lines) {
  const t = line.trim();
  if (t === 'BT') { inBT = true; continue; }
  if (t === 'ET') { inBT = false; continue; }
  if (!inBT) continue;
  const tm = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
  if (tm) { curX = parseFloat(tm[1]); curY = parseFloat(tm[2]); continue; }
  if (curX >= 240 && Math.abs(curY - codeY) <= 2) {
    const tjIdx = t.lastIndexOf('] TJ');
    if (tjIdx !== -1) {
      let start = tjIdx - 1, depth = 0;
      while (start >= 0) {
        if (t[start] === ']') depth++;
        else if (t[start] === '[') { if (depth === 0) break; depth--; }
        start--;
      }
      if (start >= 0) {
        const text = decodeStr(parseTJfull(t.slice(start+1, tjIdx)));
        if (text.trim()) descParts.push(text.trim());
      }
    }
  }
}

const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
const en = enLocale.activities['01010'];
const full = descParts.join(' ').replace(/\s+/g, ' ').trim();

console.log('PDF desc:', full);
console.log('EN desc: ', en);
console.log('Match:', full === en ? 'YES' : 'NO');
if (full !== en) {
  console.log('PDF hex:', Buffer.from(full).toString('hex').slice(0, 60));
  console.log('EN  hex:', Buffer.from(en).toString('hex').slice(0, 60));
}
