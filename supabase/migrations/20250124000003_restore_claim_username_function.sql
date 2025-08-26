CREATE OR REPLACE FUNCTION claim_username_atomic(p_user_id uuid, p_username citext)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE username = p_username AND id != p_user_id) INTO username_exists;
  IF username_exists THEN
    RETURN false;
  END IF;
  UPDATE profiles SET username = p_username WHERE id = p_user_id;
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
