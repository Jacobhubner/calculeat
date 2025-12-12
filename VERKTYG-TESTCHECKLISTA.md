# Verktyg Testchecklista

## Navigering & Layout

### NAV-1: Expanderbar Navigation
- [ ] Klicka på "Verktyg" i sidomenyn
- [ ] Verifiera att sektionen expanderar/kollapsar
- [ ] Kontrollera att chevron-ikon roterar korrekt
- [ ] Verifiera att alla 6 verktyg visas i undermenyn

### NAV-2: Verktygsnavigation
- [ ] Klicka på varje verktyg i undermenyn
- [ ] Verifiera att rätt verktyg laddas
- [ ] Kontrollera att aktiv verktyg highlightas
- [ ] Verifiera att parent "Verktyg" också highlightas när barn är aktivt

### NAV-3: Direct URL Access
- [ ] Navigera direkt till `/app/tools/genetic-potential`
- [ ] Navigera direkt till `/app/tools/met-calculator`
- [ ] Navigera direkt till `/app/tools/tdee-calculator`
- [ ] Navigera direkt till `/app/tools/goal-calculator`
- [ ] Navigera direkt till `/app/tools/macro-optimizer`
- [ ] Verifiera att varje URL laddar rätt verktyg

---

## 🏋️ Kroppsanalys Verktyg

### GEN-1: Genetisk Muskelpotential - Grundläggande Load
**Plats:** `/app/tools/genetic-potential`
- [ ] Sidan laddar utan fel
- [ ] Header visar "Genetisk Muskelpotential"
- [ ] Badge visar "Kroppsanalys" (grön)
- [ ] Info-alert visas med förklaring

### GEN-2: Saknad Data - Höjd & Kön
- [ ] Om `height_cm` saknas: Orange varningskort visas
- [ ] Om `gender` saknas: Orange varningskort visas
- [ ] Klicka "Fyll i saknade uppgifter"
- [ ] Fyll i höjd (ex: 180 cm)
- [ ] Välj kön (Man/Kvinna)
- [ ] Klicka "Spara"
- [ ] Verifiera toast: "Profil uppdaterad"
- [ ] Verifiera att varningskortet försvinner

### GEN-3: Berkhan Formula (Standard)
- [ ] Verifiera att "Berkhan" formelknapp är aktiv (default)
- [ ] Resultat visar "Maximal mager massa"
- [ ] Resultat visar "Vid låg kroppsfett"
- [ ] Målvikter tabell visar 8 olika kroppsfett % (5%, 8%, 10%, 12%, 15%, 18%, 20%, 25%)

### GEN-4: Lyle McDonald Formula
- [ ] Klicka på "Lyle" formelknapp
- [ ] Verifiera att rätt resultat visas
- [ ] Jämför med Berkhan (ska vara liknande)

### GEN-5: Casey Butt Formula - Med Mätningar
- [ ] Fyll i "Handledsmått": 17.5 cm
- [ ] Fyll i "Ankelmått": 23.0 cm
- [ ] Verifiera att "Casey" formelknapp blir tillgänglig
- [ ] Klicka på "Casey" knapp
- [ ] Verifiera resultat (ska vara mer specifik än Berkhan/Lyle)

### GEN-6: Progress Tracking (Om Vikt & Kroppsfett finns)
- [ ] Höger sidopanel visar "Din Nuvarande Status"
- [ ] Visar aktuell vikt och kroppsfett
- [ ] Visar mager massa
- [ ] Progress bar visar "Progress (Berkhan): XX%"
- [ ] Visar "Återstående potential: +X.X kg"

### GEN-7: Auto-uppdatering från Profil
- [ ] Gå till Profil
- [ ] Ändra höjd från 180 → 185 cm
- [ ] Återgå till Genetisk Muskelpotential
- [ ] Verifiera att resultat uppdaterats automatiskt

---

## 🔥 Energi & Metabol Verktyg

### MET-1: MET Kalkylator - Grundläggande Load
**Plats:** `/app/tools/met-calculator`
- [ ] Sidan laddar utan fel
- [ ] Header visar "MET Aktivitetskalkylator"
- [ ] Badge visar "Energi & Metabol" (orange)
- [ ] Visar antal aktiviteter: "från XXX olika alternativ"

