-- Fix moddatetime triggers to specify the column name
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
DROP TRIGGER IF EXISTS set_updated_at_recipes ON recipes;
DROP TRIGGER IF EXISTS set_updated_at_user_safety ON user_safety;
DROP TRIGGER IF EXISTS set_updated_at_cooking_preferences ON cooking_preferences;

-- Recreate triggers with proper column specification
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_recipes
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_user_safety
  BEFORE UPDATE ON user_safety
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_cooking_preferences
  BEFORE UPDATE ON cooking_preferences
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
