-- Följdändringar av bildbilagor i vänmeddelanden.

-- ── edit_message ─────────────────────────────────────────────────────────
-- Ett bildmeddelande utan text gick inte att redigera alls: v_trimmed = ''
-- gav 'empty_content'. Tom text är i sin ordning så länge bilden finns kvar.
-- Redigering rör aldrig image_path — bilden byts inte via edit.
CREATE OR REPLACE FUNCTION public.edit_message(
  p_message_id   uuid,
  p_new_content  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg  record;
  v_trimmed text := trim(p_new_content);
BEGIN
  SELECT id, sender_id, read_at, deleted_at, image_path
  INTO v_msg
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'message_not_found');
  END IF;

  IF v_msg.sender_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_sender');
  END IF;

  IF v_msg.read_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_read');
  END IF;

  IF v_msg.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_deleted');
  END IF;

  -- Tom text tillåts bara när meddelandet har en bild att stå för sig själv.
  IF v_trimmed = '' AND v_msg.image_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  UPDATE public.messages
  SET content   = v_trimmed,
      edited_at = now()
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.edit_message(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO authenticated;

-- ── get_conversations ────────────────────────────────────────────────────
-- Ett bildmeddelande utan text gav en tom rad i konversationslistan.
-- has_image låter klienten visa "Bild" i stället — själva pathen skickas
-- inte med, listan behöver ingen förhandsvisning av bilden.
DROP FUNCTION IF EXISTS public.get_conversations();

CREATE FUNCTION public.get_conversations()
RETURNS TABLE (
  friendship_id           uuid,
  friend_name             text,
  friend_username         text,
  friend_alias            text,
  last_message_content    text,
  last_message_has_image  boolean,
  last_message_at         timestamptz,
  last_message_sender_id  uuid,
  unread_count            bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_friendships AS (
    SELECT
      f.id                AS friendship_id,
      f.addressee_id      AS friend_id,
      f.requester_alias   AS friend_alias
    FROM public.friendships f
    WHERE f.requester_id = (SELECT auth.uid())
      AND f.status = 'accepted'

    UNION ALL

    SELECT
      f.id                AS friendship_id,
      f.requester_id      AS friend_id,
      f.addressee_alias   AS friend_alias
    FROM public.friendships f
    WHERE f.addressee_id = (SELECT auth.uid())
      AND f.status = 'accepted'
  ),
  latest_messages AS (
    SELECT DISTINCT ON (m.friendship_id)
      m.friendship_id,
      CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.content END AS last_message_content,
      CASE WHEN m.deleted_at IS NOT NULL THEN false
           ELSE m.image_path IS NOT NULL END AS last_message_has_image,
      m.created_at AS last_message_at,
      m.sender_id  AS last_message_sender_id
    FROM public.messages m
    WHERE m.friendship_id IN (SELECT friendship_id FROM my_friendships)
    ORDER BY m.friendship_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.friendship_id,
      COUNT(*) AS unread_count
    FROM public.messages m
    WHERE m.friendship_id IN (SELECT friendship_id FROM my_friendships)
      AND m.read_at IS NULL
      AND m.deleted_at IS NULL
      AND m.sender_id != (SELECT auth.uid())
    GROUP BY m.friendship_id
  )
  SELECT
    mf.friendship_id,
    COALESCE(up.username, up.email) AS friend_name,
    up.username                     AS friend_username,
    mf.friend_alias,
    lm.last_message_content,
    lm.last_message_has_image,
    lm.last_message_at,
    lm.last_message_sender_id,
    COALESCE(uc.unread_count, 0)    AS unread_count
  FROM my_friendships mf
  JOIN latest_messages lm USING (friendship_id)
  JOIN public.user_profiles up ON up.id = mf.friend_id
  LEFT JOIN unread_counts uc USING (friendship_id)
  ORDER BY lm.last_message_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_conversations() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
