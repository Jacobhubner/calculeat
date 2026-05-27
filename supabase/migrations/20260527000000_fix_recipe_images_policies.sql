-- Fix recipe-images Storage RLS policies
--
-- Issues in 20260308000000_add_recipe_details.sql:
--   1. No SELECT policy — even though bucket is public: true, that only controls the CDN
--      endpoint (/object/public/…); RLS on storage.objects still blocks SDK reads.
--   2. INSERT policy had no owner-folder check — any authenticated user could write to
--      any path (e.g., {other_user_id}/file.webp).
--   3. No UPDATE policy — needed if upsert uploads are ever used.

-- ─── 1. Public SELECT ────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public can view recipe images'
  ) THEN
    CREATE POLICY "Public can view recipe images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'recipe-images');
  END IF;
END $$;

-- ─── 2. Tighten INSERT — restrict to uploader's own folder ───────────────────
DROP POLICY IF EXISTS "Authenticated users can upload recipe images" ON storage.objects;

CREATE POLICY "Authenticated users can upload to own recipe folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 3. UPDATE — owner check via folder path (safer than owner column which  ─
--        may not be populated in all Supabase Storage versions)               ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Owner can update own recipe image'
  ) THEN
    CREATE POLICY "Owner can update own recipe image"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'recipe-images'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'recipe-images'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;
