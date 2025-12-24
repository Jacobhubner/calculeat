# Adaptive Thermogenesis (AT) Implementation Specification

> **VIKTIGT**: Denna spec är LÅST och representerar fysiologiskt korrekt implementation.
> Implementera strikt enligt detta - avvikelser bryter den fysiologiska korrektheten.

## 🎯 Grundprincip

Adaptiv termogenes (AT) definieras som förändring i energiförbrukning som sker **utöver** vad som kan förklaras av vikt-, kroppssammansättnings- eller åldersförändringar.

### Core Rules

- ✅ AT beräknas ALLTID på `baseline_bmr` (ALDRIG på current/expected BMR)
- ✅ AT är en fast referenspunkt som INTE uppdateras automatiskt
- ✅ `BMR_effective = BMR_expected + accumulated_at`
- ❌ INGEN dubbelräkning av vikteffekter

---

## 📊 Datamodell

### Database Schema

```sql
-- Lägg till i profiles-tabellen
ALTER TABLE profiles
ADD COLUMN baseline_bmr DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN accumulated_at DECIMAL(10,2) DEFAULT 0,
ADD COLUMN last_at_calculation_date DATE DEFAULT NULL;

COMMENT ON COLUMN profiles.baseline_bmr IS 'Fast referenspunkt för AT-beräkning. Sätts vid första profilen baserat på Mifflin-St Jeor (om manuell TDEE) eller vald BMR-metod (om beräknad). Ändras INTE automatiskt.';
COMMENT ON COLUMN profiles.accumulated_at IS 'Ackumulerad metabolisk anpassning i kcal/dag. Range: -12% till +6% av baseline_bmr';
COMMENT ON COLUMN profiles.last_at_calculation_date IS 'Senaste AT-beräkning (för cron job)';

-- AT History Table (valfri men rekommenderad)
CREATE TABLE adaptive_thermogenesis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  baseline_bmr DECIMAL(10,2) NOT NULL,
  bmr_expected DECIMAL(10,2) NOT NULL,
  calorie_balance_7d DECIMAL(10,2) NOT NULL,
  at_weekly DECIMAL(10,2) NOT NULL,
  accumulated_at DECIMAL(10,2) NOT NULL,
  bmr_effective DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, calculation_date)
);

CREATE INDEX idx_at_history_profile ON adaptive_thermogenesis_history(profile_id, calculation_date DESC);
```

### TypeScript Types

```typescript
// src/lib/types.ts

export interface AdaptiveThermogenesisData {
  baseline_bmr: number | null
  accumulated_at: number
  last_at_calculation_date: string | null
}

export interface ATCalculationInput {
  baseline_bmr: number
  current_bmr_expected: number
  calorie_balance_7d: number // Veckobalans i kcal
  current_accumulated_at: number
}

export interface ATCalculationResult {
  at_weekly: number // Veckovis förändring
  accumulated_at: number // Ny ackumulerad AT
  bmr_effective: number // BMR_expected + accumulated_at
  is_at_max_limit: boolean // +6% limit nådd?
  is_at_min_limit: boolean // -12% limit nådd?
}

export interface ATHistoryEntry {
  id: string
  profile_id: string
  calculation_date: string
  baseline_bmr: number
  bmr_expected: number
  calorie_balance_7d: number
  at_weekly: number
  accumulated_at: number
  bmr_effective: number
  created_at: string
}
```

---

## 🧮 AT Beräkningslogik

### Konstanter

```typescript
const AT_DEFICIT_RATE = -0.015 // -1.5% av baseline per vecka vid underskott
const AT_SURPLUS_RATE = 0.0075 // +0.75% av baseline per vecka vid överskott
const AT_MIN_LIMIT = -0.12 // Max -12% av baseline_bmr
const AT_MAX_LIMIT = 0.06 // Max +6% av baseline_bmr
```

### Beräkningsalgoritm

