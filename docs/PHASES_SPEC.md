# Perioder — analys och arbetsplan

Status: **arbetsplan.** Nuläget verifierat mot koden 2026-08-22.

Utgångspunkt: appen har ännu inga riktiga användare utöver enstaka testare.
Regressionsrisken är därför låg, och ambitionen kan sättas efter vad
funktionen **borde** vara — inte efter vad som är minst störande att ändra.

Målet: en premiumanvändare ska kunna lita på att perioden är en **plan som
följs upp**, där det enda hen behöver göra är att logga och väga sig.

---

## 1. Nuläget

En dietfas med mål, riktning och tänkt längd. Fyra typer, olika namn per
fokusspår:

| Typ           | Hälsospåret   | Styrkespåret  | Förvald längd |
| ------------- | ------------- | ------------- | ------------- |
| `cut`         | Viktminskning | Deff          | 12 v          |
| `bulk`        | Viktuppgång   | Bygga muskler | 12 v          |
| `maintenance` | Underhåll     | Underhåll     | 4 v           |
| `reverse`     | Trappa upp    | Reverse diet  | 4 v           |

Längderna är härledningar, inte studieresultat — litteraturen styr på
hastighet och kroppsfettnivå, inte på tid. Motivering per siffra i
`dietPhases.ts`.

### Vad som fungerar bra i dag

Värt att säga innan bristerna, eftersom det avgör vad som **inte** ska rivas:

- **Fasbytet är atomärt.** `start_diet_phase` avslutar föregående fas och
  startar den nya i ett RPC-anrop, just för att två anrop kunde lämna
  användaren utan aktiv fas.
- **Uppföljningen är ärlig.** Den skiljer `too_early` (vätskesvängningar) från
  verkliga avvikelser, och `deficit_level_changed_at` hindrar att ett
  nivåbyte läses som att användaren misslyckats.
- **Estimerat TDEE flaggas.** `tdeeIsEstimated` finns på båda ställena, och
  texten säger att avvikelsen troligen beror på formeln — inte på användaren.
- **Fokusspåret sparas på perioden**, så en pågående fas inte byter namn.

### Gränsen gratis/premium

En flagga: `diet_phase_planning`.

**Gratis:** välja och byta fas, kalori- och proteinmål, kostläge,
veckoräknare, uppföljning, tidsberäknaren, justera underskottsdjup.

**Premium:** planerad längd + progressbar, fashistorik, guidat nästa steg,
reverse-upptrappning, "Använd X veckor".

---

## 2. Sex brister

Ordnade efter hur mycket de undergräver löftet "en plan som följs upp".

### 2.1 Perioden har ingen målvikt

`diet_phases` har `planned_weeks` men **ingen målvikt**. Tidsberäknaren
frågar efter en, räknar ut veckor — och kastar bort målet; `onUseWeeks`
skickar bara `Math.ceil(weeks)`.

Följd: **progressbaren mäter tid, inte framsteg.** Den som ligger före planen
ser samma bar som den som inte gått ner ett gram.

Rotorsak till 2.2 och delvis 2.6.

### 2.2 Ingenting händer när perioden tar slut

`phaseProgress` klampar till 1, `weeksSince` fortsätter räkna. Efter tolv
veckor står det "vecka 15 av 12" med full bar. Ingen uppmaning, ingen notis.
Det guidade nästa steget finns i koden men triggar aldrig av sig själv.

En plan utan slut är en påminnelse, inte en plan.

### 2.3 Kalorimålet följer inte vikten

`target_calories` sparas en gång och står kvar. Mätt (88,4 kg, TDEE 2881,
mål 3169 = +10 %):

| Vikt    | Underhåll | Faktiskt överskott |
| ------- | --------- | ------------------ |
| 88,4 kg | 2881      | 288 kcal           |
| 94 kg   | 2998      | 171 kcal           |
| 100 kg  | 3060      | 109 kcal           |

Uppgången bromsar in av sig själv: 70 veckor i stället för 43.
`phaseCalorieDrift` finns och räknar rätt sedan mattefixen 2026-08-22.

### 2.4 TDEE följer inte vikten — blockerar 2.3

