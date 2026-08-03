# Premium-spec — Calculeat

Beslutad 2026-07-12. Detta dokument är facit för all premium-gating: exakta gränser,
nedgraderingsregler och lanseringsläge. Ändringar i gränser görs HÄR först, sedan i
`get_plan_limits()` (SQL) och `src/lib/constants/entitlements.ts` — alla tre ska alltid
vara i synk.

## Planer

| Plan      | Beskrivning                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `free`    | Gratisnivån efter hard launch                                                                                                                                                                                                               |
| `premium` | Betald nivå (Stripe, Fas 4)                                                                                                                                                                                                                 |
| `founder` | Gratis premium — manuellt tilldelad via admin_set_user_plan (admins är alltid founder). BESLUT 2026-07-14: ingen automatisk founder till soft launch-testare — alla icke-admin-konton blir free vid hard launch och betalar som alla andra. |

**Regler:**

- Admins och super admins (rad i `public.admins`) behandlas ALLTID som `founder`, oavsett prenumerationsrad.
- **Soft launch-läge:** så länge `app_config.premium_enforcement = 'off'` behandlas ALLA användare som `founder`. Flippas till `'on'` vid hard launch — det är hela lanseringsknappen.
- Data raderas ALDRIG p.g.a. plan. Historik sparas alltid; endast synligheten begränsas. Retroaktiv upplåsning vid uppgradering.

## Feature-matris (beslutad: "justerad matris")

| Nyckel (limits-JSON)       | Gratis                                          | Premium/Founder                                          | Enforcement                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `saved_meals`              | 3                                               | obegränsat (-1)                                          | DB-trigger på `saved_meals` INSERT                                                                                                                                                                                                                                                                                                                                 |
| `recipes`                  | 3 (personliga)                                  | obegränsat (-1)                                          | DB-trigger på `recipes` INSERT (endast `shared_list_id IS NULL`)                                                                                                                                                                                                                                                                                                   |
| `recipe_images`            | nej                                             | ja                                                       | UI + storage-policy (Fas 2+)                                                                                                                                                                                                                                                                                                                                       |
| `history_days`             | 30                                              | obegränsat (-1)                                          | Endast UI (egen data, inget att skydda)                                                                                                                                                                                                                                                                                                                            |
| `csv_export`               | nej                                             | ja                                                       | UI (funktionen byggs direkt bakom gate)                                                                                                                                                                                                                                                                                                                            |
| `advanced_trends`          | delvis (vikt- + BF-graf, 30 d + 3-punktsgolv)   | ja (vikt + BF + fettmassa + mager massa, alla intervall) | UI (WeightTracker: vikt- och BF-graferna renderas för alla men serien beskärs via `gateSeries`/`applyFreeWindow` — 30 d, golv 3 punkter, tak 180 d; låslänk → UpgradeModal när äldre data finns. `90d`/`Allt` är låsta knappar. Brush-reglaget kan inte scrubbas förbi gränsen eftersom punkterna inte finns i serien. Fettmassa/mager massa förblir helt premium) |
| `period_stats`             | nej (30-d snitt gratis)                         | ja (90-d jämförelser)                                    | UI                                                                                                                                                                                                                                                                                                                                                                 |
| `all_tdee_formulas`        | nej (Mifflin + Basic internet-PAL + Custom PAL) | ja (alla 10 formler, alla PAL-system + aktivitetswizard) | UI; jämförelsefliken suddad/låst; låsta select-alternativ märks "— Premium" + intercept (FREE_BMR_FORMULAS/FREE_PAL_SYSTEMS i entitlements.ts)                                                                                                                                                                                                                     |
| `calibrations_per_quarter` | 1                                               | obegränsat (-1)                                          | UI + kontroll i `useCalibrationAvailability`                                                                                                                                                                                                                                                                                                                       |
| `advanced_body_comp`       | nej (2 basmetoder: U.S. Navy + Heritage BMI)    | ja (alla 12 + mäthistorik)                               | UI                                                                                                                                                                                                                                                                                                                                                                 |
| `genetic_potential`        | nej                                             | ja                                                       | UI                                                                                                                                                                                                                                                                                                                                                                 |
| `owned_shared_lists`       | 1 (skapade & fortfarande medlem)                | obegränsat (-1)                                          | DB-trigger på `shared_lists` INSERT                                                                                                                                                                                                                                                                                                                                |
| `label_scans_per_month`    | 5                                               | obegränsat (-1)                                          | Räknas ur `scan_usage` (`scan_type='nutrition_label'`, kalendermånad)                                                                                                                                                                                                                                                                                              |
| `food_suggestions`         | nej                                             | ja                                                       | UI (PremiumGate i TodayPage-sidopanelen; ren klientberäkning). Portionsberäknaren är ALLTID gratis (kärnloop, beslut 2026-07-18)                                                                                                                                                                                                                                   |
| `all_diet_modes`           | nej (NNR + Weight Loss Mode)                    | ja (alla 5: + Active, Off-/On-Season)                    | UI (MacroModesCard i profilen: Använd-knapp + källreferens-modal intercept → UpgradeModal för låsta lägen). BESLUT 2026-07-19: Weight Loss fri — viktminskning är kärnloopens vanligaste mål och samma inställningar nås manuellt via målkalkylatorn (alltid gratis); atletlägena är premium                                                                       |
| `recipe_bank_full`         | nej (gratisrecepten i banken)                   | ja (hela receptbanken)                                   | UI (blur-mönstret från kostlägena på `premium_only`-recept i Upptäck-fliken) + server-side gate i `copy_official_recipe_to_personal`-RPC:n (kastar `PREMIUM_LIMIT_REACHED:recipe_bank_full`). Att spara ETT recept (även gratis) räknas dessutom mot `recipes`-kvoten. BESLUT 2026-07-21: bläddring gratis för alla, delar av banken premium-låst                  |

