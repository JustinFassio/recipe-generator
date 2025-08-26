-- Restore username management functions

-- Add RPC functions for username management
CREATE OR REPLACE FUNCTION is_username_available(check_username citext)
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
    WHERE username = check_username
  ) INTO username_exists;
  RETURN NOT username_exists;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_username_available TO authenticated;
