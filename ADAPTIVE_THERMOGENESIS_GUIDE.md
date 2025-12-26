# Adaptive Thermogenesis (AT) - Komplett Guide

## 🎯 Vad är Adaptive Thermogenesis (AT)?

**Enkel förklaring:**
När du går ner i vikt genom att äta mindre, sjunker din metabolism på **två sätt**:

1. **Naturlig minskning** - Du väger mindre → kroppen behöver mindre energi (detta är förväntat)
2. **Metabolisk anpassning (AT)** - Kroppen "försvarar sig" mot viktnedgång genom att sänka metabolismen EXTRA mycket (utöver viktförlusten)

**Exempel:**
- Du väger 80 kg → BMR = 1750 kcal
- Efter diet väger du 75 kg → **Förväntad BMR** = 1650 kcal (baserat på ny vikt)
- Men **verklig BMR** = 1545 kcal
- **Skillnaden** (-105 kcal) = Adaptive Thermogenesis

Din metabolism har sänkts **105 kcal mer** än vad som kan förklaras av viktförlusten. Detta är din kropp som "sparar energi".

---

## 📊 Varför är AT viktigt att mäta?

### Problem utan AT-tracking:
```
Vecka 1: Äter 1800 kcal, TDEE = 2500 kcal → Underskott -700 kcal ✅
Vecka 8: Äter 1800 kcal, men TDEE har sjunkit till 2200 kcal → Underskott -400 kcal
Vecka 12: Äter 1800 kcal, TDEE nu 2000 kcal → Underskott -200 kcal
```

Du äter samma mängd, men viktnedgången saktar ner eftersom din metabolism anpassat sig.

### Med AT-tracking:
```
Vecka 1: TDEE 2500 kcal, AT = 0
Vecka 8: TDEE 2200 kcal, AT = -100 kcal (metabolismen har sänkts extra)
         → Du vet att metabolismen anpassat sig, inte bara att du "gör fel"
```

---

## 🏗️ Hur fungerar AT-systemet? (Del för del)

### 1️⃣ **Baseline BMR** (Fast referenspunkt)

**Vad:** Din "ursprungliga" basmetabolism när du startade.

**Varför:** Vi behöver en fast punkt att jämföra mot, annars vet vi inte om metabolismen förändrats utöver viktförändringen.

**När sätts den:**
- Första gången du anger TDEE (manuellt eller via kalkylatorn)
- Använder Mifflin-St Jeor formeln: `(9.99 × vikt) + (6.25 × längd) - (4.92 × ålder) + 5/-161`

**Kod (ManualTDEEEntry.tsx:38-43):**
```typescript
// Calculate baseline_bmr using Mifflin-St Jeor (for manual TDEE entry)
let baseline_bmr: number | undefined
if (initialWeight && height && birthDate && gender && gender !== '') {
  const age = calculateAge(birthDate)
  baseline_bmr = calculateBMR(initialWeight, height, age, gender)
}
```

**Exempel:**
- Startvikt: 80 kg, längd: 180 cm, ålder: 30, man
- Baseline BMR = **1750 kcal** ← Detta värde ändras ALDRIG automatiskt

---

### 2️⃣ **Accumulated AT** (Ackumulerad metabolisk anpassning)

**Vad:** Hur mycket din metabolism har förändrats UTÖVER viktförändringen, mätt i kcal/dag.

**Varför:** Detta är själva AT-värdet vi vill spåra.

**Hur beräknas den:**
Varje vecka (när Edge Function körs):
```typescript
if (kaloriunderskott) {
  AT minskar med 1.5% av baseline BMR per vecka
} else if (kaloriöverskott) {
  AT ökar med 0.75% av baseline BMR per vecka
}
```

**Gränser:**
- **Minimum:** -12% av baseline (max nedgång)
- **Maximum:** +6% av baseline (max uppgång)

