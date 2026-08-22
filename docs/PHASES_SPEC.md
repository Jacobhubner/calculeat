# Perioder — hur funktionen ska fungera

Status: **beslutsunderlag.** Nuläget är verifierat mot koden 2026-08-22.
Avsnitt 4 och framåt är förslag som väntar på beslut.

---

## 1. Vad Perioder är

En period är en dietfas med ett mål, en riktning och en tänkt längd. Fyra
typer, och de heter olika i de två fokusspåren:

| Typ           | Hälsospåret   | Styrkespåret  | Förvald längd |
| ------------- | ------------- | ------------- | ------------- |
| `cut`         | Viktminskning | Deff          | 12 v          |
| `bulk`        | Viktuppgång   | Bygga muskler | 12 v          |
| `maintenance` | Underhåll     | Underhåll     | 4 v           |
| `reverse`     | Trappa upp    | Reverse diet  | 4 v           |

Fokusspåret sparas på perioden. En pågående period byter alltså inte namn om
användaren senare väljer ett annat fokus.

Längderna är **härledningar, inte studieresultat**. Ingen granskad källa
anger en optimal faslängd — litteraturen styr på hastighet (% kroppsvikt per
vecka) och kroppsfettnivå. Motiveringen per siffra står i `dietPhases.ts`.

---

## 2. Gränsen mellan gratis och premium

Allt styrs av en enda flagga: `diet_phase_planning`. Principen i koden är

> planering över tid är premium, att välja fas och få mål är gratis

### Gratis

- Välja fas och byta fas
- Kalorimål och proteinmål
- Kostläge (alla fem lägen är fria sedan 2026-08-15)
- Veckoräknare — hur länge perioden pågått
- Uppföljning: faktisk mot förväntad viktförändring
- Tidsberäknaren i periodvalet (hur lång tid målet tar)
- Justera underskottsdjup mitt i perioden

### Premium

- **Planerad längd** och progressbar
- **Fashistorik** — avslutade perioder
- **Guidat nästa steg** efter avslutad period
- **Reverse dietens veckoupptrappning** (`weekly_calorie_step`)
- **"Använd X veckor"** — knappen som fyller i räknarens svar som faslängd

Tidsberäknaren flyttades ut ur gaten 2026-08-19. Motiveringen står kvar och
är värd att behålla: att räkna ut hur lång tid något tar är inte planering,
och samma svar finns gratis i Målsättning. En gräns som bara den oinvigde
stöter på är en dålig gräns.

---

## 3. Det olösta problemet

`target_calories` sparas **en gång** vid periodstart och följer aldrig
vikten. Men energibehovet gör det.

Mätt för ett verkligt fall (88,4 kg, TDEE 2881, mål 3169 = +10 %):

| Vikt    | Underhåll | Överskott vid mål 3169 |
| ------- | --------- | ---------------------- |
| 88,4 kg | 2881      | 288 kcal               |
| 94 kg   | 2998      | 171 kcal               |
| 100 kg  | 3060      | 109 kcal               |

Uppgången bromsar in av sig själv. Tiden till 100 kg blir **70 veckor i
stället för 43**, och användaren ser bara att vikten stannat — inte varför.
Tidsberäknarens veckotal förutsätter att målet räknas om; utan det stämmer
de inte.

`phaseCalorieDrift` (i `dietPhases.ts`) svarar på om tröskeln passerats och
vad målet borde vara. Tröskeln är 3 kg ≈ 46 kcal, ungefär där avvikelsen
börjar synas i viktkurvan i stället för att drunkna i dygnsvariationen.

### 3.1 Blockeraren

**`profiles.tdee` följer inte vikten.** En vägning skriver `weight_kg`
(`ProfilePage.tsx:469`) men rör aldrig `tdee`, och det finns ingen trigger på
`weight_history`. TDEE skrivs bara vid kalibrering, i TDEE-verktyget eller
manuellt.

Kopplas driften in som den är rapporterar den **fantomdrift**: den läser
divergensen mellan uppdaterad vikt och inaktuell TDEE som att behovet
ändrats. Det här måste avgöras först — allt annat hänger på det.

Tre vägar:

1. **Härled vid visning** ur BMR-formeln och aktuell vikt. Ingen migration.
   Fungerar inte för `tdee_source = 'manual'` eller `'metabolic_calibration'`
   — där finns ingen formel att räkna med, respektive ett uppmätt värde som
   inte får skalas med en formels antaganden.
2. **Persistera TDEE vid viktändring.** Rätt på sikt, men rör kalibreringen
   och är en egen ändring med följdverkningar.
3. **Låt kalibreringen äga frågan** — uppmana till ny mätning vid stor
   viktförändring i stället för att gissa justeringen.

**Rekommendation: 1 för formelbaserad TDEE, 3 för kalibrerad.** Det följer
principen att en mätning alltid slår en formel, och undviker två system som
drar i samma kolumn med olika sanningsanspråk.

---

## 4. Förslag: vad gratis ska se

Målet är att användaren ska veta att funktionen finns, utan att få den
gratis och utan att bli gnatad på.

**Premissen "att visa driften är att ge bort svaret" håller inte.** Att veta
_att_ behovet ökat säger inget om _hur mycket_ — det kräver formeln,
startvikten och den ursprungliga andelen. Den verkliga risken är motsatt: en
vag varning får användaren att gissa fel själv.

### Två placeringar

**Vid periodstart** (`PhasePickerDialog`, efter `trackingNotice`) — en
mening, för alla planer, eftersom det är en sanning om kroppen och inte en
säljpunkt:

