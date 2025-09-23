-- Create or replace aggregate stats view for public recipes
-- One SQL command per file (best practices)
CREATE OR REPLACE VIEW public.recipe_aggregate_stats AS
SELECT
  r.id                          AS recipe_id,
  r.title                       AS title,
  r.is_public                   AS is_public,
  COALESCE(ROUND(AVG(rr.rating)::numeric, 2), NULL) AS aggregate_avg_rating,
  COALESCE(COUNT(rr.*), 0)      AS total_ratings,
  COALESCE(COUNT(rv.*), 0)      AS total_views,
  COALESCE(COUNT(DISTINCT v.version_number), 0) AS total_versions,
  COALESCE(MAX(v.version_number), 0) AS latest_version
FROM public.recipes r
LEFT JOIN public.recipe_ratings rr
  ON rr.recipe_id = r.id
LEFT JOIN public.recipe_views rv
  ON rv.recipe_id = r.id
LEFT JOIN public.recipe_content_versions v
  ON v.recipe_id = r.id
WHERE r.is_public = TRUE
GROUP BY r.id, r.title, r.is_public;