**Exempel:**
```
Baseline BMR = 1750 kcal

Vecka 1 (underskott): AT = -26 kcal (-1.5% av 1750)
Vecka 2 (underskott): AT = -52 kcal (ackumuleras)
Vecka 4 (underskott): AT = -105 kcal
Vecka 12 (nått min): AT = -210 kcal (-12% av 1750, kan inte sjunka mer)
```

---

### 3️⃣ **Current BMR Expected** (Förväntad BMR baserat på nuvarande vikt)

**Vad:** Vad din BMR BORDE vara baserat på din nuvarande vikt.

**Varför:** Detta visar den "naturliga" förändringen från viktförändring.

**Beräknas varje gång:**
```typescript
const age = calculateAge(profile.birth_date)
const bmr_expected = calculateBMR(currentWeight, height, age, gender)
```

**Exempel:**
```
Startvikt: 80 kg → Expected BMR = 1750 kcal
Efter diet: 75 kg → Expected BMR = 1650 kcal (100 kcal mindre pga vikten)
```

---

### 4️⃣ **Effective BMR** (Verklig/Effektiv BMR)

**Vad:** Din VERKLIGA metabolism = Expected BMR + AT

**Varför:** Detta är vad din kropp faktiskt förbränner.

**Formel:**
```typescript
const bmr_effective = bmr_expected + accumulated_at
```

**Exempel:**
```
Expected BMR: 1650 kcal (baserat på vikt 75 kg)
AT: -105 kcal (metabolisk anpassning)
───────────────────────
Effective BMR: 1545 kcal ← Din VERKLIGA metabolism
```

Din kropp förbränner 105 kcal MINDRE per dag än vad den "borde" baserat på vikten.

---

### 5️⃣ **Effective TDEE** (Automatisk TDEE-uppdatering)

**Vad:** Din VERKLIGA totala energiförbrukning baserat på effektiv BMR och din aktivitetsnivå.

**Varför:** TDEE uppdateras automatiskt när AT förändras, så du alltid ser din faktiska energiförbrukning.

**Hur det fungerar:**

1. **PAL-faktor beräknas från ursprunglig TDEE:**
   ```typescript
   const palFactor = originalTDEE / baseline_bmr
   // Exempel: 2520 / 1800 = 1.4
   ```

2. **Effektiv TDEE beräknas dynamiskt:**
   ```typescript
   const effectiveTDEE = effectiveBMR × palFactor
   ```

**Exempel - Diet (8 veckor):**
```
Start:
- Baseline BMR: 1800 kcal
- Original TDEE: 2520 kcal
- PAL-faktor: 1.4
- AT: 0 kcal
→ Visat TDEE: 2520 kcal

Efter 8 veckor:
- Aktuell BMR: 1750 kcal (lägre pga vikt)
- AT: -200 kcal
- Effektiv BMR: 1750 - 200 = 1550 kcal
- Effektiv TDEE: 1550 × 1.4 = 2170 kcal
→ Visat TDEE: 2170 kcal (Justerat för AT)
→ TDEE minskade automatiskt med 350 kcal!
```

**Exempel - Bulk (8 veckor):**
```
Start:
- Baseline BMR: 1800 kcal
- Original TDEE: 2520 kcal
- PAL-faktor: 1.4
- AT: 0 kcal
→ Visat TDEE: 2520 kcal

Efter 8 veckor:
- Aktuell BMR: 1850 kcal (högre pga vikt)
- AT: +150 kcal
- Effektiv BMR: 1850 + 150 = 2000 kcal
- Effektiv TDEE: 2000 × 1.4 = 2800 kcal
→ Visat TDEE: 2800 kcal (Justerat för AT)
→ TDEE ökade automatiskt med 280 kcal!
```

