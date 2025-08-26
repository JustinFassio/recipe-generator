-- Add RPC function for atomic username claiming using usernames table
CREATE OR REPLACE FUNCTION claim_username_atomic(
  p_user_id uuid,
  p_username citext
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
BEGIN
  -- Check if username is already taken by another user
  SELECT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_username AND user_id != p_user_id
  ) INTO username_exists;

  IF username_exists THEN
    RETURN false;
  END IF;

  -- Update the user's username in profiles table
  UPDATE profiles 
  SET username = p_username
  WHERE id = p_user_id;

  -- Insert into usernames table
  INSERT INTO usernames (username, user_id)
  VALUES (p_username, p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET username = EXCLUDED.username;

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
