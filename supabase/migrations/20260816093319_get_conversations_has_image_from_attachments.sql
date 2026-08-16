-- last_message_has_image läste bara messages.image_path. Den sätts visserligen
-- till första bilden, men gör uppslaget mot attachments-tabellen också så
-- listan förblir korrekt om image_path-kolumnen fasas ut senare.
CREATE OR REPLACE FUNCTION public.get_conversations()
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
    SELECT f.id AS friendship_id, f.addressee_id AS friend_id, f.requester_alias AS friend_alias
    FROM public.friendships f
    WHERE f.requester_id = (SELECT auth.uid()) AND f.status = 'accepted'
    UNION ALL
    SELECT f.id, f.requester_id, f.addressee_alias
    FROM public.friendships f
    WHERE f.addressee_id = (SELECT auth.uid()) AND f.status = 'accepted'
  ),
  latest_messages AS (
    SELECT DISTINCT ON (m.friendship_id)
      m.friendship_id,
      CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.content END AS last_message_content,
      CASE WHEN m.deleted_at IS NOT NULL THEN false
           ELSE (m.image_path IS NOT NULL
                 OR EXISTS (SELECT 1 FROM public.message_attachments a
                            WHERE a.message_id = m.id))
      END AS last_message_has_image,
      m.created_at AS last_message_at,
      m.sender_id  AS last_message_sender_id
    FROM public.messages m
    WHERE m.friendship_id IN (SELECT friendship_id FROM my_friendships)
    ORDER BY m.friendship_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT m.friendship_id, COUNT(*) AS unread_count
    FROM public.messages m
    WHERE m.friendship_id IN (SELECT friendship_id FROM my_friendships)
      AND m.read_at IS NULL AND m.deleted_at IS NULL
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

REVOKE ALL ON FUNCTION public.get_conversations() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO public;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