### MET-2: Saknad Data - Vikt
- [ ] Om `weight_kg` saknas: Orange varningskort visas
- [ ] Klicka "Fyll i saknade uppgifter"
- [ ] Fyll i vikt (ex: 80 kg)
- [ ] Klicka "Spara"
- [ ] Verifiera toast: "Profil uppdaterad"

### MET-3: Kategorisökning
- [ ] Öppna "Kategori" dropdown
- [ ] Välj "Bicycling"
- [ ] Verifiera att endast cykelaktiviteter visas
- [ ] Välj "Running"
- [ ] Verifiera att endast löpaktiviteter visas
- [ ] Välj "Alla kategorier"
- [ ] Verifiera att alla aktiviteter visas igen

### MET-4: Textsökning
- [ ] Skriv "running" i sökfältet
- [ ] Verifiera att endast aktiviteter med "running" visas
- [ ] Skriv "swimming"
- [ ] Verifiera filtrering fungerar
- [ ] Töm sökfältet
- [ ] Verifiera att alla aktiviteter visas igen

### MET-5: Lägg till Aktivitet
- [ ] Sök efter "jogging"
- [ ] Klicka "Lägg till" på "Jogging, general"
- [ ] Ange varaktighet: 30 minuter
- [ ] Klicka "OK"
- [ ] Verifiera toast: "Jogging, general tillagd"
- [ ] Verifiera att aktiviteten dyker upp i höger panel "Valda Aktiviteter"
- [ ] Verifiera att "Totalt" uppdateras: Aktiviteter: 1, Tid: 30 min, Kalorier: XX kcal

### MET-6: Flera Aktiviteter
- [ ] Lägg till "Walking, 4 mph" - 45 min
- [ ] Lägg till "Bicycling, leisure" - 60 min
- [ ] Verifiera att "Totalt" summerar korrekt:
  - Aktiviteter: 3
  - Tid: 135 min (30+45+60)
  - Kalorier: Summa av alla tre

### MET-7: Ta bort Aktivitet
- [ ] Klicka papperskorg-ikon på första aktiviteten
- [ ] Verifiera att aktiviteten försvinner
- [ ] Verifiera att "Totalt" uppdateras korrekt

### MET-8: Rensa Alla
- [ ] Klicka "Rensa alla" knapp
- [ ] Verifiera att alla aktiviteter försvinner
- [ ] Verifiera att "Totalt" nollställs

### MET-9: Intensitetsbadge
- [ ] Hitta en aktivitet med låg MET (< 3.0)
- [ ] Verifiera blå badge "Lätt"
- [ ] Hitta en aktivitet med hög MET (> 6.0)
- [ ] Verifiera orange/röd badge "Hård"/"Mycket hård"

### MET-10: 50+ Resultat Limit
- [ ] Sök efter något generiskt (ex: "e")
- [ ] Scrolla ner i listan
- [ ] Verifiera meddelande: "Visar 50 av XXX aktiviteter. Förfina din sökning för fler resultat."

---

### TDEE-1: TDEE Kalkylator - Grundläggande Load
**Plats:** `/app/tools/tdee-calculator`
- [ ] Sidan laddar utan fel
- [ ] Header visar "TDEE & Kaloriuträknare"
- [ ] Badge visar "Energi & Metabol" (orange)

### TDEE-2: Saknad Data - Vikt, Höjd, Ålder, Kön
- [ ] Verifiera varning om något av följande saknas:
  - weight_kg
  - height_cm
  - age
  - gender
- [ ] Fyll i saknade uppgifter via varningskortet

### TDEE-3: BMR Display
- [ ] Verifiera att BMR-kortet visas (blå-lila gradient)
- [ ] Visar "Ditt BMR: XXXX kcal per dag"
- [ ] Visar förklaring om BMR

### TDEE-4: TDEE Display
- [ ] Verifiera att TDEE-kortet visas (grön-blå gradient)
- [ ] Visar "Din TDEE: XXXX kcal per dag"
- [ ] Visar aktivitetsnivå (ex: "Aktivitetsnivå: 1.55")
- [ ] PAL referenstabell visas:
  - 1.2 - Sittande (inaktiv)
  - 1.375 - Lätt aktiv
  - 1.55 - Måttligt aktiv
  - 1.725 - Mycket aktiv
  - 1.9 - Extra aktiv

