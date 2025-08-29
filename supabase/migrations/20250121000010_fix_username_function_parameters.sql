-- Fix username function parameters to use standard naming conventions
-- Remove confusing p_ prefix and use simple, descriptive parameter names

-- Fix is_username_available function
CREATE OR REPLACE FUNCTION is_username_available(username citext)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = is_username_available.username
  );
END;
$$;

-- Fix update_username_atomic function
CREATE OR REPLACE FUNCTION update_username_atomic(
  user_id uuid,
  new_username citext
) RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
  result json;
BEGIN
  -- Security check - ensure user can only update their own username
  IF auth.uid() != user_id THEN
    result := json_build_object('success', false, 'error', 'unauthorized');
    RETURN result;
  END IF;

  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = new_username AND usernames.user_id != update_username_atomic.user_id
  ) INTO username_exists;

  IF username_exists THEN
    result := json_build_object('success', false, 'error', 'username_already_taken');
    RETURN result;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles
  SET username = new_username, updated_at = NOW()
  WHERE id = user_id;

  -- Update or insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (new_username, user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username;

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
GRANT EXECUTE ON FUNCTION is_username_available TO authenticated;
GRANT EXECUTE ON FUNCTION update_username_atomic TO authenticated;
