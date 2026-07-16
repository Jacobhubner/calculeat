// Direct MCID extraction with stream stitching for the 5 hard codes
// The issue: code's MCID block starts in stream N, description's TJ continues in stream N+1
const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

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
      const rng = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (rng) {
        const s = parseInt(rng[1], 16), e = parseInt(rng[2], 16), d = parseInt(rng[3], 16);
        for (let i = s; i <= e; i++) map.set(i, String.fromCodePoint(d + (i - s)));
      }
    }
  }
  return map;
}

const chunk = str.slice(223109, 223109 + 1000);
const smIdx = chunk.indexOf('stream');
let ds2 = 223109 + smIdx + 6;
if (buf[ds2] === 13 && buf[ds2+1] === 10) ds2 += 2;
else if (buf[ds2] === 10) ds2 += 1;
const es2 = str.indexOf('endstream', ds2);
const f3CMap = parseToUnicodeCMap(zlib.inflateSync(buf.slice(ds2, es2)).toString('ascii'));

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

// Collect all content streams with their ds values
const allStreams = [];
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
        if (dec.includes('BT')) allStreams.push({ ds, dec });
      } catch (e) {}
    }
    pos = es + 9;
  }
}

const codes = ['01010','01016','01030','01066','01244'];
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));

for (const code of codes) {
  // Find stream(s) containing the code
  const codeStreamIdx = allStreams.findIndex(s => s.dec.includes('(' + code + ')'));
  if (codeStreamIdx === -1) { console.log(code + ': not found'); continue; }

  // Stitch streams: prev, current, next 3 (desc may be in adjacent streams)
  const start = Math.max(0, codeStreamIdx - 1);
  const stitched = allStreams.slice(start, codeStreamIdx + 4).map(s => s.dec).join('\n');
  const normalized = stitched.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');

  // Extract all MCID cells from stitched content
  const bdcRe = /\/P\s*<<\/MCID\s+(\d+)>>\s*BDC([\s\S]*?)EMC/g;
  const cells = [];
  let m;
  while ((m = bdcRe.exec(normalized)) !== null) {
    const mcid = parseInt(m[1]);
    const content = m[2];
    const tmM = content.match(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/);
    const x = tmM ? parseFloat(tmM[1]) : -1;
    const y = tmM ? parseFloat(tmM[2]) : -1;
    const text = extractTextFromBlock(content);
    cells.push({ mcid, x, y, text });
  }

  // Find code cell — must handle Tc prefix
  let codeCell = cells.find(c => c.text === code);
  if (!codeCell) {
    // Try partial match (Tc might cause issues)
    codeCell = cells.find(c => c.text.includes(code) && c.text.length <= code.length + 5);
  }
  if (!codeCell) {
    console.log(code + ': code cell not found. cells sample: ' + cells.slice(0,5).map(c => c.text).join(', '));
    continue;
  }

  // Find desc cells in wider MCID range
  const descCells = cells.filter(c =>
    c.mcid > codeCell.mcid &&
    c.mcid <= codeCell.mcid + 8 &&
    c.x >= 240 &&
    c.text.length > 2 &&
    !/^\d+(\.\d+)?$/.test(c.text)
  );

  if (descCells.length === 0) {
    const nextCells = cells.filter(c => c.mcid > codeCell.mcid && c.mcid <= codeCell.mcid + 8);
    console.log(code + ': no desc. Code mcid=' + codeCell.mcid + ' next: ' + JSON.stringify(nextCells.map(c => ({mcid:c.mcid,x:c.x,text:c.text.slice(0,30)}))));
    continue;
  }

  const full = descCells.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim();
  const en = enLocale.activities[code];
  const match = full === en ? 'MATCH' : 'DIFF';
  console.log(code + ' [' + match + ']');
  console.log('  PDF: ' + full);
  if (match === 'DIFF') console.log('  EN:  ' + en);
}
