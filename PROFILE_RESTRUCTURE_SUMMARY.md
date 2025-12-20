# Profilsida Omstrukturering - Sammanfattning

## Översikt
Komplett omstrukturering av profilhantering och TDEE-beräkning för bättre användarupplevelse och tydligare separation av ansvar.

## ✅ Genomförda Ändringar

### 1. Databasändringar (2 nya migrationer)

**`supabase/migrations/20251218000000_add_initial_weight.sql`**
- Lägger till `initial_weight_kg` kolumn i `profiles` tabellen
- Backfiller befintliga profiler med TDEE

**`supabase/migrations/20251218000001_create_weight_history.sql`**
- Skapar `weight_history` tabell för viktspårning över tid
- RLS policies för användarspecifik data
- Indexering för optimal prestanda

**⚠️ VIKTIGT: Dessa migrationer måste köras manuellt mot Supabase-databasen**

### 2. TypeScript Types (uppdaterad `src/lib/types.ts`)

**Nya fält i Profile interface:**
- `initial_weight_kg?: number` - Startvikt när TDEE först beräknades
- `tdee_calculated_at?: string` - Tidsstämpel för TDEE-beräkning
- `tdee_source?: 'manual' | 'tdee_calculator_tool' | 'profile_form' | 'legacy'`
- `tdee_calculation_snapshot?: TDEECalculationSnapshot` - Snapshot av beräkningsdata

**Ny interface:**
- `WeightHistory` - För vikthistorikspårning

### 3. Nya Hooks

**`src/hooks/useWeightHistory.ts`** - 3 hooks för vikthistorik:
- `useWeightHistory(profileId)` - Hämta vikthistorik
- `useCreateWeightHistory()` - Skapa ny viktpost
- `useDeleteWeightHistory()` - Ta bort viktpost

Exporteras i `src/hooks/index.ts`

### 4. Profilkortskomponenter (3 nya filer)

Följer exakt samma mönster som measurementSetCard-systemet:

**`src/components/profile/ProfileCard.tsx`**
- Individuellt profilkort med inline namnredigering
- Orange ram för osparade kort
- Aktiv highlighting (grön)
- Auto-namngivning: "Profilkort", "Profilkort 1", "Profilkort 2", etc.
- Penna-ikon för namnredigering
- Diskett-ikon för spara
- Upp/ned-pilar för omsortering

**`src/components/profile/ProfileCardList.tsx`**
- Lista med alla profilkort (sparade + osparade)
- Klick för att välja aktivt kort
- Varning om osparade ändringar vid byte
- Auto-namngivning med duplikathantering

**`src/components/profile/ProfileCardSidebar.tsx`**
- Sidebar med profilkortslista
- Grön plus-knapp för nytt kort
- Collapsible på mobil (framtida implementering)

### 5. Profilformulärkomponenter (4 nya filer)

**`src/components/profile/GrundtreFields.tsx`**
- Födelsedatum (3 dropdowns: dag, månad, år)
- Kön (radioknappar: Man/Kvinna)
- Längd (cm)
- Lås-logik när > 1 profil finns
- Varningsmeddelande om låsta fält

**`src/components/profile/TDEEOptions.tsx`**
- Två kort side-by-side:
  1. "Beräkna TDEE" → navigerar till `/app/tools/tdee-calculator`
  2. "Ange TDEE manuellt" → visar ManualTDEEEntry inline

**`src/components/profile/ManualTDEEEntry.tsx`**
- Formulär för manuell TDEE-inmatning
- Kräver: TDEE (obligatorisk), Startvikt (obligatorisk)
- Valfritt: Kroppsfettprocent
- Sparar till aktivt profilkort med `tdee_source: 'manual'`

**`src/components/profile/BasicProfileForm.tsx`**
- Förenklad profilform när TDEE redan finns
- Aktuell vikt (uppdaterbar)
- Kroppsfettprocent (valfri)
- Energimål-tabell (interaktiv, INGEN omberäkning)
- Visar viktförändring (startvikt vs aktuell vikt)

