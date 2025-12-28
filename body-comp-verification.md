# Body Composition Formula Verification Report

## Siri Equation (1961)

**Spec:** `% Body Fat = ((4.95 / Body density) - 4.5) * 100`
**Code:** `495 / bodyDensity - 450`
**Status:** ✅ CORRECT (algebraically equivalent)

---

## Brozek Equation (1963)

**Spec:** `% Body Fat = (457 / Body Density) - 414.2`
**Code:** `457 / bodyDensity - 414.2`
**Status:** ✅ CORRECT

---

## Jackson/Pollock 3 Caliper Method - Male (1978)

### Variation: S, S², age

**Spec:** `Body density = 1.1093800 - 0.0008267 (ΣS) + 0.0000016 (ΣS)² - 0.0002574 (age)`
**Code:** `1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age`
**Status:** ✅ CORRECT

### Variation: S, S², age, C

**Spec:** `Body density = 1.0990750 - 0.0008209 (ΣS) + 0.0000026 (ΣS)² - 0.0002017 (age) - 0.005675 (Cw) + 0.018586 (Cf)`
**Code:** `1.099075 - 0.0008209 * sum + 0.0000026 * sum * sum - 0.0002017 * age - 0.005675 * waistM + 0.018586 * forearmM`
**Status:** ✅ CORRECT
**Sites:** Pectoral, abdominal, thigh ✅
**Circumferences:** Cw = waist (m), Cf = forearm (m) ✅

---

## Jackson/Pollock 3 Clothes On - Male (1985)

**Spec:** `Body density = 1.1125025 - 0.0013125 (ΣS) + 0.0000055 (ΣS)² - 0.0002440 (age)`
**Code:** `1.1125025 - 0.0013125 * sum + 0.0000055 * sum * sum - 0.000244 * age`
**Status:** ✅ CORRECT
**Sites:** Pectoral, tricep, subscapular ✅

---

## Jackson/Pollock 3 Caliper Method - Female (1980)

### Variation: S, S², age

**Spec:** `Body density = 1.0994921 - 0.0009929 (ΣS) + 0.0000023 (ΣS)² - 0.0001392 (age)`
**Code:** `1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age`
**Status:** ✅ CORRECT
**Sites:** Triceps, thigh, suprailiac ✅

### Variation: S, S², C

**Spec:** `Body density = 1.1466399 - 0.0009300 (ΣS) + 0.0000028 (ΣS)² - 0.0006171 (C)`
**Code:** `1.1466399 - 0.00093 * sum + 0.0000028 * sum * sum - 0.0006171 * hipsCm`
**Status:** ✅ CORRECT
**Circumference:** C = hips (cm) ✅

### Variation: S, S², age, C

**Spec:** `Body density = 1.1470292 - 0.0009376 (ΣS) + 0.0000030 (ΣS)² - 0.0001156 (age) - 0.0005839 (C)`
**Code:** `1.1470292 - 0.0009376 * sum + 0.000003 * sum * sum - 0.0001156 * age - 0.0005839 * hipsCm`
**Status:** ✅ CORRECT

---

## Jackson/Pollock 3 Clothes On - Female (1985)

**Spec:** `Body density = 1.089733 - 0.0009245 (ΣS) + 0.0000025 (ΣS)² - 0.0000979 (age)`
**Code:** `1.089733 - 0.0009245 * sum + 0.0000025 * sum * sum - 0.0000979 * age`
**Status:** ✅ CORRECT
**Sites:** Triceps, suprailiac, abdominal ✅

---

## Jackson/Pollock 4 Caliper Method - Female (1980)

### Variation: S, S², age

**Spec:** `Body density = 1.0960950 - 0.0006952 (ΣS) + 0.0000011 (ΣS)² - 0.0000714 (age)`
**Code:** `1.096095 - 0.0006952 * sum + 0.0000011 * sum * sum - 0.0000714 * age`
**Status:** ✅ CORRECT

### Variation: S, S², C

**Spec:** `Body density = 1.1443913 - 0.0006523 (ΣS) + 0.0000014 (ΣS)² - 0.0006053 (C)`
**Code:** `1.1443913 - 0.0006523 * sum + 0.0000014 * sum * sum - 0.0006053 * hipsCm`
**Status:** ✅ CORRECT

### Variation: S, S², age, C

**Spec:** `Body density = 1.1454464 - 0.0006558 (ΣS) + 0.0000015 (ΣS)² - 0.0000604 (age) - 0.0005981 (C)`
**Code:** `1.1454464 - 0.0006558 * sum + 0.0000015 * sum * sum - 0.0000604 * age - 0.0005981 * hipsCm`
**Status:** ✅ CORRECT

**Sites:** Triceps, thigh, suprailiac, abdominal ✅

---

## Jackson/Pollock 4 Unknown Origin

