-- SÄKERHETSFIX: message_attachments läckte till alla inloggade användare.
--
-- Felet: block_anonymous_users skapades som `FOR ALL ... USING (is_anonymous
-- IS NOT TRUE)`. Postgres ORar ihop permissiva policyer, så den policyn
-- SLÄPPTE IGENOM varje inloggad användare — den begränsade ingenting utan
-- upphävde i praktiken message_attachments_select. Dessutom gav dess
-- WITH CHECK vem som helst rätt att INSERTa rader direkt.
--
-- Verifierat över HTTP före fixen: utomstående kunde läsa bilagerader,
-- vem som helst kunde skriva, och mjukraderade meddelanden dolde inget.
--
-- Rätt konstruktion: EN restriktiv policy för anonym-spärren (AND, inte OR)
-- plus en enda permissiv SELECT-policy. Skrivning sker bara via
-- send_message (SECURITY DEFINER) — ingen INSERT/UPDATE/DELETE-policy alls.
--
-- LÄRDOM: `block_anonymous_users` MÅSTE vara AS RESTRICTIVE. En permissiv
-- FOR ALL-policy med bara ett is_anonymous-villkor öppnar hela tabellen.

DROP POLICY IF EXISTS "block_anonymous_users" ON public.message_attachments;
DROP POLICY IF EXISTS "message_attachments_select" ON public.message_attachments;

-- Restriktiv: ANDas med övriga policyer i stället för att ORas.
CREATE POLICY "block_anonymous_users"
  ON public.message_attachments
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- Enda vägen till läsning: part i vänskapen och meddelandet ej raderat.
CREATE POLICY "message_attachments_select"
  ON public.message_attachments
  FOR SELECT TO authenticated
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

-- Städa bort raden som testet lyckades skriva in
DELETE FROM public.message_attachments WHERE image_path = 'hack/x.webp';
