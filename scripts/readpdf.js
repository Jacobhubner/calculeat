const fs = require('fs')
const buf = fs.readFileSync('C:/Users/jahub/Downloads/1_2024-adult-compendium_1_2024.pdf')
const str = buf.toString('binary')
const texts = []
let pos = 0
while (pos < str.length) {
  const start = str.indexOf('(', pos)
  if (start === -1) break
  let end = start + 1
  let depth = 0
  while (end < str.length) {
    const ch = str[end]
    if (ch === String.fromCharCode(92)) {
      end += 2
      continue
    }
    if (ch === '(') depth++
    if (ch === ')') {
      if (depth === 0) break
      depth--
    }
    end++
  }
  if (end >= str.length) break
  const after = str.slice(end + 1, end + 10).replace(/[ \t\r\n]/g, '')
  if (after.startsWith('Tj') || after.startsWith('TJ')) {
    const raw = str.slice(start + 1, end)
    if (raw.trim().length > 2) texts.push(raw.trim().substring(0, 200))
  }
  pos = end + 1
}
console.log('Total:', texts.length)
texts.slice(0, 100).forEach((t, i) => console.log(i, JSON.stringify(t)))
