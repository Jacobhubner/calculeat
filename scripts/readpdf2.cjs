const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf');

// Find all compressed streams and decompress them
const allText = [];
let pos = 0;

while (pos < buf.length) {
  // Find 'stream\r\n' or 'stream\n'
  const streamMarker = buf.indexOf('stream', pos);
  if (streamMarker === -1) break;

  // Check what's before stream to see if FlateDecode
  const objHeader = buf.slice(Math.max(0, streamMarker - 500), streamMarker).toString('binary');
  const isFlate = objHeader.includes('FlateDecode') || objHeader.includes('Fl\n') || objHeader.includes('/Fl ');

  // Find actual start of stream data
  let dataStart = streamMarker + 6;
  if (buf[dataStart] === 13 && buf[dataStart + 1] === 10) dataStart += 2; // \r\n
  else if (buf[dataStart] === 10) dataStart += 1; // \n

  // Find endstream
  const endStream = buf.indexOf('endstream', dataStart);
  if (endStream === -1) { pos = streamMarker + 6; continue; }

  const streamData = buf.slice(dataStart, endStream);

  if (isFlate && streamData.length > 10) {
    try {
      const decompressed = zlib.inflateSync(streamData);
      const text = decompressed.toString('utf8');
      // Look for activity-like text (codes + descriptions)
      if (text.includes('Bicycling') || text.includes('Walking') || text.includes('Running') ||
          text.includes('Activity Description') || text.match(/\d{5}/)) {
        allText.push(text.substring(0, 5000));
      }
    } catch (e) {
      // ignore decompress errors
    }
  }

  pos = endStream + 9;
}

console.log('Found', allText.length, 'relevant streams');
if (allText.length > 0) {
  // Print first relevant stream
  console.log('\n=== STREAM 1 (first 3000 chars) ===');
  console.log(allText[0].substring(0, 3000));
  if (allText.length > 1) {
    console.log('\n=== STREAM 2 (first 2000 chars) ===');
    console.log(allText[1].substring(0, 2000));
  }
}
