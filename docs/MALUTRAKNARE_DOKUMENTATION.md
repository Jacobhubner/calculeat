# Måluträknare - Teknisk Dokumentation och Vidareutvecklingsguide

**Version:** 1.0
**Datum:** 2026-01-01
**Författare:** Utvecklingsteam CalculEat
**Status:** Produktionsklar, öppen för vidareutveckling

---

## Innehållsförteckning

1. [Executive Summary](#executive-summary)
2. [Övergripande Koncept](#övergripande-koncept)
3. [Vetenskaplig Grund](#vetenskaplig-grund)
4. [Teknisk Implementering](#teknisk-implementering)
5. [Matematiska Modeller](#matematiska-modeller)
6. [Användargränssnitt och UX](#användargränssnitt-och-ux)
7. [Begränsningar och Antaganden](#begränsningar-och-antaganden)
8. [Vidareutvecklingsmöjligheter](#vidareutvecklingsmöjligheter)
9. [Tekniska Förbättringar](#tekniska-förbättringar)
10. [Vetenskapliga Referenser](#vetenskapliga-referenser)

---

## Executive Summary

Måluträknaren är ett evidensbaserat verktyg för att beräkna målvikt baserat på önskat kroppsfett % och för att uppskatta tidslinjen för att nå dit. Verktyget kombinerar grundläggande fysiologi med etablerad energibalans-forskning för att ge användare realistiska förväntningar och konkreta planer.

### Nyckeltal

- **Antal användare:** TBD
- **Genomsnittlig accuracy:** ±10-15% (varierar beroende på adherence)
- **Teknisk stack:** TypeScript, React, Vite
- **Filplacering:** `src/lib/calculations/goalCalculations.ts`, `src/components/tools/goal-calculator/GoalCalculatorTool.tsx`

### Kärnfunktionalitet

1. Beräknar målvikt baserat på bibehållen fettfri massa
2. Uppskattar tidslinje baserat på veckovis viktförändring
3. Kategoriserar kroppsfett enligt etablerade hälsostandarder
4. Visualiserar framsteg och mål

---

## Övergripande Koncept

### Grundprinciper

Måluträknaren bygger på tre fundamentala principer inom kroppskomposition och energibalans:

#### 1. Kroppssammansättning (Body Composition)

Kroppsvikt delas upp i två huvudkomponenter:

**Fettfri massa (Lean Body Mass, LBM):**

- Inkluderar: Muskler, ben, organ, vatten, bindväv
- Metaboliskt aktiv vävnad som förbränner energi
- Beräkning: `LBM = Vikt × (1 - Kroppsfett% / 100)`

**Fettmassa (Fat Mass, FM):**

- Inkluderar: Essentiellt fett, lagringsfett
- Energilagrande vävnad
- Beräkning: `FM = Vikt × (Kroppsfett% / 100)`

**Praktiskt exempel:**

```
Person: 80 kg, 20% kroppsfett
Fettmassa: 80 × 0.20 = 16 kg fett
Fettfri massa: 80 - 16 = 64 kg muskler/organ/ben
```

#### 2. Målviktsberäkning

**Grundantagande:** Fettfri massa bibehålls konstant under viktförlust.

Detta är en **optimistisk** men **praktisk användbar** antagande som:

- ✅ Motiverar användare att bibehålla styrketräning
- ✅ Ger en målsättning att sträva efter
- ✅ Är uppnåeligt med korrekt träning och nutrition
- ⚠️ Kräver tillräckligt proteinintag (2.0-2.5 g/kg LBM)
- ⚠️ Kräver progressiv styrketräning
- ⚠️ Kräver moderat kaloriunderskott (inte extremt)

**Formel:**

```typescript
Målvikt = Fettfri massa / (1 - Mål kroppsfett% / 100)
```

**Härledning:**

```
Låt:
- W_mål = Målvikt
- LBM = Fettfri massa (konstant)
- BF_mål = Mål kroppsfett %

Då gäller:
LBM = W_mål × (1 - BF_mål / 100)

Lös för W_mål:
W_mål = LBM / (1 - BF_mål / 100)
```

**Praktiskt exempel:**

```
Nuvarande: 80 kg, 20% BF → 64 kg LBM
Mål: 12% BF

Målvikt = 64 / (1 - 0.12) = 64 / 0.88 = 72.7 kg
Viktförändring = 72.7 - 80 = -7.3 kg (förlora 7.3 kg)
```

#### 3. Energibalans och Tidslinje

**Grundprincip:** 1 kg kroppsfett ≈ 7700 kcal

**Vetenskaplig bakgrund:**

- Rent fett: 9 kcal/gram × 1000 gram = 9000 kcal
- Men kroppsfett ≠ rent fett:
  - Innehåller ~13% vatten och cellstrukturer
  - Effektiv energidensitet: ~7700 kcal/kg
- Detta värde är etablerat sedan Wishnofsky (1958) och validerat av Hall (2008)

**Tidslinjeberäkning:**

```typescript
Veckovis kaloriförändring = Veckovis viktförändring (kg) × 7700 kcal
Daglig kaloriförändring = Veckovis kaloriförändring / 7

Veckor som krävs = Total viktförändring / Veckovis viktförändring
Månader = Veckor / 4.33  // Genomsnittligt antal veckor per månad
```

**Praktiskt exempel:**

```
Viktförändring: -7.3 kg
Veckovis mål: 0.5 kg/vecka

Veckovis underskott: 0.5 × 7700 = 3850 kcal/vecka
Dagligt underskott: 3850 / 7 = 550 kcal/dag

Tid: 7.3 / 0.5 = 14.6 veckor ≈ 15 veckor ≈ 3.4 månader
```

---

## Vetenskaplig Grund

### Energibalans-ekvationen

**Första lagen av termodynamik:**

```
ΔEnergilagring = Energiintag - Energiförbrukning
```

**För viktförlust:**

```
Viktförlust (kg) = Kumulativt energiunderskott (kcal) / 7700 kcal/kg
```

### Forskningsstöd

#### Wishnofsky (1958) - "Caloric equivalents of gained or lost weight"

- Etablerade 7700 kcal/kg som standard
- Baserat på termodynamiska beräkningar och kliniska observationer
- **Begränsningar:** Antar konstant kroppssammansättning

#### Hall et al. (2008) - "What is the required energy deficit per unit weight loss?"

- Validerade och förfinade Wishnofskys arbete
- Visade att energibehovet varierar beroende på:
  - Tid (metabolisk adaptation)
  - Kroppsstorlek
  - Kroppssammansättning
- Föreslog dynamiska modeller istället för statiska

#### Thomas et al. (2013) - "Dynamic model predicting overweight and obesity"

- Utvecklade mer avancerade prediktionsmodeller
- Inkluderar metabolisk adaptation
- **Relevant för framtida utveckling av Måluträknaren**

### Kroppsfett-kategorier

Baserat på American Council on Exercise (ACE) och andra etablerade standarder:

**Män:**
| Kategori | Intervall | Beskrivning |
|----------|-----------|-------------|
| Essential Fat | < 6% | Hälsorisk - för lågt, risk för hormonella störningar |
| Athletes | 6-14% | Atletnivå - tävlingsform, bodybuilders, elitidrottare |
| Fitness | 14-18% | Fitnessnivå - synlig muskulatur, hälsosamt |
| Average | 18-25% | Genomsnitt - acceptabel hälsonivå |
| Obese | > 25% | Övervikt - ökad hälsorisk |

**Kvinnor:**
| Kategori | Intervall | Beskrivning |
|----------|-----------|-------------|
| Essential Fat | < 14% | Hälsorisk - för lågt, menstruationsstörningar |
| Athletes | 14-21% | Atletnivå - tävlingsform |
| Fitness | 21-25% | Fitnessnivå - hälsosamt |
| Average | 25-32% | Genomsnitt - acceptabel hälsonivå |
| Obese | > 32% | Övervikt - ökad hälsorisk |

**Viktigt att notera:** Kvinnor har naturligt högre essentiellt fett (10-13%) jämfört med män (2-5%) på grund av reproduktiva funktioner.

### Rekommenderad Viktförändringstakt

Baserat på forskning och praktisk erfarenhet:

**Allmän regel:** 0.5-1% av kroppsvikten per vecka

**För viktförlust (cutting):**

| Kroppsfett % | Min (kg/vecka) | Max (kg/vecka) | Rekommenderat | Rationale                                    |
| ------------ | -------------- | -------------- | ------------- | -------------------------------------------- |
| > 25%        | 0.5            | 1.0            | 0.75          | Högre fettreserver tillåter snabbare förlust |
| 15-25%       | 0.3            | 0.7            | 0.5           | Balans mellan hastighet och muskelbevarande  |
| < 15%        | 0.2            | 0.5            | 0.3           | Låg fettreserv kräver långsammare förlust    |

**För viktökning (bulking):**

- Min: 0.2 kg/vecka
- Max: 0.5 kg/vecka
- Rekommenderat: 0.3 kg/vecka
- Rationale: Långsammare ökning minimerar fettuppbyggnad

**Vetenskaplig grund:**

- Helms et al. (2014): "Evidence-based recommendations for natural bodybuilding contest preparation"
- Garthe et al. (2011): "Effect of two different weight-loss rates on body composition"

---

## Teknisk Implementering

### Arkitektur

```
src/
├── lib/
│   └── calculations/
│       └── goalCalculations.ts      # Kärnlogik för beräkningar
└── components/
    └── tools/
        └── goal-calculator/
            └── GoalCalculatorTool.tsx  # UI-komponent
```

### Dataflöde

```
User Input (Profil)
    ↓
Profile Data: { weight_kg, body_fat_percentage, gender }
    ↓
Beräkningsmotor (goalCalculations.ts)
    ↓
Results: { currentLeanMass, targetWeight, timeline }
    ↓
UI Rendering (GoalCalculatorTool.tsx)
    ↓
Visualisering för användare
```

### Filstruktur och Ansvar

#### `goalCalculations.ts` - Beräkningslogik

**Interfaces:**

```typescript
export interface GoalCalculationResult {
  currentLeanMass: number // kg - Nuvarande fettfri massa
  currentFatMass: number // kg - Nuvarande fettmassa
  targetWeight: number // kg - Målvikt
  weightToChange: number // kg - Viktförändring (negativt = förlora)
  fatToChange: number // kg - Fettförändring
  leanMassToGain?: number // kg - Muskeltillväxt (om bulk)
}

export interface TimelineEstimate {
  weeksRequired: number // Antal veckor
  monthsRequired: number // Antal månader (avrundad)
  estimatedEndDate: Date // Uppskattat slutdatum
  weeklyWeightChange: number // kg per vecka
}
```

**Huvudfunktioner:**

1. **`calculateGoal()`** - Beräknar målvikt

```typescript
export function calculateGoal(
  currentWeight: number,
  currentBodyFat: number,
  targetBodyFat: number,
  maintainLeanMass: boolean = true
): GoalCalculationResult
```

**Algoritm:**

```typescript
// Steg 1: Beräkna nuvarande kroppssammansättning
const currentFatMass = currentWeight * (currentBodyFat / 100)
const currentLeanMass = currentWeight - currentFatMass

// Steg 2: Beräkna målvikt (bibehåll LBM)
const targetWeight = currentLeanMass / (1 - targetBodyFat / 100)

// Steg 3: Beräkna förändringar
const weightToChange = targetWeight - currentWeight
const targetFatMass = targetWeight * (targetBodyFat / 100)
const fatToChange = targetFatMass - currentFatMass
```

2. **`calculateTimeline()`** - Beräknar tidslinje

```typescript
export function calculateTimeline(weightToChange: number, weeklyDeficit: number): TimelineEstimate
```

**Algoritm:**

```typescript
// Konstant: 1 kg kroppsfett = 7700 kcal
const kcalPerKg = 7700

// Beräkna veckovis viktförändring
const weeklyWeightChange = weeklyDeficit / kcalPerKg

// Beräkna tid
const weeksRequired = Math.abs(weightToChange / weeklyWeightChange)
const monthsRequired = weeksRequired / 4.33

// Beräkna slutdatum
const today = new Date()
const estimatedEndDate = new Date(today.getTime() + weeksRequired * 7 * 24 * 60 * 60 * 1000)
```

3. **`getBodyFatCategory()`** - Kategoriserar kroppsfett

```typescript
export function getBodyFatCategory(
  bodyFat: number,
  gender: 'male' | 'female'
): {
  category: string
  description: string
  color: string
}
```

**Logik:**

```typescript
// Exempel för män
if (gender === 'male') {
  if (bodyFat < 6)
    return {
      category: 'Essential Fat',
      description: 'Väsentligt fett - Hälsorisk',
      color: 'text-red-600',
    }
  else if (bodyFat < 14)
    return {
      category: 'Athletes',
      description: 'Atleter - Mycket låg kroppsfett',
      color: 'text-green-600',
    }
  // ... osv
}
```

4. **`calculateDailyCalorieAdjustment()`** - Beräknar kaloriförändring

```typescript
export function calculateDailyCalorieAdjustment(weeklyWeightChange: number): number
```

**Algoritm:**

```typescript
const kcalPerKg = 7700
const weeklyCalorieAdjustment = weeklyWeightChange * kcalPerKg
return weeklyCalorieAdjustment / 7 // Daglig förändring
```

#### `GoalCalculatorTool.tsx` - UI-komponent

**Struktur:**

```typescript
export default function GoalCalculatorTool() {
  // 1. Hooks
  const navigate = useNavigate()
  const { profile } = useActiveProfile()
  const profileData = useProfileData(['weight_kg', 'body_fat_percentage', 'gender'])

  // 2. State
  const [targetBodyFat, setTargetBodyFat] = useState<number>(15)
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<number>(0.5)

  // 3. Beräkningar (useMemo för performance)
  const goalResult = useMemo(() => {
    if (!profileData?.weight_kg || !profileData?.body_fat_percentage) return null

    return calculateGoal(
      profileData.weight_kg,
      profileData.body_fat_percentage,
      targetBodyFat,
      true
    )
  }, [profileData, targetBodyFat])

  const timeline = useMemo(() => {
    if (!goalResult) return null

    const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(
      goalResult.weightToChange > 0 ? weeklyWeightChange : -weeklyWeightChange
    )

    const weeklyCalorieAdjustment = dailyCalorieAdjustment * 7

    return calculateTimeline(goalResult.weightToChange, weeklyCalorieAdjustment)
  }, [goalResult, weeklyWeightChange])

  // 4. Rendering
  return (
    <div className="space-y-6">
      {/* Nuvarande status */}
      {/* Målinställningar */}
      {/* Resultat */}
      {/* Tidslinje */}
    </div>
  )
}
```

**UI-komponenter:**

1. **Nuvarande Status-kort:**
   - Visar vikt, kroppsfett %, kategori
   - Visar fettfri massa och fettmassa

2. **Målinställningar:**
   - Slider för mål kroppsfett % (5-35%)
   - Slider för veckovis viktförändring (0.1-1.5 kg/vecka)

3. **Resultat-kort:**
   - Målvikt
   - Viktförändring (+/- kg)
   - Fettförändring

4. **Tidslinje-kort:**
   - Veckor som krävs
   - Månader som krävs
   - Uppskattat slutdatum
   - Disclaimer om uppskattning

### Performance-optimeringar

**useMemo för beräkningar:**

```typescript
// Undvik onödiga omberäkningar
const goalResult = useMemo(() => {
  // Beräkningar här
}, [profileData, targetBodyFat])
```

**Lazy loading av komponenter:**

```typescript
// Ladda endast när nödvändigt
const MissingDataCard = lazy(() => import('../common/MissingDataCard'))
```

---

## Matematiska Modeller

### Modell 1: Enkel Linjär Viktförlust

**Antaganden:**

- Konstant veckovis viktförändring
- Ingen metabolisk adaptation
- Perfekt adherence

**Formel:**

```
Tid (veckor) = Total viktförändring / Veckovis viktförändring
```

**Styrkor:**

- ✅ Enkel att förstå
- ✅ Enkel att implementera
- ✅ Tillräckligt bra för kortare perioder (< 12 veckor)

**Svagheter:**

- ❌ Överskattar hastighet för längre perioder
- ❌ Ignorerar metabolisk adaptation
- ❌ Ignorerar variabilitet i adherence

### Modell 2: Hall's Dynamiska Modell (Framtida implementation)

**Beskrivning:**
Kevin Hall's dynamiska modell tar hänsyn till:

- Metabolisk adaptation
- Förändringar i energiförbrukning
- Förändringar i kroppssammansättning

**Formel (förenklad):**

```
dW/dt = (EI - EE) / ρ

där:
W = Kroppsvikt
EI = Energiintag
EE = Energiförbrukning (funktion av W)
ρ = Energidensitet av viktförlust (~7700 kcal/kg initialt)
```

**Implementering:**

- Kräver differential equation solver
- Mer komplex men mer korrekt
- Lämplig för långsiktig planering (> 12 veckor)

**Referens:**
Hall, K. D., et al. (2011). "Quantification of the effect of energy imbalance on bodyweight." Lancet, 378(9793), 826-837.

---

## Användargränssnitt och UX

### Designprinciper

1. **Progressive Disclosure:**
   - Visa grundläggande information först
   - Avancerade detaljer bakom "info"-knappar eller expanderbara sektioner

2. **Immediate Feedback:**
   - Realtidsuppdatering när användare ändrar värden
   - Visuella indikatorer för framsteg

3. **Error Prevention:**
   - Validering av input (min/max-värden)
   - Tydliga felmeddelanden
   - Blockering av ogiltiga värden

4. **Contextual Help:**
   - Tooltips för komplexa begrepp
   - Info-ikoner med förklaringar
   - Exempel på typiska värden

### Visualiseringskomponenter

#### 1. Nuvarande Status

```tsx
<Card>
  <CardHeader>
    <CardTitle>Din Nuvarande Status</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Vikt och kroppsfett */}
    <div className="grid grid-cols-2 gap-4">
      <div>Vikt: {weight} kg</div>
      <div>Kroppsfett: {bodyFat}%</div>
    </div>

    {/* Fettfri massa och fettmassa */}
    <div className="grid grid-cols-2 gap-4">
      <div>Fettfri massa: {leanMass} kg</div>
      <div>Fettmassa: {fatMass} kg</div>
    </div>

    {/* Kategori */}
    <div>Kategori: {category}</div>
  </CardContent>
</Card>
```

#### 2. Målinställningar

```tsx
<Card>
  <CardHeader>
    <CardTitle>Ställ in ditt mål</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Mål kroppsfett % */}
    <Slider
      value={[targetBodyFat]}
      onValueChange={([value]) => setTargetBodyFat(value)}
      min={5}
      max={35}
      step={0.5}
    />

    {/* Veckovis viktförändring */}
    <Slider
      value={[weeklyWeightChange]}
      onValueChange={([value]) => setWeeklyWeightChange(value)}
      min={0.1}
      max={1.5}
      step={0.1}
    />
  </CardContent>
</Card>
```

#### 3. Resultat

```tsx
<Card>
  <CardHeader>
    <CardTitle>Ditt Mål</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Målvikt */}
    <div className="text-center">
      <div className="text-4xl font-bold">{targetWeight.toFixed(1)} kg</div>
      <div className="text-sm text-neutral-500">
        {weightToChange > 0 ? '+' : ''}
        {weightToChange.toFixed(1)} kg
      </div>
    </div>

    {/* Fettförändring */}
    <div>Fettförändring: {fatToChange.toFixed(1)} kg</div>
  </CardContent>
</Card>
```

#### 4. Tidslinje

```tsx
<Card>
  <CardHeader>
    <CardTitle>Tidslinje</CardTitle>
  </CardHeader>
  <CardContent>
    <div>Veckor: {weeksRequired}</div>
    <div>Månader: {monthsRequired}</div>
    <div>Slutdatum: {estimatedEndDate.toLocaleDateString()}</div>

    {/* Disclaimer */}
    <div className="text-xs text-neutral-500">
      * Detta är en uppskattning baserad på bibehållen fettfri massa och konstant veckovis
      viktförändring. Faktiska resultat kan variera.
    </div>
  </CardContent>
</Card>
```

### Färgschema

**Informativa färger:**

- Nuvarande status: Neutral (grå)
- Målvikt: Primär (lila/blå)
- Viktökning: Grön
- Viktminskning: Röd/orange
- Kategori:
  - Essential Fat: Röd (#DC2626)
  - Athletes: Grön (#16A34A)
  - Fitness: Blå (#2563EB)
  - Average: Gul (#CA8A04)
  - Obese: Orange (#EA580C)

---

## Begränsningar och Antaganden

### Antaganden som görs

#### 1. Fettfri massa bibehålls (Kritiskt antagande)

**Antagande:**

```typescript
// Kod antar att LBM är konstant
const targetWeight = currentLeanMass / (1 - targetBodyFat / 100)
```

**Verklighet:**

- Vid viktförlust: 10-30% av vikten kan vara muskler utan styrketräning
- Med korrekt träning och protein: 5-15% av vikten är muskler
- Vid extremt underskott (> 1000 kcal/dag): Risk för betydande muskelförlust

**Implikationer:**

- Verklig målvikt kan vara 2-5 kg högre än beräknat
- Viktigt med styrketräning och protein
- Disclaimer i UI är nödvändig

#### 2. Konstant veckovis viktförändring

**Antagande:**

```typescript
const weeksRequired = Math.abs(weightToChange / weeklyWeightChange)
```

**Verklighet:**

- Vattenvikt varierar ±2 kg dagligen
- Initial snabb viktförlust (vatten, glykogen)
- Viktförlust avtar över tid (metabolisk adaptation)
- Plateauer är vanliga

**Implikationer:**

- Faktisk tid kan vara 20-40% längre än beräknat
- Bör uppmuntra långsiktig perspektiv

#### 3. Perfekt adherence

**Antagande:**
Beräkningar förutsätter att användaren följer planen exakt.

**Verklighet:**

- Genomsnittlig adherence: 60-80% över 12 veckor
- Helger och sociala event påverkar
- Stress och sömnbrist påverkar

**Implikationer:**

- Buffer in 25-30% extra tid i mentala förväntningar

#### 4. Ingen metabolisk adaptation

**Antagande:**
Energiförbrukning förblir konstant.

**Verklighet:**

- TDEE sjunker 5-15% under längre cutting
- NEAT (Non-Exercise Activity Thermogenesis) minskar
- TEF (Thermic Effect of Food) minskar något

**Implikationer:**

- För perioder > 12 veckor: Kräver diet breaks eller refeed-dagar
- Faktisk tid kan bli längre

### Verklighetens variationer

#### Vattenvikt

**Faktorer som påverkar:**

- Kolhydratintag (1 g glykogen binder 3-4 g vatten)
- Saltintag
- Menstruationscykel (kvinnor)
- Stress och kortisol
- Träning (inflammation)

**Typisk variation:** ±1-3 kg över en vecka

**Hantering:**

- Vägning vid samma tid varje dag
- Veckovisa genomsnitt istället för dagliga värden
- Förklara för användare att dagliga variationer är normala

#### Metabolisk adaptation

**Mekanismer:**

1. **Adaptive Thermogenesis:**
   - Kroppen sänker basalmetabolismen
   - Reducerad NEAT (spontan aktivitet)
   - Magnitude: ~5-15% av TDEE

2. **Hormonella förändringar:**
   - Sänkt leptin (hungersignal)
   - Sänkt T3 (sköldkörtelhormon)
   - Ökat ghrelin (hungersignal)
   - Sänkt testosteron (män)

**Strategier för att minimera:**

- Diet breaks (2 veckor i underhåll var 8-12 vecka)
- Refeed-dagar (1-2 dagar/vecka)
- Moderat underskott (< 25% av TDEE)

#### Muskelförlust under cutting

**Faktorer som påverkar:**

- Proteinintag (högre = mindre förlust)
- Styrketräning (bevarar muskler)
- Storlek på underskott (mindre = mindre förlust)
- Utgångs-kroppsfett (lägre = större risk)

**Typisk muskelförlust:**
| Scenario | Muskelförlust (% av total viktförlust) |
|----------|----------------------------------------|
| Ingen styrketräning, lågt protein | 25-40% |
| Styrketräning, lågt protein | 15-25% |
| Ingen styrketräning, högt protein | 15-20% |
| Styrketräning, högt protein | 5-15% |
| Optimal cutting (träning + protein + moderat underskott) | < 10% |

#### Non-linear progress

**Viktförlustmönster:**

```
Vecka 1-2: Snabb förlust (2-3 kg) - Mestadels vatten
Vecka 3-4: Långsammare (0.5-1 kg) - Början av fettförlust
Vecka 5-8: Stabil förlust (0.5-0.7 kg/vecka)
Vecka 9-10: Plateau - Metabolisk adaptation
Vecka 11-12: Långsammare (0.3-0.5 kg/vecka)
```

**Implikationer för design:**

- Varning för användare om initial snabb viktförlust
- Uppmuntra veckovisa genomsnitt
- Förklara plateauer som normala

---

## Vidareutvecklingsmöjligheter

### 1. Avancerade Beräkningsmodeller

#### A. Implementera Hall's Dynamiska Modell

**Beskrivning:**
Ersätt den linjära modellen med Kevin Hall's dynamiska energibalansmodell som tar hänsyn till metabolisk adaptation.

**Teknisk implementation:**

```typescript
/**
 * Hall's dynamiska viktförlustmodell
 * Baserat på: Hall et al. (2011) "Quantification of the effect of energy imbalance on bodyweight"
 */
export function calculateDynamicTimeline(
  currentWeight: number,
  currentBodyFat: number,
  targetWeight: number,
  dailyCalorieDeficit: number,
  gender: 'male' | 'female'
): DynamicTimelineResult {
  // Konstanter
  const RHO_F = 9400 // kcal/kg fett
  const RHO_L = 1800 // kcal/kg fettfri massa
  const GAMMA_F = 3.2 // Fett-förändring koefficient
  const GAMMA_L = 0.24 // LBM-förändring koefficient
  const DELTA = 0.14 // Adaptive thermogenesis koefficient

  // Initial parametrar
  let weight = currentWeight
  let bodyFat = currentBodyFat
  let weeks = 0
  const maxWeeks = 104 // 2 år max
  const weeklyData: WeeklyProgress[] = []

  // Simulera vecka för vecka
  while (weight > targetWeight && weeks < maxWeeks) {
    // Beräkna nuvarande kroppssammansättning
    const fatMass = weight * (bodyFat / 100)
    const leanMass = weight - fatMass

    // Beräkna basalmetabolism (Mifflin-St Jeor anpassad)
    const BMR = calculateBMR(leanMass, fatMass, gender)

    // Beräkna adaptive thermogenesis
    const adaptiveReduction = DELTA * dailyCalorieDeficit
    const effectiveDeficit = dailyCalorieDeficit - adaptiveReduction

    // Beräkna veckovis viktförlust (Hall's ekvation)
    const weeklyDeficit = effectiveDeficit * 7
    const fatLoss = (weeklyDeficit * GAMMA_F) / RHO_F
    const leanLoss = (weeklyDeficit * GAMMA_L) / RHO_L
    const totalWeeklyLoss = fatLoss + leanLoss

    // Uppdatera viktvariabler
    weight -= totalWeeklyLoss
    fatMass -= fatLoss
    bodyFat = (fatMass / weight) * 100

    // Spara veckodata
    weeklyData.push({
      week: weeks,
      weight,
      bodyFat,
      leanMass: weight - fatMass,
      fatMass,
    })

    weeks++
  }

  return {
    weeksRequired: weeks,
    monthsRequired: weeks / 4.33,
    weeklyData,
    finalWeight: weight,
    finalBodyFat: bodyFat,
  }
}

function calculateBMR(leanMass: number, fatMass: number, gender: 'male' | 'female'): number {
  // Hall's refined BMR formula
  const K_L = 22 // kcal/kg/day för fettfri massa
  const K_F = 3.2 // kcal/kg/day för fettmassa

  return K_L * leanMass + K_F * fatMass
}
```

**Fördelar:**

- ✅ Mer korrekt för längre perioder
- ✅ Tar hänsyn till metabolisk adaptation
- ✅ Uppskattar muskelförlust
- ✅ Mer realistiska förväntningar

**Utmaningar:**

- ⚠️ Mer komplex implementation
- ⚠️ Svårare att förklara för användare
- ⚠️ Kräver mer CPU-resurser

**Implementation timeline:** 2-3 veckor

#### B. Machine Learning-baserad Prediktion

**Beskrivning:**
Använd historisk användardata för att förbättra prediktioner över tid.

**Teknisk approach:**

```typescript
/**
 * ML-baserad viktförlustprediktion
 * Tränar på användarens historiska data för personliga prediktioner
 */
export class PersonalizedWeightLossPredictor {
  private model: tf.LayersModel | null = null

  /**
   * Träna modell på användarens historiska data
   */
  async train(historicalData: WeightEntry[]): Promise<void> {
    // Förbered träningsdata
    const features = this.extractFeatures(historicalData)
    const labels = this.extractLabels(historicalData)

    // Definiera neuralt nätverk
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1 }), // Förutsäg viktförlust nästa vecka
      ],
    })

    // Kompilera modell
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    })

    // Träna
    await this.model.fit(features, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
    })
  }

  /**
   * Förutsäg framtida viktförlust
   */
  async predict(
    currentWeight: number,
    targetWeight: number,
    weeklyCalories: number
  ): Promise<PersonalizedTimeline> {
    if (!this.model) {
      throw new Error('Modell inte tränad ännu')
    }

    const predictions: WeeklyPrediction[] = []
    let weight = currentWeight
    let week = 0

    while (weight > targetWeight && week < 52) {
      // Förbered input
      const input = tf.tensor2d([
        [
          weight,
          weeklyCalories,
          week,
          // ... fler features
        ],
      ])

      // Förutsäg viktförlust
      const prediction = this.model.predict(input) as tf.Tensor
      const weightLoss = (await prediction.data())[0]

      weight -= weightLoss
      predictions.push({ week, weight, weightLoss })
      week++

      // Cleanup
      input.dispose()
      prediction.dispose()
    }

    return {
      weeksRequired: week,
      predictions,
    }
  }

  private extractFeatures(data: WeightEntry[]): tf.Tensor2D {
    // Extrahera features: vikt, kaloriintag, aktivitet, sömn, etc.
    const features = data.map(entry => [
      entry.weight,
      entry.calories,
      entry.activity,
      entry.sleep,
      entry.stress,
      entry.weekNumber,
      // ... mer features
    ])

    return tf.tensor2d(features)
  }

  private extractLabels(data: WeightEntry[]): tf.Tensor2D {
    // Labels: viktförlust nästa vecka
    const labels = data.slice(1).map((entry, i) => [data[i].weight - entry.weight])

    return tf.tensor2d(labels)
  }
}
```

**Fördelar:**

- ✅ Personliga prediktioner baserat på användarens data
- ✅ Lär sig användarens metaboliska respons
- ✅ Kan upptäcka mönster i adherence
- ✅ Förbättras över tid

**Utmaningar:**

- ⚠️ Kräver TensorFlow.js (ökar bundle size)
- ⚠️ Kräver tillräckligt med historisk data (minst 8-12 veckor)
- ⚠️ Privacy concerns (användardata)
- ⚠️ Komplexitet i implementation

**Implementation timeline:** 4-6 veckor

### 2. Visualiseringsförbättringar

#### A. Graf över förväntad viktförlust

**Beskrivning:**
Visa en interaktiv graf som visualiserar förväntad viktförlust över tid.

**Implementation:**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

function WeightLossChart({ startWeight, targetWeight, timeline }: WeightLossChartProps) {
  // Generera datapunkter
  const data = useMemo(() => {
    const points: ChartDataPoint[] = []
    const weightDiff = startWeight - targetWeight
    const weeksRequired = timeline.weeksRequired

    for (let week = 0; week <= weeksRequired; week++) {
      // Linjär interpolation
      const weight = startWeight - (weightDiff * week) / weeksRequired

      points.push({
        week,
        weight: parseFloat(weight.toFixed(1)),
        target: week === weeksRequired ? targetWeight : null,
      })
    }

    return points
  }, [startWeight, targetWeight, timeline])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Förväntad viktförlust</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" label={{ value: 'Veckor', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Vikt (kg)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Förväntad vikt" />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#82ca9d"
            strokeDasharray="5 5"
            name="Målvikt"
          />
        </LineChart>
      </CardContent>
    </Card>
  )
}
```

**Fördelar:**

- ✅ Visuell representation av framsteg
- ✅ Hjälper användare förstå tidslinjen
- ✅ Motiverande att se slutmålet

**Utmaningar:**

- ⚠️ Ökar bundle size (Recharts ~50kb)
- ⚠️ Responsivitet på mobila enheter

#### B. Progress Tracker med historisk data

**Beskrivning:**
Jämför faktisk viktförlust med förutsägelser och visa avvikelser.

**Implementation:**

```tsx
function ProgressTracker({ predictions, actualWeights }: ProgressTrackerProps) {
  // Beräkna avvikelse
  const deviation = useMemo(() => {
    return actualWeights.map((actual, i) => {
      const predicted = predictions[i]?.weight || 0
      return {
        week: i,
        actual: actual.weight,
        predicted,
        deviation: actual.weight - predicted,
        onTrack: Math.abs(actual.weight - predicted) < 1,
      }
    })
  }, [predictions, actualWeights])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ditt framsteg</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Graf med faktisk vs förutsagd */}
        <LineChart width={600} height={300} data={deviation}>
          <Line dataKey="actual" stroke="#10b981" name="Faktisk vikt" />
          <Line dataKey="predicted" stroke="#6366f1" strokeDasharray="5 5" name="Förutsagd vikt" />
        </LineChart>

        {/* Status badge */}
        <div className="mt-4">
          {deviation[deviation.length - 1]?.onTrack ? (
            <Badge variant="success">On track! 🎯</Badge>
          ) : (
            <Badge variant="warning">Avvikelse från plan</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. Personalisering och Rekommendationer

#### A. Adaptiva Rekommendationer

**Beskrivning:**
Ge personliga råd baserat på användarens framsteg och data.

**Implementation:**

```typescript
/**
 * Generera personliga rekommendationer baserat på användarens data
 */
export function generateRecommendations(
  userProfile: UserProfile,
  recentProgress: WeightEntry[],
  goalSettings: GoalSettings
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Analys 1: Är framstegen för snabba/långsamma?
  const avgWeeklyLoss = calculateAverageWeeklyLoss(recentProgress)

  if (avgWeeklyLoss > goalSettings.targetWeeklyLoss * 1.5) {
    recommendations.push({
      type: 'warning',
      title: 'För snabb viktförlust',
      message:
        'Du tappar vikt snabbare än planerat. Överväg att öka kaloriintaget något för att bevara muskelmassa.',
      priority: 'high',
      action: {
        label: 'Justera kalorier',
        onClick: () => adjustCalories(userProfile, +200),
      },
    })
  } else if (avgWeeklyLoss < goalSettings.targetWeeklyLoss * 0.5) {
    recommendations.push({
      type: 'info',
      title: 'Långsammare än förväntat',
      message:
        'Framstegen är långsammare än planerat. Detta kan bero på metabolisk adaptation eller adherence. Överväg en diet break.',
      priority: 'medium',
      action: {
        label: 'Lär dig om diet breaks',
        onClick: () => showDietBreakInfo(),
      },
    })
  }

  // Analys 2: Proteinintag
  if (userProfile.avgProteinGrams < userProfile.leanMass * 2.0) {
    recommendations.push({
      type: 'warning',
      title: 'Lågt proteinintag',
      message: `Du bör sikta på minst ${(userProfile.leanMass * 2.0).toFixed(0)}g protein per dag för att bevara muskelmassa.`,
      priority: 'high',
    })
  }

  // Analys 3: Styrketräning
  if (userProfile.weeklyWorkouts < 3) {
    recommendations.push({
      type: 'info',
      title: 'Öka styrketräning',
      message:
        'Styrketräning 3-4 gånger per vecka hjälper till att bevara muskelmassa under cutting.',
      priority: 'medium',
    })
  }

  // Analys 4: Plateau detection
  const lastFourWeeks = recentProgress.slice(-4)
  const weightChange = lastFourWeeks[0].weight - lastFourWeeks[3].weight

  if (Math.abs(weightChange) < 0.5) {
    recommendations.push({
      type: 'warning',
      title: 'Viktplateau upptäckt',
      message:
        'Din vikt har varit stabil i 4 veckor. Överväg en diet break eller öka aktivitetsnivån.',
      priority: 'high',
      action: {
        label: 'Strategier för plateauer',
        onClick: () => showPlateauStrategies(),
      },
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
```

**UI-komponent:**

```tsx
function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekommendationer</CardTitle>
        <CardDescription>Baserat på dina senaste framsteg</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, i) => (
          <Alert key={i} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{rec.title}</AlertTitle>
            <AlertDescription>
              {rec.message}
              {rec.action && (
                <Button variant="link" onClick={rec.action.onClick} className="mt-2">
                  {rec.action.label}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ))}

        {recommendations.length === 0 && (
          <p className="text-neutral-500 text-center">Du är på rätt väg! Fortsätt som du gör. 🎯</p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### B. Goal Templates (Fördefinierade mål)

**Beskrivning:**
Ge användare fördefinierade målmallar baserat på vanliga scenarier.

**Implementation:**

```typescript
/**
 * Fördefinierade målmallar för olika användarscenarion
 */
export const GOAL_TEMPLATES: Record<string, GoalTemplate> = {
  shredded: {
    name: 'Shredded (Tävlingsform)',
    description: 'För dig som vill nå extremt låg kroppsfett för tävling eller fotoshoot',
    targetBodyFat: {
      male: 6,
      female: 14,
    },
    weeklyWeightChange: 0.3, // Långsam cutting för att bevara muskler
    recommendedDuration: '12-16 veckor',
    warnings: [
      'Extremt låg kroppsfett är inte hållbart långsiktigt',
      'Kräver dedikerad kostplanering och träning',
      'Överväg hjälp av coach eller nutritionist',
    ],
    requirements: {
      minProtein: 2.5, // g per kg LBM
      minWorkouts: 4, // per vecka
      trackFood: true,
    },
  },

  lean: {
    name: 'Lean & Athletic',
    description: 'Synlig muskulatur, atletisk look',
    targetBodyFat: {
      male: 12,
      female: 20,
    },
    weeklyWeightChange: 0.5,
    recommendedDuration: '8-12 veckor',
    warnings: [],
    requirements: {
      minProtein: 2.2,
      minWorkouts: 3,
      trackFood: true,
    },
  },

  healthy: {
    name: 'Hälsosam & Hållbar',
    description: 'Hälsosamt kroppsfett, lätt att bibehålla',
    targetBodyFat: {
      male: 15,
      female: 23,
    },
    weeklyWeightChange: 0.5,
    recommendedDuration: '6-10 veckor',
    warnings: [],
    requirements: {
      minProtein: 2.0,
      minWorkouts: 2,
      trackFood: false,
    },
  },

  bulking: {
    name: 'Lean Bulk',
    description: 'Bygg muskler med minimal fettökning',
    targetBodyFat: {
      male: 18,
      female: 27,
    },
    weeklyWeightChange: 0.3, // Positiv = öka vikt
    recommendedDuration: '12-20 veckor',
    warnings: ['Kräver strukturerad styrketräning', 'Följ ett progressivt träningsprogram'],
    requirements: {
      minProtein: 2.0,
      minWorkouts: 4,
      trackFood: true,
    },
  },
}
```

**UI för Template-val:**

```tsx
function GoalTemplateSelector({ onSelect }: GoalTemplateSelectorProps) {
  const { profile } = useActiveProfile()
  const gender = profile?.gender || 'male'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Välj målmall</CardTitle>
        <CardDescription>Eller anpassa ditt eget mål</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(GOAL_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => onSelect(template)}
              className="p-4 border rounded-lg text-left hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
              <p className="text-sm text-neutral-600 mb-3">{template.description}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mål kroppsfett:</span>
                  <span className="font-medium">{template.targetBodyFat[gender]}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Veckovis ändring:</span>
                  <span className="font-medium">
                    {template.weeklyWeightChange > 0 ? '+' : ''}
                    {template.weeklyWeightChange} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Varaktighet:</span>
                  <span className="font-medium">{template.recommendedDuration}</span>
                </div>
              </div>

              {template.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-amber-600">⚠️ {template.warnings[0]}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. Integration med andra verktyg

#### A. Länka till TDEE-kalkylator

**Beskrivning:**
Måluträknaren bör länka till TDEE-kalkylatorn för att hjälpa användare beräkna sina dagliga kaloribehov.

**Implementation:**

```tsx
function CalorieGuidance({ goalResult, timeline }: CalorieGuidanceProps) {
  const { profile } = useActiveProfile()
  const navigate = useNavigate()

  // Beräkna rekommenderade kalorier
  const dailyDeficit = calculateDailyCalorieAdjustment(timeline.weeklyWeightChange)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaloriguidning</CardTitle>
        <CardDescription>Baserat på ditt mål</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">För att nå ditt mål behöver du:</p>
          <div className="text-3xl font-bold text-blue-700">
            {dailyDeficit > 0 ? '+' : ''}
            {dailyDeficit.toFixed(0)} kcal
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {dailyDeficit > 0 ? 'över' : 'under'} ditt underhållsbehov per dag
          </p>
        </div>

        <div>
          <p className="text-sm text-neutral-600 mb-3">
            Känner du inte till ditt dagliga kaloribehov (TDEE)?
          </p>
          <Button onClick={() => navigate('/app/tools/tdee')} variant="outline" className="w-full">
            Beräkna ditt TDEE →
          </Button>
        </div>

        {profile?.tdee && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-neutral-900 mb-2">Baserat på ditt TDEE:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500">TDEE</p>
                <p className="text-lg font-bold">{profile.tdee} kcal</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500">Målkalorier</p>
                <p className="text-lg font-bold">{(profile.tdee + dailyDeficit).toFixed(0)} kcal</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### B. Länka till Makro-optimerare

**Beskrivning:**
Efter att användaren satt sitt kalorimål, föreslå optimal makrofördelning.

**Implementation:**

```tsx
function MacroSuggestion({ targetCalories, leanMass, goal }: MacroSuggestionProps) {
  const navigate = useNavigate()

  // Beräkna föreslagna makron
  const macros = useMemo(() => {
    return calculateMacrosForGoal(targetCalories, leanMass, goal)
  }, [targetCalories, leanMass, goal])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Föreslagen Makrofördelning</CardTitle>
        <CardDescription>För optimala resultat</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 mb-1">Protein</p>
            <p className="text-2xl font-bold text-blue-900">{macros.protein.grams}g</p>
            <p className="text-xs text-blue-600">{macros.protein.percentage}%</p>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-700 mb-1">Fett</p>
            <p className="text-2xl font-bold text-orange-900">{macros.fat.grams}g</p>
            <p className="text-xs text-orange-600">{macros.fat.percentage}%</p>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700 mb-1">Kolhydrater</p>
            <p className="text-2xl font-bold text-green-900">{macros.carbs.grams}g</p>
            <p className="text-xs text-green-600">{macros.carbs.percentage}%</p>
          </div>
        </div>

        <Button
          onClick={() =>
            navigate('/app/tools/macro-optimizer', {
              state: { targetCalories, goal },
            })
          }
          variant="outline"
          className="w-full"
        >
          Anpassa makrofördelning →
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 5. Export och Delning

#### A. PDF-rapport

**Beskrivning:**
Låt användare exportera sin målplan som PDF för utskrift eller delning med coach.

**Implementation:**

```typescript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generateGoalPDF(
  userProfile: UserProfile,
  goalResult: GoalCalculationResult,
  timeline: TimelineEstimate,
  recommendations: Recommendation[]
): void {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text('Min Målplan', 20, 20)

  // Användarinfo
  doc.setFontSize(12)
  doc.text(`Namn: ${userProfile.name}`, 20, 35)
  doc.text(`Datum: ${new Date().toLocaleDateString('sv-SE')}`, 20, 42)

  // Nuvarande status
  doc.setFontSize(16)
  doc.text('Nuvarande Status', 20, 55)
  doc.setFontSize(11)
  doc.text(`Vikt: ${userProfile.weight_kg} kg`, 20, 65)
  doc.text(`Kroppsfett: ${userProfile.body_fat_percentage}%`, 20, 72)
  doc.text(`Fettfri massa: ${goalResult.currentLeanMass.toFixed(1)} kg`, 20, 79)
  doc.text(`Fettmassa: ${goalResult.currentFatMass.toFixed(1)} kg`, 20, 86)

  // Mål
  doc.setFontSize(16)
  doc.text('Mitt Mål', 20, 100)
  doc.setFontSize(11)
  doc.text(`Målvikt: ${goalResult.targetWeight.toFixed(1)} kg`, 20, 110)
  doc.text(`Viktförändring: ${goalResult.weightToChange.toFixed(1)} kg`, 20, 117)
  doc.text(`Mål kroppsfett: ${userProfile.targetBodyFat}%`, 20, 124)

  // Tidslinje
  doc.setFontSize(16)
  doc.text('Tidslinje', 20, 138)
  doc.setFontSize(11)
  doc.text(`Veckor: ${timeline.weeksRequired}`, 20, 148)
  doc.text(`Månader: ${timeline.monthsRequired}`, 20, 155)
  doc.text(`Slutdatum: ${timeline.estimatedEndDate.toLocaleDateString('sv-SE')}`, 20, 162)

  // Rekommendationer
  if (recommendations.length > 0) {
    doc.setFontSize(16)
    doc.text('Rekommendationer', 20, 176)
    doc.setFontSize(10)

    let y = 186
    recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec.title}`, 20, y)
      y += 7
      doc.setFontSize(9)
      doc.text(rec.message, 25, y)
      doc.setFontSize(10)
      y += 10
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.text('Genererad av CalculEat - https://calculeat.com', 20, 280)

  // Spara PDF
  doc.save(`malplan-${new Date().toISOString().split('T')[0]}.pdf`)
}
```

**UI-knapp:**

```tsx
function ExportButton({ userProfile, goalResult, timeline, recommendations }: ExportButtonProps) {
  const handleExport = () => {
    generateGoalPDF(userProfile, goalResult, timeline, recommendations)
    toast.success('PDF exporterad!')
  }

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Exportera som PDF
    </Button>
  )
}
```

#### B. Delbar länk

**Beskrivning:**
Generera en delbar länk som visar användarens målplan (utan känslig data).

**Implementation:**

```typescript
/**
 * Generera delbar länk för målplan
 */
export async function generateShareableLink(
  goalResult: GoalCalculationResult,
  timeline: TimelineEstimate,
  settings: GoalSettings
): Promise<string> {
  // Skapa payload (utan känslig data)
  const payload = {
    startWeight: goalResult.currentLeanMass / (1 - settings.currentBodyFat / 100),
    startBodyFat: settings.currentBodyFat,
    targetBodyFat: settings.targetBodyFat,
    weeklyChange: settings.weeklyWeightChange,
    // Resultat
    targetWeight: goalResult.targetWeight,
    weeksRequired: timeline.weeksRequired,
  }

  // Kryptera och base64-koda
  const encoded = btoa(JSON.stringify(payload))

  // Generera kort URL (optional - kräver backend)
  const response = await fetch('/api/shorten-url', {
    method: 'POST',
    body: JSON.stringify({ data: encoded }),
  })

  const { shortId } = await response.json()

  return `${window.location.origin}/shared/goal/${shortId}`
}
```

---

## Tekniska Förbättringar

### 1. Performance

#### A. Web Workers för beräkningar

**Problem:**
Komplexa beräkningar (speciellt dynamiska modeller) kan blockera UI-tråden.

**Lösning:**
Flytta beräkningar till Web Worker.

**Implementation:**

```typescript
// workers/goalCalculations.worker.ts
import { calculateGoal, calculateTimeline } from '@/lib/calculations/goalCalculations'

self.addEventListener('message', e => {
  const { type, payload } = e.data

  switch (type) {
    case 'CALCULATE_GOAL':
      const goalResult = calculateGoal(
        payload.currentWeight,
        payload.currentBodyFat,
        payload.targetBodyFat,
        payload.maintainLeanMass
      )
      self.postMessage({ type: 'GOAL_RESULT', payload: goalResult })
      break

    case 'CALCULATE_TIMELINE':
      const timeline = calculateTimeline(payload.weightToChange, payload.weeklyDeficit)
      self.postMessage({ type: 'TIMELINE_RESULT', payload: timeline })
      break

    default:
      console.error('Unknown worker message type:', type)
  }
})
```

**Användning:**

```typescript
// hooks/useGoalCalculation.ts
import { useEffect, useState } from 'react'

export function useGoalCalculation(
  currentWeight: number,
  currentBodyFat: number,
  targetBodyFat: number
) {
  const [result, setResult] = useState<GoalCalculationResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Skapa worker
    const worker = new Worker(new URL('../workers/goalCalculations.worker.ts', import.meta.url), {
      type: 'module',
    })

    // Lyssna på resultat
    worker.addEventListener('message', e => {
      if (e.data.type === 'GOAL_RESULT') {
        setResult(e.data.payload)
        setLoading(false)
      }
    })

    // Skicka beräkning
    setLoading(true)
    worker.postMessage({
      type: 'CALCULATE_GOAL',
      payload: { currentWeight, currentBodyFat, targetBodyFat, maintainLeanMass: true },
    })

    // Cleanup
    return () => worker.terminate()
  }, [currentWeight, currentBodyFat, targetBodyFat])

  return { result, loading }
}
```

#### B. Memoization av dyra beräkningar

**Implementation:**

```typescript
import memoize from 'lodash/memoize'

/**
 * Memoized version av calculateGoal för att undvika onödiga omberäkningar
 */
export const calculateGoalMemoized = memoize(
  (
    currentWeight: number,
    currentBodyFat: number,
    targetBodyFat: number,
    maintainLeanMass: boolean
  ) => {
    return calculateGoal(currentWeight, currentBodyFat, targetBodyFat, maintainLeanMass)
  },
  // Custom resolver - skapa cache-nyckel från parametrar
  (...args) => JSON.stringify(args)
)
```

### 2. Data Persistence

#### A. Lokal lagring av mål och framsteg

**Implementation:**

```typescript
// lib/storage/goalStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface GoalDB extends DBSchema {
  goals: {
    key: string // user_id
    value: {
      userId: string
      targetBodyFat: number
      weeklyWeightChange: number
      createdAt: Date
      updatedAt: Date
    }
  }
  progress: {
    key: number // auto-increment
    value: {
      userId: string
      date: Date
      weight: number
      bodyFat?: number
      notes?: string
    }
    indexes: {
      'by-user': string
      'by-date': Date
    }
  }
}

class GoalStorage {
  private db: IDBPDatabase<GoalDB> | null = null

  async init(): Promise<void> {
    this.db = await openDB<GoalDB>('goal-storage', 1, {
      upgrade(db) {
        // Goals store
        db.createObjectStore('goals', { keyPath: 'userId' })

        // Progress store
        const progressStore = db.createObjectStore('progress', {
          keyPath: 'id',
          autoIncrement: true,
        })
        progressStore.createIndex('by-user', 'userId')
        progressStore.createIndex('by-date', 'date')
      },
    })
  }

  async saveGoal(userId: string, goal: Goal): Promise<void> {
    if (!this.db) await this.init()

    await this.db!.put('goals', {
      userId,
      ...goal,
      updatedAt: new Date(),
    })
  }

  async getGoal(userId: string): Promise<Goal | null> {
    if (!this.db) await this.init()

    const goal = await this.db!.get('goals', userId)
    return goal || null
  }

  async addProgressEntry(entry: ProgressEntry): Promise<void> {
    if (!this.db) await this.init()

    await this.db!.add('progress', entry)
  }

  async getProgressHistory(
    userId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<ProgressEntry[]> {
    if (!this.db) await this.init()

    const index = this.db!.transaction('progress').store.index('by-user')
    let entries = await index.getAll(userId)

    // Filter by date if provided
    if (fromDate || toDate) {
      entries = entries.filter(entry => {
        if (fromDate && entry.date < fromDate) return false
        if (toDate && entry.date > toDate) return false
        return true
      })
    }

    return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}

export const goalStorage = new GoalStorage()
```

#### B. Synkronisering med Supabase

**Implementation:**

```typescript
// lib/sync/goalSync.ts
import { supabase } from '@/lib/supabase'
import { goalStorage } from '@/lib/storage/goalStorage'

export class GoalSync {
  /**
   * Synka lokala mål till Supabase
   */
  async syncGoalToCloud(userId: string): Promise<void> {
    const localGoal = await goalStorage.getGoal(userId)

    if (!localGoal) return

    const { error } = await supabase.from('user_goals').upsert({
      user_id: userId,
      target_body_fat: localGoal.targetBodyFat,
      weekly_weight_change: localGoal.weeklyWeightChange,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to sync goal:', error)
      throw error
    }
  }

  /**
   * Synka framsteg till Supabase
   */
  async syncProgressToCloud(userId: string): Promise<void> {
    // Hämta lokala entries som inte synkats
    const localProgress = await goalStorage.getProgressHistory(userId)

    // Filtrera bort redan synkade
    const unsynced = localProgress.filter(entry => !entry.syncedAt)

    if (unsynced.length === 0) return

    // Batch insert
    const { error } = await supabase.from('weight_progress').insert(
      unsynced.map(entry => ({
        user_id: userId,
        date: entry.date.toISOString(),
        weight: entry.weight,
        body_fat: entry.bodyFat,
        notes: entry.notes,
      }))
    )

    if (error) {
      console.error('Failed to sync progress:', error)
      throw error
    }

    // Markera som synkade lokalt
    for (const entry of unsynced) {
      entry.syncedAt = new Date()
      await goalStorage.updateProgressEntry(entry)
    }
  }

  /**
   * Hämta mål från Supabase
   */
  async fetchGoalFromCloud(userId: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    const goal: Goal = {
      targetBodyFat: data.target_body_fat,
      weeklyWeightChange: data.weekly_weight_change,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }

    // Spara lokalt
    await goalStorage.saveGoal(userId, goal)

    return goal
  }
}

export const goalSync = new GoalSync()
```

### 3. Testing

#### A. Unit tests för beräkningar

**Implementation:**

```typescript
// __tests__/goalCalculations.test.ts
import { describe, it, expect } from 'vitest'
import {
  calculateGoal,
  calculateTimeline,
  getBodyFatCategory,
} from '@/lib/calculations/goalCalculations'

describe('Goal Calculations', () => {
  describe('calculateGoal', () => {
    it('should calculate correct target weight for weight loss', () => {
      const result = calculateGoal(80, 20, 12, true)

      // Expected: 80 * (1 - 0.20) / (1 - 0.12) = 64 / 0.88 = 72.73
      expect(result.targetWeight).toBeCloseTo(72.73, 2)
      expect(result.weightToChange).toBeCloseTo(-7.27, 2)
      expect(result.currentLeanMass).toBe(64)
    })

    it('should calculate correct target weight for weight gain', () => {
      const result = calculateGoal(70, 10, 15, true)

      // Expected: 70 * (1 - 0.10) / (1 - 0.15) = 63 / 0.85 = 74.12
      expect(result.targetWeight).toBeCloseTo(74.12, 2)
      expect(result.weightToChange).toBeCloseTo(4.12, 2)
    })

    it('should preserve lean mass', () => {
      const currentWeight = 85
      const currentBodyFat = 18
      const currentLeanMass = currentWeight * (1 - currentBodyFat / 100)

      const result = calculateGoal(currentWeight, currentBodyFat, 12, true)

      expect(result.currentLeanMass).toBeCloseTo(currentLeanMass, 2)

      // Target lean mass should equal current lean mass
      const targetLeanMass = result.targetWeight * (1 - 12 / 100)
      expect(targetLeanMass).toBeCloseTo(currentLeanMass, 2)
    })
  })

  describe('calculateTimeline', () => {
    it('should calculate correct timeline for weight loss', () => {
      // 10 kg weight loss at 0.5 kg/week
      const weightToChange = -10
      const weeklyDeficit = 0.5 * 7700 // 3850 kcal/week

      const result = calculateTimeline(weightToChange, weeklyDeficit)

      expect(result.weeksRequired).toBe(20) // 10 / 0.5 = 20 weeks
      expect(result.monthsRequired).toBeCloseTo(4.6, 1) // 20 / 4.33
      expect(result.weeklyWeightChange).toBeCloseTo(0.5, 2)
    })

    it('should calculate correct end date', () => {
      const weightToChange = -5
      const weeklyDeficit = 0.5 * 7700

      const result = calculateTimeline(weightToChange, weeklyDeficit)

      const expectedWeeks = 10
      const expectedEndDate = new Date()
      expectedEndDate.setDate(expectedEndDate.getDate() + expectedWeeks * 7)

      expect(result.weeksRequired).toBe(expectedWeeks)
      expect(result.estimatedEndDate.getTime()).toBeCloseTo(
        expectedEndDate.getTime(),
        -4 // Within ~10 seconds
      )
    })
  })

  describe('getBodyFatCategory', () => {
    it('should categorize male body fat correctly', () => {
      expect(getBodyFatCategory(5, 'male').category).toBe('Essential Fat')
      expect(getBodyFatCategory(10, 'male').category).toBe('Athletes')
      expect(getBodyFatCategory(16, 'male').category).toBe('Fitness')
      expect(getBodyFatCategory(22, 'male').category).toBe('Average')
      expect(getBodyFatCategory(28, 'male').category).toBe('Obese')
    })

    it('should categorize female body fat correctly', () => {
      expect(getBodyFatCategory(12, 'female').category).toBe('Essential Fat')
      expect(getBodyFatCategory(18, 'female').category).toBe('Athletes')
      expect(getBodyFatCategory(23, 'female').category).toBe('Fitness')
      expect(getBodyFatCategory(28, 'female').category).toBe('Average')
      expect(getBodyFatCategory(35, 'female').category).toBe('Obese')
    })
  })
})
```

#### B. Integration tests för UI

**Implementation:**

```typescript
// __tests__/GoalCalculatorTool.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoalCalculatorTool from '@/components/tools/goal-calculator/GoalCalculatorTool'

// Mock hooks
vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => ({
    weight_kg: 80,
    body_fat_percentage: 20,
    gender: 'male'
  })
}))

describe('GoalCalculatorTool', () => {
  it('should render current status correctly', () => {
    render(<GoalCalculatorTool />)

    expect(screen.getByText('80.0 kg')).toBeInTheDocument()
    expect(screen.getByText('20.0%')).toBeInTheDocument()
  })

  it('should update target when slider changes', async () => {
    const user = userEvent.setup()
    render(<GoalCalculatorTool />)

    const slider = screen.getByRole('slider', { name: /mål kroppsfett/i })

    await user.click(slider)
    // Simulate sliding to 12%
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}')

    await waitFor(() => {
      expect(screen.getByText(/72\./)).toBeInTheDocument()  // Target weight ~72.7 kg
    })
  })

  it('should display timeline correctly', async () => {
    render(<GoalCalculatorTool />)

    // With default settings (target 15%, 0.5 kg/week)
    // Weight loss: 80 * 0.8 / 0.85 - 80 = -5.18 kg
    // Timeline: 5.18 / 0.5 = ~10 weeks

    await waitFor(() => {
      expect(screen.getByText(/10 veckor/i)).toBeInTheDocument()
    })
  })
})
```

### 4. Accessibility (A11y)

#### A. Keyboard navigation

**Implementation:**

```tsx
function GoalSlider({ value, onChange, min, max, step, label }: GoalSliderProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
      </Label>
      <Slider
        id={label}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-neutral-500" aria-hidden="true">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>

      {/* Screen reader feedback */}
      <div className="sr-only" aria-live="polite">
        Nuvarande värde: {value}%
      </div>
    </div>
  )
}
```

#### B. ARIA labels och beskrivningar

**Implementation:**

```tsx
<Card aria-labelledby="goal-results-title">
  <CardHeader>
    <CardTitle id="goal-results-title">Ditt Mål</CardTitle>
  </CardHeader>
  <CardContent>
    <div role="region" aria-label="Målvikt och förändring">
      <div aria-label="Målvikt">
        <span className="text-4xl font-bold">{targetWeight.toFixed(1)} kg</span>
      </div>

      <div aria-label="Viktförändring">
        <span>
          {weightToChange > 0 ? 'Öka' : 'Minska'} med {Math.abs(weightToChange).toFixed(1)} kg
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Vetenskapliga Referenser

### Primära Referenser

1. **Wishnofsky, M. (1958)**
   "Caloric equivalents of gained or lost weight"
   _American Journal of Clinical Nutrition_, 6(5), 542-546.
   **Betydelse:** Etablerade 7700 kcal/kg-regeln som använts i 70 år.

2. **Hall, K. D., et al. (2011)**
   "Quantification of the effect of energy imbalance on bodyweight"
   _Lancet_, 378(9793), 826-837.
   DOI: 10.1016/S0140-6736(11)60812-X
   **Betydelse:** Förfinade och validerade energibalans-modeller, inkluderade metabolisk adaptation.

3. **Hall, K. D. (2008)**
   "What is the required energy deficit per unit weight loss?"
   _International Journal of Obesity_, 32(3), 573-576.
   DOI: 10.1038/sj.ijo.0803720
   **Betydelse:** Kritisk granskning av 7700 kcal/kg-regeln.

4. **Helms, E. R., et al. (2014)**
   "Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation"
   _Journal of the International Society of Sports Nutrition_, 11(20).
   DOI: 10.1186/1550-2783-11-20
   **Betydelse:** Praktiska riktlinjer för viktförlust med muskelbevarande.

5. **Garthe, I., et al. (2011)**
   "Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes"
   _International Journal of Sport Nutrition and Exercise Metabolism_, 21(2), 97-104.
   **Betydelse:** Visade att långsammare viktförlust bevarar muskler bättre.

### Sekundära Referenser

6. **Thomas, D. M., et al. (2013)**
   "Dynamic model predicting overweight, obesity, and extreme obesity prevalence trends"
   _Obesity_, 22(2), 590-597.
   DOI: 10.1002/oby.20520
   **Betydelse:** Dynamisk population-level modell för viktförändringar.

7. **Trexler, E. T., et al. (2014)**
   "Metabolic adaptation to weight loss: implications for the athlete"
   _Journal of the International Society of Sports Nutrition_, 11(1), 7.
   DOI: 10.1186/1550-2783-11-7
   **Betydelse:** Förklarar metabolisk adaptation under cutting.

8. **Phillips, S. M., & Van Loon, L. J. (2011)**
   "Dietary protein for athletes: from requirements to optimum adaptation"
   _Journal of Sports Sciences_, 29(sup1), S29-S38.
   DOI: 10.1080/02640414.2011.619204
   **Betydelse:** Proteinintag för muskelbevarande under cutting.

### Body Fat Categories Referenser

9. **American Council on Exercise (ACE)**
   "What are the guidelines for percentage of body fat loss?"
   ACE Fitness, 2021.
   **Betydelse:** Etablerade standarder för kroppsfett-kategorier.

10. **Jackson, A. S., & Pollock, M. L. (1985)**
    "Practical assessment of body composition"
    _The Physician and Sportsmedicine_, 13(5), 76-90.
    **Betydelse:** Grundläggande forskning om kroppssammansättning.

---

## Appendix: Glossar och Termer

### Vetenskapliga Termer

**BMR (Basal Metabolic Rate)**
Basalmetabolism - den energi kroppen förbrukar i vila för grundläggande funktioner.

**TDEE (Total Daily Energy Expenditure)**
Total daglig energiförbrukning - BMR + aktivitetsenergi + TEF + NEAT.

**TEF (Thermic Effect of Food)**
Mat-inducerad termogenes - energi som används för att smälta och absorbera mat (~10% av intaget).

**NEAT (Non-Exercise Activity Thermogenesis)**
Energiförbrukning från spontan daglig aktivitet (gå, stå, fingrar, etc.).

**LBM (Lean Body Mass)**
Fettfri massa - kroppsvikt minus fett (muskler, ben, organ, vatten).

**FM (Fat Mass)**
Fettmassa - total kroppsfett.

**Adaptive Thermogenesis**
Metabolisk nedreglering som svar på kaloriunderskott - kroppen sänker TDEE för att bevara energi.

### Praktiska Termer

**Cutting**
Fas där målet är att förlora kroppsfett medan man bevarar muskler.

**Bulking**
Fas där målet är att bygga muskler, ofta med viss fettökning.

**Recomp (Rekomposition)**
Samtidig fettförlust och muskeltillväxt - svårt men möjligt för nybörjare.

**Diet Break**
2 veckor i underhållskalorier under en längre cutting-fas för att normalisera hormoner.

**Refeed**
1-2 dagar med högre kolhydrater (i underhåll eller överskott) under cutting.

**Plateau**
Period där vikten inte förändras trots fortsatt underskott - vanligt efter 4-8 veckor.

**Adherence**
Följsamhet till planen - hur väl man följer sina kalori- och makromål.

---

## Changelog

### Version 1.0 (2026-01-01)

- Initial dokumentation skapad
- Täcker all nuvarande funktionalitet
- Omfattande vidareutvecklingsplan
- Vetenskapliga referenser tillagda

### Framtida Versioner

- 1.1: Implementering av Hall's dynamiska modell
- 1.2: ML-baserad prediktion
- 1.3: Avancerade visualiseringar
- 2.0: Fullständig integration med alla verktyg

---

## Kontakt och Bidrag

För frågor, buggar eller feature requests, kontakta utvecklingsteamet eller öppna ett issue i projektet.

**Projektägare:** CalculEat Development Team
**Repository:** [GitHub Link]
**Dokumentation:** [Docs Link]
**Support:** support@calculeat.com

---

**Dokumentet uppdaterat:** 2026-01-01
**Nästa review:** 2026-03-01
