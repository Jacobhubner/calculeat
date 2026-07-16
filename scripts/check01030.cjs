const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

function parseTJ(tjStr) {
  let r = '', i = 0;
  while (i < tjStr.length) {
    if (tjStr[i] === '(') {
      let j = i + 1;
      while (j < tjStr.length) {
        if (tjStr[j] === '\\') { j += 2; continue; }
        if (tjStr[j] === ')') break;
        j++;
      }
      r += tjStr.slice(i + 1, j); i = j + 1;
    } else i++;
  }
  return r;
}
function decodeStr(s) {
  return s.replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

const dec = zlib.inflateSync(buf.slice(4900, 5542)).toString('binary');
const lines = dec.split(/\r?\n/);
let inBT = false, curX = 0, curY = 0;
const entries = [];
for (const line of lines) {
  const t = line.trim();
  if (t === 'BT') { inBT = true; continue; }
  if (t === 'ET') { inBT = false; continue; }
  if (!inBT) continue;
  const tm = t.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
  if (tm) { curX = parseFloat(tm[1]); curY = parseFloat(tm[2]); continue; }
  const tjIdx = t.lastIndexOf('] TJ');
  if (tjIdx !== -1) {
    let start = tjIdx - 1, depth = 0;
    while (start >= 0) {
      if (t[start] === ']') depth++;
      else if (t[start] === '[') { if (depth === 0) break; depth--; }
      start--;
    }
    if (start >= 0) {
      const text = decodeStr(parseTJ(t.slice(start + 1, tjIdx)));
      if (text.trim()) entries.push({ y: curY, x: curX, text: text.trim() });
    }
  }
}
console.log('Entries from ds=4900:', entries.length);
const near01030 = entries.filter(e => Math.abs(e.y - 361.51) <= 2);
console.log('Entries near y=361.51 (code 01030):');
near01030.forEach(e => console.log('  y=' + e.y + ' x=' + e.x + ' text=' + e.text.slice(0, 60)));

// Also show all entries to understand the stream
console.log('\nAll entries:');
entries.forEach(e => console.log('  y=' + e.y + ' x=' + e.x + ' text=' + e.text.slice(0, 40)));