### 6. Omstrukturerad ProfilePage

**`src/pages/ProfilePage.tsx`** (helt omskriven)

**Conditional Rendering baserat på state:**

1. **Scenario 1: Ingen grundtre**
   - Visar endast GrundtreFields
   - Alla fält olåsta

2. **Scenario 2: Har grundtre men inget TDEE**
   - Visar GrundtreFields (låsta om > 1 profil)
   - Visar TDEEOptions (två val)

3. **Scenario 3: Har grundtre OCH TDEE**
   - Visar GrundtreFields (låsta om > 1 profil)
   - Visar BasicProfileForm
   - Visar MacroDistributionCard
   - Visar MealSettingsCard
   - Visar MacroModesCard

**Ny layout:**
```
┌─────────────────────────────────────────┐
│  Main Content    │  ProfileCardSidebar  │
├──────────────────┼──────────────────────┤
│                  │  [+] Nytt kort       │
│ Conditional      │  • Profilkort        │
│ Content          │  • Profilkort 1      │
│                  │                      │
└──────────────────┴──────────────────────┘
```

**Handlers implementerade:**
- `handleBirthDateChange` - Sparar födelsedatum
- `handleGenderChange` - Sparar kön
- `handleHeightChange` - Sparar längd
- `handleSelectProfile` - Byter aktivt profilkort
- `handleCreateNewProfile` - Skapar nytt profilkort
- `handleManualTDEESuccess` - Callback efter manuell TDEE-inmatning

### 7. Uppdaterad ProfileCompletionGuard

**`src/components/ProfileCompletionGuard.tsx`**

**Tvåstegs-check:**

1. **Steg 1: Grundtre-check**
   - Kontrollerar `birth_date`, `gender`, `height_cm`
   - Redirectar till `/app/profile` om ofullständig

2. **Steg 2: TDEE-check** (nytt!)
   - Kontrollerar om `tdee` finns
   - Tillåtna routes utan TDEE:
     - `/app/profile`
     - `/app/tools/tdee-calculator`
   - Blockerar navigation till andra sidor
   - Toast: "Beräkna eller ange ditt TDEE för att fortsätta"

### 8. Förbättrad TDEECalculatorTool

**`src/components/tools/tdee-calculator/TDEECalculatorTool.tsx`**

**Nya funktioner:**

1. **Konfirmationsdialog**
   - Visar varning om TDEE redan finns
   - Användaren måste bekräfta överskrivning

2. **Sparar initial_weight_kg**
   - Sätter `initial_weight_kg` om inte redan satt
   - Använder aktuell vikt från profil

3. **Navigation efter spara**
   - Navigerar tillbaka till `/app/profile` efter 1 sekund
   - Toast: "TDEE har sparats till din profil!"

4. **TDEE metadata**
   - Sparar `tdee_calculated_at` (timestamp)
   - Sparar `tdee_source: 'tdee_calculator_tool'`
   - Sparar `tdee_calculation_snapshot` (komplett beräkningsdata)

### 9. Backup-filer

**`src/pages/ProfilePage.old.tsx`**
- Backup av original ProfilePage för säkerhet

**`src/pages/ProfilePage.new.tsx`**
- Kan tas bort (innehållet har kopierats till ProfilePage.tsx)

## 🔄 Återstående Uppgifter

### 1. Applicera Databasmigrationer

Migrationerna måste köras mot Supabase-databasen:

**Metod 1: Lokal Supabase (Docker Desktop krävs)**
```bash
npx supabase db reset
```

**Metod 2: Remote Supabase Dashboard**
1. Gå till Supabase Dashboard → SQL Editor
2. Kör `20251218000000_add_initial_weight.sql`
3. Kör `20251218000001_create_weight_history.sql`

**Metod 3: Supabase CLI mot remote**
```bash
npx supabase db push
```

### 2. Testa Användarflöden

