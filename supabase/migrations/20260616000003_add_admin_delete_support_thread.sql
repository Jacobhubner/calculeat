-- Admin kan radera valfri stängd tråd (och alla meddelanden via CASCADE).
CREATE OR REPLACE FUNCTION public.admin_delete_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.support_threads
  WHERE id = p_thread_id
    AND status = 'closed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found_or_not_closed';
  END IF;
END;
$$;
