-- Lägg till nya kolumner för receptdetaljer
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS instructions   text,
  ADD COLUMN IF NOT EXISTS equipment      text[],
  ADD COLUMN IF NOT EXISTS prep_time_min  integer,
  ADD COLUMN IF NOT EXISTS cook_time_min  integer;

-- Skapa Supabase Storage bucket för receptbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: autentiserade användare kan ladda upp bilder
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recipe-images');

-- RLS: ägare kan ta bort sin bild
CREATE POLICY "Owner can delete recipe image"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'recipe-images' AND owner = auth.uid());
