-- Edit/delete för supportmeddelanden.
-- Redigera: avsändaren kan redigera sitt eget meddelande.
-- Radera (mjuk): admin kan mjukradera valfritt meddelande.

-- 1. Lägg till edited_at på support_messages
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 2. Uppdatera get_support_messages för att returnera edited_at
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

-- 3. RPC: redigera eget meddelande
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
  SET content   = p_content,
      edited_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found_or_forbidden';
  END IF;
END;
$$;

-- 4. RPC: mjukradera meddelande (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_support_message(
  p_message_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_messages
  SET deleted_at = now()
  WHERE id = p_message_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found_or_already_deleted';
  END IF;
END;
$$;
