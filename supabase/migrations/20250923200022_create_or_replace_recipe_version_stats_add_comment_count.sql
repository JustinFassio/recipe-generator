-- Replace per-version stats view to include version_comment_count
CREATE OR REPLACE VIEW public.recipe_version_stats AS
SELECT
  v.recipe_id,
  v.version_number,
  v.title,
  COALESCE(ROUND(AVG(rr.rating)::numeric, 2), NULL) AS version_avg_rating,
  COALESCE(COUNT(rr.*), 0) AS version_total_ratings,
  COALESCE(COUNT(rv.*), 0) AS version_total_views,
  COALESCE(
    SUM(
      CASE WHEN rr.comment IS NOT NULL AND btrim(rr.comment) <> '' THEN 1 ELSE 0 END
    ),
    0
  ) AS version_comment_count
FROM public.recipe_content_versions v
LEFT JOIN public.recipe_ratings rr
  ON rr.recipe_id = v.recipe_id
  AND rr.version_number = v.version_number
LEFT JOIN public.recipe_views rv
  ON rv.recipe_id = v.recipe_id
  AND rv.version_number = v.version_number
GROUP BY v.recipe_id, v.version_number, v.title;


