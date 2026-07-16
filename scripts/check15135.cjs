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
      if (dec.includes('(15135)')) {
        const p = dec.indexOf('(15135)');
        console.log('Raw context after 15135:');
        console.log(dec.slice(p, p + 800));

        // Also try to decode with F3 any hex strings
        const normalized = dec.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
        const lines = normalized.split(/\r?\n/);
        let inBT = false, curFont = 'F2', curX = 0, curY = 0;
        const beforeP = normalized.slice(0, p);
        const tmMs = [...beforeP.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)];
        const lastTm = tmMs[tmMs.length-1];
        const codeY = lastTm ? parseFloat(lastTm[2]) : -1;
        console.log('\nCode Y:', codeY);

        const parts = [];
        for (const line of lines) {
          const t = line.trim();
          if (t === 'BT') { inBT = true; continue; }
          if (t === 'ET') { inBT = false; continue; }
          if (!inBT) continue;
          const tfM = t.match(/\/(F\d+)\s+[\d.]+\s+Tf$/);
          if (tfM) { curFont = tfM[1]; continue; }
          const tm = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
          if (tm) { curX = parseFloat(tm[1]); curY = parseFloat(tm[2]); continue; }
          if (curX >= 240 && codeY > 0 && Math.abs(curY - codeY) <= 2) {
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
                const raw = parseTJwithFont(t.slice(start+1, tjIdx), cmap);
                const text = decodeStr(raw);
                if (text.trim()) {
                  parts.push(text);
                  console.log('\nDecoded desc part:', text);
                  console.log('Hex:', Buffer.from(text).toString('hex'));
                }
              }
            }
          }
        }
        break;
      }
    } catch(e) {}
  }
  pos = es + 9;
}

const en = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));
console.log('\nEN hex:', Buffer.from(en.activities['15135']).toString('hex').slice(0, 30));
