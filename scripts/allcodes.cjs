const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');

let pos = 0, si = 0;
const streams = [];
while (pos < buf.length) {
  const sm = buf.indexOf('stream', pos);
  if (sm === -1) break;
  const oh = buf.slice(Math.max(0, sm - 800), sm).toString('binary');
  const isFlate = oh.includes('FlateDecode');
  const isFont = oh.includes('/FontFile') || oh.includes('CIDFont') || oh.includes('/ToUnicode');
  if (isFlate && !isFont) {
    let ds = sm + 6;
    if (buf[ds] === 13 && buf[ds+1] === 10) ds += 2;
    else if (buf[ds] === 10) ds += 1;
    const es = buf.indexOf('endstream', ds);
    if (es !== -1) {
      try {
        const dec = zlib.inflateSync(buf.slice(ds, es)).toString('binary');
        if (dec.includes('BT') && dec.includes('TJ')) {
          streams.push({ si, size: dec.length, data: dec });
        }
      } catch(e) {}
      si++;
    }
  }
  pos = sm + 6;
}

console.log('Content streams:', streams.length);

// Find all 5-digit codes (activity codes start with 0)
const allCodes = new Set();
for (const s of streams) {
  // Pattern: codes appear after "Tc[(" or standalone in TJ arrays
  // Try to find patterns like "(01003)" or " 01003 " in the binary stream
  const codes = s.data.match(/\((\d{5})\)/g) || [];
  codes.forEach(c => {
    const code = c.slice(1, -1);
    if (code >= '01000') allCodes.add(code);
  });
  // Also look for code in Tc[(01010)] pattern
  const tcCodes = s.data.match(/\[?\((\d{5})\)\]?\s*TJ/g) || [];
  tcCodes.forEach(m => {
    const match = m.match(/\((\d{5})\)/);
    if (match) allCodes.add(match[1]);
  });
}

const sorted = [...allCodes].sort();
console.log('Unique codes found:', sorted.length);
console.log('First 20:', sorted.slice(0, 20).join(', '));
console.log('Last 20:', sorted.slice(-20).join(', '));
