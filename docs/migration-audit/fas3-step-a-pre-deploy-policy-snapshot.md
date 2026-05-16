# Fas 3 Steg A — Pre-deploy policy snapshot

Date: 2026-05-16
Purpose: Audit trail before RLS rewrite. Not a rollback document — see rollback SQL in migration spec.

## Scope

Tables audited: `user_meal_settings`, `calibration_history`, `weight_history`

---

## calibration_history

### SELECT — "Users can view own calibration history"

```
cmd: SELECT
permissive: PERMISSIVE
roles: {public}
qual: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = calibration_history.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)))))
with_check: null
```

### INSERT — "Users can insert own calibration history"

```
cmd: INSERT
permissive: PERMISSIVE
roles: {public}
qual: null
with_check: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = calibration_history.profile_id) AND (profiles.user_id = auth.uid()))))
NOTE: Missing (SELECT ...) wrapper on auth.uid() — fixed in Steg A migration.
```

### DELETE — "Users can delete own calibration history"

```
cmd: DELETE
permissive: PERMISSIVE
roles: {public}
qual: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = calibration_history.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)))))
with_check: null
```

---

## user_meal_settings

### SELECT — "Users can view own meal settings"

```
cmd: SELECT
permissive: PERMISSIVE
roles: {public}
qual: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_meal_settings.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)))))
with_check: null
```

### INSERT — "Users can insert own meal settings"

```
cmd: INSERT
permissive: PERMISSIVE
roles: {public}
qual: null
with_check: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_meal_settings.profile_id) AND (profiles.user_id = auth.uid()))))
NOTE: Missing (SELECT ...) wrapper on auth.uid() — fixed in Steg A migration.
```

### UPDATE — "Users can update own meal settings"

```
cmd: UPDATE
permissive: PERMISSIVE
roles: {public}
qual: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_meal_settings.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)))))
with_check: null
```

### DELETE — "Users can delete own meal settings"

```
cmd: DELETE
permissive: PERMISSIVE
roles: {public}
qual: (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = user_meal_settings.profile_id) AND (profiles.user_id = ( SELECT auth.uid() AS uid)))))
with_check: null
```

---

## weight_history

### ALL — "Users can manage own weight history"

```
cmd: ALL
permissive: PERMISSIVE
roles: {public}
qual: (user_id = ( SELECT auth.uid() AS uid))
with_check: (user_id = ( SELECT auth.uid() AS uid))
STATUS: Already clean — no profiles JOIN. Not modified in Steg A.
```
