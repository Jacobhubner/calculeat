-- Add member_ids uuid[] to get_my_shared_lists()
-- Uses a subquery to guarantee that member_ids and member_names arrays
-- are in the same order (alphabetical by display name).
-- DROP required because return type changes (new member_ids column).

DROP FUNCTION IF EXISTS public.get_my_shared_lists();

CREATE FUNCTION public.get_my_shared_lists()
RETURNS TABLE (
  id               uuid,
  name             text,
  created_at       timestamptz,
  member_count     bigint,
  member_names     text[],
  member_ids       uuid[],
  food_item_count  bigint,
  recipe_count     bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sl.id,
    sl.name,
    sl.created_at,
    COUNT(DISTINCT slm.user_id)                             AS member_count,
    (
      SELECT ARRAY_AGG(
        COALESCE(up2.username, up2.profile_name, up2.email)
        ORDER BY COALESCE(up2.username, up2.profile_name, up2.email)
      )
      FROM public.shared_list_members slm2
      JOIN public.user_profiles up2 ON up2.id = slm2.user_id
      WHERE slm2.shared_list_id = sl.id
    )                                                       AS member_names,
    (
      SELECT ARRAY_AGG(
        up2.id
        ORDER BY COALESCE(up2.username, up2.profile_name, up2.email)
      )
      FROM public.shared_list_members slm2
      JOIN public.user_profiles up2 ON up2.id = slm2.user_id
      WHERE slm2.shared_list_id = sl.id
    )                                                       AS member_ids,
    COUNT(DISTINCT fi.id)                                   AS food_item_count,
    COUNT(DISTINCT r.id)                                    AS recipe_count
  FROM public.shared_lists sl
  JOIN public.shared_list_members slm ON slm.shared_list_id = sl.id
  LEFT JOIN public.user_profiles up ON up.id = slm.user_id
  LEFT JOIN public.food_items fi
    ON fi.shared_list_id = sl.id AND fi.is_hidden IS NOT TRUE
  LEFT JOIN public.recipes r ON r.shared_list_id = sl.id
  WHERE EXISTS (
    SELECT 1 FROM public.shared_list_members my_slm
    WHERE my_slm.shared_list_id = sl.id
      AND my_slm.user_id = auth.uid()
  )
  GROUP BY sl.id, sl.name, sl.created_at
  ORDER BY sl.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_shared_lists FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_shared_lists TO authenticated;

COMMENT ON FUNCTION public.get_my_shared_lists IS
  'Returnerar alla gemensamma listor som auth.uid() är med i,
   med antal medlemmar, deras namn (member_names) och UUIDs (member_ids) i
   samma ordning (alfabetisk per visningsnamn), antal livsmedel och recept.
   STABLE = inga sidoeffekter, säker att anropa frekvent.';