**Alltid gratis (aldrig gate:at):** daglig loggning, streckkodsskanning, makros,
Livsmedelsverket + manuella livsmedel, vänner, chatt, delning (share_invitations),
medlemskap i obegränsat antal listor, goal-kalkylator, BMI/BMR/MET,
kvartalskalibrering.

**Vikttrend** var tidigare listad som alltid gratis. BESLUT 2026-08-03: grafen är
fortfarande gratis i sin helhet, men gratisnivåns synliga fönster är 30 dagar.
Samma fönster som BF-grafen, så att alla trendgrafer beter sig lika.

Beskärningen sker vid DATAKÄLLAN (`gateSeries`/`applyFreeWindow` i
WeightTracker), inte i XAxis-domänen: punkter före fönstret filtreras bort ur
serien. Skuggning av äldre punkter provades och förkastades — en skuggad punkt
ligger kvar i domänen och går att läsa av ändå, och brushens `onChange` sätter
dessutom ett eget fönster som kringgår domänklampningen. Data raderas givetvis
aldrig i DB.

**Punktgolv (BESLUT 2026-08-03).** Den som loggar sällan har ofta 0–1 punkt
inom 30 dagar, och en ensam punkt kan inte bilda en linje — hela grafen försvann
alltså för den gruppen. Regeln är därför:

1. 30 dagar är huvudfallet (`FREE_WINDOW_DAYS`).
2. Ger det färre än 3 punkter (`FREE_MIN_POINTS`) visas de 3 senaste i stället.
3. Golvet kapas vid 180 dagar (`FREE_FLOOR_CAP_DAYS`) — utan tak skulle tre
   mätningar utspridda över flera år ge mer historik ju sämre man loggar.
4. Golvet får aldrig ge FÄRRE punkter än tidsfönstret redan gav.

Golvet räknas mot hela serien, före intervallfiltrering, annars äter ett smalt
valt intervall (14d) upp punkterna innan golvet hinner rädda dem. Konsekvens:
en månadsvägare ser ~62 dagar där en daglig loggare ser 30. Det är avsiktligt —
uppmjukningen aktiveras bara för den som annars inte fått någon graf alls.

**Synlighetsprincip (BESLUT 2026-08-03).** En gratisanvändare ska veta vad
premium ger — den som inte vet att en funktion finns kan inte sakna den. Därför
döljs låsta trendgrafer aldrig helt: fettmassa och mager massa visas som
`LockedChartTeaser` med titel, nyttobeskrivning och en DEKORATIV kurva (aldrig
användarens riktiga mätdata — det är just det man betalar för). Låstexter är
formulerade som vinst ("se hela din resa"), inte som förlust ("du saknar").

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
