-- Vänlistan och adminvyn visade olika "senast sedd" för samma person.
--
-- get_friends läste user_profiles.last_seen_at rakt av. Den skrivs när appen
-- öppnas, men fångar inte en ren inloggning — olljoh loggade in 16 aug medan
-- last_seen_at stod kvar på 1 juni, så vänlistan påstod "tre månader sedan".
--
-- Båda vyerna använder nu samma källa: user_last_active_at. Då kan de inte
-- säga emot varandra, och rättas definitionen på ett ställe följer båda med.
--
-- INTEGRITET: en vän ser bara en grov tidsangivelse ("två dagar sedan"), inte
-- exakt tidpunkt eller vad personen gjort. Samma uppgift som förut, bara mer
-- korrekt — ingen ny information exponeras.
CREATE OR REPLACE FUNCTION public.get_friends()
RETURNS TABLE (
  friendship_id uuid,
  friend_id     uuid,
  friend_name   text,
  friend_email  text,
  friend_username text,
  alias         text,
  since         timestamptz,
  last_seen_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id              AS friendship_id,
    f.addressee_id    AS friend_id,
    COALESCE(up.username, up.email) AS friend_name,
    up.email          AS friend_email,
    up.username       AS friend_username,
    f.requester_alias AS alias,
    f.responded_at    AS since,
    public.user_last_active_at(up.id) AS last_seen_at
  FROM public.friendships f
  JOIN public.user_profiles up ON up.id = f.addressee_id
  WHERE f.requester_id = (SELECT auth.uid())
    AND f.status = 'accepted'

  UNION ALL

  SELECT
    f.id              AS friendship_id,
    f.requester_id    AS friend_id,
    COALESCE(up.username, up.email) AS friend_name,
    up.email          AS friend_email,
    up.username       AS friend_username,
    f.addressee_alias AS alias,
    f.responded_at    AS since,
    public.user_last_active_at(up.id) AS last_seen_at
  FROM public.friendships f
  JOIN public.user_profiles up ON up.id = f.requester_id
  WHERE f.addressee_id = (SELECT auth.uid())
    AND f.status = 'accepted'

  ORDER BY friend_name;
$$;

-- PostgREST ansluter som 'authenticator' → PUBLIC-granten behövs.
GRANT EXECUTE ON FUNCTION public.get_friends() TO public;
GRANT EXECUTE ON FUNCTION public.get_friends() TO authenticated;
