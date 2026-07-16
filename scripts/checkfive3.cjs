// Direct Y-coordinate based extraction for the 5 codes that MCID fails on
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

function getLinearStreamAll(code) {
  // Return ALL streams that contain this code
  const results = [];
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
        if (dec.includes('(' + code + ')')) results.push({ ds, dec });
      } catch (e) {}
    }
    pos = es + 9;
  }
  return results;
}

const codes = ['01010','01016','01030','01066','01244'];
const enLocale = JSON.parse(fs.readFileSync('public/locales/en/met.json', 'utf8'));

for (const code of codes) {
  // Find the stream containing this code, then stitch with adjacent streams
  const streams = getLinearStreamAll(code);
  if (!streams.length) { console.log(code + ': not found'); continue; }

  // Use the first stream and stitch with adjacent ds ranges
  const { ds: codeDs, dec: codeDec } = streams[0];

  // Find the Y of the code in the stream
  const normalized = codeDec.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
  const p = normalized.indexOf('(' + code + ')');
  const before = normalized.slice(0, p);
  const tmMatches = [...before.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)];
  if (!tmMatches.length) { console.log(code + ': no Tm found'); continue; }
  const lastTm = tmMatches[tmMatches.length-1];
  const codeY = parseFloat(lastTm[2]);

  // Now gather all desc text at x>=240 within Y range [codeY-2, codeY+10]
  // from this stream + the next stream (in case desc is split)
  // Collect all decompressed streams near this position and stitch them
  let allStreams = [];
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
        if (dec.includes('BT')) allStreams.push({ ds, es, dec });
      } catch (e) {}
    }
    pos = es + 9;
  }

  // Find this stream's index
  const idx = allStreams.findIndex(s => s.ds === codeDs);

  // Stitch: this stream + next 2
  const stitched = allStreams.slice(Math.max(0,idx), idx+3).map(s => s.dec).join('\n');
  const normStitched = stitched.replace(/\]\s*\r?\n\s*TJ/g, '] TJ');
  const lines = normStitched.split(/\r?\n/);

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
          const text = decodeStr(parseTJfull(t.slice(start+1, tjIdx)));
          if (text.trim()) descParts.push({ y: curY, x: curX, text: text.trim() });
        }
      }
    }
  }

  if (descParts.length === 0) {
    console.log(code + ': no desc parts found (codeY=' + codeY + ')');
    continue;
  }

  descParts.sort((a, b) => b.y - a.y || a.x - b.x);
  const full = descParts.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim();
  const en = enLocale.activities[code];
  const match = full === en ? 'MATCH' : 'DIFF';
  console.log(code + ' [' + match + ']');
  console.log('  PDF: ' + full);
  if (match === 'DIFF') console.log('  EN:  ' + en);
}
