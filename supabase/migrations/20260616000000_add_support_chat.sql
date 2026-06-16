-- =========================================================
-- MIGRATION: Support Chat
-- Date: 2026-06-16
-- Description: Lägger till support-chattfunktion som låter
--   användare kontakta superadmin/admins direkt från appen.
--   Isolerat system — notifications-tabellen rörs inte.
--   En tråd per användare i v1 (UNIQUE constraint).
-- =========================================================

-- =========================================================
-- STEG 1: Hjälpfunktion — admin-check (initplan-säker)
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_support_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

-- =========================================================
-- STEG 2: Tabeller
-- =========================================================

CREATE TABLE public.support_threads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_admin_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status            text        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'closed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- Drop this constraint when multi-thread per user is needed (v2)
  CONSTRAINT support_threads_user_id_unique UNIQUE (user_id)
);

CREATE TABLE public.support_messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  support_thread_id uuid        NOT NULL
                                REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  read_at           timestamptz,
  deleted_at        timestamptz, -- content → NULL i RPC om satt; edit/delete UI är v2
  CONSTRAINT chk_support_message_content_length
    CHECK (char_length(content) BETWEEN 1 AND 2000)
);

-- =========================================================
-- STEG 3: Index
-- =========================================================

-- Inbox-sortering på updated_at
CREATE INDEX idx_support_threads_updated
  ON public.support_threads (updated_at DESC);

-- RLS-lookup user_id
CREATE INDEX idx_support_threads_user
  ON public.support_threads (user_id);

-- Paginering per tråd (cursor på created_at)
CREATE INDEX idx_support_messages_thread_created
  ON public.support_messages (support_thread_id, created_at DESC);

-- Rate-limit: COUNT avsändaren senaste timmen (partiellt — exkluderar raderade)
CREATE INDEX idx_support_messages_sender_created
  ON public.support_messages (sender_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Unread-count: partiellt index för olästa aktiva meddelanden
CREATE INDEX idx_support_messages_unread
  ON public.support_messages (support_thread_id, sender_id)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- =========================================================
-- STEG 4: RLS
-- =========================================================

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- support_threads: ägaren eller admin kan läsa
CREATE POLICY "support_threads_select"
  ON public.support_threads FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_support_admin()
  );

-- Alla direkta skrivoperationer blockeras — all skrivning sker via SECURITY DEFINER RPCs
CREATE POLICY "support_threads_no_insert"
  ON public.support_threads FOR INSERT
  WITH CHECK (false);

CREATE POLICY "support_threads_no_update"
  ON public.support_threads FOR UPDATE
  USING (false);

CREATE POLICY "support_threads_no_delete"
  ON public.support_threads FOR DELETE
  USING (false);

-- support_messages: ägaren av tråden eller admin kan läsa
CREATE POLICY "support_messages_select"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads st
      WHERE st.id = support_messages.support_thread_id
        AND (
          st.user_id = (SELECT auth.uid())
          OR public.is_support_admin()
        )
    )
  );

CREATE POLICY "support_messages_no_insert"
  ON public.support_messages FOR INSERT
  WITH CHECK (false);

CREATE POLICY "support_messages_no_update"
  ON public.support_messages FOR UPDATE
  USING (false);

CREATE POLICY "support_messages_no_delete"
  ON public.support_messages FOR DELETE
  USING (false);

-- =========================================================
-- STEG 5: RPC — get_support_thread_id
-- READ-only. Returnerar befintlig thread_id eller NULL.
-- Körs vid DashboardLayout-mount för att hämta badge-threadId
-- utan att skapa rader för användare som aldrig öppnat chatten.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_support_thread_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.support_threads
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- =========================================================
-- STEG 6: RPC — create_support_thread
-- Körs första gången användaren öppnar panelen (threadId = NULL).
-- Idempotent via ON CONFLICT.
-- =========================================================

