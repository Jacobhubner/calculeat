const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');

// Extract text from a TJ array like [(Bic)4(y)-4(cli)3(ng)]
function parseTJ(tjStr) {
  let result = '';
  let i = 0;
  while (i < tjStr.length) {
    if (tjStr[i] === '(') {
      // find matching close paren
      let j = i + 1;
      while (j < tjStr.length) {
        if (tjStr[j] === '\\') { j += 2; continue; }
        if (tjStr[j] === ')') break;
        j++;
      }
      result += tjStr.slice(i + 1, j);
      i = j + 1;
    } else {
      i++;
    }
  }
  return result;
}

// Decode escape sequences in PDF strings
function decodeStr(s) {
  return s
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');
}

// Decompress all FlateDecode streams and extract text
const allDecompressed = [];
let pos = 0;

while (pos < buf.length) {
  const streamMarker = buf.indexOf('stream', pos);
  if (streamMarker === -1) break;

  const objHeader = buf.slice(Math.max(0, streamMarker - 800), streamMarker).toString('binary');
  const isFlate = objHeader.includes('FlateDecode') || objHeader.includes('/Fl ') || objHeader.includes('/Fl\n');
  const isFont = objHeader.includes('/FontFile') || objHeader.includes('/CIDFont');
  const isImage = objHeader.includes('/Image') || objHeader.includes('/Subtype /Im');

  let dataStart = streamMarker + 6;
  if (buf[dataStart] === 13 && buf[dataStart + 1] === 10) dataStart += 2;
  else if (buf[dataStart] === 10) dataStart += 1;

  const endStream = buf.indexOf('endstream', dataStart);
  if (endStream === -1) { pos = streamMarker + 6; continue; }

  const streamData = buf.slice(dataStart, endStream);

  if (isFlate && !isFont && !isImage && streamData.length > 10) {
    try {
      const decompressed = zlib.inflateSync(streamData).toString('binary');
      allDecompressed.push(decompressed);
    } catch (e) {
      // skip
    }
  }
  pos = endStream + 9;
}

// Now extract text from all decompressed streams
// We look for TJ and Tj operators
const activities = [];

for (const stream of allDecompressed) {
  // Find all TJ arrays: [...] TJ
  const tjRe = /\[([^\]]*)\]\s*TJ/g;
  let m;
  let currentLine = [];
  let inBT = false;
  let lastY = null;

  // Process line by line looking for BT...ET blocks
  const lines = stream.split('\n');
  let lineBuffer = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BT') { inBlock = true; lineBuffer = []; continue; }
    if (trimmed === 'ET') {
      inBlock = false;
      // Process lineBuffer
      const texts = [];
      for (const l of lineBuffer) {
        const tjM = l.match(/^\[([^\]]*)\]\s*TJ$/);
        const tjSimple = l.match(/^\(([^)]*)\)\s*Tj$/);
        if (tjM) {
          const txt = decodeStr(parseTJ(tjM[1]));
          if (txt.trim()) texts.push(txt);
        } else if (tjSimple) {
          const txt = decodeStr(tjSimple[1]);
          if (txt.trim()) texts.push(txt);
        }
      }
      if (texts.length > 0) {
        const combined = texts.join('');
        if (combined.trim()) activities.push(combined.trim());
      }
      lineBuffer = [];
      continue;
    }
    if (inBlock) lineBuffer.push(trimmed);
  }
}

// Now group into rows of 4 (Major Heading, Code, MET, Description)
// The PDF table has: Major Heading | Activity Code | MET Value | Activity Description
// Filter to find the actual activity data
const descriptions = activities.filter(a => {
  // Must be longer than 4 chars, not pure numbers, not layout artifacts
  return a.length > 4 && !/^[\d\s.]+$/.test(a) && !/^[A-Z][0-9]/.test(a);
});

console.log('Total text blocks:', activities.length);
console.log('\nFirst 200 blocks:');
activities.slice(0, 200).forEach((a, i) => console.log(i, JSON.stringify(a)));