```typescript
// src/lib/calculations/adaptiveThermogenesis.ts

export function calculateWeeklyAT(input: ATCalculationInput): ATCalculationResult {
  const { baseline_bmr, current_bmr_expected, calorie_balance_7d, current_accumulated_at } = input

  // 1. Beräkna veckovis AT ENDAST baserat på baseline_bmr
  let at_weekly = 0
  if (calorie_balance_7d < 0) {
    // Underskott -> metabolisk nedgång
    at_weekly = AT_DEFICIT_RATE * baseline_bmr
  } else if (calorie_balance_7d > 0) {
    // Överskott -> metabolisk uppgång
    at_weekly = AT_SURPLUS_RATE * baseline_bmr
  }
  // Om calorie_balance = 0 → ingen förändring

  // 2. Beräkna ny ackumulerad AT
  let new_accumulated_at = current_accumulated_at + at_weekly

  // 3. Applicera begränsningar
  const min_limit = AT_MIN_LIMIT * baseline_bmr // -12%
  const max_limit = AT_MAX_LIMIT * baseline_bmr // +6%

  const is_at_min_limit = new_accumulated_at <= min_limit
  const is_at_max_limit = new_accumulated_at >= max_limit

  // Clamp till gränser
  new_accumulated_at = Math.max(min_limit, Math.min(max_limit, new_accumulated_at))

  // 4. Beräkna effektiv BMR
  // BMR_expected innehåller redan vikt/ålder/kön-anpassning
  // accumulated_at läggs på som metabolisk anpassning
  const bmr_effective = current_bmr_expected + new_accumulated_at

  return {
    at_weekly,
    accumulated_at: new_accumulated_at,
    bmr_effective,
    is_at_max_limit,
    is_at_min_limit,
  }
}
```

---

## 📅 När körs beräkningarna?

### 1. Baseline BMR sätts (EN gång)

**När:**

- När användaren fyller i Grundläggande information (första profilen)

**Hur:**

```typescript
// Om manuell TDEE vald:
baseline_bmr = calculateMifflinStJeor(weight, height, age, gender)

// Om beräknad TDEE (från TDEE-kalkylator):
baseline_bmr = användarens valda BMR-metod (Mifflin/Katch-McArdle/etc)
```

**Visas:**

- I sidopanelen under "Baseline BMR (AT-referens)"
- Tooltip: "Fast referenspunkt för beräkning av metabolisk anpassning"

### 2. AT uppdateras (löpande)

**När:**

- Via cron job **1 gång per dag** (körs på servern)

**Process:**

```typescript
// Pseudokod för daily cron job
async function dailyATCalculation() {
  // För varje profil:
  // 1. Hämta senaste 7 dagarnas data
  const last7Days = await getLastSevenDays(profileId)

  // 2. Beräkna genomsnittlig kaloribalans
  const meanIntake = average(last7Days.map(d => d.calories_consumed))
  const meanTDEE = average(last7Days.map(d => d.tdee_estimate))
  const calorie_balance_7d = (meanIntake - meanTDEE) * 7

  // 3. Beräkna current BMR_expected (med aktuell vikt/ålder)
  const bmr_expected = calculateBMR(currentWeight, height, age, gender, method)

  // 4. Kör AT-beräkning
  const result = calculateWeeklyAT({
    baseline_bmr: profile.baseline_bmr,
    current_bmr_expected: bmr_expected,
    calorie_balance_7d,
    current_accumulated_at: profile.accumulated_at,
  })

  // 5. Spara till databas
  await updateProfile({
    accumulated_at: result.accumulated_at,
    last_at_calculation_date: new Date(),
  })

  // 6. Spara till historik (valfritt)
  await saveATHistory(result)
}
```

---

## 🎨 UI/UX Implementation

### 1. Visning i Sidopanelen

