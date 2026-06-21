-- Admin tilldelar ett supportärende till sig själv eller en annan admin.
-- Sätter assigned_admin_id + updated_at på tråden.

CREATE OR REPLACE FUNCTION public.assign_support_thread(
  p_thread_id   uuid,
  p_admin_id    uuid  -- NULL = avtilldela
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

  -- Om p_admin_id är satt, verifiera att den användaren faktiskt är admin
  IF p_admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = p_admin_id
  ) THEN
    RAISE EXCEPTION 'target_not_admin';
  END IF;

  UPDATE public.support_threads
  SET assigned_admin_id = p_admin_id,
      updated_at = now()
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found';
  END IF;
END;
$$;
