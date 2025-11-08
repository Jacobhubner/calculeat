import json
import sys
import io
import re

# Set UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load the detailed analysis
with open(r"c:\Users\jahub\Documents\CalculEat\excel_analysis_detailed.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 100)
print("FORMULA VERIFICATION - BMR & Body Composition")
print("=" * 100)

# Find the BMR formula (D17) in Profile sheet
profile_formulas = data['Profile']['formulas']

print("\n🔍 BMR FORMULAS (Cell D17)")
print("=" * 100)

bmr_formula = None
for formula in profile_formulas:
    if formula['cell'] == 'D17':
        bmr_formula = formula['formula']
        break

if bmr_formula:
    # Extract all BMR formula names
    print("\nExtracting BMR formula names from D17...")

    # Find all instances of D8="<formula name>"
    bmr_matches = re.findall(r'D8="([^"]+)"', bmr_formula)

    print(f"\n✓ Found {len(bmr_matches)} BMR formulas:\n")
    for i, formula_name in enumerate(bmr_matches, 1):
        print(f"{i}. {formula_name}")

print("\n" + "=" * 100)
print("🔍 BODY COMPOSITION CALCULATORS (Cell D69 - Body Density)")
print("=" * 100)

body_density_formula = None
for formula in profile_formulas:
    if formula['cell'] == 'D69':
        body_density_formula = formula['formula']
        break

if body_density_formula:
    print("\nExtracting Body Composition method names from D69...")

    # Find all instances of B48="<method name>"
    body_comp_matches = re.findall(r'B48="([^"]+)"', body_density_formula)

    print(f"\n✓ Found {len(body_comp_matches)} Body Composition methods:\n")
    for i, method_name in enumerate(body_comp_matches, 1):
        print(f"{i}. {method_name}")

print("\n" + "=" * 100)
print("🔍 BODY FAT % CONVERSION (Cell D70)")
print("=" * 100)

body_fat_formula = None
for formula in profile_formulas:
    if formula['cell'] == 'D70':
        body_fat_formula = formula['formula']
        break

if body_fat_formula:
    print("\nExtracting Body Fat % calculation methods from D70...")

    # Find all instances of B48="<method name>" in D70
    body_fat_matches = re.findall(r'B48="([^"]+)"', body_fat_formula)

    print(f"\n✓ Found {len(body_fat_matches)} methods in D70:\n")
    for i, method_name in enumerate(body_fat_matches, 1):
        print(f"{i}. {method_name}")

    # Also check for conversion formulas (B50)
    conversion_matches = re.findall(r'B50="([^"]+)"', body_fat_formula)

    if conversion_matches:
        print(f"\n✓ Body Density to Body Fat % conversion formulas:\n")
        for i, conv_name in enumerate(conversion_matches, 1):
            print(f"{i}. {conv_name}")

print("\n" + "=" * 100)
print("🔍 PAL VALUE SYSTEMS (Cell D18 - TDEE)")
print("=" * 100)

tdee_formula = None
for formula in profile_formulas:
    if formula['cell'] == 'D18':
        tdee_formula = formula['formula']
        break

if tdee_formula:
    print("\nExtracting PAL system names from D18...")

    # Find all instances of D9="<PAL system name>"
    pal_matches = re.findall(r'D9="([^"]+)"', tdee_formula)

    print(f"\n✓ Found {len(pal_matches)} PAL value systems:\n")
    for i, pal_name in enumerate(pal_matches, 1):
        print(f"{i}. {pal_name}")

print("\n" + "=" * 100)
print("🔍 ACTIVITY LEVELS (From Data Validations)")
print("=" * 100)

# Check data validations for activity levels
validations = data['Profile']['data_validation']

for validation in validations:
    if 'D10' in validation['cells']:
        print("\nActivity Levels (D10):")
        levels = validation['formula1'].strip('"').split(',')
        for i, level in enumerate(levels, 1):
            print(f"{i}. {level}")

    if 'D11' in validation['cells']:
        print("\nIntensity Levels (D11):")
        intensities = validation['formula1'].strip('"').split(',')
        for i, intensity in enumerate(intensities, 1):
            print(f"{i}. {intensity}")

print("\n" + "=" * 100)
print("🔍 DEFICIT/SURPLUS LEVELS")
print("=" * 100)

for validation in validations:
    if 'D20' in validation['cells']:
        print("\nDeficit Levels (D20):")
        levels = validation['formula1'].strip('"').split(',')
        for i, level in enumerate(levels, 1):
            print(f"{i}. {level}")

print("\n" + "=" * 100)
print("📊 SUMMARY")
print("=" * 100)

print(f"""
BMR Formulas: {len(bmr_matches) if bmr_formula else 'N/A'}
PAL Systems: {len(pal_matches) if tdee_formula else 'N/A'}
Body Composition Methods (D69): {len(body_comp_matches) if body_density_formula else 'N/A'}
Body Fat Calculation Methods (D70): {len(body_fat_matches) if body_fat_formula else 'N/A'}
Body Density Conversion Formulas: {len(conversion_matches) if conversion_matches else 'N/A'}
""")

print("\n" + "=" * 100)
print("✅ VERIFICATION COMPLETE")
print("=" * 100)