### TDEE-5: Målväljare - Bibehåll Vikt
- [ ] Välj "Bibehåll vikt" i dropdown
- [ ] Verifiera kaloriintervall: ~95-105% av TDEE
- [ ] Verifiera "Daglig förändring: 0 kcal"
- [ ] Ingen veckoändring visas

### TDEE-6: Målväljare - Gå ner i vikt
- [ ] Välj "Gå ner i vikt"
- [ ] Välj "Måttlig (15%)" nivå
- [ ] Verifiera kaloriintervall är under TDEE
- [ ] Verifiera "Daglig förändring: -XXX kcal" (röd text)
- [ ] Verifiera "Estimerad viktändring: -X.XX kg per vecka" (röd text)

### TDEE-7: Målväljare - Gå upp i vikt
- [ ] Välj "Gå upp i vikt"
- [ ] Välj "Konservativ (10%)" nivå
- [ ] Verifiera kaloriintervall är över TDEE
- [ ] Verifiera "Daglig förändring: +XXX kcal" (grön text)
- [ ] Verifiera "Estimerad viktändring: +X.XX kg per vecka" (grön text)

### TDEE-8: Deficitnivåer
- [ ] Välj "Gå ner i vikt"
- [ ] Testa "Konservativ (10%)"
- [ ] Testa "Måttlig (15%)"
- [ ] Testa "Aggressiv (20%)"
- [ ] Verifiera att kaloriintervall ändras korrekt för varje nivå

### TDEE-9: Auto-uppdatering från Profil
- [ ] Gå till Profil
- [ ] Ändra vikt från 80 → 85 kg
- [ ] Återgå till TDEE Kalkylator
- [ ] Verifiera att BMR och TDEE uppdaterats automatiskt

---

## 🎯 Mål & Planering Verktyg

### GOAL-1: Måluträknare - Grundläggande Load
**Plats:** `/app/tools/goal-calculator`
- [ ] Sidan laddar utan fel
- [ ] Header visar "Måluträknare"
- [ ] Badge visar "Mål & Planering" (lila)

### GOAL-2: Saknad Data - Vikt, Kroppsfett, Kön
- [ ] Verifiera varning om något av följande saknas:
  - weight_kg
  - body_fat_percentage
  - gender
- [ ] Fyll i saknade uppgifter

### GOAL-3: Nuvarande Status Display
- [ ] Verifiera att "Din Nuvarande Status" kort visas
- [ ] Visar aktuell vikt och kroppsfett
- [ ] Visar mager massa (grön box)
- [ ] Visar fettmassa (orange box)
- [ ] Visar kategori (ex: "Average - Genomsnitt - Acceptabel")

### GOAL-4: Kroppsfett Kategorisering
- [ ] För Man vid 20% kroppsfett: Ska visa "Average"
- [ ] För Man vid 12% kroppsfett: Ska visa "Athletes"
- [ ] För Kvinna vid 25% kroppsfett: Ska visa "Fitness"
- [ ] Verifiera färgkodning (grön=Athletes, blå=Fitness, gul=Average, etc.)

### GOAL-5: Målslider - Kroppsfett
- [ ] Dra slider för "Mål Kroppsfett %"
- [ ] Testa värden: 5%, 15%, 25%, 35%
- [ ] Verifiera att input-fält uppdateras synkroniserat
- [ ] Skriv direkt i input-fältet (ex: 12.5)
- [ ] Verifiera att slider uppdateras
- [ ] Verifiera att "Målkategori" uppdateras baserat på valt värde

### GOAL-6: Målvikt Beräkning
- [ ] Sätt mål till 15% kroppsfett
- [ ] Verifiera resultat i höger panel:
  - "Målvikt: XX.X kg" (lila gradient)
  - Pil-ikon (ner för förlust, upp för ökning)
  - "±X.X kg" (röd för förlust, grön för ökning)
  - "att förlora/att öka"
- [ ] Verifiera "Fettförändring: ±X.X kg"

