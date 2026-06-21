-- Lägg till assigned_admin_username i get_support_thread_inbox
-- så att UI kan visa vem som hanterar ett ärende utan extra query.

DROP FUNCTION IF EXISTS public.get_support_thread_inbox();

CREATE OR REPLACE FUNCTION public.get_support_thread_inbox()
RETURNS TABLE (
  thread_id              uuid,
  user_id                uuid,
  username               text,
  email                  text,
  assigned_admin_id      uuid,
  assigned_admin_username text,
  status                 text,
  last_message           text,
  last_message_at        timestamptz,
  unread_count           bigint,
  updated_at             timestamptz,
  created_at             timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_messages AS (
    SELECT DISTINCT ON (support_thread_id)
      support_thread_id,
      CASE WHEN deleted_at IS NOT NULL THEN NULL ELSE content END AS content,
      created_at
    FROM public.support_messages
    ORDER BY support_thread_id, created_at DESC
  ),
  unread_counts AS (
    SELECT
      sm.support_thread_id,
      COUNT(*) AS cnt
    FROM public.support_messages sm
    WHERE sm.sender_id != auth.uid()
      AND sm.read_at IS NULL
      AND sm.deleted_at IS NULL
    GROUP BY sm.support_thread_id
  )
  SELECT
    st.id                              AS thread_id,
    st.user_id,
    up.username,
    up.email,
    st.assigned_admin_id,
    aup.username                       AS assigned_admin_username,
    st.status,
    lm.content                         AS last_message,
    lm.created_at                      AS last_message_at,
    COALESCE(uc.cnt, 0)                AS unread_count,
    st.updated_at,
    st.created_at
  FROM public.support_threads st
  JOIN public.user_profiles up ON up.id = st.user_id
  JOIN latest_messages lm ON lm.support_thread_id = st.id
  LEFT JOIN unread_counts uc ON uc.support_thread_id = st.id
  LEFT JOIN public.user_profiles aup ON aup.id = st.assigned_admin_id
  WHERE public.is_support_admin()
  ORDER BY st.updated_at DESC;
$$;
