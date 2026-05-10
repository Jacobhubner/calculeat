# CalculEat — Architecture & Data Model

## Nutrition Data Model

### Canonical storage

All nutrition is stored **per `default_amount`** (typically 100g or 100ml).

| Column                                                  | Stored as                                                                             | Owner          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------- |
| `calories`                                              | per `default_amount`                                                                  | client         |
| `fat_g`, `carb_g`, `protein_g`                          | per `default_amount`                                                                  | client         |
| `kcal_per_gram`                                         | derived: `calories / default_amount`                                                  | **DB trigger** |
| `kcal_per_unit`                                         | derived: `kcal_per_gram * grams_per_piece`                                            | **DB trigger** |
| `fat_per_unit`, `carb_per_unit`, `protein_per_unit`     | derived: `(nutrient / default_amount) * grams_per_piece`                              | **DB trigger** |
| `grams_per_piece`                                       | grams per serving/piece                                                               | client         |
| `weight_grams`                                          | gram-foods: always 100; ml-foods: gram-equivalent of reference_amount ml              | client         |
| extended nutrients (saturated_fat, sugars, salt, fiber) | per `reference_amount` in `food_nutrients` table — **never as columns on food_items** | client         |

### Invariants

1. `calories` is always per `default_amount`, not per gram and not per serving.
2. `kcal_per_gram = calories / default_amount` — set by trigger, except for portion-recipes (see below).
3. `kcal_per_unit = kcal_per_gram * grams_per_piece` — set by trigger, except for portion-recipes.
4. Extended nutrients live exclusively in `food_nutrients(food_item_id, nutrient_code, amount, reference_amount)`.
5. `weight_grams` has different semantics per food type:
   - Gram-foods: always normalized to 100
   - ML-foods: gram-equivalent of `reference_amount` ml (varies with density)
     Code that scales via `weight_grams` must account for this difference.

### Portion-recipe special casing (fragile contract)

Recipes saved as portions (`default_unit = 'portion'`) have `kcal_per_gram` and `kcal_per_unit` set **directly by the client** in `useRecipes.ts`. The DB trigger skips recalculation for `default_unit = 'portion'`.

**Why:** The trigger's general formula (`calories / default_amount`) doesn't apply — the recipe already has per-100g values in `calories` and a separate per-serving value in `kcal_per_unit`.

**Risk:** If `default_unit` is not set correctly, the trigger overwrites client-set values with wrong numbers. The client sets:

- `calories` = per-100g value (from `recipeCalculator.ts` → `per100g.calories`)
- `kcal_per_gram` = `per100g.calories / 100`
- `kcal_per_unit` = `perServing.calories` (direct from recipe calculator)
- `grams_per_piece` = `perServing.weight` (grams per serving)

See: `src/hooks/useRecipes.ts`, `src/lib/calculations/recipeCalculator.ts`

---

## Sharing Architecture

### Snapshot format (version 1)

When a food item or recipe is shared, `send_share_invitation` creates a JSON snapshot stored in `share_invitations.snapshot`. All new snapshots include `snapshot_version: 1`.

**food_item snapshot fields (version 1):**

```
snapshot_version, name, calories, fat_g, carb_g, protein_g,
reference_unit, reference_amount, default_amount, default_unit, food_type,
ml_per_gram, grams_per_piece, serving_unit, density_g_per_ml,
notes, brand, barcode, weight_grams, energy_density_color,
kcal_per_unit, fat_per_unit, carb_per_unit, protein_per_unit,
is_global, original_food_item_id,
nutrients: [{ nutrient_code, amount, unit, reference_amount, reference_unit }]
```

**recipe snapshot fields (version 1):**

```
snapshot_version, name, servings, total_weight_grams,
food_item_snapshot: { ...food_item snapshot fields },
ingredients: [{ amount, unit, weight_grams, ingredient_order, food_item_snapshot }]
```

### Snapshot versioning

- Version 0 (implicit, no field): nutrients may be missing or empty; kcal_per_unit/per_unit fields absent.
- Version 1: complete schema as above.

`accept_share_invitation` reads fields via `->>` which returns NULL for absent fields. All NULL cases have explicit fallbacks, so old snapshots continue to work.

**If breaking changes are needed:** increment `snapshot_version`, add version-check branches in `accept_share_invitation`.

### Sharing flow invariants

#### send_share_invitation

- Runs with `SECURITY DEFINER` + `SET row_security = off` — required to read `food_nutrients` for food_items owned by the sender regardless of RLS policies.
- Snapshots `kcal_per_unit`, `fat_per_unit`, `carb_per_unit`, `protein_per_unit` from DB — these are trigger-computed and always accurate at share time.
- For recipes: snapshots the linked `food_item_id`'s nutrients directly from `food_nutrients`.

#### accept_share_invitation (recipe branch)

- Reads `calories/fat_g/carb_g/protein_g` from `food_item_snapshot` directly as per-100g — **no recalculation**.
- Reads `kcal_per_unit` directly from snapshot; falls back to computing from `grams_per_piece` if absent (handles version-0 snapshots).
- Copies `food_nutrients` rows from `food_item_snapshot.nutrients` into `food_nutrients` for the new food_item.
- Sets `kcal_per_gram = calories / 100` (not via trigger — the INSERT bypasses it in this context).

#### \_upsert_shared_food_item (deduplication)

- Deduplicates via `data_hash` computed from macros + physical properties (brand, barcode, density, grams_per_piece, ml_per_gram).
- **data_hash does NOT include extended nutrients** — by design. Items with identical macros are considered the same food.
- **On hash-match:** upserts nutrients from snapshot onto the existing item with `ON CONFLICT DO NOTHING`. This ensures nutrients are filled in even if the existing item predates extended-nutrient support.
- Global foods (`is_global=true`) are linked by ID, never copied.

### data_hash

Computed by DB trigger on INSERT/UPDATE of `food_items`. Formula:

```
sha256(calories|fat_g|carb_g|protein_g|ref_unit|ref_amount|brand|barcode|density|grams_piece|ml_per_gram)
```

Extended nutrients intentionally excluded — see deduplication section above.

---

## Recipe Nutrition Calculation

Handled by `src/lib/calculations/recipeCalculator.ts`.

### Base macros

Each ingredient scaled by `weightGrams / food.weight_grams` (where `weight_grams` is the food's reference weight, typically 100g).

### Extended nutrients (saturated_fat, sugars, salt, fiber)

Fetched from `food_nutrients` via `useFoodNutrientsBatch`. Scaled as:

```
(amount / reference_amount) * baseWeight * (ingredient_weight / baseWeight)
= amount * (ingredient_weight / reference_amount)
```

Aggregated as `null` until first non-null ingredient, then summed. A value of `null` means "no data", not zero.

---

## Health check query

Run periodically to detect recipe food_items created without nutrients (may indicate a missed copy):

```sql
SELECT fi.id, fi.name, fi.created_at, fi.shared_by
FROM food_items fi
WHERE fi.is_recipe = true
  AND fi.user_id IS NOT NULL
  AND fi.source IN ('user', 'shared')
  AND NOT EXISTS (SELECT 1 FROM food_nutrients fn WHERE fn.food_item_id = fi.id)
  AND fi.created_at > now() - interval '30 days';
```
