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
      r += tjStr.slice(i + 1, j);
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

const ds = 119261;
const es = str.indexOf('endstream', ds);
const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');

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

console.log('Entries from obj2:', entries.length);
const codes = entries.filter(e => /^\d{5}$/.test(e.text));
console.log('Code entries:', codes.length, 'first:', codes.slice(0, 5).map(e => e.text + '@y=' + e.y).join(', '));
const descs = entries.filter(e => e.x >= 240 && !/^\d{5}$/.test(e.text) && !/^\d+(\.\d+)?$/.test(e.text));
console.log('Desc entries:', descs.length, 'first:', descs.slice(0, 3).map(e => 'y=' + e.y + ' x=' + e.x + ' ' + e.text.slice(0, 40)).join(' | '));

const codeRe = /^\d{5}$/;
const metRe = /^\d+(\.\d+)?$/;
const buckets = new Map();
for (const e of entries) {
  const key = Math.round(e.y * 2) / 2;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(e);
}
let mapped = 0;
for (const [key, bucket] of buckets) {
  const sorted = bucket.sort((a, b) => a.x - b.x);
  const code = sorted.find(c => codeRe.test(c.text));
  const descsInRow = sorted.filter(c => c.x >= 240 && !codeRe.test(c.text) && !metRe.test(c.text) && c.text.length > 1);
  if (code && descsInRow.length > 0) {
    mapped++;
    if (mapped <= 5) console.log('y=' + key + ' code=' + code.text + ' desc=' + descsInRow.map(d => d.text).join(' ').slice(0, 60));
  }
}
console.log('Mapped from obj2:', mapped);
