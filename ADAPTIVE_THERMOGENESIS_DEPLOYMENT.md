# Adaptive Thermogenesis (AT) - Deployment & Usage

## ✅ Vad som är implementerat

### Frontend (Komplett)
- ✅ Database migration (baseline_bmr, accumulated_at, AT history table)
- ✅ TypeScript types (ATCalculationInput, ATCalculationResult, etc.)
- ✅ AT calculation function (`calculateWeeklyAT`)
- ✅ Baseline BMR sätts automatiskt när TDEE skapas
- ✅ UI-komponenter:
  - MetabolicInfo (sidopanel) - Visar baseline, AT, effektiv BMR
  - ATHistoryCard - Visar AT-historik
  - BaselineResetCard - Återställ baseline (avancerade inställningar)

### Backend (Komplett)
- ✅ Supabase Edge Function: `calculate-adaptive-thermogenesis`
- ✅ Beräknar AT baserat på viktförändring (7-dagars period)
- ✅ Uppdaterar `accumulated_at` i profilen
- ✅ Sparar till `adaptive_thermogenesis_history`

## 🚀 Hur AT-beräkningar körs

### Automatisk beräkning (Dagligen)

AT-beräkningar körs automatiskt **när du loggar din vikt** och det finns minst 2 viktvärden de senaste 7 dagarna.

Edge Function kan köras via:

#### 1. **Manuell trigger (För testing)**
```bash
# Via Supabase CLI
supabase functions invoke calculate-adaptive-thermogenesis

# Via curl (kräver ANON_KEY)
curl -X POST \
  'https://your-project.supabase.co/functions/v1/calculate-adaptive-thermogenesis' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

#### 2. **External Cron Service** (Rekommenderat för production)

Använd en tjänst som [cron-job.org](https://cron-job.org) eller [EasyCron](https://www.easycron.com):

1. Skapa ett nytt cron job
2. URL: `https://your-project.supabase.co/functions/v1/calculate-adaptive-thermogenesis`
3. Header: `Authorization: Bearer YOUR_ANON_KEY`
4. Schema: `0 2 * * *` (kör dagligen kl 02:00)

#### 3. **GitHub Actions** (Gratis alternativ)

Skapa `.github/workflows/at-calculation.yml`:

```yaml
name: Daily AT Calculation

on:
  schedule:
    - cron: '0 2 * * *'  # Kör dagligen kl 02:00 UTC
  workflow_dispatch:  # Tillåt manuell körning

jobs:
  calculate-at:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AT Calculation
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/calculate-adaptive-thermogenesis' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

Lägg till secrets i GitHub:
- `SUPABASE_URL`: Din Supabase project URL
- `SUPABASE_ANON_KEY`: Din Supabase anon key

## 📊 Hur AT-beräkningar fungerar

### Krav för beräkning:
1. ✅ Profilen har `baseline_bmr` (sätts automatiskt när TDEE skapas)
2. ✅ Minst **2 viktvärden** loggade de senaste **7 dagarna**
3. ✅ Grundläggande information är ifylld (vikt, längd, födelsedatum, kön)

### Beräkningsprocess:

1. **Hämta viktförändring**
   ```typescript
   const firstWeight = weights[0].weight_kg
   const lastWeight = weights[weights.length - 1].weight_kg
   const weightChange = lastWeight - firstWeight
   ```

2. **Estimera kaloribalans från viktförändring**
   ```typescript
   // 1 kg = ~7700 kcal
   const calorie_balance_7d = weightChange * 7700
   ```

3. **Beräkna AT-förändring**
   ```typescript
   if (calorie_balance_7d < 0) {
     at_weekly = -0.015 * baseline_bmr  // -1.5% vid underskott
   } else if (calorie_balance_7d > 0) {
     at_weekly = 0.0075 * baseline_bmr  // +0.75% vid överskott
   }
   ```

4. **Uppdatera ackumulerad AT**
   ```typescript
   new_accumulated_at = current_accumulated_at + at_weekly
   // Clamp: -12% till +6% av baseline
   ```

5. **Spara resultat**
   - Uppdatera `profiles.accumulated_at`
   - Spara till `adaptive_thermogenesis_history`

## 🎯 Exempel

### Scenario: Viktminskning med kaloriunderskott

**Profil:**
- Baseline BMR: 1750 kcal
- Startvikt: 80 kg
- TDEE: 2500 kcal

**Vecka 1:**
- Vikt dag 1: 80.0 kg
- Vikt dag 7: 79.5 kg
- Viktförändring: -0.5 kg
- Kaloribalans: -0.5 × 7700 = **-3850 kcal**
- AT-förändring: -0.015 × 1750 = **-26.25 kcal**
- Ackumulerad AT: **-26 kcal/dag**

**Vecka 4:**
- Total AT: -26 × 4 = **-105 kcal/dag**
- Aktuell BMR (vikt 78 kg): ~1650 kcal
- **Effektiv BMR**: 1650 - 105 = **1545 kcal**

Din metabolism har sänkts med **105 kcal/dag** (6% av baseline) utöver viktförändringen.

## 📈 Visa AT-data i UI

### Sidopanel (Automatiskt)
- **Baseline BMR**: Din fasta referenspunkt
- **Aktuell BMR**: Beräknad baserat på nuvarande vikt
- **Metabolisk anpassning (AT)**: Ackumulerad AT i kcal/dag och %
- **Effektiv BMR**: BMR + AT

### AT-historik (Automatiskt)
- Visar de senaste 10 AT-beräkningarna
- Kaloribalans per vecka
- AT-förändring per vecka
- Trendvisning (↓ nedgång, ↑ uppgång)

### Återställ Baseline (Manuellt)
- Finns under "Avancerade inställningar"
- **OBS**: Gör endast efter 8-12 veckor av stabil vikt och energibalans
- Nollställer AT och sätter ny baseline

## 🔧 Felsökning

### AT uppdateras inte
1. Kontrollera att du har loggat minst 2 viktvärden de senaste 7 dagarna
2. Verifiera att `baseline_bmr` är satt i din profil
3. Kolla Edge Function logs i Supabase Dashboard

### AT är alltid 0
- Edge Function har inte körts än
- Trigger cron manuellt eller vänta på nästa dagliga körning

### Fel i beräkningar
- Kontrollera Edge Function logs
- Verifiera att alla nödvändiga fält är ifyllda (vikt, längd, födelsedatum, kön)

## 📝 API Endpoints

### Trigger AT Calculation
```bash
POST https://your-project.supabase.co/functions/v1/calculate-adaptive-thermogenesis
Authorization: Bearer YOUR_ANON_KEY

Response:
{
  "success": true,
  "processed": 1,
  "results": [
    {
      "profile_id": "uuid",
      "weight_change": "-0.50",
      "calorie_balance_7d": -3850,
      "at_weekly": -26,
      "accumulated_at": -105,
      "bmr_effective": 1545
    }
  ]
}
```

## 🎓 Teori bakom AT

Se [ADAPTIVE_THERMOGENESIS_SPEC.md](./ADAPTIVE_THERMOGENESIS_SPEC.md) för fullständig specifikation och fysiologisk bakgrund.

**Kort sammanfattning:**
- AT är metabolisk anpassning utöver viktförändring
- Metabolism sjunker vid kaloriunderskott (sparar energi)
- Metabolism ökar vid kaloriöverskott
- AT är reversibel vid återgång till energibalans
- Maxgränser: -12% till +6% av baseline BMR

---

**Skapad:** 2024-12-25
**Status:** Production Ready ✅
