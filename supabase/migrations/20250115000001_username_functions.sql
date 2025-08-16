-- Username Claim Functions
-- This migration creates PostgreSQL functions for atomically claiming usernames.

-- Function to atomically claim a username
CREATE OR REPLACE FUNCTION public.claim_username_atomic(
  p_user_id uuid,
  p_username citext
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_username citext;
  existing_user_id uuid;
  result json;
BEGIN
  -- Check if the user already has a username
  SELECT username INTO existing_username
  FROM public.profiles
  WHERE id = p_user_id;

  IF existing_username IS NOT NULL THEN
    RAISE EXCEPTION 'user_already_has_username: User already has username: %', existing_username;
  END IF;

  -- Check if the username is already taken
  SELECT user_id INTO existing_user_id
  FROM public.usernames
  WHERE username = p_username;

  IF existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'username_already_taken: Username % is already taken', p_username;
  END IF;

  -- Begin transaction (implicit in function)
  -- Insert into usernames table first (this will fail if username exists due to PK constraint)
  INSERT INTO public.usernames (username, user_id)
  VALUES (p_username, p_user_id);

  -- Update the profile with the username
  UPDATE public.profiles
  SET username = p_username,
      updated_at = now()
  WHERE id = p_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'username', p_username,
    'user_id', p_user_id
  );

  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    -- This catches both username PK violation and profile username unique violation
    RAISE EXCEPTION 'username_already_taken: Username % is already taken', p_username;
  WHEN OTHERS THEN
    -- Re-raise any other exceptions
    RAISE;
END;
$$;
