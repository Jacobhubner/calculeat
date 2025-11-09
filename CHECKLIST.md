# CalculEat Redesign - Checklista

## ✅ Genomfört

### Färgschema

- [x] Uppdatera `tailwind.config.ts` med nya färger
  - Grönt: #25BD00 serie
  - Orange: #FF8B00 serie
- [x] Uppdatera `src/index.css` med CSS variabler
- [x] Lägg till nya gradient utilities

### Komponenter

- [x] Skapa `ImagePlaceholder.tsx`
- [x] Skapa `HeroSection.tsx`
- [x] Skapa `ProcessStep.tsx`
- [x] Skapa `HowItWorks.tsx`
- [x] Skapa `SuccessStories.tsx`
- [x] Skapa `FeatureShowcase.tsx`
- [x] Uppdatera `FeatureCard.tsx` med nya features

### Sidor

- [x] Redesigna `HomePage.tsx`
  - [x] Ny HeroSection
  - [x] Features grid
  - [x] Kalkylator (BEHÅLLEN)
  - [x] HowItWorks sektion
  - [x] SuccessStories
  - [x] CTA Footer
- [x] Redesigna `FeaturesPage.tsx`
  - [x] Hero med feature grid
  - [x] Detailed feature showcases
  - [x] Additional features
  - [x] CTA section

### Dokumentation

- [x] Skapa `IMAGE_PLACEHOLDERS.md`
- [x] Skapa `REDESIGN_SUMMARY.md`
- [x] Skapa `CHECKLIST.md`

### Testing

- [x] Projektet bygger utan fel
- [x] Alla nya komponenter fungerar
- [x] Kalkylatorn fungerar fortfarande

---

## 📋 Att göra

### Bilder (Hög prioritet)

- [ ] **Hero mockup** (600×800px)
  - Beskrivning: Dashboard mockup med kalorier och makron
  - Fil: `hero-dashboard-mockup.png`
  - Plats: `public/images/`

- [ ] **Process step icons** (4 × 80×80px)
  - `step-1-calculator.svg`
  - `step-2-food.svg`
  - `step-3-target.svg`
  - `step-4-progress.svg`
  - Plats: `public/images/steps/`

- [ ] **User avatars** (3 × 100×100px)
  - `user-1-anna.jpg`
  - `user-2-erik.jpg`
  - `user-3-maria.jpg`
  - Plats: `public/images/users/`

### Bilder (Medelhög prioritet)

- [ ] **Feature screenshots** (6 × 400×800px)
  - `feature-calculator-dashboard.png`
  - `feature-food-logging.png`
  - `feature-macro-modes.png`
  - `feature-goals-tracking.png`
  - `feature-body-composition.png`
  - `feature-dashboard.png`
  - Plats: `public/images/features/`

### Implementering när bilder finns

När du har skapat bilderna, ersätt placeholders:

1. **Hero mockup:**

```tsx
// I HeroSection.tsx, ersätt ImagePlaceholder med:
<img
  src="/images/hero-dashboard-mockup.png"
  alt="CalculEat Dashboard"
  className="rounded-3xl shadow-2xl w-full"
/>
```

2. **Process icons:**

```tsx
// I ProcessStep.tsx, lägg till img-tag
<img src={`/images/steps/${iconFilename}`} alt={iconName} className="w-20 h-20" />
```

3. **User avatars:**

```tsx
// I SuccessStories.tsx
<img
  src={`/images/users/${testimonial.avatarFilename}`}
  alt={testimonial.name}
  className="w-20 h-20 rounded-full mx-auto"
/>
```

4. **Feature screenshots:**

```tsx
// I FeatureShowcase.tsx
<img
  src={`/images/features/${screenshotFilename}`}
  alt={screenshotDescription}
  className="rounded-3xl shadow-2xl w-full"
/>
```

### Testing & Optimering

- [ ] Testa på olika enheter
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] iPad/Tablet
  - [ ] Desktop (Chrome, Firefox, Safari, Edge)
- [ ] Verifiera färgkontrast
- [ ] Testa keyboard navigation
- [ ] Verifiera screen reader accessibility
- [ ] Optimera bilder när de laddas upp (WebP, lazy loading)

### SEO & Meta

- [ ] Lägg till meta descriptions
- [ ] Lägg till Open Graph tags
- [ ] Lägg till Twitter Card tags
- [ ] Skapa favicon med nya färger
- [ ] Optimera title tags

### Performance

- [ ] Implementera lazy loading för bilder
- [ ] Implementera code splitting (dynamic imports)
- [ ] Optimera bundle size (se build warning)
- [ ] Add preload hints för critical assets

### Nice-to-have

- [ ] Lägg till Framer Motion animationer
  - [ ] Fade-in effekt för sektioner
  - [ ] Stagger effect för feature cards
  - [ ] Smooth scroll till kalkylator
- [ ] Lägg till skeleton loaders
- [ ] Implementera dark mode (valfritt)
- [ ] A/B test olika CTAs

---

## 🚀 Deploy Checklist

När du är redo att deploya:

- [ ] Alla bilder är skapade och uploadade
- [ ] Projektet bygger utan errors (`npm run build`)
- [ ] Testat på olika browsers
- [ ] Meta tags är korrekta
- [ ] Analytics setup (om önskat)
- [ ] Error tracking setup (Sentry, etc.)

---

## 📝 Anteckningar

### Verktyg för att skapa bilder:

- **Mockups:** Figma, Adobe XD, Canva
- **Icons:** Illustrator, Inkscape, Figma
- **Screenshots:** Faktiska screenshots från appen när den är klar
- **Avatars:** Unsplash, Pexels, Generated Photos

### Tips:

1. Börja med hero mockup - mest kritisk
2. Använd Figma templates för snabbare workflow
3. Exportera i 2x resolution för retina displays
4. Optimera bilder med TinyPNG innan upload
5. Konvertera till WebP för bättre performance

---

## 🎨 Design Assets

### Färgpalett (för designers)

```
PRIMARY GREEN:
- Lightest: #E6F9E1 (50)
- Light: #B8F0A8 (200)
- Main: #25BD00 (500) ← Använd denna
- Dark: #1A8400 (700)
- Darkest: #0F5000 (950)

ACCENT ORANGE:
- Lightest: #FFF3E6 (50)
- Light: #FFD9A8 (200)
- Main: #FF8B00 (500) ← Använd denna
- Dark: #CC6F00 (700)
- Darkest: #663800 (950)

NEUTRALS:
- White: #FFFFFF
- Background: #F9FAFB (50)
- Border: #E5E7EB (200)
- Text dark: #1F2937 (800)
- Text light: #6B7280 (600)
```

### Typography

- Font: System UI stack (Inter-liknande)
- H1: 60px (desktop), 36px (mobile)
- H2: 48px (desktop), 30px (mobile)
- Body: 18px lead, 16px normal

---

## ✅ Färdigt!

Projektet är redo att använda med placeholders.
Ersätt bilderna allteftersom du skapar dem.

**Nästa steg:** Öppna `IMAGE_PLACEHOLDERS.md` och börja skapa bilder! 🎨
