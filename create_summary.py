import json
import sys
import io

# Set UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load the detailed analysis
with open(r"c:\Users\jahub\Documents\CalculEat\excel_analysis_detailed.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 100)
print("EXCEL ANALYSIS SUMMARY - Project CalculEat Sheet")
print("=" * 100)

print("\n📊 OVERVIEW")
print("-" * 100)
print(f"Total sheets analyzed: {len(data)}")
print(f"Sheet names: {', '.join(data.keys())}")

# Calculate totals
total_formulas = sum(len(sheet['formulas']) for sheet in data.values())
total_validations = sum(len(sheet['data_validation']) for sheet in data.values())
total_merged = sum(len(sheet['merged_cells']) for sheet in data.values())

print(f"\nTotal formulas across all sheets: {total_formulas}")
print(f"Total data validations: {total_validations}")
print(f"Total merged cells: {total_merged}")

print("\n" + "=" * 100)
print("📋 SHEET-BY-SHEET BREAKDOWN")
print("=" * 100)

for sheet_name, sheet_data in data.items():
    print(f"\n{'=' * 100}")
    print(f"SHEET: {sheet_name}")
    print(f"{'=' * 100}")

    dims = sheet_data['dimensions']
    print(f"Dimensions: {dims['rows']} rows × {dims['cols']} columns")
    print(f"Formulas: {len(sheet_data['formulas'])}")
    print(f"Data validations: {len(sheet_data['data_validation'])}")
    print(f"Merged cells: {len(sheet_data['merged_cells'])}")

    if sheet_data['formulas']:
        print(f"\nKey formulas (first 5):")
        for formula in sheet_data['formulas'][:5]:
            formula_text = formula['formula']
            if len(formula_text) > 100:
                formula_text = formula_text[:97] + "..."
            print(f"  {formula['cell']}: {formula_text}")

        if len(sheet_data['formulas']) > 5:
            print(f"  ... and {len(sheet_data['formulas']) - 5} more formulas")

print("\n" + "=" * 100)
print("🔍 FORMULA COMPLEXITY ANALYSIS")
print("=" * 100)

# Analyze formula complexity
formula_stats = []
for sheet_name, sheet_data in data.items():
    for formula in sheet_data['formulas']:
        formula_text = formula['formula']
        formula_stats.append({
            'sheet': sheet_name,
            'cell': formula['cell'],
            'length': len(formula_text),
            'ifs_count': formula_text.count('IFS('),
            'if_count': formula_text.count('IF('),
            'formula': formula_text
        })

# Sort by length
formula_stats.sort(key=lambda x: x['length'], reverse=True)

print(f"\n📏 Longest formulas (Top 10):")
for i, stat in enumerate(formula_stats[:10], 1):
    print(f"{i}. {stat['sheet']}!{stat['cell']}: {stat['length']} characters, {stat['if_count']} IF statements, {stat['ifs_count']} IFS statements")

# Sort by IF complexity
formula_stats.sort(key=lambda x: x['if_count'] + x['ifs_count'], reverse=True)

print(f"\n🔀 Most complex conditional logic (Top 10):")
for i, stat in enumerate(formula_stats[:10], 1):
    total_conditionals = stat['if_count'] + stat['ifs_count']
    print(f"{i}. {stat['sheet']}!{stat['cell']}: {total_conditionals} conditional statements ({stat['if_count']} IF, {stat['ifs_count']} IFS)")

print("\n" + "=" * 100)
print("📝 DATA VALIDATION SUMMARY")
print("=" * 100)

for sheet_name, sheet_data in data.items():
    if sheet_data['data_validation']:
        print(f"\n{sheet_name}:")
        for validation in sheet_data['data_validation']:
            cells = validation['cells']
            val_type = validation['type']
            formula1 = str(validation['formula1'])[:60]
            print(f"  {cells}: {val_type} - {formula1}")

print("\n" + "=" * 100)
print("🎯 KEY FINDINGS")
print("=" * 100)

print(f"""
1. **Total Complexity**: {total_formulas} formulas across {len(data)} sheets
2. **Profile Sheet**: Most complex with {len(data.get('Profile', {}).get('formulas', []))} formulas
3. **Longest Formula**: {formula_stats[0]['length']} characters in {formula_stats[0]['sheet']}!{formula_stats[0]['cell']}
4. **Data Validation**: {total_validations} validation rules ensure data integrity
5. **Layout Complexity**: {total_merged} merged cells for visual organization

Key Implementation Challenges:
- Complex BMR/TDEE calculations with multiple formulas (Mifflin-St Jeor, Cunningham, etc.)
- Advanced PAL (Physical Activity Level) systems with multiple value tables
- Body composition calculations (FFMI, body fat percentage, etc.)
- Dynamic macro calculations based on goals and modes
- Unit conversion system for food items
- Noom color calculation based on calorie density
""")

print("=" * 100)
print("✅ ANALYSIS COMPLETE")
print("=" * 100)
print(f"\nDetailed JSON data available at: excel_analysis_detailed.json")
print(f"Total data points analyzed: {sum(len(sheet['cell_data']) for sheet in data.values())}")
