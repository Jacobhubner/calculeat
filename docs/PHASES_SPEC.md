# Perioder — analys och plan

Status: **arbetsplan.** Nuläget verifierat mot koden 2026-08-22.

Utgångspunkt: appen har ännu inga riktiga användare utöver enstaka testare.
Risken för regression är därför låg, och ambitionen kan sättas efter vad
funktionen **borde** vara — inte efter vad som är minst störande att ändra.

Målet: en premiumanvändare ska kunna lita på att perioden är en **plan som
följs upp**, där det enda hen behöver göra är att logga och väga sig.

---

## 1. Vad Perioder är i dag

En dietfas med mål, riktning och tänkt längd. Fyra typer, olika namn per
fokusspår:

| Typ           | Hälsospåret   | Styrkespåret  | Förvald längd |
| ------------- | ------------- | ------------- | ------------- |
| `cut`         | Viktminskning | Deff          | 12 v          |
| `bulk`        | Viktuppgång   | Bygga muskler | 12 v          |
| `maintenance` | Underhåll     | Underhåll     | 4 v           |
| `reverse`     | Trappa upp    | Reverse diet  | 4 v           |

Längderna är härledningar, inte studieresultat. Litteraturen styr på
hastighet och kroppsfettnivå, inte på tid. Motivering per siffra finns i
`dietPhases.ts`.

### Gränsen gratis/premium

En flagga: `diet_phase_planning`.

**Gratis:** välja och byta fas, kalori- och proteinmål, kostläge,
veckoräknare, uppföljning (faktisk mot förväntad viktförändring),
tidsberäknaren, justera underskottsdjup.

**Premium:** planerad längd + progressbar, fashistorik, guidat nästa steg,
reverse-upptrappning, "Använd X veckor".

Uppföljningen är alltså **redan gratis**. Gratisanvändaren ser att vikten
inte följer planen — men inte varför, och får ingen hjälp att rätta till det.

---

## 2. Analys: fem verkliga luckor

Ordnade efter hur mycket de undergräver löftet "en plan som följs upp".

### 2.1 Perioden har ingen målvikt

`diet_phases` har `planned_weeks` men **ingen målvikt**. Tidsberäknaren
frågar efter en, räknar ut veckor — och kastar sedan bort målet.
`onUseWeeks` skickar bara `Math.ceil(weeks)` vidare.

Följden är att perioden inte kan svara på den mest grundläggande frågan:
_hur långt har jag kommit?_ Progressbaren mäter **tid**, inte framsteg. En
användare som ligger före planen ser samma bar som en som inte gått ner alls.

Det här är rotorsaken till 2.2 och en del av 2.3.

### 2.2 Ingenting händer när perioden tar slut

`phaseProgress` klampar till 1, men `weeksSince` fortsätter räkna. Efter
tolv veckor står det "vecka 15 av 12" och baren är full. Ingen uppmaning,
ingen notis, inget guidat nästa steg förrän användaren själv avslutar.

En plan som inte har ett slut är en påminnelse, inte en plan.

### 2.3 Kalorimålet följer inte vikten

`target_calories` sparas en gång och står kvar. Mätt för 88,4 kg, TDEE 2881,
mål 3169 (+10 %):

| Vikt    | Underhåll | Faktiskt överskott |
| ------- | --------- | ------------------ |
| 88,4 kg | 2881      | 288 kcal           |
| 94 kg   | 2998      | 171 kcal           |
| 100 kg  | 3060      | 109 kcal           |

Uppgången bromsar in av sig själv: 70 veckor i stället för 43.
Tidsberäknarens svar förutsätter omräkning — utan den stämmer de inte.

`phaseCalorieDrift` finns och räknar rätt (efter mattefixen 2026-08-22).

### 2.4 TDEE följer inte vikten — blockerar 2.3

En vägning skriver `weight_kg` (`ProfilePage.tsx:469`) men rör aldrig
`tdee`. Ingen trigger finns på `weight_history`. TDEE skrivs bara vid
kalibrering, i TDEE-verktyget eller manuellt.

Kopplas driften in som den är rapporterar den **fantomdrift** — divergensen
mellan färsk vikt och inaktuell TDEE läses som att behovet ändrats.

### 2.5 Uppföljningen förklarar inte avvikelser

`tracking.behind` säger "Det går långsammare än planerat".
`estimatedTdeeHint` tillägger att formeln kan vara fel. Men appen vet mer än
så: den har intagsloggen, viktkurvan och kalibreringen. Den skulle kunna
skilja _du åt mer än målet_ från _ditt TDEE är högre än formeln tror_ — två
avvikelser med helt olika åtgärd.

---

## 3. Plan

Fyra steg. Varje steg är självständigt värdefullt och testbart.

### Steg 1 — Målvikt på perioden

**Varför först:** rotorsak till 2.1 och 2.2, och den enda ändringen som
kräver en migration. Allt annat blir bättre av att den finns.

- Ny kolumn `target_weight_kg` på `diet_phases` (nullable — underhåll har
  ingen).
- `PrepDurationHelper.onUseWeeks` skickar med målvikten, inte bara veckorna.
- `PhasePickerDialog` sparar den.
- `DietPhaseCard` visar **framsteg mot vikt** vid sidan av tid: "3,2 av
  11,6 kg" med en bar som mäter det.
- Progressbaren mäter framsteg, inte kalender.

Gratis/premium: målvikten sparas för alla, men **framstegsbaren är
premium** — den hör till planering över tid. Gratis ser målvikten som ett
tal.

