const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');

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

// Get all decompressed streams
const allStreams = [];
let pos = 0;
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const objHeader = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = objHeader.includes('FlateDecode');
  const isFont = objHeader.includes('/FontFile') || objHeader.includes('CIDFont') || objHeader.includes('/ToUnicode');
  const isImage = objHeader.includes('/Image');
  let ds = sm + 6;
  if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
  else if (buf[ds] === 10) ds += 1;
  const es = buf.indexOf('endstream', ds);
  if (es === -1) { pos = sm + 6; continue; }
  const data = buf.slice(ds, es);
  if (isFlate && !isFont && !isImage && data.length > 10) {
    try {
      const dec = zlib.inflateSync(data).toString('binary');
      allStreams.push(dec);
    } catch(e) {}
  }
  pos = es + 9;
}

console.log('Total streams:', allStreams.length);

// For each stream, extract ALL text with Y position
// Look for Tm matrix (which gives position) and TJ/Tj text
// Format: x y Tm ... [(text)] TJ
// We need to track: Tm sets current y, then subsequent TJ gives text at that position

const allEntries = []; // {y, x, text, streamIdx}

for (let si = 0; si < allStreams.length; si++) {
  const stream = allStreams[si];
  const lines = stream.split('\n');
  let inBT = false;
  let curX = 0, curY = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li].trim();
    if (line === 'BT') { inBT = true; continue; }
    if (line === 'ET') { inBT = false; continue; }
    if (!inBT) continue;

    // Check for Tm: "a b c d x y Tm"
    const tmMatch = line.match(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm$/);
    if (tmMatch) {
      curX = parseFloat(tmMatch[1]);
      curY = parseFloat(tmMatch[2]);
      continue;
    }

    // TJ operator
    const tjM = line.match(/^\[([^\]]*)\]\s*TJ$/);
    const tjS = line.match(/^\(([^)]*)\)\s*Tj$/);
    let text = null;
    if (tjM) text = decodeStr(parseTJ(tjM[1]));
    else if (tjS) text = decodeStr(tjS[1]);

    if (text && text.trim()) {
      allEntries.push({ y: curY, x: curX, text: text.trim(), si });
    }
  }
}

// Sort by stream, then by y descending (top of page first), then x
allEntries.sort((a, b) => {
  if (a.si !== b.si) return a.si - b.si;
  if (Math.abs(a.y - b.y) > 2) return b.y - a.y; // higher y = higher on page
  return a.x - b.x;
});

// Print entries from first data stream to understand structure
// Find stream that has "Bicycling" and "01003"
const bikeEntries = allEntries.filter(e => e.text.includes('01003') || e.text === 'Bicycling' || e.text.includes('Bicycling,'));
console.log('\nEntries related to first activity (01003):');
const bikeStreamIdx = bikeEntries.length > 0 ? bikeEntries[0].si : -1;
if (bikeStreamIdx >= 0) {
  allEntries.filter(e => e.si === bikeStreamIdx).slice(0, 80).forEach(e => {
    console.log(`  y=${e.y.toFixed(1)} x=${e.x.toFixed(1)}: ${JSON.stringify(e.text)}`);
  });
}
