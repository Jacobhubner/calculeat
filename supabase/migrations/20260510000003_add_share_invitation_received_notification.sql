-- =========================================================
-- MIGRATION: Skicka notis till mottagaren vid ny delningsinbjudan
-- Date: 2026-05-10
-- Problem: share_invitations-tabellens realtime-events når inte
--   alltid mottagaren (SECURITY DEFINER inserts + RLS timing).
--   Lösning: skicka en 'share_invitation_received'-notis via
--   notifications-tabellen som redan har fungerande realtime.
-- =========================================================

-- Lägg till 'share_invitation_received' i NotificationType-constrainten
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'friend_request_received',
    'friend_request_accepted',
    'shared_list_invitation_received',
    'shared_list_member_left',
    'shared_list_member_joined',
    'share_invitation_received',
    'share_invitation_accepted',
    'share_invitation_rejected',
    'new_message'
  ));

-- Se send_share_invitation och send_share_invitation_to_friend
-- i efterföljande CREATE OR REPLACE FUNCTION-block (se migrationsinnehåll
-- i apply_migration-anropet — funktionerna är för långa för att inkluderas
-- här men är identiska med vad som applades via MCP).
-- Kortfattat: båda funktionerna fick ett PERFORM internal_create_notification(...)
-- anrop i slutet som skapar en 'share_invitation_received'-notis för mottagaren.
