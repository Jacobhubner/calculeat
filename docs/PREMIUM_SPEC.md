# Premium-spec — CalculEat

Beslutad 2026-07-12. Detta dokument är facit för all premium-gating: exakta gränser,
nedgraderingsregler och lanseringsläge. Ändringar i gränser görs HÄR först, sedan i
`get_plan_limits()` (SQL) och `src/lib/constants/entitlements.ts` — alla tre ska alltid
vara i synk.

## Planer

| Plan      | Beskrivning                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `free`    | Gratisnivån efter hard launch                                                      |
| `premium` | Betald nivå (Stripe, Fas 4)                                                        |
| `founder` | Gratis premium — soft launch-testare, manuellt tilldelad. Behåller allt permanent. |

**Regler:**

- Admins och super admins (rad i `public.admins`) behandlas ALLTID som `founder`, oavsett prenumerationsrad.
- **Soft launch-läge:** så länge `app_config.premium_enforcement = 'off'` behandlas ALLA användare som `founder`. Flippas till `'on'` vid hard launch — det är hela lanseringsknappen.
- Data raderas ALDRIG p.g.a. plan. Historik sparas alltid; endast synligheten begränsas. Retroaktiv upplåsning vid uppgradering.

## Feature-matris (beslutad: "justerad matris")

| Nyckel (limits-JSON)       | Gratis                                          | Premium/Founder                                          | Enforcement                                                                                                                                    |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `saved_meals`              | 10                                              | obegränsat (-1)                                          | DB-trigger på `saved_meals` INSERT                                                                                                             |
| `recipes`                  | 3 (personliga)                                  | obegränsat (-1)                                          | DB-trigger på `recipes` INSERT (endast `shared_list_id IS NULL`)                                                                               |
| `recipe_images`            | nej                                             | ja                                                       | UI + storage-policy (Fas 2+)                                                                                                                   |
| `history_days`             | 30                                              | obegränsat (-1)                                          | Endast UI (egen data, inget att skydda)                                                                                                        |
| `csv_export`               | nej                                             | ja                                                       | UI (funktionen byggs direkt bakom gate)                                                                                                        |
| `advanced_trends`          | nej (vikttrend alltid gratis)                   | ja                                                       | UI                                                                                                                                             |
| `period_stats`             | nej (30-d snitt gratis)                         | ja (90-d jämförelser)                                    | UI                                                                                                                                             |
| `all_tdee_formulas`        | nej (Mifflin + Basic internet-PAL + Custom PAL) | ja (alla 10 formler, alla PAL-system + aktivitetswizard) | UI; jämförelsefliken suddad/låst; låsta select-alternativ märks "— Premium" + intercept (FREE_BMR_FORMULAS/FREE_PAL_SYSTEMS i entitlements.ts) |
| `calibrations_per_quarter` | 1                                               | obegränsat (-1)                                          | UI + kontroll i `useCalibrationAvailability`                                                                                                   |
| `advanced_body_comp`       | nej (2 basmetoder: U.S. Navy + Heritage BMI)    | ja (alla 12 + mäthistorik)                               | UI                                                                                                                                             |
| `genetic_potential`        | nej                                             | ja                                                       | UI                                                                                                                                             |
| `owned_shared_lists`       | 1 (skapade & fortfarande medlem)                | obegränsat (-1)                                          | DB-trigger på `shared_lists` INSERT                                                                                                            |
| `label_scans_per_month`    | 5                                               | obegränsat (-1)                                          | Räknas ur `scan_usage` (`scan_type='nutrition_label'`, kalendermånad)                                                                          |

**Alltid gratis (aldrig gate:at):** daglig loggning, streckkodsskanning, makros,
Livsmedelsverket + manuella livsmedel, vänner, chatt, delning (share_invitations),
medlemskap i obegränsat antal listor, goal-kalkylator, BMI/BMR/MET, vikttrend,
kvartalskalibrering.

## Nedgraderingsregler (premium → free)

Genomgående princip: **läsbar men låst — aldrig radering.**

| Feature              | Vid nedgradering                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recept 4+            | Kan visas och loggas från; kan inte redigeras eller dupliceras. Nya kan inte skapas förrän antalet < 3 (radering är användarens val).                                        |
| Sparade måltider 11+ | Samma princip: kan laddas till slot, inte redigeras; inga nya över kvot.                                                                                                     |
| Receptbilder         | Befintliga bilder visas kvar; nya kan inte laddas upp.                                                                                                                       |
| Historik > 30 dagar  | Döljs i UI (data kvar; kalibreringsmotorn läser ALLTID all data).                                                                                                            |
| Skapade listor 2+    | Användaren är kvar som medlem (medlemskap är alltid fritt); kan inte skapa nya listor förrän antal skapade-och-medlem < 1. Befintliga listor påverkas inte — flat ownership. |
| Kalibrering          | Nästa kalibrering tillåts när det gått ≥ 1 kvartal sedan senaste.                                                                                                            |
| TDEE-formel          | Om aktiv formel är premium behålls den beräknade TDEE:n; formeln kan inte köras om utan uppgradering.                                                                        |

## Preview mode

Beslut: premiumfunktioner visas **öppna med "Ingår i Premium"-badge** i preview.
Server-side kvoter gäller ändå (preview delar user_id) — men under soft launch är
enforcement av, och preview-användare efter hard launch får gate-modal via UI:t innan
de når servern.

## Teknisk arkitektur (Fas 1–2)

- `public.user_subscriptions` — en rad per användare, skrivs endast av service role/super admin-RPC (`admin_set_user_plan`). Ingen rad = plan följer enforcement-läget (`founder` vid off, `free` vid on).
- `public.app_config` — key/value; `premium_enforcement: off|on`.
- `public.get_user_plan(uuid)` — plan-upplösning (admin → founder → sub-rad → enforcement-läge).
- `public.get_plan_limits(text)` — jsonb-matris ovan; ENDA källan i DB.
- `public.get_my_entitlements()` — RPC för klienten: `{ plan, limits, enforcement }`.
- Kvot-triggers kastar `PREMIUM_LIMIT_REACHED:<nyckel>` (ERRCODE P0001) — klienten mappar prefixet till UpgradeModal.
- Klient: `src/lib/constants/entitlements.ts` (spegel av limits, för UI-räknare) + `useEntitlements()`-hook (React Query, mönster som `useIsAdmin`).

## Beslut som återstår (Fas 4–5)

- Pris (riktmärke 39–49 kr/mån, ~399 kr/år) och trial-längd (7–14 d, efter första loggveckan).
- Stripe: Checkout + Customer Portal + Stripe Tax; webhook-Edge Function skriver `user_subscriptions` (`source='stripe'`).
- GDPR: gratis dataexport via supportväg dokumenteras i villkoren (CSV i appen är premium-bekvämlighet).
- Kommunikation till soft launch-testare om founder-status.
