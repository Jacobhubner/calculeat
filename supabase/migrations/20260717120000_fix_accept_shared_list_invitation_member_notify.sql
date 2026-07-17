-- =========================================================
-- MIGRATION: Fixa accept_shared_list_invitation — trasig notifieringsloop
-- Date: 2026-07-17
-- Problem: Den deployade versionen (20260426090139, applicerad via MCP och
--   aldrig incheckad i repot) fick en loop som notifierar befintliga medlemmar
--   vid join. Loopen refererar p_shared_list_id — en parameter som inte finns
--   (funktionens enda parameter är p_invitation_id). SQL-satsen felar i runtime,
--   WHEN OTHERS fångar felet och rullar tillbaka hela accepten.
--   Effekt: INGEN har kunnat acceptera en listinbjudan sedan 2026-04-26.
--   Inbjudan låg kvar som pending och UI:t visade "kunde inte gå med".
-- Fix:
--   1. p_shared_list_id → v_invitation.shared_list_id
--   2. Notifieringsblocket är nu best-effort (eget BEGIN/EXCEPTION) så att
--      en notisbugg aldrig mer kan blockera själva medlemskapet.
-- =========================================================

CREATE OR REPLACE FUNCTION public.accept_shared_list_invitation(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id   uuid := auth.uid();
  v_invitation     record;
  v_joiner_name    text;
  v_member_id      uuid;
BEGIN
  -- Hämta inbjudan med rad-lås (förhindrar race conditions)
  SELECT * INTO v_invitation
  FROM public.shared_list_invitations
  WHERE id           = p_invitation_id
    AND recipient_id = v_recipient_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invitation_already_processed',
      'status', v_invitation.status
    );
  END IF;

  -- Verifiera att listan fortfarande finns
  IF NOT EXISTS (
    SELECT 1 FROM public.shared_lists WHERE id = v_invitation.shared_list_id
  ) THEN
    UPDATE public.shared_list_invitations
    SET status = 'rejected', responded_at = now()
    WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'list_no_longer_exists');
  END IF;

  -- Lägg in mottagaren som listmedlem
  INSERT INTO public.shared_list_members (shared_list_id, user_id)
  VALUES (v_invitation.shared_list_id, v_recipient_id)
  ON CONFLICT (shared_list_id, user_id) DO NOTHING;

  -- Uppdatera inbjudansstatus
  UPDATE public.shared_list_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = p_invitation_id;

  -- Notifiera befintliga medlemmar (exkl. den som just gick med).
  -- Best-effort: en trasig notis får aldrig rulla tillbaka medlemskapet.
  BEGIN
    SELECT COALESCE(up.profile_name, up.username, up.email, 'En ny medlem')
      INTO v_joiner_name
      FROM public.user_profiles up
     WHERE up.id = v_recipient_id;

    FOR v_member_id IN
      SELECT user_id FROM public.shared_list_members
       WHERE shared_list_id = v_invitation.shared_list_id
         AND user_id <> v_recipient_id
    LOOP
      PERFORM public.internal_create_notification(
        p_user_id     => v_member_id,
        p_actor_id    => v_recipient_id,
        p_type        => 'shared_list_member_joined',
        p_entity_type => 'shared_list',
        p_entity_id   => v_invitation.shared_list_id,
        p_title       => v_joiner_name || ' gick med i "' || v_invitation.list_name || '"'
      );
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'shared_list_id', v_invitation.shared_list_id,
    'list_name', v_invitation.list_name
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_accept_detected');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.accept_shared_list_invitation IS
  'Accepterar en listinbjudan och lägger in mottagaren som listmedlem.
   FOR UPDATE NOWAIT förhindrar race conditions.
   Medlemsnotiser (shared_list_member_joined) skickas best-effort och kan
   aldrig blockera själva accepten.';

-- CREATE OR REPLACE bevarar befintlig ACL, men var explicit för säkerhets skull
REVOKE EXECUTE ON FUNCTION public.accept_shared_list_invitation FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.accept_shared_list_invitation TO authenticated;
