# CalculEat - Image Placeholders

Detta dokument listar alla bildplaceholders som behöver skapas för CalculEat-projektet.

## Färgschema

**PRIMARY (Grönt):**

- `#25BD00` (HSL: 108, 100%, 37%)
- `#26BD00` / `#26BF00` (HSL: 108, 100%, 32%)

**ACCENT (Orange):**

- `#FF8B00` (HSL: 33, 100%, 50%)
- `#FF9800` (HSL: 30, 100%, 50%)
- `#FF8C00` (HSL: 33, 100%, 45%)

---

## Startsida (HomePage)

### 1. Hero Section ✅

**Fil:** `hero-dashboard-mockup.png`

- **Storlek:** 600×800px (3:4 aspect ratio)
- **Beskrivning:** Dashboard mockup som visar översikt av dagens kaloriintag, makrofördelning och progress rings
- **Stil:** Modern app interface med gröna och orange accenter
- **Plats:** Högra sidan av hero-sektionen
- **Status:** ✅ KLAR - Uppladdad!

### 2. Process Steps Icons ✅

**Status:** ✅ ANVÄNDER LUCIDE REACT ICONS - Inget behöver skapas!

Vi använder befintliga Lucide React ikoner:

- Calculator (Beräkna ditt behov)
- Utensils (Logga dina måltider)
- Target (Sätt upp dina mål)
- TrendingUp (Följ din progress)

### 3. Success Stories - User Avatars (3 st)

**Filer:**

- `user-1-anna.jpg` (100×100px, rund)
- `user-2-erik.jpg` (100×100px, rund)
- `user-3-maria.jpg` (100×100px, rund)

**Beskrivning:** Profilbilder för testimonials (kan vara stock photos eller generiska avatars)

---

## Features Page (FeaturesPage)

### 4. Feature Icons för Hero Grid ✅

**Status:** ✅ ANVÄNDER LUCIDE REACT ICONS - Inget behöver skapas!

Vi använder befintliga Lucide React ikoner:

- Calculator (Smart Kalkyler)
- Apple (Kostloggning)
- Target (Målsättning)
- TrendingUp (Progress Tracking)
- Dumbbell (Makro-program)
- Activity (Kroppskomposition)
- BarChart3 (Dashboard)
- Database (Livsmedelsdatabas)

### 5. Feature Screenshots (6 st, mobil format)

**Storlek:** 400×800px (1:2 aspect ratio)

#### a) Calculator Dashboard

**Fil:** `feature-calculator-dashboard.png`

- **Beskrivning:** Calculator dashboard med BMR/TDEE resultat och formelval
- **Innehåll:** Formulär för input (kön, ålder, vikt, längd, aktivitet), resultatvisning med BMR och TDEE, formelval dropdown

#### b) Food Logging

**Fil:** `feature-food-logging.png`

- **Beskrivning:** Kostloggning vy med sökfunktion och makro-översikt
- **Innehåll:** Sökfält för mat, lista med livsmedel, makrofördelning (protein, kolhydrater, fett), kaloriräknare

#### c) Macro Modes

**Fil:** `feature-macro-modes.png`

- **Beskrivning:** Makro-program val med NNR, Off-Season och On-Season lägen
- **Innehåll:** Cards med olika makro-program, procentfördelningar, description för varje läge

#### d) Goals & Tracking

**Fil:** `feature-goals-tracking.png`

- **Beskrivning:** Målsättning dashboard med viktmål och progress graf
- **Innehåll:** Viktmål input, tidslinje, progress graf över tid, nuvarande vikt vs målvikt

#### e) Body Composition

**Fil:** `feature-body-composition.png`

- **Beskrivning:** Kroppskomposition mätningar med olika formler
- **Innehåll:** Val av mätmetod (Jackson/Pollock, Navy, etc.), input för mätningar, resultat med fettprocent och fettfri massa

#### f) Dashboard Overview

**Fil:** `feature-dashboard.png`

- **Beskrivning:** Dashboard med kalori-ring, makro-bar och statistik
- **Innehåll:** Progress ring för kalorier, makrofördelning bar chart, dagens statistik, veckogenomsnitt

---

## Design Guidelines

### Stil

- **Modern & Clean:** Minimalistisk design med mycket whitespace
- **Rounded Corners:** Använd 16-24px border-radius på kort och element
- **Shadows:** Subtila skuggor för djup (shadow-lg, shadow-xl)
- **Typography:** Sans-serif font (Inter, SF Pro, eller liknande)

### Färganvändning

1. **PRIMARY GREEN (#25BD00):**
   - Huvudknappar
   - Primära ikoner
   - Progress indicators
   - Aktiva tillstånd

2. **ACCENT ORANGE (#FF8B00):**
   - Sekundära knappar
   - Call-to-actions
   - Highlights
   - Viktiga siffror/värden

3. **Neutral Colors:**
   - Bakgrunder: Vitt (#FFFFFF) och ljusgrått (#F9FAFB)
   - Text: Mörkgrå (#1F2937) för headings, ljusare grå (#6B7280) för body text
   - Borders: Ljusgrå (#E5E7EB)

### Mobile-First

Alla screenshots ska vara i mobil format (400×800px) eftersom appen är mobile-first. Desktop-versioner kan skapas senare vid behov.

### Ikoner

- Linjestil (stroke-width: 2)
- Enkla och tydliga
- Konsekvent stil genom hela appen

---

## Prioriterad Lista

### Hög Prioritet (Startsida)

1. ✅ Hero dashboard mockup (`hero-dashboard-mockup.png`) - **KLAR!**
2. ✅ Process step icons - **ANVÄNDER LUCIDE ICONS**
3. ⏳ User avatars (3 st) - **ÅTERSTÅR**

### Medelhög Prioritet (Features Page)

4. ⏳ Calculator dashboard screenshot
5. ⏳ Food logging screenshot
6. ⏳ Dashboard overview screenshot

### Lägre Prioritet

7. ⏳ Macro modes screenshot
8. ⏳ Goals tracking screenshot
9. ⏳ Body composition screenshot

---

## Verktyg & Tips

### Rekommenderade verktyg för att skapa mockups:

- **Figma** - Professionellt design tool (gratis för små projekt)
- **Canva** - Enklare, mer användarvänligt
- **Adobe XD** - Adobe's design tool
- **Sketch** - Mac-only design tool

### För ikoner:

- **Illustrator** - För vektorgrafik
- **Inkscape** - Gratis alternativ till Illustrator
- **Figma** - Även bra för ikoner

### För screenshots:

1. Skapa mobile frames i Figma/XD
2. Designa UI med dina färger
3. Exportera som PNG (2x resolution för retina displays)
4. Eller använd verkliga screenshots från appen när den är klar

### Stock Photos (för user avatars):

- **Unsplash** - Gratis stock photos
- **Pexels** - Gratis stock photos
- **Generated Photos** - AI-genererade ansikten

---

## Nästa Steg

1. **Skapa hero mockup först** - Detta är den viktigaste bilden på startsidan
2. **Process icons** - Kan vara enkla och snabba att skapa
3. **User avatars** - Kan använda stock photos tillfälligt
4. **Feature screenshots** - Skapa efter hand när du har tid

**Tips:** Du kan börja med placeholders och uppdatera bilderna gradvis. Sajten fungerar redan med placeholders!
