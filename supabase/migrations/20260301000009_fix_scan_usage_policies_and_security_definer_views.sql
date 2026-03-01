-- =========================================================
-- MIGRATION: Fix scan_usage duplicates + SECURITY DEFINER views
-- Date: 2026-03-01
-- =========================================================

-- ---------------------------------------------------
-- 1. scan_usage — ta bort duplicerade policies
-- Tabell fick policies från både 20260215163434 och 20260301000006.
-- Behåller de med (SELECT auth.uid()) — bättre performance.
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Users see own scans"    ON public.scan_usage;
DROP POLICY IF EXISTS "Users insert own scans" ON public.scan_usage;

-- ---------------------------------------------------
-- 2. share_metrics — ta bort SECURITY DEFINER
-- VIEW utan SECURITY DEFINER = SECURITY INVOKER (standard).
-- ---------------------------------------------------
CREATE OR REPLACE VIEW public.share_metrics AS
SELECT
  sender_id,
  item_type,
  count(*) FILTER (WHERE status = 'pending')  AS pending_count,
  count(*) FILTER (WHERE status = 'accepted') AS accepted_count,
  count(*) FILTER (WHERE status = 'rejected') AS rejected_count,
  count(*) FILTER (WHERE status = 'expired')  AS expired_count,
  count(*)                                    AS total_sent
FROM public.share_invitations
GROUP BY sender_id, item_type;

-- ---------------------------------------------------
-- 3. calibration_model_health — ta bort SECURITY DEFINER
-- ---------------------------------------------------
CREATE OR REPLACE VIEW public.calibration_model_health AS
SELECT
  count(*)                                                                    AS total_calibrations,
  count(*) FILTER (WHERE is_reverted = true)                                  AS reverted_count,
  round(avg(applied_tdee - previous_tdee), 1)                                 AS avg_adjustment_kcal,
  round(stddev(applied_tdee - previous_tdee), 1)                              AS stddev_adjustment_kcal,
  round(avg(abs(applied_tdee - previous_tdee)), 1)                            AS avg_abs_adjustment_kcal,
  round((100.0 * count(*) FILTER (WHERE was_limited = true)::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_hit_clamp,
  round((100.0 * count(*) FILTER (WHERE warnings ? 'low_signal')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_low_signal,
  round((100.0 * count(*) FILTER (WHERE warnings ? 'selective_logging')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_selective_logging,
  round((100.0 * count(*) FILTER (WHERE warnings ? 'large_deficit')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_large_deficit,
  round((100.0 * count(*) FILTER (WHERE warnings ? 'outlier_removed')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_outlier_removed,
  round(avg(data_quality_index), 1)                                           AS avg_dqi,
  round(avg(coefficient_of_variation), 2)                                     AS avg_cv,
  round((100.0 * count(*) FILTER (WHERE confidence_level = 'high')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_high_confidence,
  round((100.0 * count(*) FILTER (WHERE confidence_level = 'low')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_low_confidence,
  round((100.0 * count(*) FILTER (WHERE calorie_source = 'food_log')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_food_log,
  round((100.0 * count(*) FILTER (WHERE calorie_source = 'blended')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_blended,
  round((100.0 * count(*) FILTER (WHERE calorie_source = 'target_calories')::numeric)
        / NULLIF(count(*), 0)::numeric, 1)                                    AS pct_target_only
FROM public.calibration_history
WHERE is_reverted = false;
