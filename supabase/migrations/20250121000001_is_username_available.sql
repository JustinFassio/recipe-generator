-- Create username availability check function
CREATE OR REPLACE FUNCTION is_username_available(p_username citext)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS(
    SELECT 1 FROM usernames
    WHERE username = p_username
  );
END;
$$;