En vägning skriver `weight_kg` (`ProfilePage.tsx:469`) men rör aldrig
`tdee`. Ingen trigger på `weight_history`. TDEE skrivs bara vid kalibrering,
i TDEE-verktyget eller manuellt.

Kopplas driften in som den är rapporterar den **fantomdrift** — divergensen
mellan färsk vikt och inaktuell TDEE läses som förändrat behov.

### 2.5 Historiken visar inte vad perioden gav

`PhaseHistoryCard` visar veckor och **startvikt** — aldrig slutvikt.
`diet_phases` har ingen `end_weight_kg`, till skillnad från
`calibration_history` som sparar både start och slut.

En avslutad period säger alltså inte om den lyckades. Det är premiumets
tyngsta säljargument som ligger oanvänt.

### 2.6 Uppföljningen förklarar inte avvikelsen

`tracking.behind` säger "Det går långsammare än planerat", och
`estimatedTdeeHint` tillägger att formeln kan vara fel. Men appen har
intagsloggen, viktkurvan och kalibreringen — den skulle kunna skilja _du åt
mer än målet_ från _ditt TDEE är högre än formeln tror_. Två avvikelser med
helt olika åtgärd.

---

## 3. Arbetsplan

Fem steg. Varje steg är självständigt värdefullt, testbart och kan släppas
för sig.

### Steg 1 — Perioden får ett mål och ett resultat

**Varför först:** rotorsak till 2.1, 2.2 och 2.5. Samlar de två
migrationerna till en.

**Migration:** `target_weight_kg` och `end_weight_kg` på `diet_phases`, båda
nullable (underhåll har ingen målvikt). `end_diet_phase` sätter slutvikten
från senaste vägningen.

**Kod:**

- `PrepDurationHelper.onUseWeeks` → `onUsePlan({ weeks, targetWeightKg })`
- `PhasePickerDialog` sparar båda
- `DietPhaseCard`: framsteg mot **vikt** — "3,2 av 11,6 kg" med bar
- `PhaseHistoryCard`: "88,4 → 85,2 kg på 12 veckor"

**Gränsdragning:** målvikt och resultat sparas och visas för alla.
Framstegsbaren förblir premium.

**Testas:** att målvikten överlever hela vägen från räknaren till kortet;
att slutvikten sätts vid avslut; att underhåll utan målvikt inte kraschar.

### Steg 2 — Perioden får ett slut

**Beror på:** steg 1 (målvikten behövs för "klar i förtid").

- Nytt tillstånd i `phaseTracking`: `completed` när `planned_weeks` passerats
  **eller** målvikten nåtts
- Kortet byter läge: "Perioden är klar", resultat, guidat nästa steg som knapp
- Notis via befintligt system — `useCalibrationNotifier` är mallen
  (`notifiedRef` i klienten, servern som andra spärr)
- Målvikt nådd i förtid: fira, föreslå underhåll eller reverse

**Gränsdragning:** avslutningen visas **för alla**. Att inte säga till när en
period är slut är ett fel, inte en premiumfunktion. Det guidade nästa steget
förblir premium.

**Testas:** att `completed` triggar på båda villkoren; att notisen skickas
en gång; att preview-läget inte skickar notiser.

### Steg 3 — TDEE följer vikten

**Oberoende av 1–2.** Rättar ett fel som finns oavsett perioder.

- `useCalculations` räknar redan om BMR/TDEE i minnet — persistera det vid
  viktändring **när `tdee_source` är formelbaserad**
- `tdee_source = 'manual'`: rör aldrig, användaren har sagt sitt
- `tdee_source = 'metabolic_calibration'`: rör aldrig, men **uppmana till ny
  kalibrering** vid stor viktförändring

Det sista är svaret på kalibreringsfrågan: mätningen äger frågan när den
finns, formeln fyller luckan när den inte gör det.

**Testas:** att varje `tdee_source` behandlas rätt; att TDEE inte driftar vid
oförändrad vikt.

### Steg 4 — Uppföljningen säger varför

**Beror på:** steg 3 (behöver aktuellt TDEE för att skilja orsakerna).

Appen har redan data för att skilja tre fall:

