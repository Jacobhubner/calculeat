-- REGRESSION 2: tråden visade "Inga meddelanden än".
--
-- Klienten skickar `p_before: pageParam ?? undefined`. undefined serialiseras
-- inte till JSON, så nyckeln FÖRSVINNER ur anropet. PostgREST matchar RPC:er
-- på exakta parameternamn och hittade då ingen get_messages med bara
-- (p_friendship_id, p_limit) → 404 PGRST202 → tom tråd.
--
-- Den ursprungliga funktionen hade defaults. När 20260816090953 DROP:ade och
-- återskapade den för att lägga till image_path i returtypen tappades de.
-- Defaults gör anropet tåligt för utelämnade parametrar.
--
-- LÄRDOM: testa RPC:n med EXAKT samma payload som klienten skickar. Ett
-- anrop med `p_before: null` fungerar även utan defaults och döljer felet.
CREATE OR REPLACE FUNCTION public.get_messages(
  p_friendship_id uuid,
  p_limit         integer     DEFAULT 50,
  p_before        timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  sender_id  uuid,
  content    text,
  image_path text,
  created_at timestamptz,
  read_at    timestamptz,
  edited_at  timestamptz,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.sender_id,
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.content END AS content,
    CASE WHEN m.deleted_at IS NOT NULL THEN NULL ELSE m.image_path END AS image_path,
    m.created_at,
    m.read_at,
    m.edited_at,
    m.deleted_at
  FROM public.messages m
  WHERE m.friendship_id = p_friendship_id
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = p_friendship_id
        AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
    )
    AND (p_before IS NULL OR m.created_at < p_before)
  ORDER BY m.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, timestamptz) TO authenticated;
