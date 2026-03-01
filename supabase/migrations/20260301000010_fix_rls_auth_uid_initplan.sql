-- =========================================================
-- MIGRATION: RLS performance — auth.uid() → (SELECT auth.uid())
-- Date: 2026-03-01
-- Åtgärdar auth_rls_initplan: auth.uid() utvärderas per rad utan SELECT-wrapper.
-- =========================================================

-- calibration_history
DROP POLICY IF EXISTS "Users can view own calibration history"   ON public.calibration_history;
DROP POLICY IF EXISTS "Users can delete own calibration history" ON public.calibration_history;

CREATE POLICY "Users can view own calibration history"
  ON public.calibration_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = calibration_history.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own calibration history"
  ON public.calibration_history FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = calibration_history.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  ));

-- daily_logs
DROP POLICY IF EXISTS "Users can view own daily logs"   ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;

CREATE POLICY "Users can view own daily logs"
  ON public.daily_logs FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own daily logs"
  ON public.daily_logs FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own daily logs"
  ON public.daily_logs FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- favorite_foods
DROP POLICY IF EXISTS "Users can read own favorites"   ON public.favorite_foods;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorite_foods;

CREATE POLICY "Users can read own favorites"
  ON public.favorite_foods FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own favorites"
  ON public.favorite_foods FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- food_nutrients
DROP POLICY IF EXISTS "View nutrients of visible foods" ON public.food_nutrients;
DROP POLICY IF EXISTS "Update own food nutrients"       ON public.food_nutrients;
DROP POLICY IF EXISTS "Delete own food nutrients"       ON public.food_nutrients;

CREATE POLICY "View nutrients of visible foods"
  ON public.food_nutrients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.food_items fi
    WHERE fi.id = food_nutrients.food_item_id
      AND (fi.user_id IS NULL OR fi.user_id = (SELECT auth.uid()))
  ));

CREATE POLICY "Update own food nutrients"
  ON public.food_nutrients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.food_items fi
    WHERE fi.id = food_nutrients.food_item_id
      AND fi.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Delete own food nutrients"
  ON public.food_nutrients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.food_items fi
    WHERE fi.id = food_nutrients.food_item_id
      AND fi.user_id = (SELECT auth.uid())
  ));

-- hidden_conversations
DROP POLICY IF EXISTS "Users manage own hidden conversations" ON public.hidden_conversations;

CREATE POLICY "Users manage own hidden conversations"
  ON public.hidden_conversations FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- meal_entries
DROP POLICY IF EXISTS "Users can view own meal entries"   ON public.meal_entries;
DROP POLICY IF EXISTS "Users can update own meal entries" ON public.meal_entries;
DROP POLICY IF EXISTS "Users can delete own meal entries" ON public.meal_entries;

CREATE POLICY "Users can view own meal entries"
  ON public.meal_entries FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own meal entries"
  ON public.meal_entries FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own meal entries"
  ON public.meal_entries FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- measurement_sets
DROP POLICY IF EXISTS "Users can view own measurement sets"   ON public.measurement_sets;
DROP POLICY IF EXISTS "Users can update own measurement sets" ON public.measurement_sets;
DROP POLICY IF EXISTS "Users can delete own measurement sets" ON public.measurement_sets;

CREATE POLICY "Users can view own measurement sets"
  ON public.measurement_sets FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own measurement sets"
  ON public.measurement_sets FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own measurement sets"
  ON public.measurement_sets FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- messages
DROP POLICY IF EXISTS "Friendship participants can read messages" ON public.messages;

CREATE POLICY "Friendship participants can read messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.id = messages.friendship_id
      AND (f.requester_id = (SELECT auth.uid()) OR f.addressee_id = (SELECT auth.uid()))
  ));

-- profiles
DROP POLICY IF EXISTS "Users can view own profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;

CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- saved_meal_items
DROP POLICY IF EXISTS "Users can view own saved meal items"   ON public.saved_meal_items;
DROP POLICY IF EXISTS "Users can update own saved meal items" ON public.saved_meal_items;
DROP POLICY IF EXISTS "Users can delete own saved meal items" ON public.saved_meal_items;

CREATE POLICY "Users can view own saved meal items"
  ON public.saved_meal_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.saved_meals
    WHERE saved_meals.id = saved_meal_items.saved_meal_id
      AND saved_meals.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update own saved meal items"
  ON public.saved_meal_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.saved_meals
    WHERE saved_meals.id = saved_meal_items.saved_meal_id
      AND saved_meals.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own saved meal items"
  ON public.saved_meal_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.saved_meals
    WHERE saved_meals.id = saved_meal_items.saved_meal_id
      AND saved_meals.user_id = (SELECT auth.uid())
  ));

-- saved_meals
DROP POLICY IF EXISTS "Users can view own saved meals"   ON public.saved_meals;
DROP POLICY IF EXISTS "Users can update own saved meals" ON public.saved_meals;
DROP POLICY IF EXISTS "Users can delete own saved meals" ON public.saved_meals;

CREATE POLICY "Users can view own saved meals"
  ON public.saved_meals FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved meals"
  ON public.saved_meals FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own saved meals"
  ON public.saved_meals FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- user_meal_settings
DROP POLICY IF EXISTS "Users can view own meal settings"   ON public.user_meal_settings;
DROP POLICY IF EXISTS "Users can update own meal settings" ON public.user_meal_settings;
DROP POLICY IF EXISTS "Users can delete own meal settings" ON public.user_meal_settings;

CREATE POLICY "Users can view own meal settings"
  ON public.user_meal_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update own meal settings"
  ON public.user_meal_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own meal settings"
  ON public.user_meal_settings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_meal_settings.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  ));

-- user_profiles
DROP POLICY IF EXISTS "Users can view own profile"   ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = (SELECT auth.uid()));

-- weight_history
DROP POLICY IF EXISTS "Users can manage own weight history" ON public.weight_history;

CREATE POLICY "Users can manage own weight history"
  ON public.weight_history FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