### GOAL-7: Veckovis Viktförändring Slider
- [ ] Dra slider för "Veckovis Viktförändring"
- [ ] Testa värden: 0.1 kg, 0.5 kg, 1.0 kg, 1.5 kg
- [ ] Verifiera att tidslinje uppdateras baserat på valt värde

### GOAL-8: Tidslinje Beräkning
- [ ] Verifiera "Tidslinje" kort visar:
  - "Veckor: XX veckor"
  - "Månader: X.X månader"
  - "Uppskattat slutdatum: [Datum i svenskt format]"
- [ ] Ändra veckovis viktförändring från 0.5 → 1.0 kg
- [ ] Verifiera att tidslinje halveras (cirka)

### GOAL-9: Före/Efter Scenario
- [ ] Starta med 85 kg, 20% kroppsfett
- [ ] Sätt mål till 12% kroppsfett
- [ ] Sätt veckovis förändring till 0.5 kg
- [ ] Verifiera rimliga resultat:
  - Målvikt ska vara lägre än nuvarande
  - Fettförändring ska vara negativ
  - Mager massa ska vara bibehållen

---

### MACRO-1: Makro-optimerare - Grundläggande Load
**Plats:** `/app/tools/macro-optimizer`
- [ ] Sidan laddar utan fel
- [ ] Header visar "Makro-optimerare"
- [ ] Badge visar "Mål & Planering" (lila)

### MACRO-2: Saknad Data - Vikt (Valfritt)
- [ ] Om `weight_kg` saknas: Varning visas
- [ ] Protein per kg kan inte beräknas utan vikt
- [ ] Andra beräkningar fungerar ändå

### MACRO-3: Makro-lägen Väljare
- [ ] Verifiera att 4 lägesknappar visas:
  1. NNR (Nordiska Näringsrekommendationer)
  2. Off-season (Muskelbyggande)
  3. On-season (Cutting/Tävling)
  4. Anpassat
- [ ] Default läge är NNR (aktiv)

### MACRO-4: NNR Läge
- [ ] Klicka på "NNR" knapp
- [ ] Verifiera rekommenderade intervall:
  - Protein: 10% - 20%
  - Fett: 25% - 40%
  - Kolhydrater: 45% - 60%
- [ ] Verifiera att sliders sätts till mitten av intervallen:
  - Protein: ~15%
  - Fett: ~32.5%
  - Kolhydrater: ~52.5% (auto-beräknat)

### MACRO-5: Off-season Läge
- [ ] Klicka på "Off-season" knapp
- [ ] Verifiera intervall:
  - Protein: 15% - 25%
  - Fett: 20% - 30%
  - Kolhydrater: 50% - 60%
- [ ] Verifiera slider-uppdatering

### MACRO-6: On-season Läge
- [ ] Klicka på "On-season" knapp
- [ ] Verifiera intervall:
  - Protein: 25% - 35%
  - Fett: 20% - 30%
  - Kolhydrater: 40% - 50%
- [ ] Verifiera högre protein för cutting

### MACRO-7: Anpassat Läge
- [ ] Klicka på "Anpassat" knapp
- [ ] Verifiera bredare intervall:
  - Protein: 10% - 40%
  - Fett: 15% - 45%
  - Kolhydrater: 20% - 65%

### MACRO-8: Målkalorier Input
- [ ] Ändra "Kalorier per dag" från 2000 → 2500
- [ ] Verifiera att makron i gram uppdateras proportionellt
- [ ] Testa olika värden: 1500, 2000, 3000, 4000 kcal

### MACRO-9: Protein Slider
- [ ] I NNR läge, dra protein slider från 15% → 20%
- [ ] Verifiera att:
  - Protein % uppdateras
  - Input-fält uppdateras
  - Kolhydrater % minskar automatiskt (för att summera till 100%)
  - Resultatkortet uppdateras

### MACRO-10: Fett Slider
- [ ] Dra fett slider från 32% → 25%
- [ ] Verifiera att:
  - Fett % uppdateras
  - Kolhydrater % ökar automatiskt
  - Resultatkortet uppdateras