**Kod (ProfileResultsSummary.tsx:40-51):**
```typescript
if (profile.baseline_bmr && currentBMR && baseTdee) {
  // Calculate PAL factor from original TDEE and baseline BMR
  const palFactor = baseTdee / profile.baseline_bmr

  // Calculate effective BMR (current BMR + AT)
  const accumulatedAT = profile.accumulated_at || 0
  const effectiveBMR = currentBMR + accumulatedAT

  // Calculate effective TDEE using PAL factor
  tdee = effectiveBMR * palFactor
  isAdjustedForAT = accumulatedAT !== 0
}
```

**Fördelar:**
- ✅ TDEE justeras automatiskt när AT ändras
- ✅ Behåller din aktivitetsnivå (PAL-faktorn)
- ✅ Visar "Justerat för AT" när justering sker
- ✅ Original TDEE sparas oförändrat i databasen
- ✅ Fungerar för både diet och bulk

---

## 🔄 Hur beräknas AT? (Backend Edge Function)

### Edge Function (`calculate-adaptive-thermogenesis`)

**Vad gör den:**
1. Hämtar alla profiler som har `baseline_bmr` satt
2. För varje profil:
   - Kollar viktförändring de senaste 7 dagarna
   - Estimerar kaloribalansen från viktförändringen
   - Beräknar AT-förändring
   - Uppdaterar `accumulated_at`
   - Sparar till historik

**Steg-för-steg:**

#### Steg 1: Hämta viktvärden
```typescript
// Get weight history for last 7 days
const { data: weightHistory } = await supabase
  .from('weight_history')
  .select('weight_kg, recorded_at')
  .eq('profile_id', profile.id)
  .gte('recorded_at', sevenDaysAgo.toISOString())
```

**Varför:** Vi behöver minst 2 viktvärden för att se en trend.

**Exempel:**
```
Dag 1: 80.0 kg
Dag 7: 79.5 kg
```

#### Steg 2: Beräkna kaloribalans från vikten
```typescript
const weightChange = lastWeight - firstWeight  // -0.5 kg
const calorie_balance_7d = weightChange * 7700 // -3850 kcal
```

**Varför 7700?**
- 1 kg kroppsfett ≈ 7700 kcal
- Om du gått ner 0.5 kg → du har haft ett underskott på ~3850 kcal den veckan

#### Steg 3: Beräkna AT-förändring
```typescript
function calculateWeeklyAT(baseline_bmr, calorie_balance_7d, current_accumulated_at) {
  let at_weekly = 0

  if (calorie_balance_7d < 0) {
    // Underskott → metabolism sjunker
    at_weekly = -0.015 * baseline_bmr  // -1.5%
  } else if (calorie_balance_7d > 0) {
    // Överskott → metabolism ökar
    at_weekly = 0.0075 * baseline_bmr  // +0.75%
  }

  // Lägg till på ackumulerad AT
  let new_accumulated_at = current_accumulated_at + at_weekly

  // Begränsa till -12% / +6%
  const min_limit = -0.12 * baseline_bmr
  const max_limit = 0.06 * baseline_bmr
  new_accumulated_at = Math.max(min_limit, Math.min(max_limit, new_accumulated_at))

  return { accumulated_at: new_accumulated_at, at_weekly }
}
```

**Exempel:**
```
Baseline BMR: 1750 kcal
Kaloribalans: -3850 kcal (underskott)
AT denna vecka: -0.015 × 1750 = -26.25 kcal

Om tidigare AT var -78 kcal:
Ny AT = -78 + (-26.25) = -104.25 kcal
```

#### Steg 4: Uppdatera databasen
```typescript
// Update profile
await supabase.from('profiles').update({
  accumulated_at: atResult.accumulated_at,
  last_at_calculation_date: new Date().toISOString().split('T')[0],
})

// Save to history
await supabase.from('adaptive_thermogenesis_history').insert({
  profile_id: profile.id,
  calculation_date: today,
  baseline_bmr: 1750,
  bmr_expected: 1650,
  calorie_balance_7d: -3850,
  at_weekly: -26,
  accumulated_at: -104,
  bmr_effective: 1546,
})
```

---

