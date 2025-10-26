# Supabase Database Setup

## Migrera till Supabase

1. Kopiera innehållet från `supabase/migrations/001_create_users_table.sql`
2. Gå till Supabase Dashboard → SQL Editor
3. Klistra in SQL-koden och kör den

Eller använd Supabase CLI:

```bash
npx supabase db push
```

## Tabellstruktur

### user_profiles

Tabellen innehåller all användarinformation:

- **Personlig info:** födelsedatum, kön, längd, vikt
- **Beräkningsinställningar:** BMR-formel, aktivitetsnivå, kroppsfettprocent
- **Beräknade värden:** BMR, TDEE
- **Mål:** kaloriemål och rekommenderade spann

## RLS (Row Level Security)

Endast den inloggade användaren kan:

- Se sin egen profil
- Uppdatera sin egen profil
- Skapa sin egen profil vid registrering

## Automatisk profilskapande

Vid ny användarregistrering skapas automatiskt en profil med email och full_name.
