const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Jacob Hübner', 'Downloads', 'Project CalculEat Sheet.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const todaySheet = workbook.Sheets['Today'];

  console.log('='.repeat(80));
  console.log('EXCEL FORMELANALYS - R23:U27');
  console.log('='.repeat(80));

  // Get the actual values from the referenced cells
  const getCellValue = (ref) => {
    const cell = todaySheet[ref];
    return cell ? cell.v : null;
  };

  // Sum a range
  const sumRange = (startCol, endCol, startRow, endRow) => {
    let sum = 0;
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      for (let row = startRow; row <= endRow; row++) {
        const val = getCellValue(String.fromCharCode(col) + row);
        if (typeof val === 'number') sum += val;
      }
    }
    return sum;
  };

  console.log('\n### KOLUMNFÖRKLARING ###');
  console.log('I-J = Fat gram (kolumn I+J summeras)');
  console.log('K-L = Carb gram (kolumn K+L summeras)');
  console.log('M-N = Protein gram (kolumn M+N summeras)');
  console.log('Q = Total vikt per rad (gram)');

  console.log('\n### RÅDATA FRÅN FRUKOST (rad 22-31) ###');

  // Get individual values
  const fatGrams = sumRange('I', 'J', 22, 31);
  const carbGrams = sumRange('K', 'L', 22, 31);
  const proteinGrams = sumRange('M', 'N', 22, 31);
  const totalWeight = sumRange('Q', 'Q', 22, 31);
  const totalMacroGrams = fatGrams + carbGrams + proteinGrams;

  console.log(`\nSUM(I22:J31) = Fat grams = ${fatGrams}`);
  console.log(`SUM(K22:L31) = Carb grams = ${carbGrams}`);
  console.log(`SUM(M22:N31) = Protein grams = ${proteinGrams}`);
  console.log(`SUM(Q22:Q31) = Total weight = ${totalWeight}`);
  console.log(`SUM(I22:N31) = Total macro grams = ${fatGrams + carbGrams + proteinGrams}`);

  console.log('\n' + '='.repeat(80));
  console.log('### EXCEL FORMLER OCH BERÄKNINGAR ###');
  console.log('='.repeat(80));

  console.log('\n--- ROW 24: "Weight" (Vikt per vikt) ---');
  console.log('Formel R24: SUM(I22:J31) / SUM(Q22:Q31) = fat_grams / total_weight');
  console.log(`Beräkning: ${fatGrams} / ${totalWeight} = ${(fatGrams / totalWeight).toFixed(6)} = ${(fatGrams / totalWeight * 100).toFixed(1)}%`);

  console.log('\nFormel S24: SUM(K22:L31) / SUM(Q22:Q31) = carb_grams / total_weight');
  console.log(`Beräkning: ${carbGrams} / ${totalWeight} = ${(carbGrams / totalWeight).toFixed(6)} = ${(carbGrams / totalWeight * 100).toFixed(1)}%`);

  console.log('\nFormel T24: SUM(M22:N31) / SUM(Q22:Q31) = protein_grams / total_weight');
  console.log(`Beräkning: ${proteinGrams} / ${totalWeight} = ${(proteinGrams / totalWeight).toFixed(6)} = ${(proteinGrams / totalWeight * 100).toFixed(1)}%`);

  const weightSum = (fatGrams + carbGrams + proteinGrams) / totalWeight * 100;
  console.log(`\nSUMMA Weight-rad: ${weightSum.toFixed(1)}% (≠ 100% - resten är vatten, fiber, etc.)`);

  console.log('\n--- ROW 26: "Macros" (Gram per gram makro) ---');
  console.log('Formel R26: SUM(I22:J31) / SUM(I22:N31) = fat_grams / total_macro_grams');
  console.log(`Beräkning: ${fatGrams} / ${totalMacroGrams} = ${(fatGrams / totalMacroGrams).toFixed(6)} = ${(fatGrams / totalMacroGrams * 100).toFixed(1)}%`);

  console.log('\nFormel S26: SUM(K22:L31) / SUM(I22:N31) = carb_grams / total_macro_grams');
  console.log(`Beräkning: ${carbGrams} / ${totalMacroGrams} = ${(carbGrams / totalMacroGrams).toFixed(6)} = ${(carbGrams / totalMacroGrams * 100).toFixed(1)}%`);

  console.log('\nFormel T26: SUM(M22:N31) / SUM(I22:N31) = protein_grams / total_macro_grams');
  console.log(`Beräkning: ${proteinGrams} / ${totalMacroGrams} = ${(proteinGrams / totalMacroGrams).toFixed(6)} = ${(proteinGrams / totalMacroGrams * 100).toFixed(1)}%`);

  const macroSum = 100;
  console.log(`\nSUMMA Macros-rad: ${macroSum}% (= 100% alltid)`);

  console.log('\n' + '='.repeat(80));
  console.log('### JÄMFÖRELSE: GRAM-BASERAT vs KALORI-BASERAT ###');
  console.log('='.repeat(80));

  // Calorie-based calculation
  const fatCalories = fatGrams * 9;
  const carbCalories = carbGrams * 4;
  const proteinCalories = proteinGrams * 4;
  const totalCalories = fatCalories + carbCalories + proteinCalories;

  console.log('\n--- EXCEL ANVÄNDER GRAM-BASERAT (formel från Excel) ---');
  console.log(`Fat:     ${(fatGrams / totalMacroGrams * 100).toFixed(1)}%`);
  console.log(`Carb:    ${(carbGrams / totalMacroGrams * 100).toFixed(1)}%`);
  console.log(`Protein: ${(proteinGrams / totalMacroGrams * 100).toFixed(1)}%`);

  console.log('\n--- OM VI ANVÄNDE KALORI-BASERAT (ej Excel-formel) ---');
  console.log(`Fat:     ${(fatCalories / totalCalories * 100).toFixed(1)}% (${fatGrams}g × 9 = ${fatCalories} kcal)`);
  console.log(`Carb:    ${(carbCalories / totalCalories * 100).toFixed(1)}% (${carbGrams}g × 4 = ${carbCalories} kcal)`);
  console.log(`Protein: ${(proteinCalories / totalCalories * 100).toFixed(1)}% (${proteinGrams}g × 4 = ${proteinCalories} kcal)`);

  console.log('\n' + '='.repeat(80));
  console.log('### SLUTSATS ###');
  console.log('='.repeat(80));
  console.log('\nEXCEL-FORMLERNA ANVÄNDER GRAM-BASERADE BERÄKNINGAR:');
  console.log('');
  console.log('Weight-rad (R24:T24):');
  console.log('  fatWeightPercent = fat_grams / total_food_weight');
  console.log('  carbWeightPercent = carb_grams / total_food_weight');
  console.log('  proteinWeightPercent = protein_grams / total_food_weight');
  console.log('');
  console.log('Macros-rad (R26:T26):');
  console.log('  fatMacroPercent = fat_grams / (fat_grams + carb_grams + protein_grams)');
  console.log('  carbMacroPercent = carb_grams / (fat_grams + carb_grams + protein_grams)');
  console.log('  proteinMacroPercent = protein_grams / (fat_grams + carb_grams + protein_grams)');
  console.log('');
  console.log('OBS: Excel använder INTE kalori-baserade beräkningar för Macros-raden!');

} catch (e) {
  console.error('Error:', e.message);
}
