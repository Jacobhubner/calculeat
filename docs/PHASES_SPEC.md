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

#### planned_weeks sparas alltid — beslut 2026-08-22

I dag sparas längden bara för premium:

```ts
plannedWeeks: hasPlanning && weeks ? Number(weeks) : null,  // PhasePickerDialog.tsx:256
```

Det gör att en gratisperiod aldrig kan "ta slut på tid" i steg 2. Beslutet
är att **alltid spara en standardlängd, men låta bara premium ändra den**.
Fältet fylls redan med `suggestion.plannedWeeks` vid varje öppning —
värdet kastas bara bort vid start.

Fyra skäl:

1. **Samma kategorifel som tidsberäknaren**, som flyttades ut ur gaten
   2026-08-19 med motiveringen att "en gräns som bara den oinvigde stötte
   på är en dålig gräns". Här stöter gratisanvändaren inte på ett lås — hon
   stöter på en period som ser trasig ut.
2. **Konsekvens inom funktionen.** Steg 1 sparar redan målvikt för alla och
   gatar bara framstegsbaren. Att behandla längden annorlunda vore
   inkonsekvent.
3. **Alternativet kostar tre kodvägar** i `phaseTracking` i stället för en:
   klar-på-tid, klar-på-målvikt, och "kan aldrig bli klar" — den sista utan
   definierat beteende.
4. **Dagens gate är ändå kosmetisk.** Ingen trigger enforcar den; värdet går
   att sätta via ett direkt RPC-anrop.

**Ordningsföljd som inte får glida:** med det här blir "vecka 15 av 12"
synligt för alla i stället för bara premium. Avslutningslogiken (steg 2)
måste därför levereras i SAMMA släpp, inte efteråt.

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

### Steg 0 — Spåren säger vad de är, och ett proteinfel rättas

**Först, för att det är rena text- och tabelländringar utan beräkningsrisk
— och för att ett av fynden är en verklig bugg.**

#### 0a. Hälsospårets bulk ger för lite protein (BUGG)

Hälsospårets `bulk` och `maintenance` anger protein i ENERGIPROCENT
(10–20 E%) via NNR-läget, inte i g/kg. Vid en bulk blir det fel väg:
10 E% av ett FÖRHÖJT kalorimål ger, för 80 kg vid TDEE 2500:

| Överskott | Kalorier | 10 E% protein        |
| --------- | -------- | -------------------- |
| +10 %     | 2750     | 69 g = **0,86 g/kg** |
| +20 %     | 3000     | 75 g = **0,94 g/kg** |

Det är LÄGRE än samma spårs cut (1,2–1,6 g/kg, Leidy 2015) och långt under
Morton 2018:s brytpunkt 1,62 g/kg. Man får alltså mindre protein när man
bygger än när man bantar.

**Åtgärd:** peka hälsospårets bulk mot `active` i stället för `nnr`
(1,6–2,0 g/kg, Morton 2018). Det tar samtidigt bort behovet av
`NNR_CALORIE_OVERRIDE`, eftersom fasen ändå styr kaloririktningen.

#### 0b. Reverse-texten bryter mot kodens egen regel (BUGG)

`dietPhases.ts` säger uttryckligen: upptrappning ska presenteras som
"hjälp för den som vill ha struktur", ALDRIG som "så här undviker du att
gå upp i vikt" — det senare stöds inte av datan.

Nuvarande text säger: "...så att kroppen hinner med och **vikten inte
rusar tillbaka**."

**Åtgärd:** ny text som lovar struktur, inte utfall:

> Höj kalorierna stegvis efter en period i underskott i stället för att gå
> tillbaka i ett steg. Ger struktur på vägen tillbaka till underhåll.

**Fasen behålls i båda spåren.** En granskning föreslog att ta bort reverse
ur hälsospåret på grund av RCT:n som fann störst viktökning och högst
avhopp i reverse-armen. Men koden flaggar själv att publikationstypen är
osäker (supplement) och att två oberoende granskningar kom till olika
slutsats. Att ta bort en fas på preliminär evidens är ett större steg än
att rätta en text som bevisligen bryter mot en regel. Omprövas om
evidensen stärks.

#### 0c. Beskrivningarna blir spårspecifika

`phase.descriptions` är gemensam och renderas spåroberoende. Texterna är
skrivna i STYRKESPRÅK: hälsospårets cut säger "så att muskelmassan ska
sitta kvar", trots att dess protein är motiverat av MÄTTNAD
(`macroModes.ts`: weightloss-läget är "för allmänheten, inte
tävlingsförberedelse").

Spåren ÄR redan olika i protein och makron — appen säger bara aldrig vad
skillnaden består i. Ny nyckelstruktur: `phase.descriptions.${focus}.${type}`.

#### 0d. Styrketräning nämns där beslutet fattas

Texten finns (`phase.prep.gainStrengthTraining`) men renderas bara i
tidsräknaren vid uppgång. Den som väljer styrkespåret och startar en bulk
utan att öppna räknaren ser den aldrig.

Visas nu även i fasvalet när `focus === strength && selected === bulk`.
Ingen spärr — träning går inte att verifiera, och en fråga användaren kan
ljuga på ger friktion utan säkerhet.

#### Vad som INTE ändras

- **Kalorinivån ska inte skilja sig mellan spåren.** Helms 2023: 5 % mot
  15 % överskott gav likartad muskeltillväxt medan större överskott starkt
  förutsade fettökning. Mer till styrkespåret vore mer fett utan mer
  muskler. Likheten är avsiktlig — `NNR_CALORIE_OVERRIDE` finns just för
  att tvinga fram den.
- **Faslängden ska inte skilja sig.** Ingen granskad källa anger ett
  optimalt veckotal alls, alltså definitivt inte två. Startfettnivån är
  rätt variabel, och den hanteras redan i tidsräknaren.

---

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
