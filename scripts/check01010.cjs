const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');
const str = buf.toString('binary');

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
      if (dec.includes('(01010)')) {
        const bdcRe = /\/P\s*<<\/MCID\s+(\d+)>>\s*BDC([\s\S]*?)EMC/g;
        const matches = [...dec.matchAll(/\/P\s*<<\/MCID\s+(\d+)>>\s*BDC([\s\S]*?)EMC/g)];
        console.log('MCID matches in this stream:', matches.length);
        for (const m of matches) {
          if (m[2].includes('01010')) {
            console.log('Found 01010 in MCID ' + m[1]);
            console.log('Raw content:', JSON.stringify(m[2]));
          }
        }
        // Also check if the stream ends mid-MCID
        const lastBDC = dec.lastIndexOf('BDC');
        const lastEMC = dec.lastIndexOf('EMC');
        console.log('Stream ends. Last BDC at:', lastBDC, 'Last EMC at:', lastEMC);
        console.log('End of stream:', JSON.stringify(dec.slice(dec.length - 200)));
        break;
      }
    } catch(e) {}
  }
  pos = es + 9;
}
