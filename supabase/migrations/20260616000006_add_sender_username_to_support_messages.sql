-- Lägg till sender_username i get_support_messages så att
-- användaren kan se vilket admin-namn som svarade.

DROP FUNCTION IF EXISTS public.get_support_messages(uuid, integer, timestamptz);

CREATE OR REPLACE FUNCTION public.get_support_messages(
  p_thread_id  uuid,
  p_limit      int          DEFAULT 50,
  p_before     timestamptz  DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  sender_id        uuid,
  sender_username  text,
  content          text,
  created_at       timestamptz,
  read_at          timestamptz,
  deleted_at       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sm.id,
    sm.sender_id,
    up.username                                                              AS sender_username,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.content END        AS content,
    sm.created_at,
    sm.read_at,
    sm.deleted_at
  FROM public.support_messages sm
  JOIN public.user_profiles up ON up.id = sm.sender_id
  WHERE sm.support_thread_id = p_thread_id
    AND EXISTS (
      SELECT 1 FROM public.support_threads st
      WHERE st.id = p_thread_id
        AND (
          st.user_id = auth.uid()
          OR public.is_support_admin()
        )
    )
    AND (p_before IS NULL OR sm.created_at < p_before)
  ORDER BY sm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;
