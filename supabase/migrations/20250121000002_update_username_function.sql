CREATE OR REPLACE FUNCTION update_username_atomic(
  user_uuid uuid,
  new_username citext
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE username = new_username AND id != user_uuid
  ) INTO username_exists;

  IF username_exists THEN
    RETURN false;
  END IF;

  UPDATE profiles 
  SET username = new_username
  WHERE id = user_uuid;

  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