| Vad som mätts                 | Slutsats                      | Åtgärd som föreslås            |
| ----------------------------- | ----------------------------- | ------------------------------ |
| Intag ≈ mål, vikt följer inte | TDEE-skattningen stämmer inte | Kalibrera                      |
| Intag > mål                   | Mer äts än planerat           | Justera målet eller loggningen |
| För lite loggat               | Går inte att avgöra           | Logga fler dagar               |

Det är den enskilt största kvalitetshöjningen för en premiumanvändare, och
kräver ingen migration.

**Testas:** att varje fall ger rätt slutsats; att otillräcklig data ger
"vet ej" i stället för en gissning.

### Steg 5 — Målet räknas om

**Beror på:** steg 3. Sist, för att den har fem konfliktytor.

Måste lösas innan en rad skrivs:

1. **`phaseTracking`** får samma bugg som `deficit_level_changed_at` finns
   för att förhindra — `expectedChangeKg` = nuvarande takt × hela gångna
   tiden. Mätt: kvot 1,80 för någon som följt planen exakt.
2. **Reverse diet undantas helt.** Där är `target_calories` en baslinje som
   upptrappningen räknar ovanpå; ett nytt värde får trappan att hoppa.
3. **Två tabeller utan transaktion** — `diet_phases.target_calories` och
   `profiles.calories_min/max`. Triggern rör inte de senare; skrivs bara den
   ena ändras kortets siffra men inte matdagbokens mål.
4. **Manuellt mål går inte att skilja från automatiskt.** Ny kolumn krävs.
5. **Preview Mode** måste hoppa över skrivningen.

**Ordning inom steget:** notis (ingen skrivning) → förslag med knapp som
återanvänder `DeficitLevelDialog` (skriver redan alla fält rätt) → automatik
sist, och bara om förslaget visar sig otillräckligt.

**Vad gratis ser:** vid periodstart, för alla —

> Ditt energibehov ändras när vikten gör det. Väg dig regelbundet, så märker
> appen när målet behöver räknas om.

Vid passerad tröskel, gratis (texten i den befintliga låsta rutan byts, inget
nytt element):

> Du har gått upp {{kg}} kg sedan starten, och en tyngre kropp gör av med
> mer. Ditt mål står kvar på nivån från startvikten — det är därför
> uppgången bromsar in. Med Premium räknas det om åt dig.

`driftKcal` och `adjustedCalories` visas aldrig för gratis, inte heller
blurrat. Blur säger "du får inte", inte "det finns".

---

## 4. Ordning och beroenden

| Steg                         | Beror på | Migration | Risk  | Värde |
| ---------------------------- | -------- | --------- | ----- | ----- |
| 1 Mål och resultat           | —        | Ja        | Låg   | Högt  |
| 2 Slut på perioden           | 1        | Nej       | Låg   | Högt  |
| 3 TDEE följer vikten         | —        | Nej       | Medel | Medel |
| 4 Uppföljningen säger varför | 3        | Nej       | Låg   | Högt  |
| 5 Omräkning                  | 3        | Ja        | Hög   | Medel |

Steg 1 och 3 är oberoende och kan tas parallellt. **Mest värde per insats:
1, 2 och 4** — tillsammans gör de perioden till en plan med början, framsteg,
slut och förklaring.

Steg 5 är det som gör upplevelsen sömlös, men också det som kan gå tyst
sönder. Det ska inte tas förrän 1–4 fungerar.

---

## 5. Vad som inte ska göras

- **Automatik före notis.** Fem konfliktytor, och värdet är litet inom en
  period: tröskeln nås ~en gång per standardperiod och är värd ~46 kcal.
- **Flytta uppföljningen bakom premium.** Att se att planen inte håller är
  inte en betaltjänst.
- **Två system som skriver samma kolumn.** Kalibreringen mäter verkligt TDEE;
  en formelbaserad justering bredvid ger motstridiga sanningsanspråk.
- **Riva fasbytet.** Det är atomärt av ett dokumenterat skäl.

---

## 6. Redan löst

Kalibreringsfrågan behöver ingen ny kod i steg 1–2.
`phase.estimatedTdeeTitle/Body/Action` säger redan att siffrorna bygger på
en uppskattning, att formler slår fel med tio procent eller mer, och att
appen kan mäta det verkliga värdet efter ett par veckors loggning.
`tdeeIsEstimated` finns i både `DietPhaseCard` och `PhasePickerDialog`.