### Steg 2 — Perioden får ett slut

**Varför:** utan det är planen aldrig avslutad, och det guidade nästa steget
(som redan finns) triggar aldrig av sig själv.

- Nytt tillstånd i `phaseTracking`: `completed` när `planned_weeks` passerats
  **eller** målvikten nåtts.
- Kortet byter läge: "Perioden är klar" med resultat (start → nu, uppnådd
  takt) och det guidade nästa steget som knapp.
- Notis via det befintliga systemet (`useCalibrationNotifier` är mallen —
  samma `notifiedRef`-mönster, servern som andra spärr).
- Vid nådd målvikt före tiden: fira det, föreslå underhåll eller reverse.

Gratis/premium: **avslutningen visas för alla** — att inte säga till när en
period är slut är ett fel, inte en premiumfunktion. Det guidade nästa steget
förblir premium.

### Steg 3 — TDEE följer vikten

**Varför:** låser upp 2.3, och rättar ett fel som finns oavsett perioder.

- `useCalculations` räknar redan om BMR/TDEE i minnet — resultatet
  persisteras aldrig. Skriv det vid viktändring **när `tdee_source` är
  formelbaserad**.
- `tdee_source = 'manual'`: rör aldrig. Användaren har sagt sitt.
- `tdee_source = 'metabolic_calibration'`: rör aldrig, men **uppmana till ny
  kalibrering** vid stor viktförändring. En mätning slår alltid en formel.

Det sista är också svaret på hur kalibreringen ska kopplas in: den äger
frågan när den finns, formeln fyller luckan när den inte gör det.

### Steg 4 — Målet räknas om

**Varför sist:** har fem konfliktytor och bygger på steg 3.

Innan en rad skrivs måste dessa lösas:

1. **`phaseTracking`** får samma bugg som `deficit_level_changed_at` finns
   för att förhindra — `expectedChangeKg` räknas som nuvarande takt gånger
   hela den gångna tiden. Mätt: kvot 1,80 för någon som följt planen exakt.
2. **Reverse diet undantas helt.** Där är `target_calories` en baslinje som
   upptrappningen räknar ovanpå; ett nytt värde får trappan att hoppa.
3. **Två tabeller utan transaktion** — `diet_phases.target_calories` och
   `profiles.calories_min/max`. Triggern rör inte de senare. Skrivs bara den
   ena ändras kortets siffra men inte matdagbokens mål.
4. **Manuellt mål går inte att skilja från automatiskt.** Kolumnen bär ingen
   proveniens; ny kolumn krävs.
5. **Preview Mode** måste hoppa över skrivningen, som de två befintliga
   ställena gör.

**Ordning inom steget:** notis först (ingen skrivning), sedan förslag med
knapp som återanvänder `DeficitLevelDialog` — den skriver redan alla fält i
rätt ordning. Automatik sist, och bara om förslaget visar sig otillräckligt.

### Vad gratis ser under steg 4

Premissen "att visa driften är att ge bort svaret" håller inte. Att veta
_att_ behovet ändrats säger inget om _hur mycket_ — det kräver formeln,
startvikten och den ursprungliga andelen.

Vid periodstart, för alla:

> Ditt energibehov ändras när vikten gör det. Väg dig regelbundet, så märker
> appen när målet behöver räknas om.

När tröskeln passerats, gratis (texten i den befintliga låsta rutan byts —
inget nytt element):

> Du har gått upp {{kg}} kg sedan starten, och en tyngre kropp gör av med
> mer. Ditt mål står kvar på nivån från startvikten — det är därför
> uppgången bromsar in. Med Premium räknas det om åt dig.

`driftKcal` och `adjustedCalories` visas aldrig för gratis, inte heller
blurrat. Blur säger "du får inte", inte "det finns".

---

## 4. Vad som INTE ska göras

- **Automatik före notis.** Fem konfliktytor, och värdet är litet inom en
  period: tröskeln nås ~en gång per standardperiod och är värd ~46 kcal.
- **Flytta uppföljningen bakom premium.** Den är gratis i dag och ska förbli
  det — att se att planen inte håller är inte en betaltjänst.
- **Två system som skriver samma kolumn.** Kalibreringen mäter verkligt
  TDEE; en formelbaserad driftjustering bredvid den ger motstridiga
  sanningsanspråk.

---

## 5. Ordning och beroenden

| Steg                 | Beroende av | Kräver migration | Risk  |
| -------------------- | ----------- | ---------------- | ----- |
| 1 Målvikt            | —           | Ja               | Låg   |
| 2 Slut på perioden   | 1           | Nej              | Låg   |
| 3 TDEE följer vikten | —           | Nej              | Medel |
| 4 Omräkning          | 3           | Ja (steg 4c)     | Hög   |

Steg 1 och 3 är oberoende och kan tas i valfri ordning. Steg 2 blir bäst
efter 1. Steg 4 är sist oavsett.

**Mest värde per insats: steg 1 och 2.** Tillsammans gör de perioden till en
plan med början, framsteg och slut — vilket är hela löftet.

---

## 6. Redan löst

Kalibreringsfrågan behöver ingen ny kod i steg 1–2.
`phase.estimatedTdeeTitle/Body/Action` säger redan att siffrorna bygger på
en uppskattning, att formler slår fel med tio procent eller mer, och att
appen kan mäta det verkliga värdet efter ett par veckors loggning.
`tdeeIsEstimated` finns i både `DietPhaseCard` och `PhasePickerDialog`.