## 🎨 UI-Komponenter

### **ProfileResultsSummary.tsx** (Resultat i sidopanelen)

**Vad visas:**
```
┌─────────────────────────────────┐
│ Resultat                        │
├─────────────────────────────────┤
│ TDEE                2170 kcal   │
│ Totalt energibehov              │
│ Justerat för AT                 │
│                                 │
│ Kaloriintervall                 │
│ 2105-2235 kcal                  │
└─────────────────────────────────┘
```

**Nyheter:**
- TDEE uppdateras automatiskt baserat på AT
- Visar "Justerat för AT" när AT är aktivt
- Kaloriintervallet baseras på effektiv TDEE

**Kod (ProfileResultsSummary.tsx:26-51):**
```typescript
// Calculate current BMR (based on current weight)
let currentBMR: number | null = null
if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
  const age = calculateAge(profile.birth_date)
  currentBMR = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
}

const baseTdee = profile.tdee

// Calculate effective TDEE if AT is enabled
let tdee = baseTdee
let isAdjustedForAT = false

if (profile.baseline_bmr && currentBMR && baseTdee) {
  const palFactor = baseTdee / profile.baseline_bmr
  const accumulatedAT = profile.accumulated_at || 0
  const effectiveBMR = currentBMR + accumulatedAT
  tdee = effectiveBMR * palFactor
  isAdjustedForAT = accumulatedAT !== 0
}
```

---

### **MetabolicInfo.tsx** (Metabolisk Information i sidopanelen)

**Vad visas:**
```
┌─────────────────────────────────┐
│ 🔥 Metabolisk Information       │
├─────────────────────────────────┤
│ Baseline BMR        1750 kcal   │
│ ℹ Fast referenspunkt för AT     │
│ Baserat på Mifflin-St Jeor*     │
│                                 │
│ Aktuell BMR         1650 kcal   │
│ Baserat på nuvarande vikt       │
│                                 │
│ Metabolisk anpassning (AT)      │
│ ↓ -105 kcal/dag (-6.0%)         │
│                                 │
│ Effektiv BMR        1545 kcal   │
│ BMR med AT-anpassning           │
└─────────────────────────────────┘
```
*Visas endast om TDEE angavs manuellt

**Nyheter:**
- Röd flamm-ikon (🔥) för metabolisk information
- Visar "Baserat på Mifflin-St Jeor" när TDEE angavs manuellt
- Tydlig indikation om AT är negativ (↓) eller positiv (↑)

**Kod (MetabolicInfo.tsx:24-62):**
```typescript
// Check if TDEE was manually entered
const isTdeeManual = profile.tdee_source === 'manual'

// Calculate current expected BMR
let bmrExpected: number | null = null
if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
  const age = calculateAge(profile.birth_date)
  bmrExpected = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
}

const baselineBMR = profile.baseline_bmr
const accumulatedAT = profile.accumulated_at || 0
const bmrEffective = bmrExpected ? bmrExpected + accumulatedAT : null

// UI showing baseline with optional Mifflin note
{isTdeeManual && (
  <span className="block mt-0.5 text-neutral-400">
    Baserat på Mifflin-St Jeor
  </span>
)}
```

---

### **ATHistoryCard.tsx** (Historik)

**Vad visas:**
Lista över de senaste 10 AT-beräkningarna:

```
2024-12-25    ↓ -105 kcal (-6.0%)
Balans: -3850 kcal/vecka

2024-12-18    ↓ -78 kcal (-4.5%)
Balans: -3500 kcal/vecka

...
```

**Varför:** Du kan se trenden och hur din metabolism förändrats över tid.

---

### **BaselineResetCard.tsx** (Återställning)

**När använd:**
Efter 8-12 veckor av:
- Stabil vikt (±1 kg)
- Energibalans (äter lika mycket som du förbränner)
- Metabolismen har återhämtat sig

