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
      r += s.slice(i + 1, j);
      i = j + 1;
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

const codes = ['11126','11146','11192','11266','11600','11610','11765','15135','02050','03039','03060','05050','05090','05146'];

const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));

for (const code of codes) {
  for (const { obj } of offsets) {
    const d = getStreamDec(obj);
    if (!d || !d.includes('(' + code + ')')) continue;

    // Find Y of this code
    const p = d.indexOf('(' + code + ')');
    const before = d.slice(0, p);
    const tmMatches = [...before.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)];
    if (!tmMatches.length) break;
    const last = tmMatches[tmMatches.length - 1];
    const codeY = parseFloat(last[2]);

    // Extract all desc text in range
    const normalized = d.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
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
      if (curX >= 240 && curY >= codeY - 2 && curY <= codeY + 22) {
        const tjIdx = t.lastIndexOf('] TJ');
        if (tjIdx !== -1) {
          let start = tjIdx - 1, depth = 0;
          while (start >= 0) {
            if (t[start] === ']') depth++;
            else if (t[start] === '[') { if (depth === 0) break; depth--; }
            start--;
          }
          if (start >= 0) {
            const text = decodeStr(parseTJfull(t.slice(start + 1, tjIdx)));
            if (text.trim()) descParts.push({ y: curY, x: curX, text: text.trim() });
          }
        }
      }
    }

    if (descParts.length > 0) {
      descParts.sort((a, b) => b.y - a.y || a.x - b.x);
      const full = descParts.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
      const en = enLocale.activities[code];
      const match = full === en ? 'MATCH' : 'DIFF';
      console.log('\n' + code + ' [' + match + ']');
      console.log('  PDF: ' + full);
      if (match === 'DIFF') console.log('  EN:  ' + en);
    }
    break;
  }
}