### MACRO-11: Kolhydrater Auto-beräkning
- [ ] Sätt Protein: 30%, Fett: 25%
- [ ] Verifiera Kolhydrater automatiskt blir: 45%
- [ ] Sätt Protein: 20%, Fett: 40%
- [ ] Verifiera Kolhydrater automatiskt blir: 40%
- [ ] Sätt Protein: 35%, Fett: 35%
- [ ] Verifiera Kolhydrater blir: 30%

### MACRO-12: Validering - Över 100%
- [ ] Sätt Protein: 50%, Fett: 60%
- [ ] Kolhydrater blir negativ (-10%)
- [ ] Verifiera felmeddelande: "Fel: Makron summerar inte till 100%"
- [ ] Verifiera att kolhydrater input-fält blir röd
- [ ] Verifiera att resultatpanelen döljs

### MACRO-13: Resultat Display - Protein
- [ ] Sätt 2000 kcal, 25% protein
- [ ] Verifiera blå box visar:
  - "25%"
  - "Gram: 125 g" (2000 * 0.25 / 4)
  - "Kalorier: 500 kcal"
  - Om vikt finns: "Per kg kroppsvikt: X.X g/kg"

### MACRO-14: Resultat Display - Fett
- [ ] Sätt 2000 kcal, 30% fett
- [ ] Verifiera gul box visar:
  - "30%"
  - "Gram: 67 g" (2000 * 0.30 / 9)
  - "Kalorier: 600 kcal"

### MACRO-15: Resultat Display - Kolhydrater
- [ ] Med 25% protein, 30% fett
- [ ] Verifiera grön box visar:
  - "45%" (auto-beräknat)
  - "Gram: 225 g" (2000 * 0.45 / 4)
  - "Kalorier: 900 kcal"

### MACRO-16: Protein per kg Kroppsvikt
- [ ] Sätt vikt i profil: 80 kg
- [ ] Sätt 2000 kcal, 30% protein (150g)
- [ ] Verifiera "Per kg kroppsvikt: 1.9 g/kg" (150/80)
- [ ] Ändra till 40% protein (200g)
- [ ] Verifiera uppdatering till "2.5 g/kg"

### MACRO-17: Total Display
- [ ] Verifiera "Totalt" kort visar:
  - "Totala kalorier: 2000 kcal per dag" (lila gradient)
  - "Protein: 25% | Fett: 30% | Kolhydrater: 45%"

---

## Responsivitet & Design

### RESP-1: Desktop (>1024px)
- [ ] Alla verktyg visar 2-kolumn layout (2fr_1fr grid)
- [ ] Input/inställningar till vänster
- [ ] Resultat till höger
- [ ] Navigation fullt synlig

### RESP-2: Tablet (768px - 1024px)
- [ ] Layout kollapsar till 1 kolumn
- [ ] Input ovanför resultat
- [ ] Navigation funkar fortfarande

### RESP-3: Mobil (<768px)
- [ ] Alla verktyg staplas vertikalt
- [ ] Sliders fungerar med touch
- [ ] Input-fält är klickbara
- [ ] Navigation kollapsar (om responsive navbar finns)

---

## Cross-Tool Integration

### INT-1: Profilbyte
- [ ] Starta på Genetisk Muskelpotential
- [ ] Gå till Profil → Byt till annat profilkort
- [ ] Återgå till Genetisk Muskelpotential
- [ ] Verifiera att beräkningar uppdateras baserat på ny profil

### INT-2: Profil Update Propagation
- [ ] Öppna MET Kalkylator
- [ ] I annan flik/fönster: Uppdatera vikt i Profil
- [ ] Återgå till MET Kalkylator
- [ ] Lägg till en aktivitet
- [ ] Verifiera att ny vikt används i beräkningen

### INT-3: Saknad Data Flow
- [ ] Starta med tom profil (ingen data)
- [ ] Besök varje verktyg
- [ ] Fyll i saknade uppgifter via varningskort
- [ ] Verifiera att efterföljande verktyg inte visar samma varning

---

## Performance & Errors

### PERF-1: MET Search Performance
- [ ] Skriv snabbt i MET sökfält (ex: "running")
- [ ] Verifiera ingen fördröjning/lag
- [ ] Verifiera att filtrering är omedelbar

### PERF-2: Slider Responsiveness
- [ ] Dra olika sliders snabbt
- [ ] Verifiera att beräkningar uppdateras smidigt utan lag

