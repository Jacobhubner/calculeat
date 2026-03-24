ALTER TABLE share_invitations
DROP CONSTRAINT share_invitations_status_check;

ALTER TABLE share_invitations
ADD CONSTRAINT share_invitations_status_check
CHECK (status = ANY (ARRAY['pending','accepted','rejected','expired','cancelled']));
