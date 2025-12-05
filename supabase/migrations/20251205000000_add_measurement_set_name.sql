-- Lägg till valfritt name-fält för egna namn på mätset
ALTER TABLE public.measurement_sets
  ADD COLUMN name TEXT;

COMMENT ON COLUMN public.measurement_sets.name IS
  'Valfritt eget namn för mätset. Om NULL visas "datum - tid" som standardnamn.';
