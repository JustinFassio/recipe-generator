-- Create atomic username claim function
CREATE OR REPLACE FUNCTION claim_username_atomic(
  p_user_id uuid,
  p_username citext
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
  user_has_username boolean;
  result json;
BEGIN
  -- Security check - ensure user can only claim their own username
  IF auth.uid() != p_user_id THEN
    result := json_build_object('success', false, 'error', 'unauthorized');
    RETURN result;
  END IF;

  -- Check if username is already taken
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_username
  ) INTO username_exists;

  IF username_exists THEN
    result := json_build_object('success', false, 'error', 'username_already_taken');
    RETURN result;
  END IF;

  -- Check if user already has a username
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE user_id = p_user_id
  ) INTO user_has_username;

  IF user_has_username THEN
    result := json_build_object('success', false, 'error', 'user_already_has_username');
    RETURN result;
  END IF;

  -- Claim the username
  INSERT INTO usernames (username, user_id)
  VALUES (p_username, p_user_id);

  -- Update profiles table
  UPDATE profiles 
  SET username = p_username, updated_at = NOW()
  WHERE id = p_user_id;

  result := json_build_object('success', true);
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;
