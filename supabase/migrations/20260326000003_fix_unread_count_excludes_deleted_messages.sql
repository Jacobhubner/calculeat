-- =========================================================
-- MIGRATION: Exkludera raderade meddelanden från oläst-räknaren
-- Date: 2026-03-26
-- Problem: get_unread_message_count och get_conversations räknade
--   raderade meddelanden (deleted_at IS NOT NULL) som olästa,
--   vilket gav felaktig notis-badge.
-- Fix: Lägg till AND deleted_at IS NULL i båda funktionerna.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages m
  JOIN public.friendships f ON f.id = m.friendship_id
  WHERE m.read_at IS NULL
    AND m.deleted_at IS NULL
    AND m.sender_id != auth.uid()
    AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE(
  friendship_id          uuid,
  friend_name            text,
  friend_username        text,
  friend_alias           text,
  last_message_content   text,
  last_message_at        timestamptz,
  last_message_sender_id uuid,
  unread_count           bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH my_friendships AS (
    SELECT
      f.id                AS friendship_id,
      f.addressee_id      AS friend_id,
      f.requester_alias   AS friend_alias
    FROM public.friendships f
    WHERE f.requester_id = auth.uid()
      AND f.status = 'accepted'
      AND NOT EXISTS (
        SELECT 1 FROM public.hidden_conversations hc
        WHERE hc.user_id = auth.uid()
          AND hc.friendship_id = f.id
      )

    UNION ALL

    SELECT
      f.id                AS friendship_id,
      f.requester_id      AS friend_id,
      f.addressee_alias   AS friend_alias
    FROM public.friendships f
    WHERE f.addressee_id = auth.uid()
      AND f.status = 'accepted'
      AND NOT EXISTS (
        SELECT 1 FROM public.hidden_conversations hc
        WHERE hc.user_id = auth.uid()
          AND hc.friendship_id = f.id
      )
  ),
  latest_messages AS (
    SELECT DISTINCT ON (m.friendship_id)
      m.friendship_id,
      CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.content END AS last_message_content,
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
      AND m.sender_id != auth.uid()
    GROUP BY m.friendship_id
  )
  SELECT
    mf.friendship_id,
    COALESCE(up.username, up.email) AS friend_name,
    up.username                     AS friend_username,
    mf.friend_alias,
    lm.last_message_content,
    lm.last_message_at,
    lm.last_message_sender_id,
    COALESCE(uc.unread_count, 0)    AS unread_count
  FROM my_friendships mf
  JOIN latest_messages lm USING (friendship_id)
  JOIN public.user_profiles up ON up.id = mf.friend_id
  LEFT JOIN unread_counts uc USING (friendship_id)
  ORDER BY lm.last_message_at DESC;
$$;
