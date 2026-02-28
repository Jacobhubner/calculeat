-- =========================================================
-- MIGRATION: Add Shared Lists Feature — Steg 1/5
-- Date: 2026-03-01
-- Description: Skapar tabeller för gemensamt ägda listor.
--   - shared_lists: En lista med ett namn och en skapare
--   - shared_list_members: Kopplingstabell, alla är likvärdiga
--   - shared_list_invitations: Inbjudningar att gå med i en lista
-- RLS: Allt läs-skydd via membership-check.
--      Alla skrivoperationer via SECURITY DEFINER RPC.
-- Realtime: shared_list_invitations publiceras för badge-räknare.
-- =========================================================

-- =========================================================
-- STEG 1: Tabell shared_lists
-- =========================================================

CREATE TABLE IF NOT EXISTS public.shared_lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Listans visningsnamn (t.ex. "Proteinlista med Johan")
  name        text NOT NULL,

  -- Skaparens user_id för historik.
  -- ARKITEKTURBESLUT: created_by ger INGA extra rättigheter.
  -- Alla medlemmar är likvärdiga (flat ownership).
  -- SET NULL om skaparen raderar sitt konto.
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shared_lists IS
  'Gemensamt ägda listor. Alla medlemmar har identiska rättigheter.
   created_by är enbart historik, ger inga admin-privilegier.
   Listan raderas automatiskt när sista medlemmen lämnar (via leave_shared_list RPC).
   CASCADE på shared_list_members och food_items/recipes säkerställer ren radering.';

COMMENT ON COLUMN public.shared_lists.created_by IS
  'Ursprunglig skapare — enbart audit-historik. Ingen extra behörighet.
   NULL om skaparen har raderat sitt konto.';

-- Trigga updated_at-uppdatering
CREATE OR REPLACE FUNCTION public.update_shared_lists_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_shared_lists_updated_at
  BEFORE UPDATE ON public.shared_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_shared_lists_updated_at();

-- =========================================================
-- STEG 2: Tabell shared_list_members
-- =========================================================

CREATE TABLE IF NOT EXISTS public.shared_list_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  shared_list_id  uuid NOT NULL
    REFERENCES public.shared_lists(id) ON DELETE CASCADE,

  user_id         uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  joined_at       timestamptz NOT NULL DEFAULT now(),

  -- En användare kan bara vara med i en lista en gång
  UNIQUE (shared_list_id, user_id)
);

COMMENT ON TABLE public.shared_list_members IS
  'Kopplingstabell för listmedlemmar. En rad per (lista, användare)-par.
   Radering av en rad tar bort en medlems åtkomst men lämnar listans innehåll intakt.
   CASCADE från shared_lists: om listan raderas försvinner alla rader här.
   CASCADE till auth.users: om användaren raderar sitt konto tas deras rader bort.';

-- Index för primärt åtkomstmönster: "vilka listor är jag med i?"
CREATE INDEX IF NOT EXISTS idx_shared_list_members_user_id
  ON public.shared_list_members(user_id);

-- Index för sekundärt mönster: "vilka är med i listan?"
CREATE INDEX IF NOT EXISTS idx_shared_list_members_list_id
  ON public.shared_list_members(shared_list_id);

-- Kombinerat index för RLS-policys (membership check)
CREATE INDEX IF NOT EXISTS idx_shared_list_members_user_list
  ON public.shared_list_members(user_id, shared_list_id);

-- =========================================================
-- STEG 3: Tabell shared_list_invitations
-- =========================================================

CREATE TABLE IF NOT EXISTS public.shared_list_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CASCADE: om listan raderas försvinner inbjudningarna
  shared_list_id  uuid NOT NULL
    REFERENCES public.shared_lists(id) ON DELETE CASCADE,

  -- CASCADE: om avsändaren raderas tas inbjudan med sig
  sender_id       uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  -- CASCADE: om mottagaren raderas tas inbjudan med sig
  recipient_id    uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Avsändarens visningsnamn vid send-tidpunkten (immutabelt)
  sender_name     text NOT NULL,

  -- Listnamn vid send-tidpunkten (snapshot — säkert om listan byter namn)
  list_name       text NOT NULL,

  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),

  created_at      timestamptz NOT NULL DEFAULT now(),
  responded_at    timestamptz,

  -- Förhindra self-invite på databasnivå
  CONSTRAINT no_self_invite CHECK (sender_id != recipient_id)
);