> Ditt energibehov ändras när vikten gör det. Väg dig regelbundet, så märker
> appen när målet behöver räknas om.

**När tröskeln passerats** (`DietPhaseCard`) — texten i den befintliga
låsta rutan byts ut. Inget nytt element läggs till; rutan finns redan där.

Uppgång:

> Du har gått upp {{kg}} kg sedan starten, och en tyngre kropp gör av med
> mer. Ditt mål står kvar på nivån från startvikten — det är därför
> uppgången bromsar in. Med Premium räknas det om åt dig.

Nedgång:

> Du har gått ner {{kg}} kg sedan starten, och en lättare kropp gör av med
> mindre. Ditt mål står kvar på nivån från startvikten. Med Premium räknas
> det om åt dig.

Kilotalet syns redan på viktkurvan och avslöjar ingenting. **`driftKcal` och
`adjustedCalories` visas aldrig för gratis**, och inte som blurrad siffra
heller — blur säger "du får inte", inte "det finns".

Meningen om att uppgången bromsar in är hela poängen. Utan orsaken tror
användaren att hen gjort fel eller att appen inte fungerar.

---

## 5. Förslag: vad premium ska få

Målet är att det enda användaren behöver tänka på är att logga och väga sig.

### Automatiskt vid tröskel, inte vid varje vägning

Frekvensen är den skarpa frågan, inte automatik i sig. Vid varje vägning
skulle målet vandra dagligen med vätskesvängningar. Vid en 3-kg-tröskel
händer det 3–4 gånger under en period, det korrelerar med något användaren
själv ser på vågen, och det går att förklara i en mening.

Appen har redan precedens: reverse diet höjer målet varje vecka utan att
fråga.

### Men det kräver fem saker som inte finns

Granskningen hittade konflikter som måste lösas innan en rad kod skrivs:

1. **`phaseTracking` får samma bugg som `deficit_level_changed_at` finns för
   att förhindra.** `expectedChangeKg` räknas som nuvarande takt gånger hela
   den gångna tiden. Ändras målet retroaktivt blir uppföljningen fel — mätt
   till kvot 1,80 för någon som följt sin plan exakt.
2. **Reverse diet måste undantas helt.** Där är `target_calories` en
   _baslinje_ som upptrappningen räknar ovanpå. Skrivs ett nytt värde dit
   hoppar hela trappan.
3. **Kalorimålet måste skrivas till två tabeller utan transaktion** —
   `diet_phases.target_calories` och `profiles.calories_min/max`. Triggern
   rör inte de senare. Skrivs bara den ena ändras kortets siffra men inte
   matdagbokens mål, vilket är det värsta utfallet.
4. **Manuellt justerat mål går inte att skilja från automatiskt.** Kolumnen
   bär ingen proveniens. Krävs minst en ny kolumn för att automatiken ska
   veta att den inte ska skriva över.
5. **Preview Mode** måste hoppa över skrivningen, som de två befintliga
   ställena redan gör.

### Om det byggs

- Toast direkt: "Ditt kalorimål är uppdaterat till {{calories}} kcal — du
  väger {{kg}} kg mer än vid starten."
- Kvitto på kortet i sju dagar, med Ångra. En toast försvinner; den som
  loggar från telefonen ska hitta förklaringen senare.
- Har användaren justerat manuellt eller ångrat tidigare: **degradera till
  förslag med knapp**, applicera aldrig. Att ångra är ett uttalande om att
  man vill bestämma själv.

---

## 6. Är problemet värt att lösa?

Ärligt: **mindre än det ser ut**, och det påverkar hur mycket som bör
byggas.

Vid standardlängd (12 v) och 0,25 kg/vecka nås 3 kg ungefär en gång per
period, mot slutet. Underhåll och reverse (4 v) når den i princip aldrig.
Storleken vid tröskeln är ~46 kcal — under mätbrus i intagsloggning.

Fallet 88,4 → 100 kg är 11,6 kg och kräver fyra på varandra följande
standardperioder. Det är verkligt för en långsiktig bulk, men varje
periodbyte sätter redan ny startvikt och nytt mål, vilket dämpar felet.

**Slutsatsen: felet är verkligt men litet inom en period.** Det motiverar
notisen i avsnitt 4 med råge. Det motiverar inte nödvändigtvis en
automatisk databasskrivning med fem konfliktytor.

---

## 7. Föreslagen ordning

| Steg | Vad                              | Varför först                                                                      |
| ---- | -------------------------------- | --------------------------------------------------------------------------------- |
| 1    | Avgör TDEE-frågan (3.1)          | Allt annat rapporterar fantomdrift utan den                                       |
| 2    | Notis för gratis och premium (4) | Löser informationsproblemet, noll skrivkonflikter                                 |
| 3    | Förslag med knapp för premium    | Återanvänder dialoger som redan skriver alla fält rätt                            |
| 4    | Automatik                        | Först om steg 3 visar sig otillräckligt, och först när 5.2:s fem punkter är lösta |

Steg 2 och 3 ger merparten av värdet till en bråkdel av risken. Steg 4 är
det som gör upplevelsen helt sömlös — men det är också det som kan gå tyst
sönder.

---

## 8. Redan löst

Kalibreringsfrågan behöver ingen ny kod. `phase.estimatedTdeeTitle/Body/
Action` säger redan det som ska sägas: att siffrorna bygger på en
uppskattning, att formler av det slaget slår fel med tio procent eller mer,
och att appen kan mäta det verkliga värdet efter ett par veckors loggning.

`tdeeIsEstimated` finns och används i både `DietPhaseCard` och
`PhasePickerDialog`.
