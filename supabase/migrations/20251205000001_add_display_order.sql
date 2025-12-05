-- Lägg till display_order för sortering av profilkort och måttkort
-- Användare kan ändra ordning med upp/ned-knappar

-- Lägg till för profiles
ALTER TABLE public.profiles
  ADD COLUMN display_order INTEGER;

-- Sätt initial ordning baserat på created_at (äldst först = lägst display_order)
UPDATE public.profiles
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as row_num
  FROM public.profiles
) AS subquery
WHERE profiles.id = subquery.id;

COMMENT ON COLUMN public.profiles.display_order IS
  'Användarkontrollerad sorteringsordning. Lägre värde = högre upp i listan.';

-- Lägg till för measurement_sets
ALTER TABLE public.measurement_sets
  ADD COLUMN display_order INTEGER;

-- Sätt initial ordning baserat på created_at (äldst först = lägst display_order)
UPDATE public.measurement_sets
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as row_num
  FROM public.measurement_sets
) AS subquery
WHERE measurement_sets.id = subquery.id;

COMMENT ON COLUMN public.measurement_sets.display_order IS
  'Användarkontrollerad sorteringsordning. Lägre värde = högre upp i listan.';