### ERR-1: Felhantering - Negativa Värden
- [ ] Försök ange negativ vikt: -80 kg
- [ ] Försök ange negativt kroppsfett: -10%
- [ ] Verifiera att inputs blockerar/validerar

### ERR-2: Felhantering - Extremvärden
- [ ] Ange extremt hög vikt: 500 kg
- [ ] Ange extremt högt kroppsfett: 80%
- [ ] Verifiera att beräkningar inte kraschar

---

## Browser Compatibility

### BROWSER-1: Chrome/Edge
- [ ] Testa alla verktyg i Chrome/Edge
- [ ] Verifiera all funktionalitet

### BROWSER-2: Firefox
- [ ] Testa alla verktyg i Firefox
- [ ] Verifiera all funktionalitet

### BROWSER-3: Safari (om tillgänglig)
- [ ] Testa alla verktyg i Safari
- [ ] Verifiera all funktionalitet

---

## Fas 5: Polish & Förbättringar

### POLISH-1: Error Boundary
**Testar felhantering**
- [ ] Navigera till `/app/tools/genetic-potential`
- [ ] Öppna Developer Console (F12)
- [ ] Injicera ett fel (t.ex. genom att ändra localStorage)
- [ ] Verifiera att error boundary fångar felet
- [ ] Verifiera rött felkort visas med "Något gick fel"
- [ ] Klicka "Ladda om sidan" - verifiera att sidan laddas om
- [ ] Klicka "Tillbaka till översikt" - verifiera navigation till /app

### POLISH-2: Loading States
**Testar laddningsindikatorer**
- [ ] Öppna Developer Tools → Network tab
- [ ] Throttle network till "Slow 3G"
- [ ] Navigera mellan olika verktyg
- [ ] Verifiera att loading skeleton visas under laddning (om implementerat)
- [ ] Verifiera smooth transition till faktiskt innehåll

### POLISH-3: Konsekvent Spacing
**Alla verktyg ska ha samma spacing**
- [ ] Besök alla 6 verktyg
- [ ] Verifiera `space-y-6` mellan huvudsektioner
- [ ] Verifiera konsekvent padding i kort
- [ ] Verifiera konsekvent marginal mellan element

### POLISH-4: Typografi Konsistens
**Alla verktyg ska ha samma textstorlekar**
- [ ] Verktygsrubrik (H2): `text-2xl font-bold`
- [ ] Beskrivning: `text-neutral-600`
- [ ] Card titlar: `text-lg` eller default
- [ ] Labels: `text-sm`
- [ ] Hjälptext: `text-xs text-neutral-500`

### POLISH-5: Badge Färger
**Verifiera kategori-färger är konsekventa**
- [ ] Kroppsanalys: Grön (`bg-green-100 text-green-700`)
- [ ] Energi & Metabol: Orange (`bg-orange-100 text-orange-700`)
- [ ] Mål & Planering: Lila (`bg-purple-100 text-purple-700`)

### POLISH-6: Gradient Boxes Konsistens
**Alla resultat-boxar ska ha liknande gradient-stil**
- [ ] GeneticPotentialTool: Grön-blå gradient för max muskelmassa
- [ ] METCalculatorTool: Orange gradient för total kalorier
- [ ] TDEECalculatorTool: Blå-lila gradient för BMR, grön-blå för TDEE
- [ ] GoalCalculatorTool: Lila-blå gradient för målvikt
- [ ] MacroOptimizerTool: Lila-blå gradient för totala kalorier

### POLISH-7: Hover States
**Alla interaktiva element ska ha hover-effekter**
- [ ] Buttons: Hover ändrar färg
- [ ] Cards: Ingen hover (statisk)
- [ ] Aktivitetsrader (MET): `hover:bg-neutral-50`
- [ ] Links: Hover underline

### POLISH-8: Focus States (Accessibility)
**Alla inputs ska ha tydlig focus-ring**
- [ ] Klicka i text inputs
- [ ] Tab till sliders
- [ ] Tab till buttons
- [ ] Tab till dropdowns
- [ ] Verifiera att focus-ring är synlig (blå)

