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
    try { allStreams.push({ data: zlib.inflateSync(data).toString('binary'), idx: allStreams.length }); } catch(e) {}
  }
  pos = es + 9;
}

// Find which stream contains "01003" (the first activity code)
for (const { data, idx } of allStreams) {
  if (data.includes('01003')) {
    console.log(`Stream ${idx} contains "01003"`);
    // Print the 200 chars around it
    const pos = data.indexOf('01003');
    console.log('Context:\n', JSON.stringify(data.slice(Math.max(0, pos-200), pos+200)));
    break;
  }
}

// Also check for "01010" which we know is there
for (const { data, idx } of allStreams) {
  if (data.includes('01010')) {
    console.log(`\nStream ${idx} contains "01010"`);
    const pos = data.indexOf('01010');
    console.log('Context:\n', JSON.stringify(data.slice(Math.max(0, pos-300), pos+300)));
    break;
  }
}