```typescript
// Sektion: "Metabolisk Information"
<Card>
  <CardHeader>
    <CardTitle>Metabolisk Information</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Baseline BMR */}
    <div className="flex justify-between">
      <span className="text-sm text-neutral-600">
        Baseline BMR
        <InfoTooltip>Fast referenspunkt för AT-beräkning</InfoTooltip>
      </span>
      <span className="font-semibold">{profile.baseline_bmr?.toFixed(0)} kcal</span>
    </div>

    {/* Aktuell BMR (expected) */}
    <div className="flex justify-between">
      <span className="text-sm text-neutral-600">Aktuell BMR (beräknad)</span>
      <span className="font-semibold">{bmrExpected.toFixed(0)} kcal</span>
    </div>

    {/* AT påverkan */}
    <div className="flex justify-between">
      <span className="text-sm text-neutral-600">
        Metabolisk anpassning (AT)
        <InfoTooltip>
          Energi som sparas/förbrukas p.g.a. metabolisk anpassning utöver viktförändring
        </InfoTooltip>
      </span>
      <span className={`font-semibold ${atValue < 0 ? 'text-blue-600' : 'text-orange-600'}`}>
        {atValue > 0 ? '+' : ''}{atValue.toFixed(0)} kcal/dag
        <span className="text-xs ml-1">({atPercent.toFixed(1)}%)</span>
      </span>
    </div>

    {/* Effektiv BMR */}
    <Separator />
    <div className="flex justify-between">
      <span className="text-sm font-semibold text-neutral-700">Effektiv BMR</span>
      <span className="font-bold text-primary-600">
        {bmrEffective.toFixed(0)} kcal
      </span>
    </div>
  </CardContent>
</Card>
```

### 2. Metabolisk Anpassning (AT) - Egen sektion

```typescript
// Nära vikthistoriken
<Card>
  <CardHeader>
    <CardTitle>Metabolisk Anpassning (AT)</CardTitle>
    <CardDescription>
      Hur din metabolism har anpassat sig över tid
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Graf över AT över tid */}
    <ATHistoryChart profileId={profile.id} />

    {/* Nuvarande status */}
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <p className="text-sm">
        <strong>Nuvarande anpassning:</strong> {atValue.toFixed(0)} kcal/dag
      </p>
      <p className="text-xs text-neutral-600 mt-1">
        {atValue < 0
          ? 'Din metabolism har sänkts för att spara energi vid underskott'
          : 'Din metabolism har ökat vid kaloriöverskott'}
      </p>
    </div>
  </CardContent>
</Card>
```

### 3. Avancerade inställningar (Baseline Reset)

```typescript
// Under "Avancerade inställningar"
<Card className="border-amber-300">
  <CardHeader>
    <CardTitle className="text-amber-700">⚠️ Återställ Baseline BMR</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-neutral-700 mb-4">
      Detta återställer din baseline BMR till nuvarande beräknad BMR och nollställer
      all ackumulerad metabolisk anpassning (AT).
    </p>
    <p className="text-sm text-amber-700 mb-4">
      <strong>Varning:</strong> Gör endast detta efter 8-12 veckor dokumenterad
      vikt- och energibalans.
    </p>
    <Button
      variant="outline"
      className="border-amber-500 text-amber-700"
      onClick={handleResetBaseline}
    >
      Återställ Baseline
    </Button>
  </CardContent>
</Card>
```

---

## 🔄 Calorie Balance Definition

### Primär metod (föredragen)

```typescript
// Beräkna 7-dagars rullande genomsnitt
const last7Days = await getWeightAndCaloriesLast7Days(profileId)

const meanDailyIntake = average(last7Days.map(d => d.calories_consumed))
const meanDailyTDEE = average(last7Days.map(d => d.tdee_estimate))

const calorie_balance_7d = (meanDailyIntake - meanDailyTDEE) * 7
```

### Alternativ metod (viktbaserad, valfri)

```typescript
// Endast för kalibrering, INTE primär AT-styrning
const weightChange = currentWeight - weightSevenDaysAgo
const calorie_balance_7d_alt = weightChange * 7700 // kcal
```

---

## 🔒 Baseline Reset Logic

### När ska baseline uppdateras?

**ALDRIG automatiskt.**

Endast:

1. **Manuellt** av användaren (via Avancerade inställningar)
2. **Efter 8-12 veckor** dokumenterad vikt- och energibalans (valfri automatisk prompt)

### Vad händer vid reset?

```typescript
async function resetBaseline(profileId: string) {
  // 1. Beräkna ny baseline från AKTUELL data
  const currentBMR = calculateBMR(currentWeight, height, age, gender, method)

  // 2. Nollställ AT
  await updateProfile(profileId, {
    baseline_bmr: currentBMR,
    accumulated_at: 0,
    last_at_calculation_date: new Date(),
  })

  // 3. Logga händelsen
  await logBaselineReset(profileId, currentBMR)
}
```

