-- =========================================================
-- MIGRATION: Avdölj konversation automatiskt vid nytt meddelande
-- Date: 2026-04-10
-- Problem: Om en konversation var dold (hidden_conversations) och
--   en ny vän skickade ett meddelande, försvann det bakom hidden-filtret.
--   get_unread_message_count räknade det olästa meddelandet, men
--   get_conversations visade inte konversationen → badge utan synligt meddelande.
-- Fix 1: Trigger som raderar hidden_conversations-raden när ett nytt
--   meddelande INSERT:as i den konversationen.
-- Fix 2: get_unread_message_count exkluderar dolda konversationer
--   (konsekvent med get_conversations).
-- =========================================================

-- Trigger-funktion: ta bort hidden_conversations för mottagaren vid nytt meddelande
CREATE OR REPLACE FUNCTION public.unhide_conversation_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ta bort hidden-raden för alla parter i konversationen UTOM avsändaren
  -- (avsändaren dolde kanske medvetet — avdölj bara för mottagaren)
  DELETE FROM public.hidden_conversations hc
  WHERE hc.friendship_id = NEW.friendship_id
    AND hc.user_id != NEW.sender_id;

  RETURN NEW;
END;
$$;

-- Trigger på messages-tabellen
DROP TRIGGER IF EXISTS trg_unhide_conversation_on_new_message ON public.messages;
CREATE TRIGGER trg_unhide_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.unhide_conversation_on_new_message();

-- Fix get_unread_message_count: exkludera dolda konversationer
-- (synkar med get_conversations som redan gör detta via NOT EXISTS)
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages m
  JOIN public.friendships f ON f.id = m.friendship_id
  WHERE m.read_at IS NULL
    AND m.deleted_at IS NULL
    AND m.sender_id != auth.uid()
    AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.hidden_conversations hc
      WHERE hc.user_id = auth.uid()
        AND hc.friendship_id = m.friendship_id
    );
$$;
