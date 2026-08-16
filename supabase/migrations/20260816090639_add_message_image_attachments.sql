-- Bildbilagor i vänmeddelanden.
--
-- Följer samma mönster som supportbilagorna (20260716120000): privat bucket,
-- signerade URL:er vid visning, RLS via image_path-referens i ett
-- icke-raderat meddelande. Ingen ny arkitektur — mönstret är etablerat.
--
-- BESLUT 2026-08-16:
--  * Radering: mjukradering döljer bilden men filen ligger kvar. Mottagarens
--    kopia försvinner inte för att avsändaren raderar sitt meddelande.
--  * Bild utan text tillåts — content är NOT NULL, så villkoret flyttas till
--    ett CHECK: antingen text ELLER bild måste finnas.

-- ── 1. Kolumn ────────────────────────────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_path text;

COMMENT ON COLUMN public.messages.image_path IS
  'Storage-path i message-attachments (privat bucket). Visas via signerad '
  'URL. NULL = meddelande utan bild.';

-- Tomt meddelande utan bild är meningslöst; med bild är tom text i sin
-- ordning. content behålls NOT NULL för bakåtkompatibilitet.
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_or_image;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_or_image
  CHECK (length(trim(content)) > 0 OR image_path IS NOT NULL);

-- ── 2. Privat bucket ─────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage-RLS ───────────────────────────────────────────────────────
-- Uppladdning: bara till sin egen mapp (<uid>/...).
DROP POLICY IF EXISTS "message_attachments_insert" ON storage.objects;
CREATE POLICY "message_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Läsning: egna filer, ELLER filer som refereras av ett icke-raderat
-- meddelande i en vänskap man själv ingår i. Referensen är nyckeln —
-- utan den skulle en gissad path räcka.
DROP POLICY IF EXISTS "message_attachments_select" ON storage.objects;
CREATE POLICY "message_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.friendships f ON f.id = m.friendship_id
        WHERE m.image_path = storage.objects.name
          AND m.deleted_at IS NULL
          AND (SELECT auth.uid()) IN (f.requester_id, f.addressee_id)
      )
    )
  );

-- Radering: bara egna filer (t.ex. städning av en avbruten uppladdning).
DROP POLICY IF EXISTS "message_attachments_delete" ON storage.objects;
CREATE POLICY "message_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