### Male

**Spec:** `% Body fat = 0.29288 (ΣS) - 0.0005 (ΣS)² + 0.15845 (age) - 5.76377`
**Code:** `0.29288 * sum - 0.0005 * sum * sum + 0.15845 * age - 5.76377`
**Status:** ✅ CORRECT

### Female

**Spec:** `% Body fat = 0.29669 (ΣS) - 0.00043 (ΣS)² + 0.02963 (age) + 1.4072`
**Code:** `0.29669 * sum - 0.00043 * sum * sum + 0.02963 * age + 1.4072`
**Status:** ✅ CORRECT

**Sites:** Triceps, thigh, suprailiac, abdominal ✅

---

## Jackson/Pollock 7 Caliper Method (1978, 1980)

### Male - Variation: S, S², age

**Spec:** `Body density = 1.11200000 - 0.00043499 (ΣS) + 0.00000055 (ΣS)² - 0.00028826 (age)`
**Code:** `1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age`
**Status:** ✅ CORRECT

### Male - Variation: S, S², age, C

**Spec:** `Body density = 1.10100000 - 0.00041150 (ΣS) + 0.00000069 (ΣS)² - 0.00022631 (age) - 0.0059239 (Cw) + 0.0190632 (Cf)`
**Code:** `1.101 - 0.0004115 * sum + 0.00000069 * sum * sum - 0.00022631 * age - 0.0059239 * waistM + 0.0190632 * forearmM`
**Status:** ✅ CORRECT

### Female - Variation: S, S², age

**Spec:** `Body density = 1.0970 - 0.00046971 (ΣS) + 0.00000056 (ΣS)² - 0.00012828 (age)`
**Code:** `1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age`
**Status:** ✅ CORRECT

### Female - Variation: S, S², C

**Spec:** `Body density = 1.1470 - 0.00042359 (ΣS) + 0.00000061 (ΣS)² - 0.00065200 (C)`
**Code:** `1.147 - 0.00042359 * sum + 0.00000061 * sum * sum - 0.000652 * hipsCm`
**Status:** ✅ CORRECT

### Female - Variation: S, S², age, C

**Spec:** `Body density = 1.1470 - 0.00042930 (ΣS) + 0.00000065 (ΣS)² - 0.00009975 (age) - 0.00062415 (C)`
**Code:** `1.147 - 0.0004293 * sum + 0.00000065 * sum * sum - 0.00009975 * age - 0.00062415 * hipsCm`
**Status:** ✅ CORRECT

**Sites:** Pectoral, abdominal, thigh, triceps, subscapular, suprailiac, midaxillary ✅

---

## Durnin/Womersley Caliper Method (1974)

**Sites:** Bicep, tricep, subscapular, suprailiac ✅

### Male 17-19

**Spec:** `Body density = 1.1620 - 0.0630 (logΣS)`
**Code:** `1.162 - 0.063 * logSum`
**Status:** ✅ CORRECT

### Male 20-29

**Spec:** `Body density = 1.1631 - 0.0632 (logΣS)`
**Code:** `1.1631 - 0.0632 * logSum`
**Status:** ✅ CORRECT

### Male 30-39

**Spec:** `Body density = 1.1422 - 0.0544 (logΣS)`
**Code:** `1.1422 - 0.0544 * logSum`
**Status:** ✅ CORRECT

### Male 40-49

**Spec:** `Body density = 1.1620 - 0.0700 (logΣS)`
**Code:** `1.162 - 0.07 * logSum`
**Status:** ✅ CORRECT

### Male ≥50

**Spec:** `Body density = 1.1715 - 0.0779 (logΣS)`
**Code:** `1.1715 - 0.0779 * logSum`
**Status:** ✅ CORRECT

### Female 16-19

**Spec:** `Body density = 1.1549 - 0.0678 (logΣS)`
**Code:** `1.1549 - 0.0678 * logSum`
**Status:** ✅ CORRECT

### Female 20-29

**Spec:** `Body density = 1.1599 - 0.0717 (logΣS)`
**Code:** `1.1599 - 0.0717 * logSum`
**Status:** ✅ CORRECT

### Female 30-39

**Spec:** `Body density = 1.1423 - 0.0632 (logΣS)`
**Code:** `1.1423 - 0.0632 * logSum`
**Status:** ✅ CORRECT

### Female 40-49

**Spec:** `Body density = 1.1333 - 0.0612 (logΣS)`
**Code:** `1.1333 - 0.0612 * logSum`
**Status:** ✅ CORRECT

### Female ≥50

**Spec:** `Body density = 1.1339 - 0.0645 (logΣS)`
**Code:** `1.1339 - 0.0645 * logSum`
**Status:** ✅ CORRECT

---

## Parillo Caliper Method (1993)

