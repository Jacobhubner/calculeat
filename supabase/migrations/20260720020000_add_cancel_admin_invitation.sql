-- =========================================================
-- MIGRATION: Mojlighet att avbryta en skickad admin-inbjudan
-- Date: 2026-07-20
-- Kompletterar get_sent_admin_invitations (20260720010000) och
-- notifikationsflodet (20260720000000). admin_invitations.status
-- saknar ett 'cancelled'-varde (bara pending/accepted/rejected ar
-- tillatna), sa avbrutet av avsandaren ateranvander 'rejected' -
-- samma slutlage som nar mottagaren sjalv avbojer.
-- =========================================================

CREATE OR REPLACE FUNCTION public.cancel_admin_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation admin_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM admin_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_invitation.sender_id <> (SELECT auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_pending', 'status', v_invitation.status);
  END IF;

  UPDATE admin_invitations
  SET status = 'rejected', responded_at = now()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION public.cancel_admin_invitation IS
  'Later avsandaren avbryta en egen vantande (pending) admin-inbjudan.
   Atervander status=rejected (samma slutlage som ett avbojande fran
   mottagaren) eftersom admin_invitations saknar ett cancelled-varde.';

REVOKE EXECUTE ON FUNCTION public.cancel_admin_invitation FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancel_admin_invitation TO authenticated;