### POLISH-9: Disabled States
**Disabled element ska vara tydligt disabled**
- [ ] MET kalkylator utan vikt: "Lägg till" knapp disabled
- [ ] Verifiera grå färg och cursor-not-allowed
- [ ] Verifiera tooltip eller varningsmeddelande

### POLISH-10: Empty States
**Tomma listor ska ha användbar placeholder**
- [ ] MET: Sök efter "xyzabc123" (inga resultat)
- [ ] Verifiera "Inga aktiviteter hittades"
- [ ] MET: Inga valda aktiviteter → "Totalt" kort visar 0
- [ ] GoalCalculator: Saknad data → Visar endast varningskort

### POLISH-11: Toast Notifications
**Alla framgångsrika åtgärder ska ge feedback**
- [ ] Spara saknad data → "Profil uppdaterad" (grön toast)
- [ ] Lägg till MET aktivitet → "[Aktivitet] tillagd" (grön toast)
- [ ] Fel vid sparande → "Kunde inte uppdatera profil" (röd toast)

### POLISH-12: Scroll Behavior
**Långa listor ska scrolla smidigt**
- [ ] MET aktivitetslista: `max-h-96 overflow-y-auto`
- [ ] Verifiera smooth scroll
- [ ] Verifiera scrollbar syns när innehåll är längre än max höjd

### POLISH-13: Responsiv Grid Breakpoints
**Testa olika skärmstorlekar**
- [ ] Desktop (>1024px): `lg:grid-cols-[2fr_1fr]` fungerar
- [ ] Tablet (768-1024px): Grid kollapsar till 1 kolumn
- [ ] Mobil (<768px): Allt staplas vertikalt

### POLISH-14: Touch Targets (Mobil)
**Alla klickbara element ska vara minst 44x44px på mobil**
- [ ] Buttons är tillräckligt stora
- [ ] Sliders är touch-vänliga
- [ ] Dropdowns fungerar på touch-enheter

### POLISH-15: Animation & Transitions
**Smooth transitions mellan tillstånd**
- [ ] Expandera/kollapsa Verktyg-sektion: Smooth animation
- [ ] Slider ändringar: Omedelbar uppdatering utan lag
- [ ] Lägg till/ta bort aktivitet: Smooth fade in/out (om tillämpligt)

---

## Rapporteringsformat

När du rapporterar problem, använd följande format:

```
**Test ID:** [ex: MET-5]
**Problem:** [Beskriv vad som gick fel]
**Förväntat:** [Vad skulle hända]
**Faktiskt:** [Vad hände]
**Steg för att återskapa:**
1. [Steg 1]
2. [Steg 2]
...
**Skärmdump:** [Om möjligt]
```

## Sammanfattning

**Total antal tester:** 115+
- Navigation & Layout: 3 tests
- Genetisk Muskelpotential: 7 tests
- MET Kalkylator: 10 tests
- TDEE Kalkylator: 9 tests
- Måluträknare: 9 tests
- Makro-optimerare: 17 tests
- Responsivitet: 3 tests
- Integration: 3 tests
- Performance & Errors: 2 tests
- Browser: 3 tests
- **Fas 5 Polish & Förbättringar: 15 tests** ⭐ NYA

**Estimerad testtid:** 2.5-3.5 timmar för full genomgång

---

## Fas 5 Förbättringar (Implementerade)

### ✅ Nya Komponenter
1. **ToolLayout** - Gemensam layout-komponent för konsekvent header
2. **ToolSkeleton** - Loading skeleton för bättre UX under laddning
3. **ToolErrorBoundary** - Fångar och hanterar fel gracefully

### ✅ Implementerade Förbättringar
- Error boundary för alla verktyg (fångar runtime-fel)
- Konsekvent design system (färger, spacing, typografi)
- Bättre felhantering med användarvänliga meddelanden
- Förbättrad toast-feedback för alla åtgärder
- Konsekvent gradient-styling för resultat-kort

### 🎯 Fokusområden för Testning
- **Felhantering**: Testa error boundary (POLISH-1)
- **Konsistens**: Verifiera spacing, färger och typografi (POLISH-3 till POLISH-6)
- **Accessibility**: Focus states och keyboard navigation (POLISH-8)
- **Responsivitet**: Touch targets och grid breakpoints (POLISH-13, POLISH-14)
