-- =========================================================
-- MIGRATION: RPC for att lista egna skickade, vantande admin-inbjudningar
-- Date: 2026-07-20
-- Problem: Det fanns ingen vag for en super-admin att se att en admin-
--   inbjudan faktiskt skickats och inviantar svar. admin_invitations
--   lagrar bara sender_name (inte mottagarens namn), och RLS tillater
--   bara recipient (samt super admins generellt) att lasa raden -
--   det saknades en riktad "mina skickade inbjudningar"-vy i UI.
-- Fix: RPC som returnerar avsandarens egna pending-inbjudningar med
--   mottagarens visningsnamn (username/email fallback), samma monster
--   som get_sent_share_invitations.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_sent_admin_invitations()
RETURNS TABLE (
  id uuid,
  recipient_id uuid,
  recipient_name text,
  status text,
  created_at timestamptz,
  responded_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ai.id,
    ai.recipient_id,
    COALESCE(up.username, up.email, 'Okand anvandare') AS recipient_name,
    ai.status,
    ai.created_at,
    ai.responded_at
  FROM admin_invitations ai
  LEFT JOIN user_profiles up ON up.id = ai.recipient_id
  WHERE ai.sender_id = (SELECT auth.uid())
    AND ai.status = 'pending'
  ORDER BY ai.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_sent_admin_invitations IS
  'Returnerar avsandarens egna vantande (pending) admin-inbjudningar med
   mottagarens visningsnamn, for "Skickade admin-inbjudningar"-vyn i Aktivitet.';

REVOKE EXECUTE ON FUNCTION public.get_sent_admin_invitations FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_sent_admin_invitations TO authenticated;
