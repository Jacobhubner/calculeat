# Recipe Nutrition Model — Canonical Reference

## The invariant

Every recipe has a linked `food_items` row (`is_recipe = true`). That row stores nutrition in two formats depending on `default_unit`:

### `default_unit = 'portion'`

| Column             | Meaning                                                          | Canonical / Cached |
| ------------------ | ---------------------------------------------------------------- | ------------------ |
| `calories`         | kcal **per 100 g**                                               | **Canonical**      |
| `fat_g`            | fat g **per 100 g**                                              | **Canonical**      |
| `carb_g`           | carbohydrate g **per 100 g**                                     | **Canonical**      |
| `protein_g`        | protein g **per 100 g**                                          | **Canonical**      |
| `kcal_per_gram`    | `calories / 100`                                                 | Cached             |
| `grams_per_piece`  | weight of one portion in grams = `total_weight_grams / servings` | **Canonical**      |
| `kcal_per_unit`    | `calories / 100 × grams_per_piece` = kcal per portion            | Cached             |
| `fat_per_unit`     | fat per portion                                                  | Cached             |
| `carb_per_unit`    | carbs per portion                                                | Cached             |
| `protein_per_unit` | protein per portion                                              | Cached             |
| `weight_grams`     | same as `grams_per_piece`                                        | Cached             |
| `serving_unit`     | always `'portion'`                                               | Canonical          |

Enforced by DB CHECK constraints:

- `chk_recipe_kcal_per_gram_consistent` — `ABS(kcal_per_gram − calories/100) ≤ 0.05`
- `chk_recipe_kcal_per_unit_consistent` — `ABS(kcal_per_unit − calories/100 × grams_per_piece) ≤ 2.0`

### `default_unit = 'g'`

| Column                       | Meaning          |
| ---------------------------- | ---------------- |
| `calories`                   | kcal per 100 g   |
| `fat_g / carb_g / protein_g` | macros per 100 g |
| `kcal_per_gram`              | `calories / 100` |
| `kcal_per_unit`              | `NULL`           |
| `grams_per_piece`            | `NULL`           |

---

## Historical bug (fixed 2026-05-13)

All write-paths before this date wrote `perServing.calories` into `calories`, violating the per-100g invariant. The field appeared correct in the UI because `RecipeCard` reads `kcal_per_unit ?? calories` — but the sharing snapshot read `fi.calories` directly, propagating the wrong value to recipients.

**Root cause:** `useCreateRecipe`, `useUpdateRecipe`, `create_shared_list_recipe`, `update_shared_list_recipe` all used `perServing` instead of `per100g` for the base macro columns.

**Fix:** All four write-paths now write `per100g` to the base columns. DB constraints prevent regression.

**Data repair:** 9 recipes across 3 accounts were normalised via direct SQL on 2026-05-13.

---

## Write-paths — every place that writes recipe food_item nutrition

| Write-path                | File / Migration                                                                          | Notes                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Create personal recipe    | `src/hooks/useRecipes.ts` → `useCreateRecipe`                                             | Writes `per100g` to `calories` etc.                                 |
| Update personal recipe    | `src/hooks/useRecipes.ts` → `useUpdateRecipe`                                             | Same                                                                |
| Create shared-list recipe | `20260513000000_fix_recipe_food_item_calories_per_100g.sql` → `create_shared_list_recipe` | Same                                                                |
| Update shared-list recipe | same migration → `update_shared_list_recipe`                                              | Same                                                                |
| Accept shared recipe      | `20260511000000` → `accept_share_invitation`                                              | Reads canonical snapshot fields directly                            |
| DB trigger                | `calculate_food_item_nutrition`                                                           | Skips `default_unit = 'portion'` entirely — client is authoritative |

No other write-paths touch recipe food_item nutrition.

---

## Sharing snapshot contract

`send_share_invitation` serialises the recipe's `food_item` into a JSONB snapshot. The snapshot carries both the per-100g base fields (`calories`, `fat_g`, …) and the per-unit cached fields (`kcal_per_unit`, …). The accept function reads from the snapshot — so the snapshot is only as correct as the source DB row. The DB constraints guarantee the source is always consistent before a snapshot is created.

---

## Integrity monitoring

Run at any time:

```bash
npm run healthcheck:recipes
```

or directly:

```bash
npx supabase db execute --file scripts/recipe_nutrition_healthcheck.sql
```

The script checks:

1. `gram_drift` — `kcal_per_gram ≠ calories/100`
2. `unit_drift` — `kcal_per_unit ≠ calories/100 × grams_per_piece`
3. `calories_too_high_for_100g` — `calories > 900` (classic per-portion-in-wrong-column bug)
4. `missing_portion_fields` — portion recipe missing `kcal_per_unit` / `grams_per_piece`
5. `recipe_missing_food_item` — recipe with no linked food_item
6. `ingredient_missing_snapshot` — ingredient without `snapshot_calories`
7. `stale_shared_recipe` — recipient nutrition drifted >5 % from sender's current values
8. Summary counts

Zero rows in checks 1–7 = system is healthy.

---

## Rules for future development

1. **Always write `per100g` to `calories / fat_g / carb_g / protein_g`** — for both personal and shared-list recipes, in both TypeScript hooks and SQL RPCs.
2. **Always write `perServing` to `kcal_per_unit / fat_per_unit / carb_per_unit / protein_per_unit`.**
3. **Never remove the DB constraints** — they are the last line of defence against silent data corruption.
4. **Run the health-check after any migration** that touches `food_items` or recipe nutrition.
5. **The DB trigger skips portion recipes** (`IF NEW.default_unit = 'portion' THEN RETURN NEW`) — this is intentional. Do not remove that guard.
