ALTER TABLE meal_entries
  ADD COLUMN IF NOT EXISTS is_ad_hoc boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN meal_entries.is_ad_hoc IS
  'True för måltider som skapats ad hoc direkt i dagens logg, utan koppling till user_meal_settings.';
