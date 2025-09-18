-- Fix version family query to handle nested parent-child relationships
-- This function recursively finds all versions in a recipe family

CREATE OR REPLACE FUNCTION get_recipe_version_family(
  original_recipe_id UUID,
  requesting_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  ingredients TEXT[],
  instructions TEXT,
  notes TEXT,
  image_url TEXT,
  user_id UUID,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  categories TEXT[],
  setup TEXT[],
  cooking_time TEXT,
  difficulty TEXT,
  creator_rating INTEGER,
  version_number INTEGER,
  parent_recipe_id UUID,
  is_version BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE version_family AS (
    -- Start with the original recipe
    SELECT r.*
    FROM recipes r
    WHERE r.id = original_recipe_id
    
    UNION ALL
    
    -- Recursively find all children (versions)
    SELECT r.*
    FROM recipes r
    INNER JOIN version_family vf ON r.parent_recipe_id = vf.id
  )
  SELECT vf.*
  FROM version_family vf
  WHERE 
    -- Allow viewing if: user owns the recipe OR recipe is public
    (requesting_user_id IS NOT NULL AND vf.user_id = requesting_user_id)
    OR vf.is_public = true
  ORDER BY vf.version_number DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_recipe_version_family(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recipe_version_family(UUID, UUID) TO anon;