**Vad händer:**
```typescript
// Beräkna ny baseline från nuvarande data
const newBaselineBMR = calculateBMR(currentWeight, height, age, gender)

// Nollställ AT
await updateProfile({
  baseline_bmr: newBaselineBMR,  // Ny baseline
  accumulated_at: 0,              // Nollställ AT
})
```

**Exempel:**
```
Före reset:
- Baseline BMR: 1750 kcal (från 80 kg)
- Current BMR: 1650 kcal (75 kg)
- AT: -105 kcal
- Effective: 1545 kcal

Efter reset:
- Baseline BMR: 1650 kcal (ny baseline från 75 kg)
- Current BMR: 1650 kcal
- AT: 0 kcal (nollställd)
- Effective: 1650 kcal
```

Nu börjar du om från en ny utgångspunkt.

---

## 🔧 Hur allt hänger ihop - Komplett flöde

### 1. **Du börjar använda appen**
```
Dag 1: Anger TDEE manuellt (2500 kcal)
       → baseline_bmr sätts till 1750 kcal
       → accumulated_at = 0
```

**Vad händer i koden:**
- Du fyller i grundläggande information (vikt, längd, ålder, kön)
- Du anger TDEE manuellt eller via kalkylatorn
- `ManualTDEEEntry.tsx` eller `TDEECalculatorTool.tsx` beräknar och sparar:
  ```typescript
  baseline_bmr: calculateBMR(initialWeight, height, age, gender)
  accumulated_at: 0
  ```

### 2. **Du loggar din vikt regelbundet**
```
Dag 1: 80.0 kg
Dag 3: 79.8 kg
Dag 7: 79.5 kg
```

**Vad händer i koden:**
- Du använder `WeightTracker` komponenten
- Vikten sparas i `weight_history` tabellen
- Varje viktlogg får ett `recorded_at` timestamp

### 3. **Edge Function körs (dagligen via cron)**
```
Kollar vikthistoriken:
- Första vikt (dag 1): 80.0 kg
- Senaste vikt (dag 7): 79.5 kg
- Förändring: -0.5 kg

Beräknar:
- Kaloribalans: -0.5 × 7700 = -3850 kcal
- AT denna vecka: -1.5% × 1750 = -26 kcal
- Ny accumulated AT: 0 + (-26) = -26 kcal

Uppdaterar profilen:
- accumulated_at = -26
- Sparar till historik
```

**Vad händer i koden:**
```typescript
// Edge Function (index.ts)
const { data: weightHistory } = await supabase
  .from('weight_history')
  .select('weight_kg, recorded_at')
  .eq('profile_id', profile.id)
  .gte('recorded_at', sevenDaysAgo)

const weightChange = lastWeight - firstWeight
const calorie_balance_7d = weightChange * 7700

const atResult = calculateWeeklyAT(
  profile.baseline_bmr,
  calorie_balance_7d,
  profile.accumulated_at
)

await supabase.from('profiles').update({
  accumulated_at: atResult.accumulated_at
})

await supabase.from('adaptive_thermogenesis_history').insert({
  // ... historikdata
})
```

### 4. **UI uppdateras automatiskt**
```
Sidopanel visar nu:
- Baseline BMR: 1750 kcal
- Current BMR: 1746 kcal (mindre pga vikt)
- AT: -26 kcal (-1.5%)
- Effective BMR: 1720 kcal
```

**Vad händer i koden:**
```typescript
// MetabolicInfo.tsx
const bmrExpected = calculateBMR(currentWeight, height, age, gender)
const accumulatedAT = profile.accumulated_at
const bmrEffective = bmrExpected + accumulatedAT

// Visar i UI
<p>Baseline BMR: {baselineBMR} kcal</p>
<p>Aktuell BMR: {bmrExpected} kcal</p>
<p>AT: {accumulatedAT} kcal</p>
<p>Effektiv BMR: {bmrEffective} kcal</p>
```

