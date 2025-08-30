-- Update update_username_atomic function to return JSON like production
-- First drop the existing function since we're changing the return type
DROP FUNCTION IF EXISTS "public"."update_username_atomic"("p_user_id" "uuid", "p_new_username" "public"."citext");

CREATE OR REPLACE FUNCTION "public"."update_username_atomic"(
  "p_user_id" "uuid",
  "p_new_username" "public"."citext"
) RETURNS json
LANGUAGE "plpgsql"
SET "search_path" TO 'public'
AS $$
DECLARE
  username_exists boolean;
  result json;
BEGIN
  -- Security check - ensure user can only update their own username
  IF auth.uid() != p_user_id THEN
    result := json_build_object('success', false, 'error', 'unauthorized');
    RETURN result;
  END IF;

  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_new_username AND user_id != p_user_id
  ) INTO username_exists;

  IF username_exists THEN
    result := json_build_object('success', false, 'error', 'username_already_taken');
    RETURN result;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles
  SET username = p_new_username, updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if the user exists (FOUND is set by the UPDATE above)
  IF NOT FOUND THEN
    result := json_build_object('success', false, 'error', 'user_not_found');
    RETURN result;
  END IF;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username;

  -- If we get here, the operation was successful
  result := json_build_object('success', true);

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;
