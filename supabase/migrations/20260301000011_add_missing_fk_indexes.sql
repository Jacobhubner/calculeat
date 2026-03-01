-- =========================================================
-- MIGRATION: Saknade FK-index
-- Date: 2026-03-01
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_hidden_conversations_friendship_id
  ON public.hidden_conversations (friendship_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_recipes_created_by
  ON public.recipes (created_by);

CREATE INDEX IF NOT EXISTS idx_shared_lists_created_by
  ON public.shared_lists (created_by);

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_profile_id
  ON public.user_profiles (active_profile_id)
  WHERE active_profile_id IS NOT NULL;