**Spec:** `% Body fat = (Sum of measurements * 27) / (Weight)`
**Code:** `(sum * 27) / weightLbs`
**Status:** ✅ CORRECT
**Sites:** Pectoral, abdominal, thigh, biceps, triceps, subscapular, suprailiac, lower back, calf ✅
**Weight:** lbs ✅

---

## Covert Bailey Method (1999)

### Male ≤30

**Spec:** `Waist + (0.5 * Hips) - (3 * Forarm) - Wrist`
**Code:** `waistIn + 0.5 * hipsIn - 3 * forearmIn - wristIn`
**Status:** ✅ CORRECT

### Male >30

**Spec:** `Waist + (0.5 * Hips) - (2.7 * Forarm) - Wrist`
**Code:** `waistIn + 0.5 * hipsIn - 2.7 * forearmIn - wristIn`
**Status:** ✅ CORRECT

### Female ≤30

**Spec:** `Hips + (0.8 * Thigh) - (2 * Calf) - Wrist`
**Code:** `hipsIn + 0.8 * thighIn - 2 * calfIn - wristIn`
**Status:** ✅ CORRECT

### Female >30

**Spec:** `Hips + Thigh - (2 * Calf) - Wrist`
**Code:** `hipsIn + thighIn - 2 * calfIn - wristIn`
**Status:** ✅ CORRECT

**Measurements:** inches ✅

---

## U.S. Navy Body Fat Formula (1984)

### Male

**Spec:** `86.010 * Log10(Waist - Neck) - 70.041 * Log10(Height) + 36.76`
**Code:** `86.01 * Math.log10(waistInches - neckInches) - 70.041 * Math.log10(heightInches) + 36.76`
**Status:** ✅ CORRECT (86.010 ≈ 86.01)
**Required fields:** Hals, Midja (2 värden) ✅

### Female

**Spec:** `163.205 * Log10(Waist + Hips - Neck) - 97.684 * Log10(Height) - 78.387`
**Code:** `163.205 * Math.log10(waistInches + hipInches - neckInches) - 97.684 * Math.log10(heightInches) - 78.387`
**Status:** ✅ CORRECT
**Required fields:** Hals, Midja, Höft (3 värden) ✅

**Measurements:** inches ✅

### ⚠️ UI Bug Found & Fixed (2024-12-28)

**Problem:** `getRequiredFields()` i `bodyCompositionHelpers.ts` krävde alltid 3 fält för båda könen
**Impact:** Män blev felaktigt ombedda att fylla i höftmått (som inte används i formeln)
**Fix:** Lagt till könskontroll - män: 2 fält ['neck', 'waist'], kvinnor: 3 fält ['neck', 'waist', 'hip']
**File:** [bodyCompositionHelpers.ts:102-107](src/lib/helpers/bodyCompositionHelpers.ts#L102-L107)

---

## YMCA Method

### Male

**Spec:** `(4.15 * Waist - 0.082 * Weight - 98.42) / Weight * 100`
**Code:** `((4.15 * waistInches - 0.082 * weightLbs - 98.42) / weightLbs) * 100`
**Status:** ✅ CORRECT

### Female

**Spec:** `(4.15 * Waist - 0.082 * Weight - 76.76) / Weight * 100`
**Code:** `((4.15 * waistInches - 0.082 * weightLbs - 76.76) / weightLbs) * 100`
**Status:** ✅ CORRECT

**Measurements:** inches, Weight: lbs ✅

---

## Modified YMCA Method

### Male

**Spec:** `(-0.082 * Weight + 4.15 * Waist - 94.42) / Weight * 100`
**Code:** `((-0.082 * weightLbs + 4.15 * waistInches - 94.42) / weightLbs) * 100`
**Status:** ✅ CORRECT

### Female

**Spec:** `(0.268 * Weight - 0.318 * Wrist + 0.157 * Waist + 0.245 * Hips - 0.434 * Forarm - 8.987) / Weight * 100`
**Code:** `((0.268 * weightLbs - 0.318 * wristInches + 0.157 * waistInches + 0.245 * hipInches - 0.434 * forearmInches - 8.987) / weightLbs) * 100`
**Status:** ✅ CORRECT

**Measurements:** inches, Weight: lbs ✅

---

## Heritage BMI to Body Fat Method

### Male

**Spec:** `1.39 * BMI + 0.16 * Age - 19.34`
**Code:** `1.39 * bmi + 0.16 * age - 19.34`
**Status:** ✅ CORRECT

### Female

**Spec:** `1.39 * BMI + 0.16 * Age - 9`
**Code:** `1.39 * bmi + 0.16 * age - 9`
**Status:** ✅ CORRECT

---

# FINAL VERDICT: ✅ ALL FORMULAS ARE 100% CORRECT!

No errors found. All body composition formulas match the specifications exactly.
