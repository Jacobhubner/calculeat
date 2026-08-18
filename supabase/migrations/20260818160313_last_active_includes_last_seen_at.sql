-- last_seen_at saknades bland aktivitetssignalerna.
--
-- Appen skriver user_profiles.last_seen_at varje gång den öppnas (throttlat
-- till 15 min, se AuthContext). Det är den bästa signalen som finns — den
-- fångar att någon ANVÄNDER appen, inte bara att de loggat in eller råkat
-- skapa en rad någonstans.
--
-- Den låg utanför user_last_active_at, med följden att adminvyn underskattade
-- aktiviteten för 22 av 28 användare.
--
-- De två vyerna missade dessutom åt olika håll, vilket är varför de sa emot
-- varandra:
--   olljoh — Social visade 1 juni (last_seen_at), men han loggade in 16 aug
--   sarge  — Social visade 3 aug (rätt), inloggningen stod kvar på 21 april
-- Ingen av källorna räcker ensam. Den som är SENAST är svaret.
CREATE OR REPLACE FUNCTION public.user_last_active_at(p_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    -- Bästa signalen: skrivs varje gång appen öppnas.
    (SELECT up.last_seen_at FROM public.user_profiles up WHERE up.id = p_user_id),
    -- Uppdateras bara vid NY inloggning — sessioner hålls vid liv genom
    -- token-förnyelse, så den kan vara månader gammal för en aktiv användare.
    (SELECT au.last_sign_in_at FROM auth.users au WHERE au.id = p_user_id),
    -- Faktiska spår i appen, som skydd om ovanstående skulle missa.
    (SELECT max(dl.log_date)::timestamptz
       FROM public.daily_logs dl WHERE dl.user_id = p_user_id),
    (SELECT max(wh.recorded_at)
       FROM public.weight_history wh WHERE wh.user_id = p_user_id),
    (SELECT max(r.created_at)
       FROM public.recipes r WHERE r.user_id = p_user_id),
    (SELECT max(f.created_at)
       FROM public.food_items f WHERE f.user_id = p_user_id)
  );
$$;

COMMENT ON FUNCTION public.user_last_active_at IS
  'Senast kända aktivitet: det senaste av last_seen_at (skrivs när appen '
  'öppnas), inloggning, och faktiska spår i appen. Ingen källa räcker ensam — '
  'last_seen_at kan sakna en ren inloggning, och last_sign_in_at uppdateras '
  'inte när en session förnyas.';
