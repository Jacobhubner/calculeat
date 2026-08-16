-- Flera bilder per meddelande (max 5), visade som ett rutnät i EN bubbla.
--
-- messages.image_path rymde bara en bild. Kolumnen behålls tills vidare
-- (befintliga rader migreras in nedan) men skrivs inte längre av
-- send_message — message_attachments är källan från och med nu.

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  image_path  text NOT NULL,
  -- Bevarar ordningen användaren valde bilderna i
  position    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, position)
);

COMMENT ON TABLE public.message_attachments IS
  'Bildbilagor i vänmeddelanden, max 5 per meddelande (se enforce_message_attachment_limit). '
  'image_path pekar i privata bucketen message-attachments; visas via signerad URL.';

CREATE INDEX IF NOT EXISTS message_attachments_message_id_idx
  ON public.message_attachments(message_id);

-- Storage-policyn slår upp path -> meddelande vid varje signering
CREATE INDEX IF NOT EXISTS message_attachments_image_path_idx
  ON public.message_attachments(image_path);

-- ── Taket på 5 ───────────────────────────────────────────────────────────
-- En trigger, inte ett CHECK: villkoret spänner över flera rader.
CREATE OR REPLACE FUNCTION public.enforce_message_attachment_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.message_attachments
      WHERE message_id = NEW.message_id) > 5 THEN
    RAISE EXCEPTION 'Ett meddelande kan ha högst 5 bilagor'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_attachment_limit ON public.message_attachments;
CREATE CONSTRAINT TRIGGER trg_message_attachment_limit
  AFTER INSERT ON public.message_attachments
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_attachment_limit();

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Anonyma sessioner ska aldrig nå tabellen (projektregel för nya tabeller)
DROP POLICY IF EXISTS "block_anonymous_users" ON public.message_attachments;
CREATE POLICY "block_anonymous_users"
  ON public.message_attachments FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK ((SELECT auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- Läsning: parterna i vänskapen, och bara för icke-raderade meddelanden
DROP POLICY IF EXISTS "message_attachments_select" ON public.message_attachments;
CREATE POLICY "message_attachments_select"
  ON public.message_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.friendships f ON f.id = m.friendship_id
      WHERE m.id = message_attachments.message_id
        AND m.deleted_at IS NULL
        AND (SELECT auth.uid()) IN (f.requester_id, f.addressee_id)
    )
  );

-- Skrivning sker uteslutande via send_message (SECURITY DEFINER).
-- Ingen INSERT/UPDATE/DELETE-policy => klienten kan inte skriva direkt.

-- ── Migrera befintliga bilder ────────────────────────────────────────────
INSERT INTO public.message_attachments (message_id, image_path, position, created_at)
SELECT m.id, m.image_path, 0, m.created_at
FROM public.messages m
WHERE m.image_path IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.message_attachments a WHERE a.message_id = m.id
  );