### 5. **Efter 4 veckor**
```
Vikt: 78 kg (-2 kg)
AT: -105 kcal (-6%)
Effective BMR: 1545 kcal

Du ser att metabolismen sänkts 105 kcal mer än vad vikten motiverar!
```

---

## 📐 Matematisk förklaring

### Varför baseline är viktigt

**Scenario: Utan baseline (felaktigt)**
```
Vecka 1: Vikt 80kg, BMR 1750, AT beräknas på 1750
Vecka 4: Vikt 75kg, BMR 1650, AT beräknas på 1650 ← FEL!

Problem: Vi "flyttar målposten" - AT beräknas på en BMR som redan sjunkit
```

**Med baseline (korrekt)**
```
Vecka 1: Vikt 80kg, Baseline BMR = 1750 (sätts en gång)
Vecka 4: Vikt 75kg, Expected BMR = 1650
         AT beräknas fortfarande på 1750 ← RÄTT!

Expected BMR 1650 fångar vikteffekten
AT -105 fångar den EXTRA anpassningen
```

### Räkneexempel komplett

**Utgångsläge:**
- Vikt: 80 kg
- Baseline BMR: 1750 kcal
- TDEE: 2500 kcal
- Äter: 1800 kcal/dag (underskott -700 kcal/dag)

**Vecka 1:**
```
Viktförändring: -0.5 kg
Kaloribalans: -0.5 × 7700 = -3850 kcal
AT-förändring: -0.015 × 1750 = -26.25 kcal
Ackumulerad AT: 0 + (-26.25) = -26 kcal

Expected BMR (79.5 kg): 1746 kcal
Effective BMR: 1746 + (-26) = 1720 kcal
```

**Vecka 4:**
```
Viktförändring: -0.5 kg (samma takt)
Kaloribalans: -3850 kcal
AT-förändring: -26.25 kcal (samma, baserat på baseline)
Ackumulerad AT: -78 + (-26) = -104 kcal

Expected BMR (78 kg): 1650 kcal
Effective BMR: 1650 + (-104) = 1546 kcal
```

**Insikt:**
Din metabolism har sjunkit från 1750 till 1546 kcal (-204 kcal totalt)

Uppdelning:
- 100 kcal från viktminskning (förväntad)
- 104 kcal från metabolisk anpassning (AT)

---

## ❓ Vanliga frågor

### Q: Varför använder vi baseline BMR istället för current BMR?
**A:** Om vi använde current BMR skulle vi "dubbelräkna" vikteffekten. AT ska bara mäta den EXTRA förändringen.

**Exempel:**
```
Utan baseline (fel):
Vecka 1: AT på 1750 kcal → -26 kcal
Vecka 4: Vikt sjunkit, ny BMR 1650
         AT på 1650 kcal → -25 kcal (mindre än det borde vara!)

Med baseline (rätt):
Vecka 1: AT på 1750 kcal → -26 kcal
Vecka 4: AT fortfarande på 1750 kcal → -26 kcal
```

### Q: Varför -1.5% vid underskott men bara +0.75% vid överskott?
**A:** Det är asymmetriskt - kroppen försvarar sig hårdare mot viktnedgång (evolutionärt) än den ökar vid överskott.

**Evolutionär förklaring:**
- Svält är farligt → kroppen sparar energi aggressivt
- Överskott är mindre farligt → kroppen ökar metabolism försiktigt

### Q: Vad händer om jag inte loggar vikt på 7 dagar?
**A:** Ingenting - Edge Function skippar din profil tills du har minst 2 viktvärden inom 7 dagar.

**Kod:**
```typescript
if (!weightHistory || weightHistory.length < 2) {
  console.log(`Skipping profile: Insufficient weight data`)
  continue
}
```

### Q: Kan AT bli för stor?
**A:** Nej, vi begränsar till -12% / +6% av baseline. Extremare värden är fysiologiskt osannolika.

