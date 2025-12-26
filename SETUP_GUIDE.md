# ⚡ Snabbguide: Aktivera Adaptive Thermogenesis

Allt är redan klart i koden! Du behöver bara göra 2 saker:

## 📋 Steg 1: Hämta Supabase-värden (5 minuter)

Gå till [Supabase Dashboard](https://supabase.com/dashboard) och din projekt:

### 1.1 Hämta Access Token

1. Klicka på din profil (uppe till höger) → **Account Settings**
2. Gå till **Access Tokens** i vänster meny
3. Klicka **Generate New Token**
4. Namnge den: `GitHub Actions`
5. **Kopiera token** (visas endast en gång!) och spara temporärt i en anteckning

### 1.2 Hämta Project ID

1. Gå tillbaka till ditt projekt
2. Klicka **Settings** (kugghjulet) → **General**
3. Under "Reference ID" hittar du: `mdtrmyvwkypnivbjtgkc`
4. **Kopiera denna** och spara i anteckningen

---

## 🔐 Steg 2: Lägg till GitHub Secrets (5 minuter)

Gå till ditt GitHub-repo: https://github.com/Jacobhubner/calculeat

1. Klicka **Settings** (högst upp till höger)
2. Klicka **Secrets and variables** → **Actions** (i vänster meny)
3. Klicka **New repository secret** (grön knapp)

Lägg till dessa 4 secrets (en i taget):

### Secret 1: SUPABASE_ACCESS_TOKEN

- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Value:** (klistra in token från steg 1.1)
- Klicka **Add secret**

### Secret 2: SUPABASE_PROJECT_ID

- **Name:** `SUPABASE_PROJECT_ID`
- **Value:** `mdtrmyvwkypnivbjtgkc`
- Klicka **Add secret**

### Secret 3: SUPABASE_URL

- **Name:** `SUPABASE_URL`
- **Value:** `https://mdtrmyvwkypnivbjtgkc.supabase.co`
- Klicka **Add secret**

### Secret 4: SUPABASE_ANON_KEY

- **Name:** `SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdHJteXZ3a3lwbml2Ymp0Z2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTY1OTIsImV4cCI6MjA3NzA3MjU5Mn0.nEfm1t36epMw8_d0qYHTnXEYqzCz09pUbWIEXfQhJUA`
- Klicka **Add secret**

---

## ✅ Steg 3: Kör första AT-beräkningen (2 minuter)

1. Gå till **Actions** i ditt GitHub-repo
2. Välj **Daily Adaptive Thermogenesis Calculation** (i vänster lista)
3. Klicka **Run workflow** (höger sida)
4. Klicka den gröna **Run workflow** knappen
5. Vänta ~1-2 minuter
6. Uppdatera sidan - workflow ska bli grön ✅

---

## 🎉 Klart!

Nu körs AT-beräkningar automatiskt varje dag kl 03:00 svensk tid!

### Vad händer nu automatiskt:

- **Varje dag kl 03:00:** Edge function körs och beräknar AT för alla profiler
- **TDEE uppdateras:** Baserat på din metaboliska anpassning
- **Historik sparas:** Se din AT-utveckling över tid i ProfilePage

### Testa att det fungerar:

1. Gå till din hemsida: https://calculeat.vercel.app (eller din domän)
2. Logga in och gå till **Profil**
3. Under "Resultat" ska TDEE visas
4. Under "Metabolisk Information" ska du se:
   - Baseline BMR
   - Aktuell BMR
   - Metabolisk anpassning (AT)
   - Effektiv BMR

Om du inte ser "Metabolisk Information" ännu, behöver du:

- Sätta en baseline BMR (sker automatiskt när du skapar första profilen med TDEE)
- Ha loggat minst 2 viktvärden de senaste 7 dagarna

---

## ❓ Frågor?

- **Workflow misslyckas?** Kolla att alla 4 secrets är korrekt inlagda
- **Inget AT visas?** Se till att du har baseline_bmr satt och minst 2 viktvärden
- **Behöver hjälp?** Kolla loggarna i GitHub Actions för felmeddelanden

**Status:** Production Ready ✅
**Skapad:** 2025-12-26
