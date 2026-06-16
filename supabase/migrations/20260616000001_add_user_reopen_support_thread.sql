-- Användaren kan reopen sin egen stängda tråd.
-- Verifierar att tråden tillhör auth.uid() — ingen admin-behörighet krävs.
CREATE OR REPLACE FUNCTION public.user_reopen_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_threads
  SET status     = 'open',
      updated_at = now()
  WHERE id = p_thread_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found_or_forbidden';
  END IF;
END;
$$;
