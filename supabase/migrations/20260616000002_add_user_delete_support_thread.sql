-- Användaren kan radera sin egen stängda tråd (och alla meddelanden via CASCADE).
-- Kräver status='closed' — öppna ärenden kan inte raderas av användaren.
CREATE OR REPLACE FUNCTION public.delete_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.support_threads
  WHERE id = p_thread_id
    AND user_id = auth.uid()
    AND status = 'closed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found_forbidden_or_not_closed';
  END IF;
END;
$$;
