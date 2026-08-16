-- REGRESSION: chatten slutade visa meddelanden.
--
-- 20260816090953 och ...091112 körde `REVOKE ALL ... FROM public, anon` i tron
-- att det bara stängde ute anon. Men PostgREST ansluter som rollen
-- `authenticator` och byter till `authenticated` först därefter — och
-- `authenticator` når funktionen via PUBLIC-grantet, inte via sitt eget.
-- Utan `=X/postgres` failar anropet med 42501 innan rollbytet sker.
--
-- Alla appens övriga meddelande-RPC:er (mark_messages_read, delete_message,
-- get_unread_message_count) har PUBLIC-grantet kvar. Vi återställer samma
-- uppsättning här i stället för att avvika.
--
-- Notera: PUBLIC-grantet ger INTE anon åtkomst till datan. Funktionerna är
-- SECURITY DEFINER men filtrerar allt på auth.uid(), som är NULL för anon —
-- en anonym anropare får noll rader, aldrig någon annans meddelanden.
--
-- LÄRDOM: verifiera alltid RPC-behörighet över HTTP (PostgREST), inte bara
-- med `SET ROLE authenticated` i SQL. Rollbytet döljer just det här felet.

GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, text) TO public;
GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO public;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO public;
