-- =========================================================
-- MIGRATION: get_support_messages returnerar sender_is_admin
-- Date: 2026-07-21
-- Bugg: MessageBubble hårdkodade etiketten "· admin" på alla meddelanden
--   som inte var inloggade användarens egna. I admin-inkorgen märktes
--   därmed VANLIGA ANVÄNDARE felaktigt som "admin". Det var aldrig
--   baserad på verklig roll — support_messages saknade admin-flagga.
-- Fix: RPC:n exponerar nu sender_is_admin (finns avsändaren i admins-
--   tabellen?). UI:t visar etiketten enbart när detta är sant — en
--   server-verifierad sanning, inte ett antagande om "inte mitt".
-- =========================================================

-- RETURNS TABLE-formen ändras → funktionen måste droppas först.
DROP FUNCTION IF EXISTS public.get_support_messages(uuid, integer, timestamp with time zone);

CREATE OR REPLACE FUNCTION public.get_support_messages(
  p_thread_id uuid,
  p_limit integer DEFAULT 50,
  p_before timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS TABLE(
  id uuid, sender_id uuid, sender_username text, sender_is_admin boolean,
  content text, original_content text, image_path text,
  created_at timestamp with time zone, read_at timestamp with time zone,
  deleted_at timestamp with time zone, edited_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    sm.id,
    sm.sender_id,
    COALESCE(up.username, CASE WHEN st.user_id = sm.sender_id THEN st.guest_name END, 'Gäst')
                                                                               AS sender_username,
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = sm.sender_id)      AS sender_is_admin,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.content END          AS content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.original_content END AS original_content,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.image_path END       AS image_path,
    sm.created_at,
    sm.read_at,
    sm.deleted_at,
    sm.edited_at
  FROM public.support_messages sm
  JOIN public.support_threads st ON st.id = sm.support_thread_id
  LEFT JOIN public.user_profiles up ON up.id = sm.sender_id
  WHERE sm.support_thread_id = p_thread_id
    AND (
      st.user_id = auth.uid()
      OR public.is_support_admin()
    )
    AND (p_before IS NULL OR sm.created_at < p_before)
  ORDER BY sm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$function$;

-- Ny funktion ärver inte gamla ACL:er efter DROP — återställ.
GRANT EXECUTE ON FUNCTION public.get_support_messages(uuid, integer, timestamp with time zone) TO authenticated, service_role;
