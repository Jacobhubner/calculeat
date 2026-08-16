-- send_message/get_messages hanterar flera bilder.
--
-- send_message byter p_image_path (text) mot p_image_paths (text[]). Den
-- gamla enkelbilds-parametern tas bort helt — appen är enda klienten och
-- uppdateras i samma commit. Två överlagringar skulle dessutom göra anropet
-- tvetydigt (samma fälla som tidigare i den här funktionen).

DROP FUNCTION IF EXISTS public.send_message(uuid, text, text);

CREATE FUNCTION public.send_message(
  p_friendship_id uuid,
  p_content       text,
  p_image_paths   text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_trimmed text := trim(p_content);
  v_paths   text[];
  v_path    text;
  v_msg_id  uuid;
  v_i       int := 0;
BEGIN
  -- Rensa NULL/tomma poster
  SELECT coalesce(array_agg(p), '{}')
  INTO v_paths
  FROM unnest(coalesce(p_image_paths, '{}')) AS p
  WHERE nullif(trim(p), '') IS NOT NULL;

  IF v_trimmed = '' AND cardinality(v_paths) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  IF cardinality(v_paths) > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.id = p_friendship_id
      AND f.status = 'accepted'
      AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'friendship_not_found_or_not_accepted');
  END IF;

  -- Varje bild måste ligga i avsändarens egen mapp. Utan kontrollen kan en
  -- klient referera någon annans fil och exponera den för mottagaren.
  FOREACH v_path IN ARRAY v_paths LOOP
    IF split_part(v_path, '/', 1) <> auth.uid()::text THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_image_path');
    END IF;
  END LOOP;

  DELETE FROM public.hidden_conversations
  WHERE user_id = auth.uid()
    AND friendship_id = p_friendship_id;

  -- image_path sätts fortfarande till första bilden så äldre läsvägar och
  -- notistriggern fortsätter fungera under övergången.
  INSERT INTO public.messages(friendship_id, sender_id, content, image_path)
  VALUES (p_friendship_id, auth.uid(), v_trimmed,
          CASE WHEN cardinality(v_paths) > 0 THEN v_paths[1] END)
  RETURNING id INTO v_msg_id;

  FOREACH v_path IN ARRAY v_paths LOOP
    INSERT INTO public.message_attachments(message_id, image_path, position)
    VALUES (v_msg_id, v_path, v_i);
    v_i := v_i + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

REVOKE ALL ON FUNCTION public.send_message(uuid, text, text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text[]) TO public;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text[]) TO authenticated;

-- ── get_messages ─────────────────────────────────────────────────────────
-- Returtypen får en ny kolumn => DROP + CREATE. Defaults BEHÅLLS (klienten
-- utelämnar p_before), och grants sätts om eftersom DROP tar dem med sig.
DROP FUNCTION IF EXISTS public.get_messages(uuid, integer, timestamptz);

CREATE FUNCTION public.get_messages(
  p_friendship_id uuid,
  p_limit         integer     DEFAULT 50,
  p_before        timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  sender_id   uuid,
  content     text,
  image_path  text,
  image_paths jsonb,
  created_at  timestamptz,
  read_at     timestamptz,
  edited_at   timestamptz,
  deleted_at  timestamptz
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
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.image_path END AS image_path,
    -- Raderat meddelande döljer bilderna. Filerna ligger kvar i storage men
    -- storage-policyn kräver ett icke-raderat meddelande för att signera.
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE (
      SELECT jsonb_agg(a.image_path ORDER BY a.position)
      FROM public.message_attachments a
      WHERE a.message_id = m.id
    ) END AS image_paths,
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
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
$$;

REVOKE ALL ON FUNCTION public.get_messages(uuid, integer, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO authenticated;
