-- =========================================================
-- MIGRATION: Förenkla delete_conversation — radera för båda, inga hidden_conversations
-- Date: 2026-04-10
-- Förändring: Papperskorgen ska radera alla meddelanden i tråden för båda parter.
--   Nytt meddelande efter radering = helt ny konversation. Ingen hidden-logik behövs.
-- =========================================================

-- 1. Uppdatera delete_conversation: radera meddelanden, inga hidden_conversations
CREATE OR REPLACE FUNCTION public.delete_conversation(p_friendship_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifiera att anroparen är del av denna vänskap
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE id = p_friendship_id
      AND status = 'accepted'
      AND (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'friendship_not_found');
  END IF;

  -- Radera alla meddelanden i tråden permanent (båda parter)
  DELETE FROM messages WHERE friendship_id = p_friendship_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Ta bort triggern som avdöljde konversationer (behövs inte längre)
DROP TRIGGER IF EXISTS trg_unhide_conversation_on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.unhide_conversation_on_new_message();

-- 3. Uppdatera get_unread_message_count — ta bort hidden_conversations-filtret
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
    AND m.sender_id != (SELECT auth.uid())
    AND (f.requester_id = (SELECT auth.uid()) OR f.addressee_id = (SELECT auth.uid()));
$$;

-- 4. Uppdatera get_conversations — ta bort hidden_conversations-filtret
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
    lm.last_message_at,
    lm.last_message_sender_id,
    COALESCE(uc.unread_count, 0)    AS unread_count
  FROM my_friendships mf
  JOIN latest_messages lm USING (friendship_id)
  JOIN public.user_profiles up ON up.id = mf.friend_id
  LEFT JOIN unread_counts uc USING (friendship_id)
  ORDER BY lm.last_message_at DESC;
$$;

-- 5. Rensa befintliga hidden_conversations-rader (de ska inte påverka längre)
DELETE FROM public.hidden_conversations;
