-- RPC: cancel a sent share invitation (only sender, only if still pending)
CREATE OR REPLACE FUNCTION cancel_share_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation share_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM share_invitations
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

  UPDATE share_invitations
  SET status = 'cancelled', responded_at = now()
  WHERE id = p_invitation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: get invitations sent by the current user that are still pending
CREATE OR REPLACE FUNCTION get_sent_share_invitations()
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
  expires_at timestamptz
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
    si.expires_at
  FROM share_invitations si
  LEFT JOIN user_profiles up ON up.id = si.recipient_id
  WHERE si.sender_id = (SELECT auth.uid())
    AND si.status = 'pending'
  ORDER BY si.created_at DESC;
END;
$$;
