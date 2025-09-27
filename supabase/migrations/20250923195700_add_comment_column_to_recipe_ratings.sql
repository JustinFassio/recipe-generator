-- Add comment column to recipe_ratings if missing
ALTER TABLE public.recipe_ratings
  ADD COLUMN IF NOT EXISTS comment text;


