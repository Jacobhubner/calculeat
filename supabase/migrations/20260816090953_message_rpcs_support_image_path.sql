-- send_message/get_messages hanterar bildbilagor.
--
-- get_messages måste DROPas eftersom returtypen får en ny kolumn — Postgres
-- tillåter inte ändrad returtyp via CREATE OR REPLACE. DROP tar med sig
-- GRANTs, så de sätts om explicit nedan (samma fälla som supportbilagorna).

-- ── send_message ─────────────────────────────────────────────────────────
-- p_image_path har default så befintliga anrop utan bild fortsätter fungera.
CREATE OR REPLACE FUNCTION public.send_message(
  p_friendship_id uuid,
  p_content       text,
  p_image_path    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_trimmed text := trim(p_content);
  v_image   text := nullif(trim(coalesce(p_image_path, '')), '');
  v_msg_id  uuid;
BEGIN
  -- Tomt är bara tillåtet om det finns en bild.
  IF v_trimmed = '' AND v_image IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.id = p_friendship_id
      AND f.status = 'accepted'
      AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'friendship_not_found_or_not_accepted');
  END IF;

  -- Bilden måste ligga i avsändarens egen mapp. Utan den kontrollen kan en
  -- klient referera någon annans fil och därmed exponera den för mottagaren
  -- via storage-policyn.
  IF v_image IS NOT NULL AND split_part(v_image, '/', 1) <> auth.uid()::text THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_image_path');
  END IF;

  -- Avdölj konversationen för avsändaren om den var dold
  DELETE FROM public.hidden_conversations
  WHERE user_id = auth.uid()
    AND friendship_id = p_friendship_id;

  INSERT INTO public.messages(friendship_id, sender_id, content, image_path)
  VALUES (p_friendship_id, auth.uid(), v_trimmed, v_image)
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

-- ── get_messages ─────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_messages(uuid, integer, timestamptz);

CREATE FUNCTION public.get_messages(
  p_friendship_id uuid,
  p_limit         integer,
  p_before        timestamptz
)
RETURNS TABLE (
  id         uuid,
  sender_id  uuid,
  content    text,
  image_path text,
  created_at timestamptz,
  read_at    timestamptz,
  edited_at  timestamptz,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.sender_id,
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.content END AS content,
    -- Mjukraderat meddelande döljer bilden. Filen ligger kvar i storage,
    -- men utan referens i ett icke-raderat meddelande ger storage-policyn
    -- ingen åtkomst till mottagaren längre.
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.image_path END AS image_path,
    m.created_at,
    m.read_at,
    m.edited_at,
    m.deleted_at
  FROM public.messages m
  WHERE m.friendship_id = p_friendship_id
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = p_friendship_id
        AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
    )
    AND (p_before IS NULL OR m.created_at < p_before)
  ORDER BY m.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

-- DROP tog med sig grants — sätt om dem.
REVOKE ALL ON FUNCTION public.get_messages(uuid, integer, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.send_message(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text) TO authenticated;
