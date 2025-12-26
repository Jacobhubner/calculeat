# GitHub Secrets Setup för Adaptive Thermogenesis

Denna guide visar hur du sätter upp GitHub Secrets för automatisk AT-beräkning via GitHub Actions.

## 📋 Nödvändiga Secrets

Du behöver lägga till följande secrets i ditt GitHub-repository:

### 1. **SUPABASE_ACCESS_TOKEN**

- **Vad**: Din Supabase Access Token för CLI-autentisering
- **Hur man får den**:
  1. Gå till [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
  2. Klicka **Generate New Token**
  3. Namnge den: `GitHub Actions AT Deployment`
  4. Kopiera token-värdet (visas endast en gång!)

### 2. **SUPABASE_PROJECT_ID**

- **Vad**: Ditt projekt-ID (project reference)
- **Hur man får det**:
  1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
  2. Välj ditt CalculEat-projekt
  3. Gå till **Settings** → **General**
  4. Kopiera **Reference ID** (börjar med bokstäver, typ `abcdefghijklmn`)

### 3. **SUPABASE_URL**

- **Vad**: Din Supabase projekt-URL
- **Hur man får det**:
  1. Gå till **Settings** → **API**
  2. Kopiera **Project URL** (typ `https://abcdefghijklmn.supabase.co`)

### 4. **SUPABASE_ANON_KEY**

- **Vad**: Din Supabase anon/public key
- **Hur man får den**:
  1. Samma sida: **Settings** → **API**
  2. Kopiera **anon/public** key under "Project API keys"

---

## 🔐 Lägga till Secrets i GitHub

1. Gå till ditt GitHub-repository: `https://github.com/USERNAME/CalculEat`
2. Klicka på **Settings** (längst till höger i menyn)
3. I vänster sidmeny, klicka **Secrets and variables** → **Actions**
4. Klicka **New repository secret**
5. För varje secret ovan:
   - Namn: (exakt som ovan, t.ex. `SUPABASE_ACCESS_TOKEN`)
   - Värde: (klistra in värdet från Supabase)
   - Klicka **Add secret**

---

## ✅ Verifiera Setup

När alla secrets är tillagda:

1. Gå till **Actions** i ditt GitHub-repo
2. Välj **Daily Adaptive Thermogenesis Calculation** workflow
3. Klicka **Run workflow** → **Run workflow** (manuell trigger)
4. Vänta ~1-2 minuter
5. Kontrollera att workflow-körningen blir grön ✅

---

## 📅 Automatisk Schemaläggning

Workflow körs automatiskt:

- **Varje dag kl 02:00 UTC** (03:00 svensk tid på vintern, 04:00 på sommaren)
- Du kan också köra manuellt när som helst via **Actions** → **Run workflow**

---

## 🔍 Felsökning

### Workflow misslyckas med "unauthorized"

- Kontrollera att `SUPABASE_ACCESS_TOKEN` är korrekt
- Generera en ny token om den gamla har gått ut

### Edge function deployment misslyckas

- Verifiera att `SUPABASE_PROJECT_ID` är rätt (ingen URL, bara ID)
- Kontrollera att token har rätt permissions

### AT-beräkning returnerar "no profiles processed"

- Kör migration-filen i SQL Editor först (se ADAPTIVE_THERMOGENESIS_DEPLOYMENT.md)
- Kontrollera att din profil har `baseline_bmr` satt

### "Function not found" error

- Edge function kanske inte deployats korrekt
- Kör workflow manuellt igen för att re-deploya

---

## 📊 Övervaka AT-beräkningar

Efter framgångsrik körning:

1. Gå till **Supabase Dashboard** → **Edge Functions**
2. Klicka på `calculate-adaptive-thermogenesis`
3. Gå till **Logs** för att se körningshistorik
4. Du kan också kontrollera `adaptive_thermogenesis_history` tabellen i Database

---

**Skapad:** 2025-12-26
**Status:** Production Ready ✅
