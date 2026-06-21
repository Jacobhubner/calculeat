-- Spara originaltext vid första redigering av ett supportmeddelande.
-- original_content sätts bara om den är NULL (dvs. vid första edit).

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS original_content text;

-- Uppdatera edit_support_message för att spara originaltexten
CREATE OR REPLACE FUNCTION public.edit_support_message(
  p_message_id  uuid,
  p_content     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF char_length(trim(p_content)) = 0 OR char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'invalid_content';
  END IF;

  UPDATE public.support_messages
  SET original_content = COALESCE(original_content, content),
      content          = p_content,
      edited_at        = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found_or_forbidden';
  END IF;
END;
$$;

-- Uppdatera get_support_messages för att returnera original_content
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
  original_content text,
  created_at       timestamptz,
  read_at          timestamptz,
  deleted_at       timestamptz,
  edited_at        timestamptz
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
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.original_content END AS original_content,
    sm.created_at,
    sm.read_at,
    sm.deleted_at,
    sm.edited_at
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