**Kod:**
```typescript
const min_limit = -0.12 * baseline_bmr  // -210 kcal för baseline 1750
const max_limit = 0.06 * baseline_bmr   // +105 kcal för baseline 1750
new_accumulated_at = Math.max(min_limit, Math.min(max_limit, new_accumulated_at))
```

### Q: Vad händer om jag äter i underhåll (ingen viktförändring)?
**A:** AT förändras inte (förblir samma).

**Kod:**
```typescript
if (calorie_balance_7d < 0) {
  at_weekly = AT_DEFICIT_RATE * baseline_bmr
} else if (calorie_balance_7d > 0) {
  at_weekly = AT_SURPLUS_RATE * baseline_bmr
}
// Om calorie_balance = 0 → at_weekly = 0 → AT förblir samma
```

### Q: Hur vet jag att AT är korrekt?
**A:** Jämför med din faktiska viktförändring över tid. Om AT visar -100 kcal men du går ner i vikt som förväntat, stämmer beräkningen.

### Q: När ska jag återställa baseline?
**A:** Efter 8-12 veckor av:
1. Stabil vikt (±1 kg variation)
2. Äter i energibalans (underhåll)
3. AT har normaliserats (närmar sig 0)

**Tecken på att metabolismen återhämtat sig:**
- Vikten är stabil trots att du äter mer än tidigare
- AT-värdet ökar mot 0
- Du känner dig piggare/varmare

---

## 🔬 Vetenskaplig bakgrund

### Vad säger forskningen?

**Minnesota Starvation Experiment (Keys et al., 1950)**
- Deltagare gick ner 25% av kroppsvikten
- Metabolismen sjönk 40% totalt
  - ~15% från viktminskning (förväntad)
  - ~25% från adaptiv termogenes (extra)

**Rosenbaum et al. (2008)**
- Efter 10% viktnedgång: AT ≈ -100-150 kcal/dag
- Persisterande även efter viktökning
- Kan reverseras med leptin-behandling

**Trexler et al. (2014)**
- AT är individuell (varierar mellan personer)
- Påverkas av:
  - Hur snabb viktnedgången är
  - Hur länge underskottet pågår
  - Genetik
  - Tidigare diethistorik

### Varför händer AT?

**Hormonella förändringar:**
- ↓ Leptin (hungersignal)
- ↓ Thyroid hormoner (metabolism)
- ↑ Cortisol (stress)
- ↓ Testosteron (muskelmassa)

**Metaboliska anpassningar:**
- Mindre spontan aktivitet (NEAT)
- Lägre kroppstemperatur
- Effektivare mitokondrier (mindre "spillvärme")
- Minskad protein-turnover

---

## 🎓 Praktiska tips

### Minimera AT under diet

1. **Långsam viktnedgång** (0.5-1% kroppsvikt/vecka)
2. **Proteinintag** (2-2.5g/kg kroppsvikt)
3. **Styrketräning** (behåll muskelmassa)
4. **Diet breaks** (2 veckor underhåll var 8-12:e vecka)
5. **Sömn** (7-9 timmar/natt)
6. **Undvik extrema underskott** (max -25% av TDEE)

### Återställ metabolismen

1. **Reverse dieting** (öka kalorier gradvis)
2. **Underhållsfas** (8-12 veckor i energibalans)
3. **Styrketräning** (bygg tillbaka muskelmassa)
4. **Överväg reset** av baseline efter recovery

---

## 🛠️ Senaste förbättringar

### Automatisk TDEE-uppdatering (2025-12-26)

**Problem:**
TDEE förblev konstant även när AT förändrade din metabolism, vilket gav missvisande kaloriintervall.

**Lösning:**
TDEE uppdateras nu automatiskt baserat på effektiv BMR:
- Beräknar PAL-faktor från ursprunglig TDEE
- Använder PAL-faktorn med effektiv BMR
- Visar "Justerat för AT" när justering sker

**Resultat:**
Din TDEE och kaloriintervall återspeglar alltid din faktiska energiförbrukning.