CREATE OR REPLACE FUNCTION public.create_support_thread()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_thread_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  INSERT INTO public.support_threads (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_thread_id
  FROM public.support_threads
  WHERE user_id = v_user_id;

  RETURN v_thread_id;
END;
$$;

-- =========================================================
-- STEG 7: RPC — send_support_message
-- Skickas av användare. Kontrollerar status → rate-limit → insert.
-- p_thread_id DEFAULT NULL = auto-resolve via user_id (bakåtkompatibelt
-- med framtida multi-thread där p_thread_id skickas explicit).
-- Rate limit: 10 meddelanden/timme per användare (admins undantagna).
-- =========================================================

CREATE OR REPLACE FUNCTION public.send_support_message(
  p_content    text,
  p_thread_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_thread_id uuid;
  v_trimmed   text := trim(p_content);
  v_status    text;
  v_count     int;
  v_msg_id    uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_trimmed IS NULL OR v_trimmed = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  -- Resolve thread: explicit p_thread_id eller auto via user_id
  IF p_thread_id IS NOT NULL THEN
    SELECT id, status INTO v_thread_id, v_status
    FROM public.support_threads
    WHERE id = p_thread_id
      AND user_id = v_user_id; -- ägarkontroll
  ELSE
    SELECT id, status INTO v_thread_id, v_status
    FROM public.support_threads
    WHERE user_id = v_user_id;
  END IF;

  IF v_thread_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_not_found');
  END IF;

  -- Stängd tråd blockerar nya meddelanden
  IF v_status = 'closed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_closed');
  END IF;

  -- Rate limit: max 10 meddelanden per timme (ej admins)
  IF NOT public.is_support_admin() THEN
    SELECT COUNT(*) INTO v_count
    FROM public.support_messages
    WHERE sender_id = v_user_id
      AND support_thread_id = v_thread_id
      AND created_at > now() - interval '1 hour'
      AND deleted_at IS NULL;

    IF v_count >= 10 THEN
      RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
    END IF;
  END IF;

  INSERT INTO public.support_messages (support_thread_id, sender_id, content)
  VALUES (v_thread_id, v_user_id, v_trimmed)
  RETURNING id INTO v_msg_id;

  -- Uppdatera trådens aktivitetstidsstämpel för inbox-sortering
  UPDATE public.support_threads
  SET updated_at = now()
  WHERE id = v_thread_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

-- =========================================================
-- STEG 8: RPC — reply_support_message
-- Skickas av admin. Kontrollerar admin-roll och att tråden är öppen.
-- =========================================================

CREATE OR REPLACE FUNCTION public.reply_support_message(
  p_thread_id  uuid,
  p_content    text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_trimmed   text := trim(p_content);
  v_status    text;
  v_msg_id    uuid;
BEGIN
  -- Verifierar admin-roll
  IF NOT public.is_support_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF v_trimmed IS NULL OR v_trimmed = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'empty_content');
  END IF;

  IF char_length(v_trimmed) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'content_too_long');
  END IF;

  SELECT status INTO v_status
  FROM public.support_threads
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_not_found');
  END IF;

  -- Admin kan inte svara på stängd tråd — måste öppna den explicit först
  IF v_status = 'closed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'thread_closed');
  END IF;

  INSERT INTO public.support_messages (support_thread_id, sender_id, content)
  VALUES (p_thread_id, v_caller_id, v_trimmed)
  RETURNING id INTO v_msg_id;

  UPDATE public.support_threads
  SET updated_at = now()
  WHERE id = p_thread_id;

  RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

-- =========================================================
-- STEG 9: RPC — close_support_thread
-- Admin-only. Stänger tråden.
-- =========================================================

CREATE OR REPLACE FUNCTION public.close_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_threads
  SET status     = 'closed',
      updated_at = now()
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found';
  END IF;
END;
$$;

-- =========================================================
-- STEG 10: RPC — reopen_support_thread
-- Admin-only. Öppnar stängd tråd.
-- =========================================================

