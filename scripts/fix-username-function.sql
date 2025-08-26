-- Fix Username Function for RPC Calls
-- Run this in Supabase SQL Editor

-- Drop and recreate the function to ensure it's properly exposed
DROP FUNCTION IF EXISTS update_username_atomic(uuid, citext);

-- Recreate the function with proper RPC exposure
CREATE OR REPLACE FUNCTION update_username_atomic(
  p_user_id uuid,
  p_new_username citext
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
  result json;
BEGIN
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

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_new_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username, updated_at = NOW();

  IF FOUND THEN
    result := json_build_object('success', true);
  ELSE
    result := json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_username_atomic(uuid, citext) TO authenticated;

-- Verify the function was created
SELECT '=== FUNCTION VERIFICATION ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_username_atomic';
