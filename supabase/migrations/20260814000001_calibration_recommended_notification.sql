-- =========================================================
-- Notis: "kalibrering rekommenderas"
--
-- Bakgrund: kalibreringen är produktens starkaste differentierare mot
-- MyFitnessPal/Lifesum/Yazio, men användaren måste själv komma på att
-- undra "borde jag kalibrera nu?". MacroFactor justerar veckovis
-- automatiskt. Denna notis stänger merparten av det gapet utan att
-- införa helautomatik: appen säger till, användaren bestämmer.
--
-- ARKITEKTUR — varför en RPC och inte en trigger/cron:
-- Rekommendationen härleds i klienten (useCalibrationAvailability) från
-- viktkluster, CV-baserad trenddetektion och datakvalitet. Att duplicera
-- den logiken i SQL vore två sanningar som glider isär. Klienten avgör
-- alltså NÄR, servern äger idempotens och rate limit — klienten kan inte
-- spamma even om den anropar vid varje render.
--
-- IDEMPOTENS: max en notis per 14 dagar per användare. Utan detta skulle
-- varje dashboard-render ge en ny notis.
-- =========================================================

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
    'new_message',
    'support_message_received',
    'admin_invitation_received',
    'admin_invitation_accepted',
    'admin_invitation_rejected',
    'admin_message',
    'calibration_recommended'
  ));

-- RPC: skapa en kalibreringsnotis till den inloggade användaren själv.
-- Anropas av klienten när useCalibrationAvailability slår om till
-- isRecommended. Returnerar tyst false om en notis redan skickats nyligen.
CREATE OR REPLACE FUNCTION public.notify_calibration_recommended(
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_reason text := NULLIF(trim(COALESCE(p_reason, '')), '');
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Idempotens + rate limit: en notis per 14 dagar räcker. Kalibrering är
  -- meningsfull tidigast var 14:e dag (MIN_DATA_POINTS-perioderna är
  -- 14/21/28 dagar), så tätare påminnelser vore brus.
  IF EXISTS (
    SELECT 1 FROM public.notifications
     WHERE user_id = v_user
       AND type = 'calibration_recommended'
       AND created_at > now() - interval '14 days'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_notified');
  END IF;

  PERFORM internal_create_notification(
    v_user,
    NULL,                                     -- systemnotis, ingen aktör
    'calibration_recommended',
    'calibration',
    NULL,
    COALESCE(v_reason, 'Dags att kalibrera ditt TDEE')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION public.notify_calibration_recommended IS
  'Skapar en calibration_recommended-notis åt den inloggade användaren. '
  'Klienten avgör när (useCalibrationAvailability.isRecommended); denna '
  'funktion garanterar högst en notis per 14 dagar.';

GRANT EXECUTE ON FUNCTION public.notify_calibration_recommended(text) TO authenticated;