CREATE OR REPLACE FUNCTION public.reopen_support_thread(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_threads
  SET status     = 'open',
      updated_at = now()
  WHERE id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'thread_not_found';
  END IF;
END;
$$;

-- =========================================================
-- STEG 11: RPC — get_support_messages
-- Cursor-baserad paginering (created_at DESC, 50/sida).
-- Raderade meddelanden: content returneras som NULL.
-- Tillgänglig för tråd-ägaren och alla admins.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_support_messages(
  p_thread_id  uuid,
  p_limit      int          DEFAULT 50,
  p_before     timestamptz  DEFAULT NULL
)
RETURNS TABLE (
  id                uuid,
  sender_id         uuid,
  content           text,
  created_at        timestamptz,
  read_at           timestamptz,
  deleted_at        timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sm.id,
    sm.sender_id,
    CASE WHEN sm.deleted_at IS NOT NULL THEN NULL ELSE sm.content END AS content,
    sm.created_at,
    sm.read_at,
    sm.deleted_at
  FROM public.support_messages sm
  WHERE sm.support_thread_id = p_thread_id
    AND EXISTS (
      SELECT 1 FROM public.support_threads st
      WHERE st.id = p_thread_id
        AND (
          st.user_id = auth.uid()
          OR public.is_support_admin()
        )
    )
    AND (p_before IS NULL OR sm.created_at < p_before)
  ORDER BY sm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

-- =========================================================
-- STEG 12: RPC — mark_support_messages_read
-- Sätter read_at på motpartens olästa meddelanden i tråden.
-- Idempotent — safe att anropa flera gånger.
-- =========================================================

CREATE OR REPLACE FUNCTION public.mark_support_messages_read(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifiera att anroparen har åtkomst till tråden
  IF NOT EXISTS (
    SELECT 1 FROM public.support_threads st
    WHERE st.id = p_thread_id
      AND (
        st.user_id = auth.uid()
        OR public.is_support_admin()
      )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.support_messages
  SET read_at = now()
  WHERE support_thread_id = p_thread_id
    AND sender_id != auth.uid()
    AND read_at IS NULL
    AND deleted_at IS NULL;
END;
$$;

-- =========================================================
-- STEG 13: RPC — get_support_unread_count
-- Antal olästa admin-svar för den inloggade användaren.
-- Ingen threadId-parameter — filtrerar internt via JOIN.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_support_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.support_messages sm
  JOIN public.support_threads st ON st.id = sm.support_thread_id
  WHERE st.user_id = auth.uid()
    AND sm.sender_id != auth.uid()
    AND sm.read_at IS NULL
    AND sm.deleted_at IS NULL;
$$;

-- =========================================================
-- STEG 14: RPC — get_support_admin_unread_count
-- Summa olästa meddelanden från användare, alla trådar.
-- Används för admin-badge på /app/admin/support-länken.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_support_admin_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.support_messages sm
  JOIN public.support_threads st ON st.id = sm.support_thread_id
  WHERE public.is_support_admin()
    AND sm.sender_id != auth.uid()  -- utesluter egna svar
    AND sm.read_at IS NULL
    AND sm.deleted_at IS NULL;
$$;

-- =========================================================
-- STEG 15: RPC — get_support_thread_inbox
-- Admin-only. CTE-baserad — undviker N+1 correlated subqueries.
-- Mönstret speglar get_conversations i detta projekt.
-- Sorteras på updated_at DESC för korrekt aktivitetsordning.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_support_thread_inbox()
RETURNS TABLE (
  thread_id        uuid,
  user_id          uuid,
  username         text,
  email            text,
  assigned_admin_id uuid,
  status           text,
  last_message     text,
  last_message_at  timestamptz,
  unread_count     bigint,
  updated_at       timestamptz,
  created_at       timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_messages AS (
    SELECT DISTINCT ON (support_thread_id)
      support_thread_id,
      CASE WHEN deleted_at IS NOT NULL THEN NULL ELSE content END AS content,
      created_at
    FROM public.support_messages
    ORDER BY support_thread_id, created_at DESC
  ),
  unread_counts AS (
    SELECT
      sm.support_thread_id,
      COUNT(*) AS cnt
    FROM public.support_messages sm
    WHERE sm.sender_id != auth.uid()
      AND sm.read_at IS NULL
      AND sm.deleted_at IS NULL
    GROUP BY sm.support_thread_id
  )
  SELECT
    st.id                           AS thread_id,
    st.user_id,
    up.username,
    up.email,
    st.assigned_admin_id,
    st.status,
    lm.content                      AS last_message,
    lm.created_at                   AS last_message_at,
    COALESCE(uc.cnt, 0)             AS unread_count,
    st.updated_at,
    st.created_at
  FROM public.support_threads st
  JOIN public.user_profiles up ON up.id = st.user_id
  LEFT JOIN latest_messages lm ON lm.support_thread_id = st.id
  LEFT JOIN unread_counts uc ON uc.support_thread_id = st.id
  WHERE public.is_support_admin()
  ORDER BY st.updated_at DESC;
$$;