---

### Förbättrad datahantering (2025-12-26)

**Problem:**
Kunde inte radera kroppsfettprocent genom att lämna fältet tomt - Supabase ignorerade `undefined`-värden.

**Lösning:**
Implementerade automatisk konvertering i `useUpdateProfile`:
```typescript
// Convert undefined values to null for Supabase
const sanitizedData = Object.entries(data).reduce(
  (acc, [key, value]) => {
    acc[key] = value === undefined ? null : value
    return acc
  },
  {} as Record<string, unknown>,
)
```

**Resultat:**
Kan nu radera valfria fält (som kroppsfettprocent) genom att lämna dem tomma.

---

### Genetisk Muskelpotential - Validering (2025-12-26)

**Problem:**
Verktyget visade resultat även utan nödvändig data (kroppsfett, handled/fotled, kön).

**Förbättringar:**

1. **Könskrav:**
   - Endast tillgängligt för män (formlerna är utvecklade för män)
   - Visar röd varning för kvinnor med förklaring

2. **Kroppsfettkrav:**
   - Alla formler kräver nu kroppsfett för meningsfulla resultat
   - Visar gul varning om kroppsfett saknas

3. **Casey Butt-krav:**
   - Kräver handled, fotled OCH kroppsfett
   - Inga dummy-värden längre

4. **Inga resultat utan data:**
   - Tomt resultat om kraven inte uppfylls
   - Tydliga instruktioner om vad som saknas

**Kod (geneticPotentialCalculations.ts:333-366):**
```typescript
export function calculateAllModels(input: GeneticPotentialInput): GeneticPotentialResult[] {
  const results: GeneticPotentialResult[] = []

  // These formulas are designed for men only
  if (input.gender === 'female') {
    return results
  }

  // Berkhan - Requires body fat
  if (input.currentBodyFat) {
    results.push(berkhanFormula(input.heightCm, input.gender, input.currentBodyFat))
  }

  // McDonald - Requires body fat
  if (input.currentBodyFat) {
    results.push(lyleMcDonaldModel(input.heightCm, input.gender))
  }

  // Casey Butt - Requires wrist, ankle AND body fat
  if (input.wristCm && input.ankleCm && input.currentBodyFat) {
    results.push(caseyButtFormula(...))
  }

  // Alan Aragon - Requires weight AND body fat
  if (input.currentWeight && input.currentBodyFat) {
    results.push(alanAragonModel(...))
  }

  return results
}
```

**Resultat:**
Verktyget visar endast korrekta resultat baserade på faktisk data, ingen gissning eller dummy-värden.

---

### UI-förbättringar (2025-12-26)

1. **BMR/RMR borttaget från Resultat:**
   - Fanns duplicerat i både "Resultat" och "Metabolisk Information"
   - Flyttade röd flamm-ikon till Metabolisk Information
   - Tydligare separation mellan resultat och metabolisk data

2. **Mifflin-St Jeor indikation:**
   - Visar "Baserat på Mifflin-St Jeor" under Baseline BMR
   - Endast när TDEE angavs manuellt
   - Tydliggör att beräkningen är baserad på vetenskaplig formel

3. **AT-justerad TDEE-indikation:**
   - Visar "Justerat för AT" under TDEE när AT är aktivt
   - Användaren ser direkt att TDEE är dynamiskt

---

## 📚 Teknisk dokumentation

Se även:
- [ADAPTIVE_THERMOGENESIS_SPEC.md](./ADAPTIVE_THERMOGENESIS_SPEC.md) - Fullständig teknisk specifikation
- [ADAPTIVE_THERMOGENESIS_DEPLOYMENT.md](./ADAPTIVE_THERMOGENESIS_DEPLOYMENT.md) - Deployment & konfiguration

---

**Skapad:** 2024-12-25
**Senast uppdaterad:** 2025-12-26
**Författare:** Claude Sonnet 4.5
**Version:** 1.1