---

## 🧪 Testfall

### Test 1: Initial Setup

```typescript
// Given: Ny användare, 80kg, 180cm, 30år, man
const baseline = calculateMifflin(80, 180, 30, 'male') // ~1750 kcal

// Expected:
expect(profile.baseline_bmr).toBe(1750)
expect(profile.accumulated_at).toBe(0)
```

### Test 2: 4 veckor underskott (-500 kcal/dag)

```typescript
// After 4 weeks with -500 kcal/day deficit:
// AT_weekly = -0.015 * 1750 = -26.25 kcal/week
// Total AT = -26.25 * 4 = -105 kcal/day

expect(profile.accumulated_at).toBeCloseTo(-105)
```

### Test 3: AT når min-limit

```typescript
// After 8 weeks at maximum deficit:
// Min limit = -0.12 * 1750 = -210 kcal
// AT cannot go below this

expect(profile.accumulated_at).toBeGreaterThanOrEqual(-210)
```

### Test 4: BMR_effective beräkning

```typescript
// Current weight: 75kg (lost 5kg)
const bmr_expected = calculateMifflin(75, 180, 30, 'male') // ~1650 kcal
const accumulated_at = -105

const bmr_effective = bmr_expected + accumulated_at
expect(bmr_effective).toBe(1545) // 1650 - 105
```

---

## ✅ Implementation Checklist

- [ ] Database migration (baseline_bmr, accumulated_at, at_history table)
- [ ] TypeScript types (ATCalculationInput, ATCalculationResult, etc)
- [ ] AT calculation function (`calculateWeeklyAT`)
- [ ] Set baseline BMR on profile creation
- [ ] Daily cron job for AT calculation
- [ ] UI component: Metabolisk Information (sidebar)
- [ ] UI component: Metabolisk Anpassning (AT) section
- [ ] UI component: AT history chart
- [ ] UI component: Baseline reset (Advanced Settings)
- [ ] Tests: AT calculation edge cases
- [ ] Tests: Baseline reset logic
- [ ] Documentation: User guide for AT

---

## 🚨 Common Mistakes to Avoid

❌ **FELAKTIGT:**

```typescript
// Beräkna AT på aktuell BMR
const at_weekly = -0.015 * current_bmr_expected // WRONG!
```

✅ **KORREKT:**

```typescript
// Beräkna AT på baseline BMR
const at_weekly = -0.015 * baseline_bmr // CORRECT!
```

---

❌ **FELAKTIGT:**

```typescript
// Uppdatera baseline automatiskt vid viktnedgång
baseline_bmr = calculateBMR(newWeight, ...) // WRONG!
```

✅ **KORREKT:**

```typescript
// Baseline förblir konstant
// Endast BMR_expected uppdateras
bmr_expected = calculateBMR(newWeight, ...)
bmr_effective = bmr_expected + accumulated_at
```

---

## 📚 Fysiologisk Bakgrund

### Varför denna modell?

1. **AT existerar oberoende av vikt**
   - Metabolisk anpassning sker även när vikt/komposition är konstant
   - Därför: AT måste beräknas mot en fast baseline

2. **BMR_expected fångar redan vikteffekter**
   - Viktminskning → lägre BMR_expected (automatiskt)
   - AT representerar anpassning UTÖVER detta

3. **AT är långsam och ackumulerande**
   - Inte en daglig fluktuering
   - Byggd över veckor/månader av energibalans

4. **Reversibel vid återgång till balans**
   - AT närmar sig 0 vid långvarig energibalans
   - Därför: reset efter 8-12 veckor balans

---

## 🔗 Referenser

- Minnesota Starvation Experiment (Keys et al., 1950)
- Rosenbaum et al. (2008) - Leptin reverses weight loss-induced changes in energy expenditure
- Trexler et al. (2014) - Metabolic adaptation to weight loss

---

**Skapad:** 2024-12-20
**Version:** 1.0
**Status:** SPECIFICATION LOCKED - Klar för implementation
