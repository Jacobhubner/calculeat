const text = 'Bench step class, allmän';
const translations = {'Bench step': 'Stepbräda', 'step': 'steg'};
const sorted = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
console.log('Sorted:', sorted.map(x => x[0]));
let result = text;
sorted.forEach(([eng, swe]) => {
  const regex = new RegExp(eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  console.log(`Replacing "${eng}" -> "${swe}"`);
  result = result.replace(regex, swe);
  console.log('Result:', result);
});
console.log('Final:', result);
