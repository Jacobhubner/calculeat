import fs from 'fs';

// Read the Excel data
const excelData = JSON.parse(fs.readFileSync('met-data-from-excel.json', 'utf8'));

// Clean and structure the data
const cleanedExcelData = excelData
  .filter(row => {
    const code = String(row['Activity Code '] || '').trim();
    const met = String(row['MET Value '] || '').trim();
    const category = String(row['Major Heading '] || '').trim();
    const activity = String(row['Activity Description'] || '').trim();

    // Only include rows with valid data
    return code && met && category && activity &&
           !isNaN(parseFloat(met)) &&
           code.match(/^\d{5}$/);
  })
  .map(row => ({
    id: String(row['Activity Code ']).trim(),
    category: String(row['Major Heading ']).trim(),
    activity: String(row['Activity Description']).trim(),
    met: parseFloat(row['MET Value '])
  }));

console.log('=== EXCEL DATA ANALYSIS ===');
console.log('Total valid activities in Excel:', cleanedExcelData.length);

// Group by category
const categoryCounts = {};
cleanedExcelData.forEach(item => {
  categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
});

console.log('\nActivities per category:');
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

console.log('\n=== SAMPLE ACTIVITIES ===');
console.log('\nFirst 10 activities:');
cleanedExcelData.slice(0, 10).forEach(item => {
  console.log(`  [${item.id}] ${item.category} - ${item.activity} (${item.met} MET)`);
});

// Save cleaned data
fs.writeFileSync('met-data-cleaned.json', JSON.stringify(cleanedExcelData, null, 2));
console.log('\nCleaned data saved to met-data-cleaned.json');

// Also create a TypeScript-ready format
const tsFormat = cleanedExcelData.map(item => {
  // Determine intensity based on MET value
  let intensity;
  if (item.met < 3.0) intensity = 'light';
  else if (item.met < 6.0) intensity = 'moderate';
  else if (item.met < 9.0) intensity = 'vigorous';
  else intensity = 'very vigorous';

  return `  { id: '${item.id}', category: '${item.category}', activity: '${item.activity.replace(/'/g, "\\'")}', met: ${item.met}, intensity: '${intensity}' },`;
});

fs.writeFileSync('met-activities-typescript.txt', tsFormat.join('\n'));
console.log('TypeScript format saved to met-activities-typescript.txt');

console.log('\n=== SUMMARY ===');
console.log(`Total categories: ${Object.keys(categoryCounts).length}`);
console.log(`Total activities: ${cleanedExcelData.length}`);
console.log(`MET range: ${Math.min(...cleanedExcelData.map(a => a.met))} - ${Math.max(...cleanedExcelData.map(a => a.met))}`);