#### Scenario 1: Ny användare
- [ ] Skapar profil → grundtre visas
- [ ] Fyller i grundtre → två val visas
- [ ] Val 1: Navigate till TDEE calculator
- [ ] Val 2: Manuell TDEE → sparar korrekt
- [ ] Efter TDEE finns → alla kort visas
- [ ] Navigation guard blockerar utan TDEE

#### Scenario 2: Profilkortssystem
- [ ] Skapa nytt kort → auto-namn fungerar
- [ ] Redigera namn → penna-ikon
- [ ] Spara kort → diskett-ikon (om behövs)
- [ ] Orange ram för osparade kort
- [ ] Byta mellan kort fungerar
- [ ] Ta bort kort fungerar
- [ ] Omsortering (upp/ned) fungerar

#### Scenario 3: TDEE Calculator
- [ ] Beräkna TDEE → knapp "Spara till profil"
- [ ] Om TDEE finns → varning visas
- [ ] Spara → navigerar till profile
- [ ] initial_weight_kg sätts korrekt
- [ ] Metadata sparas (timestamp, source, snapshot)

#### Scenario 4: Viktspårning
- [ ] Uppdatera nuvarande vikt
- [ ] Startvikt visas korrekt
- [ ] Viktförändring beräknas (+/- kg)
- [ ] Vikthistorik sparas (framtida implementering)

#### Scenario 5: Energimål
- [ ] Interaktiv tabell visas
- [ ] Användaren kan ändra mål
- [ ] INGEN omberäkning av TDEE
- [ ] Ändringar sparas

### 3. Rensa gamla komponenter (valfritt)

När allt är verifierat fungera:
- [ ] Ta bort `src/components/UserProfileForm.tsx`
- [ ] Ta bort `src/components/FloatingProfileSaveCard.tsx`
- [ ] Ta bort `src/pages/ProfilePage.old.tsx`
- [ ] Ta bort `src/pages/ProfilePage.new.tsx`

## 📊 Statistik

**Nya filer skapade:** 13
**Befintliga filer modifierade:** 5
**Filer att ta bort:** 2 (efter verifiering)
**Migrations:** 2
**Totala rader kod:** ~2000+ rader

## 🎯 Användarupplevelse-förbättringar

1. **Tydligare steg-för-steg-process**
   - Grundtre → TDEE → Resten av appen

2. **Flexibilitet**
   - Välj mellan beräkning eller manuell inmatning

3. **Viktspårning**
   - Separation mellan startvikt och aktuell vikt
   - Framtida möjlighet för vikthistorik

4. **Profilkortssystem**
   - Samma UX som måttkort (bekant för användaren)
   - Tydlig visuell feedback

5. **Navigation guard**
   - Förhindrar användare från att gå vilse
   - Tvingar korrekt setup innan användning

## 🔒 Säkerhetsförbättringar

1. **TDEE Metadata**
   - Spårar när och hur TDEE beräknades
   - Möjliggör framtida analyser och validering

2. **Confirmation dialogs**
   - Förhindrar oavsiktlig överskrivning av TDEE

3. **Låsta fält**
   - Skyddar grundtre-data vid multipla profiler

## 🚀 Framtida Förbättringar

1. **Vikthistorik-vy**
   - Graf med viktförändring över tid
   - Använd `weight_history` tabellen

2. **TDEE Status Indikator**
   - Använd `useTDEEStatus` hook
   - Visa om TDEE är föråldrad (vikt ändrad > 2kg, > 30 dagar sedan beräkning)

3. **Batch-operationer**
   - Spara flera fält samtidigt
   - Optimera API-anrop

4. **Ångra-funktion**
   - Möjlighet att återställa raderade profilkort
   - Använd local state för undo-stack

## 📝 Viktiga Anteckningar

- **Alla components använder auto-save** - inga floating save cards behövs längre
- **ProfileCardSidebar ersätter ProfileList** - men ProfileList kan behövas i andra vyer
- **useActiveProfile används istället för useProfileStore direkt** - eliminerar race conditions
- **Grundtre-fält låses när > 1 profil** - förhindrar inkonsistent data mellan profiler
- **TDEE calculator sparar direkt till profil** - ingen mellanlagring behövs