COMMENT ON TABLE public.shared_list_invitations IS
  'Inbjudningar att gå med i en gemensam lista. Skiljer sig fundamentalt från
   share_invitations (one-time snapshot-push) — dessa ger livsvaraktigt listmedlemskap.
   Ingen expirering i Fas 1 (till skillnad från share_invitations som har 30 dagar).';

COMMENT ON COLUMN public.shared_list_invitations.list_name IS
  'Snapshot av listnamnet vid send-tidpunkten.
   Visas i inbjudan även om listan byter namn senare.';

-- Index: primärt åtkomstmönster (inkorgen)
CREATE INDEX IF NOT EXISTS idx_shared_list_invitations_recipient_pending
  ON public.shared_list_invitations(recipient_id)
  WHERE status = 'pending';

-- Index: skickade inbjudningar
CREATE INDEX IF NOT EXISTS idx_shared_list_invitations_sender_id
  ON public.shared_list_invitations(sender_id);

-- Index: inbjudningar per lista (för att kolla om en person redan blivit inbjuden)
CREATE INDEX IF NOT EXISTS idx_shared_list_invitations_list_id
  ON public.shared_list_invitations(shared_list_id);

-- Partial unique index: förhindrar dubbletter av pending-inbjudningar.
-- En användare kan bara ha en pending-inbjudan per lista.
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_list_invitations_unique_pending
  ON public.shared_list_invitations(shared_list_id, recipient_id)
  WHERE status = 'pending';

-- =========================================================
-- STEG 4: RLS för shared_lists
-- =========================================================

ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;

-- Enbart medlemmar kan se sina listor.
-- Icke-medlemmar ser varken listnamn eller existens.
CREATE POLICY "Members can view their shared lists"
  ON public.shared_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_list_members slm
      WHERE slm.shared_list_id = id
        AND slm.user_id = (SELECT auth.uid())
    )
  );

-- Inga direkta skrivoperationer — allt via SECURITY DEFINER RPC
CREATE POLICY "No direct insert on shared_lists"
  ON public.shared_lists FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on shared_lists"
  ON public.shared_lists FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on shared_lists"
  ON public.shared_lists FOR DELETE
  USING (false);

-- =========================================================
-- STEG 5: RLS för shared_list_members
-- =========================================================

ALTER TABLE public.shared_list_members ENABLE ROW LEVEL SECURITY;

-- Medlemmar kan se vilka andra som är med i sina listor.
-- Icke-medlemmar kan inte se att listan ens existerar.
CREATE POLICY "Members can view memberships in their lists"
  ON public.shared_list_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_list_members slm2
      WHERE slm2.shared_list_id = shared_list_id
        AND slm2.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "No direct insert on shared_list_members"
  ON public.shared_list_members FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on shared_list_members"
  ON public.shared_list_members FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on shared_list_members"
  ON public.shared_list_members FOR DELETE
  USING (false);

-- =========================================================
-- STEG 6: RLS för shared_list_invitations
-- =========================================================

ALTER TABLE public.shared_list_invitations ENABLE ROW LEVEL SECURITY;

-- Avsändare och mottagare kan se sina egna inbjudningar
CREATE POLICY "Parties can view their list invitations"
  ON public.shared_list_invitations FOR SELECT
  USING (
    sender_id    = (SELECT auth.uid())
    OR recipient_id = (SELECT auth.uid())
  );

CREATE POLICY "No direct insert on shared_list_invitations"
  ON public.shared_list_invitations FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on shared_list_invitations"
  ON public.shared_list_invitations FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on shared_list_invitations"
  ON public.shared_list_invitations FOR DELETE
  USING (false);

-- =========================================================
-- STEG 7: Realtime-publikation för shared_list_invitations
-- Krävs för att badge-räknaren (usePendingSharedListInvitationsCount)
-- ska kunna prenumerera på INSERT-events i realtid.
-- Samma mönster som share_invitations i föregående migration.
-- =========================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_list_invitations;
