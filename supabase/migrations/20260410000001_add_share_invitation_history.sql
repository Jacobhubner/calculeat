-- =========================================================
-- MIGRATION: Visa accepterade/nekade inbjudningar för avsändaren
-- Date: 2026-04-10
-- Problem: get_sent_share_invitations filtrerade på status = 'pending',
--   vilket innebar att avsändaren aldrig fick feedback om utfallet.
-- Fix: Ny RPC get_sent_share_invitation_history som returnerar
--   besvarade inbjudningar (accepted/rejected) de senaste 14 dagarna.
-- =========================================================

CREATE OR REPLACE FUNCTION get_sent_share_invitation_history()
RETURNS TABLE (
  id uuid,
  item_type text,
  item_id uuid,
  item_name text,
  recipient_id uuid,
  recipient_name text,
  recipient_email text,
  status text,
  created_at timestamptz,
  responded_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.item_type,
    si.item_id,
    COALESCE((si.snapshot->>'name')::text, 'Okänt') AS item_name,
    si.recipient_id,
    COALESCE(up.username, up.email, 'Okänd') AS recipient_name,
    up.email AS recipient_email,
    si.status,
    si.created_at,
    si.responded_at
  FROM share_invitations si
  LEFT JOIN user_profiles up ON up.id = si.recipient_id
  WHERE si.sender_id = (SELECT auth.uid())
    AND si.status IN ('accepted', 'rejected')
    AND si.responded_at >= now() - interval '14 days'
  ORDER BY si.responded_at DESC;
END;
$$;
